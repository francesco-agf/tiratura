/* La scheda iniziale deve stare dentro il campo senza scorrere, su tutti i
   telefoni e in tutti i giochi.

   Nata da un guaio vero: su Tiratura, che ha il campo più basso di tutti perché
   è un runner, la scheda con titolo, presentazione, nome e tasti era più alta
   del riquadro. Con `justify-content:center` un contenuto più alto del
   contenitore viene tagliato in cima e non si riesce nemmeno a scorrerci:
   il riquadro «scorreva su e giù» e il pulsante per cominciare restava fuori.

   Questa prova gira su tutti e quattro i giochi: dalla cartella sorgente/ di
   uno qualsiasi, `node prova-scheda.js`. */
const { chromium, devices } = require('playwright');
const path = require('path');
const GIOCHI = ['baseline', 'refusi', 'leporello', 'tiratura'];
const SCHERMI = [
  { nome: 'iPhone 15 Pro', w: 393, h: 852 },
  { nome: 'iPhone SE',     w: 375, h: 667 },
  { nome: 'Pixel stretto', w: 360, h: 780 }
];
let falliti = 0;
(async () => {
  const b = await chromium.launch();
  for (const g of GIOCHI){
    const PAGINA = 'file://' + path.resolve(__dirname, '..', '..', g, 'index.html');
    for (const s of SCHERMI){
      const p = await b.newPage({ viewport: { width: s.w, height: s.h }, isMobile: true, hasTouch: true });
      await p.addInitScript(() => { try { localStorage.setItem('agf.giocatore','Francesco'); } catch(e){} });
      await p.route('**/rest/v1/**', r => r.fulfill({status:200, contentType:'application/json', body:'[]'}));
      await p.goto(PAGINA);
      await p.waitForTimeout(900);
      const m = await p.evaluate(() => {
        const o = document.getElementById('overlay');
        if (!o) return { assente: true };
        const el = document.getElementById('field');
        const cv = el ? el.getBoundingClientRect() : { width:0, height:0 };
        // il bottone «comincia» deve essere dentro il riquadro senza scorrere
        const b0 = document.querySelector('#ovButtons .btn:not([hidden])');
        const btn = b0 ? b0.getBoundingClientRect() : { top:0, bottom:0 };
        const box = o.getBoundingClientRect();
        return { scorre: o.scrollHeight > o.clientHeight + 1,
                 avanzo: o.scrollHeight - o.clientHeight,
                 campo: [Math.round(cv.width), Math.round(cv.height)],
                 bottoneDentro: btn.bottom <= box.bottom + 1 && btn.top >= box.top - 1,
                 bottoneVisibile: btn.bottom <= window.innerHeight + 1 };
      });
      const esito = !m.scorre;
      if (!esito) falliti++;
      console.log((esito ? '  ok  ' : '  KO  ') + g.padEnd(10) + s.nome.padEnd(15) +
                  'campo ' + m.campo.join('×') +
                  (m.scorre ? '  SCORRE di ' + m.avanzo + 'px' : '  sta dentro') +
                  (m.bottoneDentro ? '' : '  · bottone fuori'));
      await p.close();
    }
  }
  console.log(falliti ? '\n' + falliti + ' schermi con la scheda che scorre' : '\ntutto dentro');
  await b.close();
  process.exit(falliti ? 1 : 0);
})();

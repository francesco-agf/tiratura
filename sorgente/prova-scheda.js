/* La scheda — quella iniziale e quella di fine partita — deve stare dentro il
   campo senza scorrere: su tutti i telefoni, su tutti i monitor, in tutti e
   quattro i giochi della sala.

   Nata da un guaio vero: su Tiratura, che ha il campo più basso di tutti perché
   è un runner, la scheda con titolo, presentazione, nome e tasti era più alta
   del riquadro. Con `justify-content:center` un contenuto più alto del
   contenitore viene tagliato in cima e non si riesce nemmeno a scorrerci:
   il riquadro «scorreva su e giù» e il pulsante per cominciare restava fuori.

   Il seguito del guaio: sistemato il telefono restava il monitor — Leporello e
   Tiratura hanno il campo largo e basso anche su uno schermo grande, 627×429 e
   640×366 — e restava soprattutto la scheda di fine partita, che è la più alta
   di tutte. Da qui i due gradi di stretta, `campo-basso` e `campo-stretto`: non
   sono legati a una misura indovinata, li accende il gioco stesso misurando se
   la scheda sta nel riquadro.

   Questa prova gira su tutti e quattro i giochi: dalla cartella sorgente/ di
   uno qualsiasi, `node prova-scheda.js`. */
const { chromium } = require('playwright');
const path = require('path');
const GIOCHI = [
  { nome: 'baseline',  api: '__baseline',  fine: 'over' },
  { nome: 'refusi',    api: '__refusi',    fine: 'fine' },
  { nome: 'leporello', api: '__leporello', fine: 'fine' },
  { nome: 'tiratura',  api: '__tiratura',  fine: 'fine' }
];
const SCHERMI = [
  { nome: 'iPhone 15 Pro', w: 393,  h: 852, telefono: true },
  { nome: 'iPhone SE',     w: 375,  h: 667, telefono: true },
  { nome: 'Pixel stretto', w: 360,  h: 780, telefono: true },
  { nome: 'monitor 1280',  w: 1280, h: 800 },
  { nome: 'portatile 1440',w: 1440, h: 900 },
  { nome: 'portatile 1512',w: 1512, h: 860 }
];
let falliti = 0;
(async () => {
  const b = await chromium.launch();
  for (const g of GIOCHI){
    const PAGINA = 'file://' + path.resolve(__dirname, '..', '..', g.nome, 'index.html');
    for (const s of SCHERMI){
      const p = await b.newPage({ viewport: { width: s.w, height: s.h },
                                  isMobile: !!s.telefono, hasTouch: !!s.telefono });
      await p.addInitScript(() => { try { localStorage.setItem('agf.giocatore','Francesco'); } catch(e){} });
      await p.route('**/rest/v1/**', r => r.fulfill({status:200, contentType:'application/json', body:'[]'}));
      await p.goto(PAGINA);
      await p.waitForTimeout(900);

      const misura = () => {
        const o = document.getElementById('overlay');
        if (!o) return { assente: true };
        const el = document.getElementById('field');
        const cv = el ? el.getBoundingClientRect() : { width:0, height:0 };
        // il bottone dei comandi deve essere dentro il riquadro senza scorrere
        const b0 = document.querySelector('#ovButtons .btn:not([hidden])');
        const btn = b0 ? b0.getBoundingClientRect() : { top:0, bottom:0 };
        const box = o.getBoundingClientRect();
        return { scorre: o.scrollHeight > o.clientHeight + 1,
                 avanzo: o.scrollHeight - o.clientHeight,
                 campo: [Math.round(cv.width), Math.round(cv.height)],
                 bottoneDentro: btn.bottom <= box.bottom + 1 && btn.top >= box.top - 1 };
      };

      // 1. la scheda di apertura
      const m = await p.evaluate(misura);
      // 2. la scheda di fine partita, che è la più alta: ha punteggio,
      //    rivelazione, iscrizione alla classifica e rimando all'altro gioco
      const f = await p.evaluate(async ([api, met, src]) => {
        const ni = document.getElementById('nameInput'); if (ni) ni.value = 'Francesco';
        const sb = document.getElementById('startBtn'); if (sb) sb.click();
        await new Promise(r => setTimeout(r, 300));
        window[api][met]();
        await new Promise(r => setTimeout(r, 1300));
        return eval('(' + src + ')')();
      }, [g.api, g.fine, misura.toString()]);

      for (const [quale, r] of [['apertura', m], ['fine partita', f]]){
        const esito = !r.scorre && r.bottoneDentro !== false;
        if (!esito) falliti++;
        console.log((esito ? '  ok  ' : '  KO  ') + g.nome.padEnd(10) + s.nome.padEnd(16) +
                    quale.padEnd(13) + 'campo ' + r.campo.join('×') +
                    (r.scorre ? '  SCORRE di ' + r.avanzo + 'px' : '  sta dentro') +
                    (r.bottoneDentro === false ? '  · bottone fuori' : ''));
      }
      await p.close();
    }
  }
  console.log(falliti ? '\n' + falliti + ' schede che scorrono' : '\ntutto dentro');
  await b.close();
  process.exit(falliti ? 1 : 0);
})();

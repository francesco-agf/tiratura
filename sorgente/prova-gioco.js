/* Collaudo di Tiratura.
   Gira su index.html, quello rigenerato da sorgente/build.py.

   Il gioco è a tempo continuo ma la simulazione sta in `aggiorna(dt)`, che le
   prove chiamano a mano con __tiratura.avanza(ms): requestAnimationFrame si
   ferma con la scheda in secondo piano, e aspettare il tempo vero non
   funzionerebbe. */
const { chromium } = require('playwright');
const path = require('path');
const PAGINA = 'file://' + path.resolve(__dirname, '..', 'index.html');
const log = (...a) => console.log(...a);
let falliti = 0;
const ok = (nome, cond, extra) => {
  if (!cond) falliti++;
  log((cond ? '  ok  ' : '  KO  ') + nome + (extra !== undefined ? '  ' + JSON.stringify(extra) : ''));
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 940 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('agf.giocatore', 'Collaudo'); } catch (e) {} });
  await page.route('**/rest/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto(PAGINA);
  await page.waitForTimeout(900);

  // 1. si parte, si corre, i metri salgono
  const t1 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    T.avanza(2000);
    return T.stato();
  });
  ok('1. si corre', t1.fase === 'play' && t1.metri >= 25 && t1.punti >= 25 && t1.bozze === 3, t1);

  // 2. il salto sale e ritorna a terra da solo
  const t2 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    const a = T.stato();
    T.salta(); T.avanza(300);
    const b = T.stato();
    T.avanza(600);
    const c = T.stato();
    return { partenza: a.y, apice: b.y, ritorno: c.y, suolo: a.suolo, aTerra: c.aTerra };
  });
  ok('2. salto e ricaduta', t2.apice < t2.partenza - 60 && t2.ritorno === t2.suolo && t2.aTerra, t2);

  // 3. la seconda passata: due salti e non tre
  const t3 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    T.salta(); T.avanza(120);
    const uno = T.stato().y;
    T.salta(); T.avanza(120);
    const due = T.stato().y;
    T.salta(); T.avanza(120);
    const tre = T.stato();
    return { uno, due, salti: tre.salti };
  });
  ok('3. seconda passata', t3.due < t3.uno && t3.salti === 2, t3);

  // 4. un bancale addosso costa una bozza
  const t4 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    const s = T.stato();
    T.metti('bancale', 300, 2);
    T.avanza(2000);
    return T.stato();
  });
  ok('4. il bancale ferma', t4.bozze === 2 && t4.urti === 1, { bozze: t4.bozze, urti: t4.urti });

  // 5. saltato al momento giusto, non costa niente
  const t5 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    // il bancale arriva addosso: si salta quando è vicino
    T.metti('bancale', 300, 2);
    T.avanza(200);          // si salta prima che arrivi addosso
    T.salta();
    T.avanza(1400);
    return T.stato();
  });
  ok('5. si scavalca', t5.bozze === 3 && t5.urti === 0, { bozze: t5.bozze, urti: t5.urti, y: t5.y });

  // 6. la taglierina si passa solo scivolando
  const t6 = await page.evaluate(() => {
    const T = window.__tiratura;
    // in piedi: urto
    T.comincia(); T.svuota(); T.metti('taglierina', 300);
    T.avanza(2000);
    const inPiedi = T.stato();
    // scivolando: passa
    T.comincia(); T.svuota(); T.metti('taglierina', 300);
    T.avanza(250); T.scivola(); T.avanza(1400);
    const giu = T.stato();
    return { inPiedi: inPiedi.urti, giu: giu.urti };
  });
  ok('6. la taglierina', t6.inPiedi === 1 && t6.giu === 0, t6);

  // 7. la colata d'inchiostro: a terra brucia, per aria no
  const t7 = await page.evaluate(() => {
    const T = window.__tiratura;
    T.comincia(); T.svuota(); T.metti('inchiostro', 300);
    T.avanza(2000);
    const dentro = T.stato().urti;
    T.comincia(); T.svuota(); T.metti('inchiostro', 300);
    T.avanza(250); T.salta(); T.avanza(1400);
    const sopra = T.stato().urti;
    return { dentro, sopra };
  });
  ok('7. la colata', t7.dentro === 1 && t7.sopra === 0, t7);

  // 8. sul bancale ci si può atterrare sopra
  const t8 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    T.metti('bancale', 321, 3);
    T.salta();
    // si campiona ogni sedici millesimi: prima o poi i piedi si posano sulla
    // cima del bancale, e lì aTerra torna vero senza essere a terra
    let sopra = false, minimo = 1e9;
    for (let i = 0; i < 90; i++){
      T.avanza(16);
      const s = T.stato();
      if (s.aTerra && s.y < s.suolo - 10){ sopra = true; minimo = s.y; break; }
    }
    const fine = T.stato();
    return { sopra: sopra, y: minimo, suolo: fine.suolo, urti: fine.urti };
  });
  ok('8. si atterra sul bancale', t8.sopra && t8.urti === 0, t8);

  // 9. il casco assorbe un urto solo
  const t9 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    T.mettiRaccolta('bonus', 200, undefined, 'casco');
    T.avanza(700);
    const conCasco = T.stato().casco;
    T.metti('bancale', 300, 2);
    T.avanza(2200);
    const s = T.stato();
    return { conCasco, bozze: s.bozze, casco: s.casco };
  });
  ok('9. il casco', t9.conCasco && t9.bozze === 3 && !t9.casco, t9);

  // 10. il muletto travolge invece di fermarti
  const t10 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    T.mettiRaccolta('bonus', 200, undefined, 'muletto');
    T.avanza(700);
    const eff = T.stato().effetto;
    T.metti('bancale', 320, 3);
    T.avanza(2000);
    const s = T.stato();
    return { eff, bozze: s.bozze, urti: s.urti };
  });
  ok('10. il muletto', t10.eff === 'muletto' && t10.bozze === 3 && t10.urti === 0, t10);

  // 11. volantini e biglietti fanno punti
  const t11 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    const p0 = T.stato().punti;
    T.mettiRaccolta('volantino', 200, T.stato().suolo - 30 * T.S());
    T.avanza(700);
    const dopoV = T.stato();
    T.mettiRaccolta('biglietto', 200, T.stato().suolo - 30 * T.S());
    T.avanza(700);
    const dopoB = T.stato();
    return { volantini: dopoV.volantini, biglietti: dopoB.biglietti,
             cresce: dopoB.punti > dopoV.punti };
  });
  ok('11. si raccoglie', t11.volantini === 1 && t11.biglietti === 1 && t11.cresce, t11);

  // 12. tre urti e la corsa finisce
  const t12 = await page.evaluate(async () => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    for (let i = 0; i < 3; i++){
      T.metti('bancale', 300, 2);
      T.avanza(2200);   // l'urto e poi l'invulnerabilità che scade
    }
    const prima = T.stato();
    await new Promise(r => setTimeout(r, 900));
    const dopo = T.stato();
    return { prima: prima.fase, bozze: prima.bozze, dopo: dopo.fase, causa: dopo.causa };
  });
  ok('12. tre urti e si chiude', t12.bozze === 0 && t12.dopo === 'over', t12);

  // 13. si cambia reparto ogni trecento metri
  const t13 = await page.evaluate(() => {
    const T = window.__tiratura; T.comincia(); T.svuota();
    T.zonaA(1);
    T.avanza(25000);
    return T.stato();
  });
  ok('13. il reparto cambia', t13.zona >= 2, { zona: t13.zona, metri: t13.metri });

  // 14. pausa e abbandono
  const t14 = await page.evaluate(async () => {
    const T = window.__tiratura; T.comincia();
    T.pausa();
    const inPausa = T.stato().fase;
    const abbandona = !document.getElementById('giveUpBtn').hidden;
    document.getElementById('giveUpBtn').click();
    await new Promise(r => setTimeout(r, 120));
    const s = T.stato();
    return { inPausa, abbandona, fase: s.fase, causa: s.causa,
             scheda: !document.getElementById('altroGioco').hidden };
  });
  ok('14. pausa e abbandono', t14.inPausa === 'pause' && t14.abbandona &&
      t14.fase === 'over' && t14.causa === 'resa' && t14.scheda, t14);

  // 15. il ponte verso gli altri giochi
  const t15 = await page.evaluate(() => ({
    sala: document.querySelector('.sala-link').getAttribute('href'),
    piede: Array.from(document.querySelectorAll('.colofoot a.tool')).map(a => a.getAttribute('href')),
    scheda: document.getElementById('altroGioco').getAttribute('href')
  }));
  ok('15. il ponte', t15.sala === 'https://francesco-agf.github.io/' && t15.piede.length === 4 &&
      /baseline/.test(t15.piede.join()) && /refusi/.test(t15.piede.join()) &&
      /leporello/.test(t15.piede.join()) && /baseline|refusi|leporello/.test(t15.scheda || ''), t15);

  // 16. niente selezione del testo
  const t16 = await page.evaluate(() => {
    const b = getComputedStyle(document.body);
    return { us: b.userSelect || b.webkitUserSelect,
             inp: getComputedStyle(document.getElementById('nameInput')).webkitUserSelect };
  });
  ok('16. selezione bloccata', t16.us === 'none' && t16.inp === 'text', t16);

  // 17. il risultato condivisibile
  const t17 = await page.evaluate(() => window.__tiratura.testo());
  ok('17. risultato condivisibile', /TIRATURA/.test(t17) && /tiratura\/$/m.test(t17.trim()),
      t17.split('\n')[0]);

  // 18. da telefono
  const tel = await browser.newPage({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
  await tel.addInitScript(() => { try { localStorage.setItem('agf.giocatore', 'Collaudo'); } catch (e) {} });
  await tel.route('**/rest/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await tel.goto(PAGINA);
  await tel.waitForTimeout(900);
  const t18 = await tel.evaluate(() => {
    const cv = document.getElementById('field').getBoundingClientRect();
    return { largo: Math.round(cv.width), alto: Math.round(cv.height),
             sbordo: cv.right > window.innerWidth + 1 || cv.left < -1,
             docSbordo: document.documentElement.scrollWidth > window.innerWidth + 1,
             pad: getComputedStyle(document.getElementById('pad')).display,
             tasti: document.querySelectorAll('#pad button').length,
             striscia: getComputedStyle(document.getElementById('hudStrip')).display };
  });
  ok('18. telefono', !t18.sbordo && !t18.docSbordo && t18.pad === 'flex' && t18.tasti === 2 &&
      t18.striscia === 'block', t18);
  await tel.close();

  log('\nerrori di console: ' + (errors.length ? errors.join(' | ') : 'nessuno'));
  if (errors.length) falliti++;
  log(falliti ? '\n' + falliti + ' PROVE FALLITE' : '\ntutto a posto');
  await browser.close();
  process.exit(falliti ? 1 : 0);
})();

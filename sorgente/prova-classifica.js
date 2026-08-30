/* Collaudo della classifica di Tiratura — stessa forma di quella di Baseline
   e di Refusi, perché l'invio del punteggio è lo stesso meccanismo per tutti i
   giochi della sala.

   La prova 5 esiste per una ragione precisa: il database aveva due vincoli sul
   campo `gioco`, e quello vecchio ammetteva solo baseline e refusi. Gli
   inserimenti venivano rifiutati con un 400 che spiegava tutto, e il gioco lo
   ingoiava mostrando «Riprova». Adesso il motivo del rifiuto si vede. */
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  // il 400 della prova 5 è voluto: non è un errore del gioco
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g|400 \(Bad Request\)/.test(m.text())) errors.push(m.text()); });

  const inviati = [];
  let rifiuta = null;          // quando è una stringa, il finto database dice di no
  const finte = [
    { name:'Proto', score:9800, level:6, lines:41, quads:5, dati:{}, day:20260829 },
    { name:'Anna',  score:5400, level:4, lines:22, quads:2, dati:{}, day:20260830 },
    { name:'anna',  score:3100, level:3, lines:14, quads:1, dati:{}, day:20260828 }
  ];
  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST'){
      inviati.push(JSON.parse(req.postData()));
      if (rifiuta) return route.fulfill({ status: 400, contentType: 'application/json',
                                          body: JSON.stringify({ message: rifiuta }) });
      return route.fulfill({ status: 201, body: '' });
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(finte) });
  });

  await page.goto(PAGINA);
  await page.waitForTimeout(1100);

  // 1. la classifica si carica, e di ogni nome resta la partita migliore
  const t1 = await page.evaluate(() =>
    [...document.querySelectorAll('#boardList li')].map(li => li.querySelector('.board-name').firstChild.textContent));
  ok('1. classifica caricata', t1.length === 2 && t1[0] === 'Proto' && t1[1] === 'Anna', t1);

  // 2. senza nome non si comincia
  const t2 = await page.evaluate(async () => {
    localStorage.removeItem('agf.giocatore');
    localStorage.removeItem('baseline.nome');
    document.getElementById('nameInput').value = '';
    document.getElementById('startBtn').click();
    await new Promise(r => setTimeout(r, 200));
    return { fase: window.__tiratura.stato().fase,
             nota: document.getElementById('nameNote').textContent };
  });
  ok('2. senza nome non si parte', t2.fase !== 'play' && /Scrivi un nome/.test(t2.nota), t2);

  // 3. col nome si gioca e a fine partita il punteggio parte da solo
  const t3 = await page.evaluate(async () => {
    const T = window.__tiratura;
    document.getElementById('nameInput').value = 'Francesco';
    document.getElementById('startBtn').click();
    await new Promise(r => setTimeout(r, 200));
    const partito = T.stato().fase;
    T.svuota();
    T.avanza(2000);
    T.fine();
    await new Promise(r => setTimeout(r, 700));
    return { partito: partito, msg: document.getElementById('signupMsg').textContent,
             nome: localStorage.getItem('agf.giocatore') };
  });
  const corpo = inviati[inviati.length - 1] || {};
  ok('3. il punteggio parte', t3.partito === 'play' && t3.nome === 'Francesco' &&
      /su .* garzon/.test(t3.msg), { msg: t3.msg });
  ok('4. il corpo dell\'invio', corpo.gioco === 'tiratura' && corpo.name === 'Francesco' &&
      typeof corpo.score === 'number' && typeof corpo.lines === 'number' &&
      typeof corpo.quads === 'number' && corpo.level >= 1 &&
      String(corpo.day).length === 8, corpo);

  // 5. se il database rifiuta, il motivo si deve leggere
  rifiuta = 'new row violates check constraint "scores_gioco_valido"';
  const t5 = await page.evaluate(async () => {
    const T = window.__tiratura;
    document.getElementById('startBtn').click();       // «Un'altra consegna»
    await new Promise(r => setTimeout(r, 200));
    T.fine();
    await new Promise(r => setTimeout(r, 700));
    return document.getElementById('signupMsg').textContent;
  });
  ok('5. il rifiuto si vede', /scores_gioco_valido/.test(t5), t5);
  rifiuta = null;

  // 6. il nome della sala arriva dagli altri giochi
  await page.evaluate(() => {
    localStorage.removeItem('agf.giocatore');
    localStorage.setItem('baseline.nome', 'Fimognari');
    location.reload();
  });
  await page.waitForTimeout(1200);
  const t6 = await page.evaluate(() => ({
    valore: document.getElementById('nameInput').value,
    nota: document.getElementById('nameNote').textContent
  }));
  ok('6. nome ereditato dalla sala', t6.valore === 'Fimognari' && /sala giochi/.test(t6.nota), t6);

  log('\nerrori di console: ' + (errors.length ? errors.join(' | ') : 'nessuno'));
  if (errors.length) falliti++;
  log(falliti ? '\n' + falliti + ' PROVE FALLITE' : '\ntutto a posto');
  await browser.close();
  process.exit(falliti ? 1 : 0);
})();

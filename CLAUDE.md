# Tiratura — la corsa del ragazzo di bottega

Repo `francesco-agf/tiratura` → https://francesco-agf.github.io/tiratura/
Quarto gioco della sala giochi AGF. La famiglia è di cinque repo:
`francesco-agf.github.io` (la sala), `baseline`, `refusi`, `leporello`, `tiratura`.

## Prima di toccare qualcosa

Il quaderno di progetto sta su Google Drive, in **Sala Giochi AGF / Quaderno**.
Va letto prima di cominciare — qui ci sono solo dieci righe di promemoria.

| File | Cosa contiene |
|---|---|
| `AGF-come-si-lavora.md` | come si monta, come si prova, come si pubblica |
| `AGF-decisioni.md` | che cosa è stato deciso, e perché |
| `AGF-marchio.md` | bianco su scuro, nero su bianco |
| `AGF-tiratura.md` | **questo gioco**: fisica, ostacoli, commessa, rotativa, bolla |
| `AGF-sala.md` | classifiche, database, ponte fra i giochi, privacy |

## Le quattro cose da non sbagliare

1. **`index.html` è generato.** Si modifica `sorgente/tiratura.html`, poi
   `python3 sorgente/build.py`. Le prove girano su `index.html`: senza il montaggio si
   prova la versione vecchia. È la trappola numero uno.
   *(Storicamente il sorgente si montava da `_tir_css.html` + `_tir_html.html` +
   `_tir_js.html`: quei pezzi non sono più nel repository.)*
2. **I cronometri vanno sul tempo di gioco**, non su `performance.now()`: `tempo` cresce
   solo dentro `aggiorna(dt)`. Unica eccezione, `fineA`.
3. **Si scrive in italiano.** Funzioni, variabili, commenti, messaggi.
4. **Supabase non si tocca** e **Aruba è in stand-by**.

## Le prove

Playwright, in `sorgente/`, più quelle comuni in `../sala/sorgente/`: i cinque repo vanno
clonati come cartelle sorelle e quello della sala **deve** chiamarsi `sala`.
`node prova-<nome>.js` dalla cartella `sorgente/`. Prima di pubblicare girano tutte.

Due avvertenze:

- le prove avanzano la partita a mano con `__tiratura.avanza(ms)` a fette da 16 ms, e serve
  `agf.giocatore` in `localStorage` con `addInitScript` prima di caricare la pagina;
- `sorgente/prova-scheda.js` gira su **tutti e quattro** i giochi e misura due schede,
  apertura e fine partita. **Ogni volta che si aggiunge un pulsante alla scheda di fine
  partita va rifatta**: qui il campo è il più basso di tutti ed è il primo a rompersi.

## Pubblicare

Branch di lavoro → prove → pull request → merge in `main` → GitHub Pages pubblica da sola
dalla radice → si verifica l'URL dal vivo. Dettagli in `AGF-come-si-lavora.md`.

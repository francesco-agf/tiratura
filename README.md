# Tiratura

La corsa del ragazzo di bottega di **Arti Grafiche Fimognari**, dal 1950. Il garzone attraversa
di corsa tutto lo stabilimento con le bozze sotto il braccio: bancali di risme, colate
d'inchiostro, bobine che rotolano, la taglierina che scende — e una pioggia di volantini.

Gioca: https://francesco-agf.github.io/tiratura/

## La regola

Si corre da soli: tu pensi solo a **saltare** e a **scivolare**. La distanza si misura in
**metri lineari di carta**, e ogni mille metri è una **risma**.

## Cosa c'è per terra

| | |
|---|---|
| **Bancali di risme** | da uno a tre alti. Si saltano — e sopra ci si può anche atterrare, se ci si arriva dall'alto |
| **Colate d'inchiostro** | larghe, a terra. Atterrarci dentro costa una bozza |
| **Bobine di carta** | rotolano verso di te più veloci di tutto il resto |
| **La taglierina** | lascia solo un passaggio basso: l'unico modo è la scivolata |

Un salto normale scavalca un bancale doppio. Il secondo salto a mezz'aria — la **seconda
passata** — serve per il resto.

## Cosa si prende al volo

| | |
|---|---|
| **Caffè** | otto secondi più veloce, tutto vale un terzo in più |
| **Casco** | assorbe un urto |
| **Muletto** | otto secondi sul transpallet: travolgi tutto |
| **Rullo** | dieci secondi di scia in quadricromia: i volantini valgono il doppio |

A ondate regolari arriva la **pioggia di volantini** (10 punti l'uno), i **biglietti da visita**
che girano su sé stessi (50) e ogni tanto un **manifesto AGF** che ne vale 150.

## Le bozze

Ne hai tre. Ogni urto è una macchia sul grembiule; alla terza sei cestinato. Dopo un urto resti
intoccabile per un secondo e mezzo.

## I reparti

Ogni trecento metri si cambia reparto e la corsa accelera: **magazzino carta**, **reparto
stampa**, **legatoria**, **spedizione**. Poi si ricomincia, più in fretta.

## Comandi

Spazio, ↑ o W per saltare (due volte per la seconda passata), ↓ o S per la scivolata,
P per la pausa, Invio per ricominciare. Da telefono: tocca il campo per saltare, trascina il
dito in giù per scivolare, oppure usa i due tasti sotto.

## Tecnica

Un solo file. Nessuna dipendenza a parte i caratteri da Google Fonts. Il marchio è SVG in linea;
il garzone, gli ostacoli, i fondali in parallasse e le raccolte sono disegnati su canvas; i
rumori di reparto sono sintetizzati con la Web Audio API. La classifica è quella condivisa
della sala.

La simulazione sta tutta in `aggiorna(dt)`, separata dal disegno: i cronometri vanno sul
**tempo di gioco**, non sull'orologio di sistema, così la pausa li ferma davvero e i collaudi
possono far avanzare la partita a mano.

## Il sorgente

`index.html` alla radice è **generato**: non modificarlo a mano. Si lavora su
`sorgente/tiratura.html` e si rilancia `python3 sorgente/build.py` dopo ogni modifica.
Istruzioni in [`sorgente/LEGGIMI.md`](sorgente/LEGGIMI.md).

## Gli altri giochi

**Baseline**: https://francesco-agf.github.io/baseline/
**Refusi**: https://francesco-agf.github.io/refusi/
**Leporello**: https://francesco-agf.github.io/leporello/
La sala giochi: https://francesco-agf.github.io/

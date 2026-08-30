#!/usr/bin/env python3
"""
Rigenera index.html — il file che GitHub Pages pubblica — dal sorgente di lavoro.

Il gioco esiste in due forme dello stesso codice:

  sorgente/tiratura.html   il sorgente di lavoro. Non ha doctype né <head>: quando
                     lo si pubblica come artifact su claude.ai la cornice li
                     mette da sé.
  index.html         la versione autonoma, con testata completa: viewport per
                     il telefono, theme-color, meta per la condivisione.

Questo script incolla sorgente/testa.html davanti al corpo del sorgente.
Va rilanciato **dopo ogni modifica**: i collaudi girano su index.html, e le
media query del telefono funzionano solo lì, perché il sorgente non ha il
meta viewport.

    python3 sorgente/build.py
"""
from pathlib import Path

# il corpo del sorgente comincia da qui: quello che sta prima (il <title> di
# lavoro) viene sostituito dalla testata completa
MARCA = '<link rel="preconnect" href="https://fonts.googleapis.com">'

qui = Path(__file__).resolve().parent
radice = qui.parent

testa = (qui / "testa.html").read_text(encoding="utf-8")
corpo = (qui / "tiratura.html").read_text(encoding="utf-8")
corpo = corpo[corpo.index(MARCA):]

fuori = radice / "index.html"
fuori.write_text(testa + corpo + "\n\n</body>\n</html>\n", encoding="utf-8")
print("index.html rigenerato:", fuori.stat().st_size, "byte")

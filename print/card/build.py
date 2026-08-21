#!/usr/bin/env python3
"""Business card (docs/outreach/pieces/04-business-card.md).

3.5x2in, two sides, 16pt matte. Outputs to out/: card-preview.png (both
sides, high dpi), card.pdf (2 true-size pages).
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import doc, render

OUT = pathlib.Path(__file__).resolve().parent / "out"

CSS = """
.card{width:3.5in;height:2in;background:var(--paper);position:relative;
  overflow:hidden;padding:.18in .2in;display:flex;flex-direction:column}
.card .bar{position:absolute;left:0;top:0;bottom:0;width:.09in;background:var(--accent)}
.name{font:600 12pt/1.15 var(--serif);letter-spacing:-.005em}
.title{font:600 6.6pt/1 var(--sans);letter-spacing:.2em;text-transform:uppercase;
  color:var(--accent);margin-top:4pt}
.reach{margin-top:auto;font-size:7.6pt;line-height:1.6;color:var(--ink)}
.back{flex-direction:row;align-items:center;gap:.16in}
.back .qr{width:1.15in;height:1.15in}
.back .lbl b{display:block;font:600 9pt/1.3 var(--sans)}
.back .lbl span{display:block;font-size:7.4pt;color:var(--soft);margin-top:2pt}
.back .lbl .fact{margin-top:8pt;font-size:7.2pt;color:var(--soft)}

.wrap{display:flex;gap:24px;padding:16px;background:#9AA29E;align-items:flex-start}
.wrap figure{margin:0}
.wrap figcaption{font:600 10px/1 var(--sans);letter-spacing:.08em;color:#EFF2F0;
  text-transform:uppercase;margin-bottom:8px}
"""

FRONT = """<div class="card"><div class="bar"></div>
  <div class="name">Logan DuBose, M.D.</div>
  <div class="title">Adult primary care</div>
  <div class="reach">[phone]<br>[email]<br>[site]</div>
</div>"""

BACK = """<div class="card back"><div class="bar"></div>
  <div class="qr"><b>QR</b></div>
  <div class="lbl"><b>Book a free conversation</b><span>[site]/book</span>
    <div class="fact">$100 a month &middot; [City], Texas</div></div>
</div>"""

PREVIEW = doc(f"""<div class="wrap">
  <figure><figcaption>Front</figcaption>{FRONT}</figure>
  <figure><figcaption>Back</figcaption>{BACK}</figure>
</div>""", CSS)

PROOF = doc(f"<div class='pg'>{FRONT}</div>{BACK}",
            CSS + "@page{size:3.5in 2in;margin:0}body{background:#fff}"
                  ".pg{page-break-after:always}")

JOBS = [
    dict(out=OUT / "card-preview.png", kind="png", w=736, h=250, scale=3, html=PREVIEW),
    dict(out=OUT / "card.pdf", kind="pdf", html=PROOF),
]

if __name__ == "__main__":
    render(JOBS)

#!/usr/bin/env python3
"""Business card (docs/outreach/pieces/04-business-card.md, v2).

3.5x2in, two sides, 16pt matte. Phone is an incomplete placeholder until
the owner supplies the area code. Outputs to out/: card-preview.png,
card.pdf (2 true-size pages).
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import CERT_LINE, CITY, EMAIL, PHONE, QR_IMG, SITE, doc, render

OUT = pathlib.Path(__file__).resolve().parent / "out"

CSS = """
.card{width:3.5in;height:2in;background:var(--paper);position:relative;
  overflow:hidden;padding:.17in .2in .16in .26in;display:flex;flex-direction:column}
.card .bar{position:absolute;left:0;top:0;bottom:0;width:.09in;background:var(--accent)}
.name{font:600 11.5pt/1.15 var(--serif);letter-spacing:-.005em}
.title{font:600 6.4pt/1 var(--sans);letter-spacing:.2em;text-transform:uppercase;
  color:var(--accent);margin-top:3.5pt}
.cert{font-size:6.8pt;line-height:1.35;color:var(--soft);margin-top:5pt;
  max-width:2.3in}
.reach{margin-top:auto;font-size:7.4pt;line-height:1.55}
.reach .soft{color:var(--soft)}
.back{flex-direction:row;align-items:center;gap:.15in}
.back .qr{width:1.12in;height:1.12in}
.back .lbl b{display:block;font:600 8.6pt/1.3 var(--sans)}
.back .lbl span{display:block;font-size:7.2pt;color:var(--soft);margin-top:2pt}
.back .lbl .more{margin-top:7pt;font-size:7.2pt;line-height:1.5}

.wrap{display:flex;gap:24px;padding:16px;background:#9AA29E;align-items:flex-start}
.wrap figure{margin:0}
.wrap figcaption{font:600 10px/1 var(--sans);letter-spacing:.08em;color:#EFF2F0;
  text-transform:uppercase;margin-bottom:8px}
"""

FRONT = f"""<div class="card"><div class="bar"></div>
  <div class="name">Logan DuBose, M.D., M.B.A.</div>
  <div class="title">Primary care physician</div>
  <div class="cert">Lifestyle medicine board certification<br>expected January 2027</div>
  <div class="reach">{CITY}<br><b>{SITE}</b></div>
</div>"""

BACK = f"""<div class="card back"><div class="bar"></div>
  {QR_IMG}
  <div class="lbl"><b>Learn more at {SITE}</b>
    <span>Book a free conversation: {SITE}/book</span>
    <div class="more">{EMAIL}<br><span class="soft">{PHONE}</span><br>
    $100 a month &middot; adult primary care</div></div>
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

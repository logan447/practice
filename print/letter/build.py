#!/usr/bin/env python3
"""General outreach letter (docs/outreach/pieces/03-cover-letter.md, v2).

One standard letter, no per-recipient personalization. Signed by hand on
the printed copy; the preview shows a provisional handwritten treatment
(Caveat type), NOT the physician's real signature. The phone number is an
incomplete placeholder until the owner supplies the area code.
Outputs to out/: letter.png, letter.pdf.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import CITY, EMAIL, PHONE, SITE, doc, render

OUT = pathlib.Path(__file__).resolve().parent / "out"

CSS = """
.page{width:8.5in;height:11in;background:#fff;padding:1in 1.15in;
  display:flex;flex-direction:column}
.lh{display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:2px solid var(--accent);padding-bottom:.16in}
.lh .meta{font-size:8pt;color:var(--soft);text-align:right;line-height:1.6}
.body{font-family:var(--serif);font-size:10.5pt;line-height:1.65;margin-top:.55in}
.body p{font-size:10.5pt;line-height:1.65}
.body p+p{margin-top:11pt}
.ph{color:var(--soft)}
.sigblock{margin-top:.3in}
.sigblock .sig{margin:.12in 0 .08in}
"""

LETTER = f"""
<div class="page">
  <div class="lh">
    <div class="wordmark">DuBose, M.D.<small>Direct primary care</small></div>
    <div class="meta">{CITY}<br>Website: {SITE}<br>Email: {EMAIL}<br>
    Phone: <span class="ph">{PHONE}</span></div>
  </div>
  <div class="body">
    <p>Dear Reader,</p>
    <p>I am writing because this practice may be useful to someone you know
    or serve.</p>
    <p>I run a small primary care practice for adults in Austin. Members pay
    $100 a month. That covers all of my care as their doctor. Visits are
    unhurried. They happen by video, at home, or in person as needed.
    Patients keep their insurance and their other doctors.</p>
    <p>This folder has a one-page overview and brochures you are welcome to
    hand out. If they run out, send me a note and I will bring more.</p>
    <p>I would be glad to answer questions.</p>
    <p>Sincerely,</p>
  </div>
  <div class="sigblock">
    <div class="sig">Logan DuBose</div>
    <div class="body" style="margin-top:0"><p>Logan DuBose, M.D.</p></div>
  </div>
</div>"""

PROOF = doc(LETTER, CSS + "@page{size:8.5in 11in;margin:0}body{background:#fff}")

JOBS = [
    dict(out=OUT / "letter.png", kind="png", w=816, h=1056, html=doc(LETTER, CSS)),
    dict(out=OUT / "letter.pdf", kind="pdf", html=PROOF),
]

if __name__ == "__main__":
    render(JOBS)

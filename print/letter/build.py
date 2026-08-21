#!/usr/bin/env python3
"""Cover letter template (docs/outreach/pieces/03-cover-letter.md).

Letter sheet, single-sided, printed per recipient and signed by hand.
Bracketed placeholders stay visible in previews. Outputs to out/:
letter.png, letter.pdf.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import doc, render

OUT = pathlib.Path(__file__).resolve().parent / "out"

CSS = """
.page{width:8.5in;height:11in;background:#fff;padding:1in 1.15in;
  display:flex;flex-direction:column}
.lh{display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:2px solid var(--accent);padding-bottom:.16in}
.lh .meta{font-size:8pt;color:var(--soft);text-align:right;line-height:1.6}
.body{font-family:var(--serif);font-size:10.5pt;line-height:1.65;margin-top:.5in}
.body p{font-size:10.5pt;line-height:1.65}
.body p+p{margin-top:11pt}
.addr{font-family:var(--serif);font-size:10.5pt;line-height:1.65;margin-top:.45in}
.ph{color:var(--soft)}
.sig{margin-top:.55in}
.sig .space{height:.5in}
"""

LETTER = """
<div class="page">
  <div class="lh">
    <div class="wordmark">DuBose, M.D.<small>Direct primary care</small></div>
    <div class="meta">[City], Texas<br>[phone] &middot; [email]<br>[site]</div>
  </div>
  <div class="addr">
    <span class="ph">[Date]</span><br><br>
    <span class="ph">[Recipient name]<br>[Organization]</span>
  </div>
  <div class="body">
    <p>Dear <span class="ph">[Name]</span>,</p>
    <p>I run a small primary care practice for adults in
    <span class="ph">[City]</span>. I am writing because it may be useful to
    some of the people you work with.</p>
    <p>Members pay $100 a month. That covers all of my care as their doctor.
    Visits are by video, at home, or in person as needed. Patients keep
    their insurance and their other doctors.</p>
    <p class="ph">[Optional: one sentence about this recipient.]</p>
    <p>This folder has a one-page overview for you and brochures you are
    welcome to hand out. If they run out, send me a note and I will bring
    more.</p>
    <p>I would be glad to answer questions.</p>
    <p>Sincerely,</p>
  </div>
  <div class="sig">
    <div class="space"></div>
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

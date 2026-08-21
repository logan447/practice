#!/usr/bin/env python3
"""Practice one-pager, copy v2 (docs/outreach/pieces/02-practice-one-pager.md).

Letter sheet, duplex, printed on demand. Outputs to out/: front.png,
back.png, onepager.pdf (2 trim-size pages).
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import CREDENTIAL_ROWS, PHOTO, doc, render

OUT = pathlib.Path(__file__).resolve().parent / "out"

CSS = """
.page{width:8.5in;height:11in;background:var(--paper);padding:.6in .65in;
  display:flex;flex-direction:column;position:relative;overflow:hidden}
.head{display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:1px solid var(--hair);padding-bottom:.14in;margin-bottom:.24in}
.head .loc{font:600 7pt/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;
  color:var(--soft)}
h1{font:600 19pt/1.2 var(--serif);letter-spacing:-.01em;margin-bottom:8pt}
.intro{font-size:10pt;line-height:1.55;max-width:5.6in}
.grid{display:flex;gap:.5in;margin-top:.28in}
.grid>div{flex:1;min-width:0}
.block{margin-bottom:.26in}
.block:last-child{margin-bottom:0}
.about{display:flex;gap:.4in;margin-bottom:.3in}
.about .txt{flex:1}
.about .photo-frame{width:2in;flex-shrink:0;align-self:flex-start}
.about img{height:2.35in;object-position:50% 22%}
.fine{margin-top:auto;padding-top:.16in;border-top:1px solid var(--hair);
  font-size:7.6pt;color:var(--soft)}
"""

HEAD = """<div class="head">
  <div class="wordmark">DuBose, M.D.<small>Direct primary care</small></div>
  <div class="loc">[City], Texas</div>
</div>"""

FRONT = f"""
<div class="page">
  {HEAD}
  <h1>The practice at a glance</h1>
  <p class="intro">I run a small primary care practice for adults. Members pay
  $100 a month. That covers all of my work as their doctor. I keep the
  practice small so visits have enough time.</p>
  <div class="grid">
    <div>
      <div class="block">
        <h2>Who it may help</h2><hr class="rule">
        <ul class="list bare">
          <li>Adults who need a primary care doctor</li>
          <li>Adults managing ongoing health conditions</li>
          <li>Adults who want to prevent future problems</li>
          <li>Adults who need steady support between specialist visits</li>
        </ul>
      </div>
      <div class="block">
        <h2>What membership includes</h2><hr class="rule">
        <ul class="list">
          <li>Visits as long as they need to be</li>
          <li>Direct messaging, answered within 1 to 2 business days</li>
          <li>Results reviewed and explained</li>
          <li>Prescriptions and refills</li>
          <li>Preventive care and care for ongoing conditions</li>
          <li>Referrals and coordination with other doctors</li>
        </ul>
      </div>
    </div>
    <div>
      <div class="block">
        <h2>How care happens</h2><hr class="rule">
        <p>Most visits are by video. I make home visits when an exam calls
        for it. I use clinic space when that is better. There is no set
        schedule. Care follows need.</p>
      </div>
      <div class="block">
        <h2>Price and insurance</h2><hr class="rule">
        <p>$100 a month per adult. No sign-up fee. No contract. Cancel
        anytime.</p>
        <p>Members keep their insurance and their other doctors. Insurance
        keeps paying for labs, medicines, and hospital care as it does
        today. People on Medicare or Medicaid can join. One extra form is
        needed. The membership is not insurance.</p>
      </div>
      <div class="block">
        <h2>The limits, stated plainly</h2><hr class="rule">
        <p>I keep business hours. This is not an emergency service. I take
        real time away each year and plan ahead for it. I care for adults
        only. When my panel is full, it is full.</p>
      </div>
    </div>
  </div>
  <div class="fine">Continued on the back: about the doctor, and how someone
  starts.</div>
</div>"""

BACK = f"""
<div class="page">
  {HEAD}
  <div class="about">
    <div class="txt">
      <h1>Logan DuBose, M.D.</h1>
      <p>I have practiced primary care part-time for years while leading
      research on aging and caregiving. I built this practice to give
      patients one doctor with enough time.</p>
      {CREDENTIAL_ROWS}
    </div>
    <div class="photo-frame"><img src="{PHOTO}" alt=""></div>
  </div>
  <div class="grid" style="margin-top:0">
    <div>
      <div class="block">
        <h2>How someone starts</h2><hr class="rule">
        <p>The first step is a free conversation. Thirty minutes, by video.
        No cost and no obligation. If I&rsquo;m not the right fit, I&rsquo;ll say so
        and point you toward someone good.</p>
      </div>
      <div class="block">
        <h2>For your organization</h2><hr class="rule">
        <p>You are welcome to hand the enclosed brochures to anyone who may
        benefit. If they run out, send me a note and I will bring more.</p>
        <p>Patients keep their other doctors and their insurance. I work
        alongside the care they already have.</p>
      </div>
    </div>
    <div>
      <div class="block">
        <h2>Contact</h2><hr class="rule">
        <div class="qr-row" style="margin-top:4pt"><div class="qr"><b>QR</b></div>
          <div class="lbl"><b>Book a free conversation</b>
          <span>[site]/book</span></div></div>
        <p style="margin-top:9pt">Learn more: [site]<br>[phone] &middot; [email]</p>
      </div>
    </div>
  </div>
  <div class="fine">This practice is a direct primary care medical service
  agreement under Texas law. It is not health insurance.</div>
</div>"""

PROOF = doc(f"<div class='pg'>{FRONT}</div>{BACK}",
            CSS + "@page{size:8.5in 11in;margin:0}body{background:#fff}"
                  ".pg{page-break-after:always}")

JOBS = [
    dict(out=OUT / "front.png", kind="png", w=816, h=1056, html=doc(FRONT, CSS)),
    dict(out=OUT / "back.png", kind="png", w=816, h=1056, html=doc(BACK, CSS)),
    dict(out=OUT / "onepager.pdf", kind="pdf", html=PROOF),
]

if __name__ == "__main__":
    render(JOBS)

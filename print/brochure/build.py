#!/usr/bin/env python3
"""Patient brochure, copy v2 (docs/outreach/pieces/01-patient-brochure.md).

Roll-fold tri-fold, 11x8.5in. Outputs to out/: outside.png, inside.png,
closed.png, firstopen.png, brochure.pdf (2 trim-size pages).
  outside face: flap (panel 2, 3.625in) | back (panel 6) | cover (panel 1)
  inside face:  panel 3 | panel 4 | panel 5 (3.625in)
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import (CITY, CREDENTIAL_ROWS, EMAIL, ICON_CLINIC, ICON_HOME,
                 ICON_VIDEO, PHOTO, QR_IMG, SITE, STRIP, WORK_TOWARD, doc,
                 render)

OUT = pathlib.Path(__file__).resolve().parent / "out"
WIDE, NARROW = 3.6875, 3.625

CSS = """
.sheet{display:flex;background:var(--paper);position:relative}
.panel{height:8.5in;position:relative;overflow:hidden;
  display:flex;flex-direction:column;padding:.32in .3in}
.panel.wide{width:3.6875in} .panel.narrow{width:3.625in}
.guide{position:absolute;top:0;bottom:0;width:0;border-left:1.5px dashed rgba(32,40,38,.38);z-index:5}
.guide i{position:absolute;top:3px;left:4px;font:600 8px/1 var(--sans);font-style:normal;
  letter-spacing:.08em;color:rgba(32,40,38,.55);text-transform:uppercase}
.h3{font-family:var(--serif);font-weight:600;font-size:11pt;margin:11pt 0 5pt}
.gap{margin-top:12pt}

.cover h1{font:600 17.5pt/1.3 var(--serif);letter-spacing:-.01em;margin-top:.55in}
.cover .pricing{margin-top:.3in}
.cover .pricing b{display:block;font:600 11pt/1.5 var(--sans)}
.cover .pricing span{display:block;font-size:9.6pt;color:var(--soft);margin-top:2pt}
.cover .photo-frame{margin-top:auto}
.cover .photo-frame img{height:2.75in;object-position:50% 22%}

.recog{background:var(--band-warm)}

.price{background:var(--band-tint)}
.price .amt{font:600 23pt/1 var(--serif);margin-top:2pt}
.price .amt span{font:400 9pt/1 var(--sans);color:var(--soft)}
.price .per{font-size:8.8pt;color:var(--soft);margin:4pt 0 9pt}
.price p{font-size:8.8pt;line-height:1.48}
.cols{display:flex;gap:.16in;padding:7pt 0;border-top:1px solid rgba(32,40,38,.16);
  border-bottom:1px solid rgba(32,40,38,.16);margin-bottom:8pt}
.cols div{flex:1}
.cols b{display:block;font:600 8.4pt/1.3 var(--sans);margin-bottom:3pt}
.cols span{font-size:8.6pt;line-height:1.45;display:block}
.cols div+div{border-left:1px solid rgba(32,40,38,.16);padding-left:.16in}

.back{padding:0}
.back .main{flex:1;display:flex;flex-direction:column;padding:.32in .3in .18in}
.back .contact{margin-top:auto;padding-top:.12in;font-size:8.8pt;line-height:1.55}
.back .contact b{font-family:var(--serif);font-size:10.5pt}
"""

P1_COVER = f"""
<section class="panel wide cover">
  <div class="wordmark">DuBose, M.D.<small>Direct primary care</small></div>
  <h1>Unhurried direct primary care by a physician who knows you.</h1>
  <div class="pricing">
    <b>$100 a month &middot; Cancel anytime</b>
    <span>Works alongside your insurance.</span>
  </div>
  <div class="photo-frame"><img src="{PHOTO}" alt=""></div>
</section>"""

P2_FLAP = """
<section class="panel narrow recog">
  <h2>What this is</h2>
  <hr class="rule">
  <p>A small medical practice with one doctor. Members pay one flat monthly
  price. I provide their ongoing primary care and stay with them over time.</p>
  <h2 class="gap">Who it may help</h2>
  <hr class="rule">
  <ul class="list bare">
    <li>Adults who need a primary care doctor</li>
    <li>Adults managing ongoing health conditions</li>
    <li>Adults who want to prevent future problems</li>
    <li>Adults who want care that fits their schedule</li>
  </ul>
  <h2 class="gap">What I treat</h2>
  <hr class="rule">
  <div class="goals">
    <span>High blood pressure</span>
    <span>Diabetes</span>
    <span>High cholesterol</span>
    <span>Thyroid problems</span>
    <span>Asthma</span>
    <span>Acid reflux</span>
    <span>Colds and infections</span>
    <span>Anxiety and depression</span>
    <span>Sleep problems</span>
    <span>Weight</span>
  </div>
  <p style="margin-top:7pt">And other common primary care needs.</p>
</section>"""

P3_PROVIDE = """
<section class="panel wide">
  <h2>What I provide</h2>
  <hr class="rule">
  <ul class="list">
    <li>Visits as long as they need to be</li>
    <li>Direct messaging with me</li>
    <li>Results reviewed and explained</li>
    <li>Prescriptions and refills</li>
    <li>Preventive care and checkups</li>
    <li>Care for ongoing conditions</li>
    <li>Referrals and coordination</li>
  </ul>
  <p class="gap">This is ongoing care from one doctor, not one-time advice.
  There are no per-visit charges.</p>
</section>"""

P4_HOW = f"""
<section class="panel wide">
  <h2>How care works</h2>
  <hr class="rule">
  <div class="icons">
    <div>{ICON_VIDEO}<b>Video visits</b></div>
    <div>{ICON_HOME}<b>Home visits</b></div>
    <div>{ICON_CLINIC}<b>In-person visits</b></div>
  </div>
  <p>Most care is by video. I see people at home or in a clinic when an exam
  is needed.</p>
  <div class="h3">What care looks like</div>
  <ol class="stepper">
    <li>Understand your health</li>
    <li>Make a plan</li>
    <li>Work on it together</li>
    <li>Track progress</li>
  </ol>
  <p>I answer messages within 1 to 2 business days.</p>
  <div class="h3">What we work toward</div>
  {WORK_TOWARD}
</section>"""

P5_PRICE = f"""
<section class="panel narrow price">
  <h2>The price</h2>
  <hr class="rule">
  <div class="amt">$100 <span>a month</span></div>
  <div class="per">per adult &middot; no contract &middot; cancel anytime</div>
  <div class="cols">
    <div><b>Included</b><span>All care from me, with no per-visit
    charges.</span></div>
    <div><b>Not included</b><span>Labs and imaging. Medicines. Care from
    other doctors. Hospital care.</span></div>
  </div>
  <p>Your insurance keeps paying for those, as it does today.<br>
  People with Medicare or Medicaid can join.</p>
  <div class="h3">Membership highlights</div>
  <ul class="list bare">
    <li>Month to month from day one</li>
    <li>No per-visit charges and no no-show fees</li>
    <li>Care during business hours, Monday to Friday</li>
    <li>Adult primary care only</li>
  </ul>
  <p style="margin-top:8pt">Full agreement: {SITE}/agreement</p>
  <p style="margin-top:8pt">If the price would keep you from care, tell me.
  I hold a small number of reduced-rate memberships.</p>
</section>"""

P6_BACK = f"""
<section class="panel wide back">
  <div class="main">
    <h2>About Dr. DuBose</h2>
    <hr class="rule">
    {CREDENTIAL_ROWS}
    <h2 class="gap">Start with a free conversation</h2>
    <hr class="rule">
    <p>Thirty minutes by video, at no cost. Tell me what is going on. I will
    say honestly whether I can help. If I&rsquo;m not the right fit, I&rsquo;ll say so
    and point you toward someone good.</p>
    <div class="qr-row" style="margin-top:.14in">{QR_IMG}
      <div class="lbl"><b>Learn more at {SITE}</b>
      <span>Book a free conversation: {SITE}/book</span></div></div>
    <div class="contact">
      <b>DuBose, M.D.</b><br>{CITY}<br>{EMAIL}
    </div>
  </div>
  {STRIP}
</section>"""


def page(title, note, panels, guides, preview=True):
    slug = f'<div class="slug">{title} <em>{note}</em></div>' if preview else ""
    gd = "".join(f'<div class="guide" style="left:{p}in"><i>{l}</i></div>'
                 for p, l in guides) if preview else ""
    return doc(f"{slug}<div class='sheet'>{''.join(panels)}{gd}</div>", CSS)


PROOF = doc(
    f"<div class='sheet pg'>{P2_FLAP}{P6_BACK}{P1_COVER}</div>"
    f"<div class='sheet'>{P3_PROVIDE}{P4_HOW}{P5_PRICE}</div>",
    CSS + "@page{size:11in 8.5in;margin:0}body{background:#fff}.pg{page-break-after:always}")

JOBS = [
    dict(out=OUT / "outside.png", kind="png", w=1056, h=860,
         html=page("Outside face", "draft preview &middot; trim 11 &times; 8.5 in &middot; "
                   "flap | back cover | front cover", [P2_FLAP, P6_BACK, P1_COVER],
                   [(NARROW, "fold"), (NARROW + WIDE, "fold")])),
    dict(out=OUT / "inside.png", kind="png", w=1056, h=860,
         html=page("Inside face", "draft preview &middot; panels 3 | 4 | 5",
                   [P3_PROVIDE, P4_HOW, P5_PRICE], [(WIDE, "fold"), (WIDE * 2, "fold")])),
    dict(out=OUT / "closed.png", kind="png", w=354, h=860,
         html=page("Front cover", "as handed to someone", [P1_COVER], [])),
    dict(out=OUT / "firstopen.png", kind="png", w=702, h=860,
         html=page("First open", "inside of cover + flap: panel 3 | panel 2",
                   [P3_PROVIDE, P2_FLAP], [(WIDE, "fold")])),
    dict(out=OUT / "brochure.pdf", kind="pdf", html=PROOF),
]

if __name__ == "__main__":
    render(JOBS)

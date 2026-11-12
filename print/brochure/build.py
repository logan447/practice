#!/usr/bin/env python3
"""Patient brochure — print build (pipeline steps 2-3, docs/outreach/production.md).

Copy source: docs/outreach/pieces/01-patient-brochure.md (transcribed verbatim).
Outputs to out/ (gitignored):
  outside.png, inside.png    - flat faces, true-scale, with fold guides + slug
  closed.png, firstopen.png  - reading-sequence views
  brochure-proof.pdf         - 2 pages, exact trim 11x8.5in, no guides (home proof)

Roll-fold imposition, 11x8.5in landscape sheet:
  outside face, left to right:  flap (panel 2, 3.625in) | back (panel 6) | cover (panel 1)
  inside face,  left to right:  panel 3 | panel 4 | panel 5 (3.625in)
Regular panels are 3.6875in; the in-folding flap and its reverse are 1/16in narrower.
"""
import glob
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(__file__).resolve().parent / "out"
OUT.mkdir(exist_ok=True)
FONTS = ROOT / "print" / "fonts"
PHOTO = ROOT / "site" / "public" / "images" / "dr-dubose-square.jpg"

WIDE, NARROW = 3.6875, 3.625  # inches
SLUG_PX = 44                  # preview label strip, outside the artwork

CSS = f"""
@font-face{{font-family:'Source Serif 4';font-weight:400;src:url('{FONTS}/SourceSerif4-400-latin.woff2') format('woff2')}}
@font-face{{font-family:'Source Serif 4';font-weight:600;src:url('{FONTS}/SourceSerif4-600-latin.woff2') format('woff2')}}
@font-face{{font-family:'Source Sans 3';font-weight:400;src:url('{FONTS}/SourceSans3-400-latin.woff2') format('woff2')}}
@font-face{{font-family:'Source Sans 3';font-weight:600;src:url('{FONTS}/SourceSans3-600-latin.woff2') format('woff2')}}
:root{{
  --paper:#FAF7F1; --ink:#202826; --soft:#5B6461; --accent:#2A6B5F;
  --pine:#1E3B34; --pine-deep:#16302A; --band-warm:#F1EBDF; --band-tint:#E5EFE9;
  --card:#FFFFFF; --card-line:#E4DED1; --hair:#DCD4C5; --em:#A6392F;
  --serif:'Source Serif 4',Georgia,serif; --sans:'Source Sans 3',system-ui,sans-serif;
}}
*{{box-sizing:border-box;margin:0}}
body{{margin:0;background:#9AA29E;font-family:var(--sans);color:var(--ink);
  -webkit-font-smoothing:antialiased}}
.slug{{height:{SLUG_PX}px;display:flex;align-items:center;gap:14px;padding:0 12px;
  font:600 11px/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:#EFF2F0}}
.slug em{{font-style:normal;font-weight:400;letter-spacing:.02em;text-transform:none;color:#D4DAD7}}
.sheet{{display:flex;background:var(--paper);position:relative}}
.panel{{height:8.5in;position:relative;overflow:hidden;
  display:flex;flex-direction:column;padding:.32in .3in}}
.panel.wide{{width:{WIDE}in}} .panel.narrow{{width:{NARROW}in}}
.guide{{position:absolute;top:0;bottom:0;width:0;border-left:1.5px dashed rgba(32,40,38,.38);z-index:5}}
.guide i{{position:absolute;top:3px;left:4px;font:600 8px/1 var(--sans);font-style:normal;
  letter-spacing:.08em;color:rgba(32,40,38,.55);text-transform:uppercase}}

h2{{font-family:var(--serif);font-weight:600;font-size:15.5pt;line-height:1.22;
  letter-spacing:-.008em;margin-bottom:9pt}}
p{{font-size:9.4pt;line-height:1.52}}
p+p{{margin-top:7pt}}
.rule{{width:.46in;height:2px;background:var(--accent);border:0;margin:0 0 10pt}}
.soft{{color:var(--soft)}}

/* panel 1 - cover */
.cover{{background:var(--paper)}}
.wordmark{{font:600 15.5pt/1.05 var(--serif)}}
.wordmark small{{display:block;font:600 6.4pt/1 var(--sans);letter-spacing:.24em;
  text-transform:uppercase;color:var(--soft);margin-top:4pt}}
.cover h1{{font:600 21.5pt/1.2 var(--serif);letter-spacing:-.01em;margin-top:.62in}}
.cover .pricing{{margin-top:.34in}}
.cover .pricing b{{display:block;font:600 11pt/1.5 var(--sans)}}
.cover .pricing span{{display:block;font:400 9.6pt/1.5 var(--sans);color:var(--soft);margin-top:2pt}}
.cover .photo-frame{{margin-top:auto;position:relative;padding:0 .14in .14in 0}}
.cover .photo-frame::after{{content:"";position:absolute;inset:.14in 0 0 .14in;
  background:var(--band-tint);border-radius:8px}}
.cover .photo-frame img{{position:relative;z-index:1;display:block;width:100%;
  height:2.5in;object-fit:cover;object-position:50% 22%;border-radius:8px}}

/* panel 2 - recognition (flap) */
.recog{{background:var(--band-warm)}}
.recog p{{font-size:10.2pt;line-height:1.62}}
.recog p+p{{margin-top:9pt}}
/* the payoff line sits at the foot of the flap, as the closing blocks do
   on panels 3-4, so a short panel reads as composed rather than unfilled. */
.recog .last{{font-weight:600;margin-top:auto;padding-top:12pt}}

/* panels 3-4 */
.list{{list-style:none;padding:0;margin:8pt 0}}
.list li{{font-size:8.9pt;line-height:1.42;padding:4.6pt 0 4.6pt 15pt;position:relative;
  border-top:1px solid var(--hair)}}
.list li:first-child{{border-top:0}}
.list li::before{{content:"";position:absolute;left:1px;top:9.5pt;width:7.5pt;height:4.5pt;
  border-left:1.6pt solid var(--accent);border-bottom:1.6pt solid var(--accent);
  transform:rotate(-45deg)}}
.lead{{font-weight:600;font-size:9.4pt;margin-top:9pt}}
/* the closing block sits at the panel foot: it anchors the panel and
   takes up the slack left by panels that run short. */
.closing{{margin-top:auto;padding-top:10pt;border-top:1px solid var(--hair)}}

/* panel 5 - price */
.price{{background:var(--band-tint)}}
.price .card{{background:var(--card);border:1px solid var(--card-line);border-radius:10px;
  padding:.2in .18in;margin-top:2pt}}
.price .amt{{font:600 24pt/1 var(--serif)}}
.price .amt span{{font:400 9pt/1 var(--sans);color:var(--soft)}}
.price .per{{font-size:8.8pt;color:var(--soft);margin:4pt 0 8pt}}
.price p{{font-size:8.7pt;line-height:1.46}}
.price p b{{font-family:var(--serif);font-size:9.3pt}}

/* panel 6 - back cover */
.back{{padding:0;background:var(--paper)}}
.back .main{{flex:1;display:flex;flex-direction:column;padding:.32in .3in .2in}}
.qr-row{{display:flex;align-items:center;gap:.14in;margin-top:.16in}}
.qr{{width:.88in;height:.88in;flex-shrink:0;border:2px solid var(--ink);border-radius:4px;
  background:repeating-linear-gradient(45deg,#fff 0 3px,#D8D2C4 3px 6px);
  display:grid;place-items:center}}
.qr b{{font:600 8pt/1 var(--sans);letter-spacing:.1em;background:#fff;padding:2px 5px;
  border-radius:3px;color:var(--soft)}}
.qr-row .lbl b{{display:block;font:600 9.6pt/1.3 var(--sans)}}
.qr-row .lbl span{{display:block;font-size:8.6pt;color:var(--soft);margin-top:2pt}}
.back .contact{{margin-top:auto;padding-top:.14in;font-size:8.8pt;line-height:1.55}}
.back .contact b{{font-family:var(--serif);font-size:10.5pt}}
.back .strip{{background:var(--pine-deep);color:#C9D2CD;padding:.16in .3in .2in;
  font-size:7.6pt;line-height:1.55}}
.back .strip .em{{color:#E8C7C2;font-weight:600;font-size:8.2pt}}
.back .strip .legal{{margin-top:5pt;color:#8FA39B}}
"""

# ---- panel content, verbatim from docs/outreach/pieces/01-patient-brochure.md ----

P1_COVER = f"""
<section class="panel wide cover">
  <div class="wordmark">Direct Lifestyle Medicine<small>Logan DuBose, M.D.</small></div>
  <h1>Prevention first, with medical care when you need it.</h1>
  <div class="pricing">
    <b>Adults &middot; $99 a month &middot; Cancel anytime</b>
    <span>Reduced and free memberships available.</span>
  </div>
  <div class="photo-frame"><img src="{PHOTO}" alt=""></div>
</section>"""

P2_RECOG = """
<section class="panel narrow recog">
  <h2>Where most people start</h2>
  <hr class="rule">
  <p>Maybe it&rsquo;s several things at once. Blood pressure creeping up. Sleep
  that never feels like rest. Weight that will not move. Results you&rsquo;d like
  to understand better. Medicines you have questions about.</p>
  <p>Or maybe nothing is wrong yet. You just want to keep it that way, and you
  want a doctor who knows you.</p>
  <p>Either way, we start the same. A full look at your health and the way you
  live, then a plan you can actually follow.</p>
  <p class="last">That is what this practice is for.</p>
</section>"""

P3_SERVICES = """
<section class="panel wide">
  <h2>Three parts of one practice</h2>
  <hr class="rule">
  <p>Not three plans. Every member gets the first. The other two come in as
  your health calls for them.</p>
  <p class="lead">Prevention and lifestyle medicine</p>
  <p>The foundation, for every member. Screenings on time, and a written plan
  with goals we check against. We work on:</p>
  <ul class="list">
    <li>Food and metabolic health</li>
    <li>Movement</li>
    <li>Sleep</li>
    <li>Stress and emotional health</li>
    <li>The people around you</li>
    <li>Alcohol, tobacco, and other habits</li>
  </ul>
  <p class="lead">Medical care and treatment</p>
  <p>I examine, diagnose, order labs and imaging, prescribe, and follow up on
  results. Starting with lifestyle is not a rule against using medicine.</p>
  <p class="lead">Care coordination</p>
  <p>I work with your other doctors, make referrals, and track what comes back.
  If I am your only doctor, I help you set up whatever else you need.</p>
  <p class="closing"><b>You do not need another doctor to join.</b> If you have
  one, I work alongside them. You are never asked to choose.</p>
</section>"""

P4_CARE = """
<section class="panel wide">
  <h2>How care happens</h2>
  <hr class="rule">
  <p>Most care happens by video and secure messaging. When an exam needs it, I
  come to you at home. When clinic space is better, I use space I keep for
  exactly that. There is no required visit schedule. Care follows what your
  health needs.</p>
  <p class="lead">Included, with no per-visit charges:</p>
  <ul class="list">
    <li>A full first assessment of your health and habits</li>
    <li>A written plan, reviewed as you go</li>
    <li>Visits as your care needs them, as long as they need to be</li>
    <li>Direct messaging with me between visits</li>
    <li>Every result reviewed and explained</li>
    <li>Medicines managed within my scope</li>
    <li>Referrals and coordination with your other doctors</li>
    <li>Forms and paperwork handled</li>
  </ul>
  <p class="closing">Between visits, message me. I answer within 1&ndash;2 business
  days, usually faster. I keep business hours and take real time away each year,
  always with a clear plan for your care while I&rsquo;m gone. Away means slower,
  never unaware.</p>
</section>"""

P5_PRICE = """
<section class="panel narrow price">
  <h2>The price, plainly</h2>
  <div class="card">
    <div class="amt">$99 <span>a month</span></div>
    <div class="per">per adult &middot; flat and published &middot; no enrollment fee &middot;
    no contract &middot; cancel anytime</div>
    <p><b>If $99 is a barrier,</b> say so when we talk. I offer a reduced monthly
    fee based on your finances, and a small number of free memberships. The
    medical care is the same at every level. No application, just a
    conversation.</p>
    <p><b>What it doesn&rsquo;t cover:</b> labs, imaging, medicines, specialists,
    urgent care, ER, and hospital care. Your insurance keeps paying for those as
    it does today. On Medicare or Medicaid? Ask me. How a membership works with
    those programs is still being settled.</p>
    <p><b>What&rsquo;s the catch?</b> I keep business hours and am not an emergency
    service. I treat within my scope and refer when something is outside it. And
    when my panel is full, it is full. That is the whole catch.</p>
  </div>
</section>"""

P6_BACK = """
<section class="panel wide back">
  <div class="main">
    <h2>Start with a conversation. That&rsquo;s all.</h2>
    <hr class="rule">
    <p>Thirty minutes, by video, free. Tell me what&rsquo;s going on. I&rsquo;ll tell you
    honestly whether I can help, and if I&rsquo;m not the right fit, I&rsquo;ll say so and
    point you toward someone good.</p>
    <div class="qr-row"><div class="qr"><b>QR</b></div>
      <div class="lbl"><b>Book a free conversation</b><span>[site]/book</span></div></div>
    <div class="qr-row"><div class="qr"><b>QR</b></div>
      <div class="lbl"><b>Everything else, answered</b><span>[site]</span></div></div>
    <div class="contact">
      <b>Direct Lifestyle Medicine</b><br>Logan DuBose, M.D. &middot; [City], Texas<br>
      [phone] &middot; [email]<br>I care for adults only.
    </div>
  </div>
  <div class="strip">
    <div class="em">If this is an emergency, call 911 or go to the nearest ER.</div>
    <div class="legal">This practice is a direct medical service agreement
    under Texas law; it is not health insurance.</div>
  </div>
</section>"""


def page(title, note, panels, guides, preview=True):
    slug = f'<div class="slug">{title} <em>{note}</em></div>' if preview else ""
    gd = "".join(
        f'<div class="guide" style="left:{pos}in"><i>{lbl}</i></div>' for pos, lbl in guides
    ) if preview else ""
    return (f"<!doctype html><meta charset='utf-8'><style>{CSS}</style>"
            f"{slug}<div class='sheet'>{''.join(panels)}{gd}</div>")


def proof():
    return (f"<!doctype html><meta charset='utf-8'><style>{CSS}"
            "@page{size:11in 8.5in;margin:0}body{background:#fff}"
            ".pg{page-break-after:always}</style>"
            f"<div class='sheet pg'>{P2_RECOG}{P6_BACK}{P1_COVER}</div>"
            f"<div class='sheet'>{P3_SERVICES}{P4_CARE}{P5_PRICE}</div>")


PAGES = {
    "outside": page("Outside face", "draft preview &middot; trim 11 &times; 8.5 in &middot; "
                    "flap | back cover | front cover",
                    [P2_RECOG, P6_BACK, P1_COVER],
                    [(NARROW, "fold"), (NARROW + WIDE, "fold")]),
    "inside": page("Inside face", "draft preview &middot; panels 3 | 4 | 5",
                   [P3_SERVICES, P4_CARE, P5_PRICE],
                   [(WIDE, "fold"), (WIDE * 2, "fold")]),
    "closed": page("Front cover", "as handed to someone", [P1_COVER], []),
    "firstopen": page("First open", "inside of cover + flap: panel 3 | panel 2",
                      [P3_SERVICES, P2_RECOG], [(WIDE, "fold")]),
}

SIZES = {"outside": 11.0, "inside": 11.0, "closed": WIDE, "firstopen": WIDE + NARROW}


def main():
    # Headless Chromium via CLI does not honor --window-size for layout in
    # this build; Playwright sets the viewport reliably.
    from playwright.sync_api import sync_playwright

    # The bundled browser has moved between chrome-linux/ and chrome-linux64/
    # across Playwright versions; the stable symlink is tried first.
    cands = ["/opt/pw-browsers/chromium"]
    for pat in ("/opt/pw-browsers/chromium-*/chrome-linux*/chrome",
                "/opt/pw-browsers/chromium_headless_shell-*/chrome-linux*/headless_shell"):
        cands += sorted(glob.glob(pat))
    chrome = next((c for c in cands if pathlib.Path(c).exists()), None)
    if chrome is None:
        raise SystemExit("no bundled Chromium found under /opt/pw-browsers")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=chrome)
        pg = browser.new_page(device_scale_factor=2, viewport={"width": 1056, "height": 900})
        for name, html in PAGES.items():
            f = OUT / f"{name}.html"
            f.write_text(html)
            w = round(SIZES[name] * 96)
            pg.set_viewport_size({"width": w, "height": round(8.5 * 96) + SLUG_PX})
            pg.goto(f.as_uri())
            pg.screenshot(path=OUT / f"{name}.png", full_page=True)
            print(f"rendered {name}.png")
        f = OUT / "proof.html"
        f.write_text(proof())
        pg.goto(f.as_uri())
        pg.pdf(path=OUT / "brochure-proof.pdf", prefer_css_page_size=True,
               print_background=True,
               margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        browser.close()
    print("rendered brochure-proof.pdf (2 pages, exact trim, print at 100%)")


if __name__ == "__main__":
    main()

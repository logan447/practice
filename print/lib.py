"""Shared print tokens and render helpers for the outreach pieces.

Pipeline steps 2-3 (docs/outreach/production.md): layouts are HTML/CSS at
exact physical size on the website's visual tokens; previews are true-scale
PNGs; PDFs are trim-size proofs. Bleed versions are generated at order time
(step 6) by extending page size 0.125in per edge; backgrounds already run to
the trim edge so no layout changes are needed then.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
FONTS = ROOT / "print" / "fonts"
PHOTO = ROOT / "site" / "public" / "images" / "dr-dubose-square.jpg"
QR_SVG = ROOT / "print" / "assets" / "qr-dubosemd.svg"

# Practice facts used across pieces.
CITY = "Austin, Texas"
SITE = "dubosemd.com"
EMAIL = "logan@dubosemd.com"
PHONE = "(979) 481-9110"
CERT_LINE = "Lifestyle medicine board certification expected January 2027"

BASE_CSS = f"""
@font-face{{font-family:'Source Serif 4';font-weight:400;src:url('{FONTS}/SourceSerif4-400-latin.woff2') format('woff2')}}
@font-face{{font-family:'Source Serif 4';font-weight:600;src:url('{FONTS}/SourceSerif4-600-latin.woff2') format('woff2')}}
@font-face{{font-family:'Source Sans 3';font-weight:400;src:url('{FONTS}/SourceSans3-400-latin.woff2') format('woff2')}}
@font-face{{font-family:'Source Sans 3';font-weight:600;src:url('{FONTS}/SourceSans3-600-latin.woff2') format('woff2')}}
@font-face{{font-family:'Caveat';font-weight:600;src:url('{FONTS}/Caveat-600.ttf') format('truetype')}}
:root{{
  --paper:#FAF7F1; --ink:#202826; --soft:#5B6461; --accent:#2A6B5F;
  --pine:#1E3B34; --pine-deep:#16302A; --band-warm:#F1EBDF; --band-tint:#E5EFE9;
  --card:#FFFFFF; --card-line:#E4DED1; --hair:#DCD4C5;
  --serif:'Source Serif 4',Georgia,serif; --sans:'Source Sans 3',system-ui,sans-serif;
}}
*{{box-sizing:border-box;margin:0}}
body{{margin:0;background:#9AA29E;font-family:var(--sans);color:var(--ink);
  -webkit-font-smoothing:antialiased}}
.slug{{height:44px;display:flex;align-items:center;gap:14px;padding:0 12px;
  font:600 11px/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:#EFF2F0}}
.slug em{{font-style:normal;font-weight:400;letter-spacing:.02em;text-transform:none;color:#D4DAD7}}

h2{{font-family:var(--serif);font-weight:600;font-size:14.5pt;line-height:1.22;
  letter-spacing:-.008em;margin-bottom:8pt}}
p{{font-size:9.4pt;line-height:1.5}}
p+p{{margin-top:6pt}}
.rule{{width:.46in;height:2px;background:var(--accent);border:0;margin:0 0 9pt}}
.soft{{color:var(--soft)}}

.wordmark{{font:600 15.5pt/1.05 var(--serif)}}
.wordmark small{{display:block;font:600 6.4pt/1 var(--sans);letter-spacing:.24em;
  text-transform:uppercase;color:var(--soft);margin-top:4pt}}

.list{{list-style:none;padding:0;margin:6pt 0 0}}
.list li{{font-size:9pt;line-height:1.4;padding:4.4pt 0 4.4pt 15pt;position:relative;
  border-top:1px solid var(--hair)}}
.list li:first-child{{border-top:0}}
.list li::before{{content:"";position:absolute;left:1px;top:9pt;width:7.5pt;height:4.5pt;
  border-left:1.6pt solid var(--accent);border-bottom:1.6pt solid var(--accent);
  transform:rotate(-45deg)}}
.list.bare li{{padding-left:12pt}}
.list.bare li::before{{border:0;width:4pt;height:4pt;border-radius:50%;
  background:var(--accent);top:10pt}}

.rows{{margin:6pt 0 0}}
.rows div{{display:flex;font-size:8.8pt;line-height:1.4;padding:4pt 0;
  border-top:1px solid var(--hair)}}
.rows div:first-child{{border-top:0}}
.rows b{{flex:0 0 .95in;font-weight:600;color:var(--soft)}}

.qr{{width:.95in;height:.95in;flex-shrink:0;background:#fff;border:1px solid var(--hair);
  border-radius:4px;display:block}}
.qr-row{{display:flex;align-items:center;gap:.14in}}
.qr-row .lbl b{{display:block;font:600 9.6pt/1.3 var(--sans)}}
.qr-row .lbl span{{display:block;font-size:8.6pt;color:var(--soft);margin-top:2pt}}

.strip{{background:var(--pine-deep);color:#C9D2CD;font-size:7.6pt;line-height:1.55}}
.strip .em{{color:#E8C7C2;font-weight:600;font-size:8.2pt}}
.strip .legal{{margin-top:4pt;color:#8FA39B}}

.icons{{display:flex;gap:.1in;margin:8pt 0 6pt}}
.icons div{{flex:1;text-align:center}}
.icons svg{{width:22pt;height:22pt;color:var(--accent);display:block;margin:0 auto 3pt}}
.icons b{{font:600 8.2pt/1.25 var(--sans);display:block}}

.goals{{display:flex;flex-wrap:wrap;margin-top:2pt}}
.goals span{{flex:0 0 50%;font-size:8.6pt;line-height:1.4;padding:3.2pt 6pt 3.2pt 11pt;
  position:relative}}
.goals span::before{{content:"";position:absolute;left:1px;top:8.4pt;width:4pt;height:4pt;
  border-radius:50%;background:var(--accent)}}

.sig{{font-family:'Caveat',cursive;font-size:24pt;line-height:1;color:var(--ink);
  transform:rotate(-2deg);display:inline-block}}

.stepper{{list-style:none;counter-reset:s;margin:8pt 0 6pt;padding:0}}
.stepper li{{counter-increment:s;position:relative;padding:0 0 10pt 22pt;
  font:600 9.2pt/1.35 var(--sans)}}
.stepper li::before{{content:counter(s);position:absolute;left:0;top:-1pt;width:13pt;
  height:13pt;border-radius:50%;background:var(--accent);color:#fff;
  font:600 7.5pt/13pt var(--sans);text-align:center}}
.stepper li:not(:last-child)::after{{content:"";position:absolute;left:6.1pt;top:13pt;
  bottom:-1pt;width:1.2pt;background:var(--hair)}}
.stepper li:last-child{{padding-bottom:0}}

.photo-frame{{position:relative;padding:0 .14in .14in 0}}
.photo-frame::after{{content:"";position:absolute;inset:.14in 0 0 .14in;
  background:var(--band-tint);border-radius:8px}}
.photo-frame img{{position:relative;z-index:1;display:block;width:100%;
  object-fit:cover;border-radius:8px}}
"""

ICON_VIDEO = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
 stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6.5" width="13" height="11"
 rx="2"/><path d="M15.5 10.5l6-3v9l-6-3z"/></svg>"""
ICON_HOME = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
 stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.5 12 4.5l8.5 7"/>
 <path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>"""
ICON_CLINIC = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
 stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5v-11L12 4l7.5 4.5v11"/>
 <path d="M2.5 19.5h19"/><path d="M12 10.5v5M9.5 13h5"/></svg>"""

CREDENTIAL_ROWS = f"""<div class="rows">
<div><b>M.D.</b><span>Texas A&amp;M College of Medicine</span></div>
<div><b>Internship</b><span>Internal medicine, George Washington University</span></div>
<div><b>Research</b><span>NIH-funded work on aging and caregiving</span></div>
<div><b>Certification</b><span>Lifestyle medicine, expected January 2027,
International Board of Lifestyle Medicine</span></div>
<div><b>Full CV</b><span>{SITE}/cv</span></div>
</div>"""

# "What we work toward" — wording from the approved help page (site
# help.astro goals list), shortened, never reworded.
WORK_TOWARD = """<div class="goals">
<span>Feel better day to day</span>
<span>Understand your health</span>
<span>Improve the numbers that matter</span>
<span>Keep conditions under control</span>
<span>Prevent disease where we can</span>
<span>Stay independent and able</span>
</div>"""

QR_IMG = f'<img class="qr" src="{QR_SVG}" alt="QR code for {SITE}">'

# "What I treat" — patient-friendly terms, from the approved help page.
# Shared so the brochure and one-pager cannot drift.
TREAT_LIST = """<div class="goals">
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
</div>"""

STRIP = """<div class="strip" style="padding:.14in .3in .18in">
<div class="em">If this is an emergency, call 911 or go to the nearest ER.</div>
<div class="legal">This practice is a direct primary care medical service agreement
under Texas law. It is not health insurance.</div></div>"""


def doc(body, extra_css=""):
    return (f"<!doctype html><meta charset='utf-8'>"
            f"<style>{BASE_CSS}{extra_css}</style>{body}")


def render(jobs):
    """jobs: iterable of dicts {out, html, kind:'png'|'pdf', w, h, scale?}.
    w/h in CSS px for png viewport; pdf uses @page from the HTML."""
    import glob
    from playwright.sync_api import sync_playwright

    chrome = glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome")[0]
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=chrome)
        for j in jobs:
            out = pathlib.Path(j["out"])
            out.parent.mkdir(exist_ok=True)
            src = out.with_suffix(".html")
            src.write_text(j["html"])
            if j["kind"] == "png":
                pg = browser.new_page(device_scale_factor=j.get("scale", 2),
                                      viewport={"width": j["w"], "height": j["h"]})
                pg.goto(src.as_uri())
                pg.screenshot(path=out, full_page=True)
            else:
                pg = browser.new_page()
                pg.goto(src.as_uri())
                pg.pdf(path=out, prefer_css_page_size=True, print_background=True,
                       margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            pg.close()
            print("rendered", out.name)
        browser.close()

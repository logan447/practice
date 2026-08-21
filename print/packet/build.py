#!/usr/bin/env python3
"""Packet map: one internal sheet showing the standard packet as an
experience. What is inside, what is seen first, what gets kept, what gets
handed out, and the action each piece asks for. Not for distribution.
Outputs to out/: packet-map.png, packet-map.pdf (11x8.5 landscape).
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import doc, render

OUT = pathlib.Path(__file__).resolve().parent / "out"

CSS = """
.page{width:11in;height:8.5in;background:var(--paper);padding:.55in .6in;
  display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:1px solid var(--hair);padding-bottom:.14in}
.top .tag{font:600 7pt/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;
  color:var(--soft)}
h1{font:600 17pt/1.2 var(--serif);margin-top:.2in}
.sub{font-size:9.5pt;color:var(--soft);margin-top:3pt}
.flow{display:flex;gap:.18in;margin-top:.3in;align-items:stretch}
.stage{flex:1;border:1px solid var(--card-line);background:var(--card);
  border-radius:8px;padding:.16in .17in;display:flex;flex-direction:column}
.stage .role{font:600 6.6pt/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;
  color:var(--accent);margin-bottom:5pt}
.stage .what{font:600 10.5pt/1.25 var(--serif);margin-bottom:5pt}
.stage p{font-size:8.2pt;line-height:1.45}
.stage .act{margin-top:auto;padding-top:7pt;font-size:8.2pt;line-height:1.4}
.stage .act b{font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;
  color:var(--soft);display:block;margin-bottom:2pt}
.arrow{align-self:center;color:var(--soft);font-size:12pt}
.bottom{display:flex;gap:.5in;margin-top:.32in;border-top:1px solid var(--hair);
  padding-top:.2in}
.script{flex:1.4;font-family:var(--serif);font-size:10pt;line-height:1.6;
  padding-left:.18in;border-left:2px solid var(--accent)}
.script small{display:block;font:600 6.6pt/1 var(--sans);letter-spacing:.16em;
  text-transform:uppercase;color:var(--soft);margin-bottom:5pt;font-family:var(--sans)}
.notes{flex:1;font-size:8.4pt;line-height:1.6;color:var(--ink)}
.notes b{display:block;font:600 6.6pt/1 var(--sans);letter-spacing:.16em;
  text-transform:uppercase;color:var(--soft);margin-bottom:5pt}
"""

STAGES = [
    ("Carrier", "Plain folder",
     "9 &times; 12 two-pocket folder, unprinted. The letterhead inside does the "
     "branding. Cards sit in the slits.",
     "Holds everything. No design, no cost surprise."),
    ("Seen first", "Cover letter &middot; 1",
     "Addressed by name, signed by hand. Says why I came and what the folder "
     "is for.",
     "A one-minute read."),
    ("Kept on file", "One-pager &middot; 1",
     "The practice on one sheet, front and back. Credentials and the "
     "organization note on the back.",
     "Judge fit. Keep for reference."),
    ("Handed out", "Brochures &middot; 6",
     "The patient-facing piece. What the practice is, the price, and how to "
     "book.",
     "Hand to anyone who may benefit. Refills on request."),
    ("Passed along", "Cards &middot; 4",
     "Name, contact, and the booking QR. The price on the back.",
     "Give away."),
]

stages_html = "<div class='arrow'>&#8594;</div>".join(
    f"""<div class="stage"><div class="role">{role}</div>
    <div class="what">{what}</div><p>{desc}</p>
    <div class="act"><b>What it asks</b>{act}</div></div>"""
    for role, what, desc, act in STAGES)

PAGE = f"""
<div class="page">
  <div class="top">
    <div class="wordmark">DuBose, M.D.<small>Direct primary care</small></div>
    <div class="tag">Internal &middot; packet plan &middot; not for distribution</div>
  </div>
  <h1>The standard outreach packet</h1>
  <div class="sub">One packet for every audience. Every piece points to the same
  two places: the website and the free conversation.</div>
  <div class="flow">{stages_html}</div>
  <div class="bottom">
    <div class="script"><small>The handoff, in person</small>
    &ldquo;I run a local primary care practice. I thought some of the people you
    work with may find it useful. Everything is explained here, and I would be
    happy to talk if you have questions.&rdquo;</div>
    <div class="notes"><b>Working notes</b>
    Respect rule: a physician&rsquo;s office may receive this packet, so no piece
    compares the practice to anyone&rsquo;s care.<br>
    Cost per packet: about $3 to $4 (estimate; production.md &sect;3).<br>
    Nothing is printed until the publishing gates clear ([City], licensure,
    counsel pass).</div>
  </div>
</div>"""

PROOF = doc(PAGE, CSS + "@page{size:11in 8.5in;margin:0}body{background:#fff}")

JOBS = [
    dict(out=OUT / "packet-map.png", kind="png", w=1056, h=816, html=doc(PAGE, CSS)),
    dict(out=OUT / "packet-map.pdf", kind="pdf", html=PROOF),
]

if __name__ == "__main__":
    render(JOBS)

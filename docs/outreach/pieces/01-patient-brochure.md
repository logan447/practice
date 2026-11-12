# Patient Brochure — Draft Copy

*Piece 1 of the outreach packet (architecture §3.3). Status: **draft for
review.** Rewritten 2026-11-12 for D-039 (Direct Lifestyle Medicine,
$99/month). Patient-voiced, first person, per the website register.
Copy here condenses approved website copy — where a sentence exists on the
site, the brochure reuses it verbatim or trims it, never rewrites it
(duplication rule §6). All standing rules bind: no emojis, copy filter,
credential accuracy, one CTA, canonical phrases verbatim, R-13. Print
only after the TMB advertising/counsel pass (`NEEDS-COUNSEL`) and the
publishing gates.*

**Job:** the only packet piece designed to leave the building. It is
handed to a person at the moment someone says "you should talk to this
doctor." Within one unhurried read: what this is, whether it might be
for them, what it costs, that it works with their insurance, and the
safe next step. It routes to the site and the free conversation; it
answers nothing in depth.

## Format and fold

Letter sheet, tri-fold (roll fold), six panels. Reading order below is
the designed sequence: cover → first-open panel → three-panel inside
spread, left to right → back cover.

| Position | Panel |
|---|---|
| Front cover | 1 — The promise and the price |
| First seen on opening | 2 — Recognition |
| Inside spread, left | 3 — Three parts of one practice |
| Inside spread, middle | 4 — How care happens |
| Inside spread, right | 5 — The price, plainly |
| Back cover | 6 — Start with a conversation |

---

## Panel 1 · Front cover

> **Direct Lifestyle Medicine**
> Logan DuBose, M.D.
>
> # Prevention first, with medical care when you need it.
>
> Adults · **$99 a month** · Cancel anytime
> Reduced and free memberships available.

*Type-led cover; at most one warm candid photo of Dr. DuBose (listening,
seated — never white-coat-with-crossed-arms), or no photo. The price is
on the cover for the same reason it is in the homepage hero: hiding the
number is a dark pattern.*

## Panel 2 · Recognition

> ## Where most people start
>
> Maybe it's several things at once. Blood pressure creeping up. Sleep
> that never feels like rest. Weight that will not move. Results you'd
> like to understand better. Medicines you have questions about.
>
> Or maybe nothing is wrong yet. You just want to keep it that way, and
> you want a doctor who knows you.
>
> Either way, we start the same. A full look at your health and the way
> you live, then a plan you can actually follow.
>
> **That is what this practice is for.**

## Panel 3 · Inside left

> ## Three parts of one practice
>
> **Prevention and lifestyle medicine.** The foundation, for every
> member. Food, activity, sleep, stress, alcohol and tobacco, and the
> people around you. Screenings on time. A written plan with goals we
> check against.
>
> **Medical care and treatment.** I examine, diagnose, order labs and
> imaging, prescribe, and follow up on results. Starting with lifestyle
> is not a rule against using medicine.
>
> **Care coordination.** I work with your other doctors, make
> referrals, and track what comes back. If I am your only doctor, I
> help you set up whatever else you need.
>
> **You do not need another doctor to join.** If you have one, I work
> alongside them. You are never asked to choose.

## Panel 4 · Inside middle

> ## How care happens
>
> Most care happens by video and secure messaging. When an exam needs
> it, I come to you at home. When clinic space is better, I use space I
> keep for exactly that. There is no required visit schedule. Care
> follows what your health needs.
>
> **Included, with no per-visit charges:** a full first assessment,
> a written plan, visits as your care needs them, direct messaging,
> every result explained, medicines managed within my scope, referrals
> and coordination, and forms and paperwork.
>
> Between visits, message me. I answer within 1 to 2 business days,
> usually faster. I keep business hours, and I take real time away each
> year, always with a clear plan for how your care works while I'm
> gone. Away means slower, never unaware.

## Panel 5 · Inside right

> ## The price, plainly
>
> **$99 a month, per adult.** Flat and published. No enrollment fee,
> no contract. Cancel anytime.
>
> **If $99 is a barrier,** say so when we talk. I offer a reduced
> monthly fee based on your finances, and a small number of free
> memberships. The medical care is the same at every level. There is no
> application, just a conversation.
>
> **What it doesn't cover:** labs, imaging, medicines, specialists,
> urgent care, ER, and hospital care. Your insurance keeps paying for
> those as it does today. On Medicare or Medicaid? Ask me. How a
> membership works with those programs is still being settled.
>
> **What's the catch?** I keep business hours and am not an emergency
> service. I treat within my scope and refer when something is outside
> it. And when my panel is full, it is full. That is the whole catch.

## Panel 6 · Back cover

> ## Start with a conversation. That's all.
>
> Thirty minutes, by video, free. Tell me what's going on. I'll tell
> you honestly whether I can help, and if I'm not the right fit, I'll
> say so and point you toward someone good.
>
> `[QR]` **Book a free conversation** — [site]/book
> `[QR]` Everything else, answered — [site]
>
> **Direct Lifestyle Medicine** · Logan DuBose, M.D.
> [City], Texas · [phone] · [email]
> I care for adults only.
>
> If this is an emergency, call 911 or go to the nearest ER.

*Small print, bottom edge:*

> This practice is a direct medical service agreement under Texas law;
> it is not health insurance.

---

## Preview build

`print/brochure/build.py` renders this copy at true scale (pipeline
steps 2–3): flat outside/inside faces with fold guides, the closed
cover, the first-open view, and `brochure-proof.pdf` (two exact
11 × 8.5 in pages for the print-at-home proof). Outputs land in
`print/brochure/out/` (gitignored; regenerate with
`python3 print/brochure/build.py`). Type and color reuse the website's
tokens (Source Serif 4 / Source Sans 3, ivory/ink/juniper).

## Production notes

- Uncoated stock matching the letterhead/folder system; brochure is
  part of the stationery register, not a glossy piece.
- Panel 5 is deliberately the densest (the money panel earns it);
  the designer may tighten leading there, never cut the catch.
- QR codes: exactly two, back cover only, human-readable URLs beside
  them (packet-wide rule, architecture §5).
- Photo: one candid maximum, or type-only. No stock imagery ever.
- Placeholders until runway: [City], [site], [phone], [email].
- No market figures anywhere in this piece — by design, nothing here is
  `REFRESH-AT-RUNWAY`; the brochure only ages if the model changes.
- Icons, if the designer wants them on panels 3–4: drawn line-icons or
  plain typographic marks only.

## Copy provenance (duplication audit)

| Panel | Source |
|---|---|
| 1 | Homepage hero, condensed; price-in-hero decision carried over |
| 2 | Homepage §2 "Where most people start", trimmed; last line new (print needs a landing) |
| 3 | Homepage §3 three-service cards + `/help` section heads, condensed |
| 4 | How-it-works "Where we meet" and availability + pricing card included-list; canonical "Away means slower, never unaware" |
| 5 | Pricing §2 card, the three memberships, §3 not-covered rows, §4 Medicare line and §5 the catch, radically condensed; canonical "when my panel is full, it is full" · "that is the whole catch" |
| 6 | Homepage §9 + global footer; canonical fit-phrase + emergency short form + not-insurance line |

Nothing in this brochure exists only here: every claim has a deeper
home on the site, which is where both QR codes lead.

## Decisions of record

Price on the cover, not inside · recognition before explanation
(homepage order preserved) · the catch lives on the money panel ·
adults-only stated twice (panel 5 "per adult," back cover plainly) ·
one CTA, appearing twice (cover implies it, back cover makes it).

**Added 2026-11-12 (D-039):** the three services are panel 3, because
they are the practice's shape and a reader who sees only the inside
spread must get them · "You do not need another doctor to join" is
bolded on panel 3, since it is the single largest message change and
the brochure travels inside clinician packets · the sliding-scale and
pro bono offer is promoted to the cover, because accessibility is now
part of the model rather than a quiet exception · the Medicare and
Medicaid answer shrinks to one honest sentence that routes to a
conversation, because the arrangements are unsettled and print is the
worst place to be provisional at length (`NEEDS-COUNSEL`).

## Open items for review

1. Cover photo: candid, or type-only? (One-pager will carry the
   portrait either way.)
2. Panel 2's added closing line ("That is what this practice is for.")
   — new copy, needs approval since it may migrate back to the site.

3. ~~**House Style review (added 2026-08-21, after this draft)**~~
   **Closed 2026-11-12 by the D-039 rewrite.** The three debts this
   item queued are all paid: em dashes are gone from every panel; the
   register is plain short sentences at the 5th-grade target; and the
   §5 physician-respect problem is resolved at the root rather than
   softened. Panel 2's "results nobody fully explained," "no one is
   looking at the whole of it, with you," and "nobody has time to think
   it through with you" were banned patterns in a piece that travels
   inside clinician packets. They are deleted, not reworded. The panel
   now describes what this practice does and never what anyone else
   fails to do.

4. **New:** the brochure cannot say what Medicare and Medicaid patients
   should do, because that is unsettled. Panel 5 asks them to raise it
   in the conversation. If counsel settles the question before the
   first print run, panel 5 gains a sentence and this item closes.
   Until then, do not print a number of copies you would regret.

*(Checked, not open: "1–2 business days, usually faster" matches all
three site surfaces that state it — pricing, how-it-works, emergency
strip. D-017's "~24–72h" is the internal charter envelope, not patient
copy.)*

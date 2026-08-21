# Website — Information Architecture & Patient Journey

> **Status (2026-08-21): superseded as a build spec.** The live site
> (`site/`, baseline locked per D-035) and the two house-style
> documents (`design-house-style.md`, `writing-house-style.md`) are
> the current source of truth. This file remains the record of the
> original IA and journey design.

*Designed 2026-08-17 from the current model (D-029/D-030/D-033, D-014,
D-016, D-017, D-022, the Patient Agreement v2). Phase deliverable: a
**prototype for visualization and Track F validation** — publishing waits
on name, entity, licensure posture, and a TMB-advertising/counsel pass
(R-13). Identity decided (D-034): **DuBose, M.D.** — header lockup
"DuBose, M.D. · direct primary care"; physician: Logan DuBose, M.D.*

## 1. What the website is for

One job, stated as the visitor's thought on leaving:

> *"This makes sense. This is affordable. I understand what this doctor
> does, and I think having someone like this in my corner could genuinely
> help me. I want to talk to him."*

**Who it speaks to** (from D-014 and the intensity mix): the primary
reader is the person who is scared, frustrated, or overwhelmed by their
health — multiple concerns, conflicting advice, abnormal results,
medications, stress — and can't tell what actually matters. The secondary
readers are the stable-chronic and prevention-minded adults who want a
physician with time before something goes wrong. All Texas adults; the
site never needs to say "archetype" — it speaks to situations, not
categories.

**What problem it solves for them:** not "access to healthcare" (they
have that, in fragments) but *sense-making and a physician who has time*
— someone to hold the whole picture, prioritize, and work through it.

**Register:** credible, thoughtful medicine with more time and attention.
Warm and plain. Explicitly NOT: concierge-luxury signaling, longevity
optimization aesthetics, "wellness" language, supplement-adjacent vibes,
grandiosity, or urgency tactics. The honesty *is* the brand — including
being honest about what the practice doesn't do.

## 2. The prospective-patient journey

```
DISCOVER            LEARN                 MEET                DECIDE            BEGIN
word of mouth   →   website:         →    free intro      →   (optional     →   enroll: sign
referral,           what, for whom,       conversation        2nd convo,        agreement +
community,          how, $100/mo,         (30 min, video,     think it          card on file
content             boundaries, who       no pressure)        over — always     → onboarding
                    he is                                     offered)          visit scheduled
```

- **Discover → Learn:** grassroots (D-022). The site's job on arrival:
  answer "what is this / is it for me / what does it cost" inside two
  minutes without scrolling archaeology. **Price appears on the
  homepage** — transparency early, never behind a funnel.
- **Learn → Meet:** exactly one primary call to action, everywhere:
  **"Book a free introductory conversation."** Sub-text does the
  de-risking: *free, ~30 minutes, by video, no commitment — and if I'm
  not the right fit, I'll tell you and point you somewhere good.* (This
  is D-016's capacity/fit gate wearing its public face.)
- **Meet → Decide:** the conversation itself (already designed, Track B);
  the site supports it with a "what happens next" page the physician can
  send afterward. No automated "nurture sequence" at MVP — the follow-up
  is a personal email from the physician, which at this scale *is* the
  differentiator. One passive path for not-ready visitors: an optional
  email signup ("an occasional letter about the practice") — collected,
  not campaigned, until there's a reason.
- **Decide → Begin:** enrollment = sign the agreement + payment method +
  (where applicable) the one program-specific form (D-033) + first-visit
  scheduling. MVP: handled person-to-person after the conversation;
  self-serve enrollment comes with the billing-platform selection (X-03).
- **Measurement (Q-? lightweight):** where each consult came from (asked,
  not tracked), visits→bookings, bookings→enrollments. Privacy-light
  analytics only; no ad pixels.

## 3. Site map — MVP is six pages

| Page | Job | Notes |
|---|---|---|
| **Home** | The whole story in miniature; route to depth | structure in §4 |
| **How it works** | The mechanics: what's included, care settings (video/home/clinic), availability and boundaries, what happens in your first months | honest §4/§7-agreement content, patient-voiced |
| **Pricing** | $100/month, what it covers, what it doesn't, cancel anytime, insurance/Medicare/Medicaid interaction in plain words | short; exists so search and skeptics land somewhere direct |
| **About** | Who the physician is, why he practices this way, credentials, the philosophy in first person | trust page; photo, real biography, no stock imagery |
| **Questions** (FAQ) | The honest objections, answered | architecture in §6 |
| **Book a conversation** | Scheduling embed + what-to-expect | the only conversion surface |

Deliberately absent from MVP: blog/education library (later, real
content only), employer page (near-term addition once the employer lane
activates), Spanish version (flagged for consideration — Texas;
translation is a real project, do it well or not yet), patient portal
links (post-EHR), legal pages beyond a simple privacy notice.

## 4. Homepage structure

1. **Hero.** A plain human statement, not a slogan. Direction:
   *"A doctor with time to actually figure it out with you."* Subline:
   *"Unhurried primary care by a physician who knows you — $100 a month,
   cancel anytime."* CTA button + quiet secondary link ("How it works").
   Price in the hero: yes — it is the model's boldest trust move.
2. **The recognition section.** The overwhelmed reader sees themselves,
   written with respect: multiple concerns, conflicting advice, results
   nobody explained, five specialists and no one holding the whole
   picture, or simply a body that's changed and no time with any doctor
   to talk about it honestly.
3. **What I do about it.** The core experience in one paragraph: listen
   carefully → make sense of the whole situation → separate what's
   urgent from what matters → one realistic plan → work through it
   together over time. Framed as ordinary good medicine given room.
4. **How it works, in four steps.** Free conversation → join at $100/mo
   → care that fits (video-first, home when needed, clinic
   occasionally) → your progress, visible.
5. **The price, plainly.** $100/month. What it includes (time, visits
   without per-visit charges, messaging, results explained,
   coordination). What it doesn't (labs, meds, specialists — your
   insurance keeps covering those; works alongside Medicare and
   Medicaid). Cancel anytime.
6. **Who this is for — and who it isn't.** The honesty section: not an
   emergency service; not 24/7; not a hospital practice; adults only;
   works best for people who want a thinking partner in their health.
   This section converts *trust*, not volume.
7. **The doctor.** Photo, three sentences, link to About.
8. **Common questions.** 4–5 FAQ items inline, link to the rest.
9. **Closing CTA.** The conversation invitation with its de-risking
   sub-text.

## 5. Core messaging (the pillars every page draws from)

1. **Time is the treatment.** Everything else follows from a physician
   who is not overbooked.
2. **Sense-making.** "I help people who can't tell what actually
   matters in their health figure that out — then we work the plan."
3. **One honest price.** $100/month, said early, everywhere, unhedged.
4. **Works alongside your insurance, never instead of it.** Including
   Medicare and Medicaid (D-033's plain-language versions).
5. **Boundaries as credibility.** Business hours, real time away,
   emergencies to the ER — stated proudly, because sustainability is
   what makes the attention real.
6. **Evidence-based, unexotic.** No protocols named after the doctor,
   no supplements, no biohacking. Medicine, with time.

**Claims discipline (R-13):** no outcome claims, no testimonials at MVP
(none exist; patient testimonials also carry TMB/consent constraints —
counsel later), no "results" language. The provable claims — time,
price, structure, philosophy — are the only claims.

## 6. FAQ architecture (grouped; each answer ≤150 words, honest)

- **The model:** Why $100/month? Is this insurance? What if I already
  have a doctor? Is this "concierge medicine"? What's the catch?
- **Money & coverage:** What does the fee not cover? How do labs and
  medications get paid? I have Medicare — can I join? Medicaid? Can I
  use my HSA? What if I can't afford $100?
- **Access & availability:** How fast do you respond? What about
  nights/weekends/emergencies? What happens when you're away? Do you do
  home visits?
- **The medicine:** What conditions do you treat? What do you *not*
  treat? Do you prescribe controlled medications? What if I need a
  specialist or hospital?
- **Starting & stopping:** What's the free conversation like? How do I
  join? Is there a commitment? How do I cancel? What happens to my
  records?

Several answers are the agreement's sections in conversational voice —
one source of truth, two registers.

## 7. Trust & credibility elements

Real credentials and licensure, stated simply · a genuine first-person
About page · **the published agreement itself** (radical transparency:
"read the entire agreement before you ever talk to me" — our five calm
pages are a competitive weapon) · the who-it-isn't-for section · the
price everywhere · no dark patterns: no countdown timers, no "only 3
spots left," no exit popups · professional but human design (real
photography, no stethoscope stock art) · later, once real: years in
practice, panel-is-open/closed status, and eventually outcome
transparency (D-023's practice-level story, only when true).

## 8. Scheduling and future EHR connection

- **MVP:** an embedded scheduler (Cal.com or equivalent) for the free
  conversation only. **Architectural rule: the marketing site never
  touches health information.** Booking collects name, email, phone,
  and nothing clinical — keeps the site outside HIPAA scope and the
  vendor list short (R-12). Anything clinical waits for the EHR intake.
  (Scheduler BAA question if any health data ever creeps in — the
  design answer is: it doesn't. `COUNSEL` sanity check at runway.)
- **At launch:** enrollment flow hands off to the billing platform
  (card-on-file) and EHR portal (X-03 selection); the site links out,
  never stores.
- **Requirement fed back to X-03:** clean patient-facing scheduling and
  a portal the site can link to without embarrassment.

## 9. Technology stack recommendation

**Static site: Astro + Tailwind, deployed on Cloudflare Pages (free
tier), content as Markdown in this repo.** Why: $0 hosting against the
D-020 ceiling; no CMS, no database, no maintenance surface, nothing to
patch (D-007's spirit); version-controlled copy (the repo stays the
project's memory, D-010); fast and accessible by default; trivially
handed to any future designer/developer. Scheduler embedded
(Cal.com free tier or ~$15/mo). Privacy-light analytics (Plausible,
~$9/mo, or none at MVP). Domain purchased once the name exists (Q-22).
Email: the physician's existing professional address; no marketing
platform until there's a reason. **Total MVP run-rate: ~$0–25/month.**

Rejected: WordPress (maintenance + attack surface), Squarespace/Wix
(fine, but less controllable and copy leaves the repo), Next.js/React
app (this is a brochure with one embed — no app framework needed),
website builders bundled with EHRs (couples the most durable asset to
the least decided vendor).

## 10. MVP vs. later

**MVP (this phase):** the six pages, full copy, real design, scheduler
embed stubbed, the decided name (DuBose, M.D. — D-034), draft-marked footer —
reviewable in a browser and usable in validation conversations.
**Pre-launch (runway):** name/domain/identity finalized (Q-22), counsel
+ TMB-advertising pass, licensure/location facts inserted, scheduler
live, privacy notice.
**Post-launch:** education content (the evidence-explainer tradition,
written as real essays), employer page, panel-status indicator, Spanish
version decision, enrollment self-serve, portal integration, outcome
transparency when earned.

## 11. What building this will force us to answer (the point)

The practice name question (now unavoidable — Q-22) · the hero sentence
(the entire positioning in ~12 words) · the who-it-isn't-for list in
public language · the plain-words version of every boundary · what the
free conversation promises · what the physician is willing to say about
himself. Each of these is a working-model test disguised as copywriting
— exactly the gap-exposure this phase is for.

## Standing design rules (added 2026-08-17, user-directed)

1. **No emojis, ever, anywhere on the site.** Icons are drawn line-icons
   or plain typographic marks — never emoji characters. (Applies
   retroactively: the approved Page 3 sketch's emoji icon placeholders
   become drawn icons at build time.)
2. **Every piece of site copy passes this filter before it ships:**
   *write with clarity, thoughtfulness, directness, conciseness,
   maturity, and professionalism while maintaining simplicity.*
3. **Credential accuracy guardrails (2026-08-17, from CV review):** the
   physician completed an internal medicine INTERNSHIP at George
   Washington University — never state or imply completed residency or
   board certification in internal/family medicine. Lifestyle medicine
   certification (IBLM) is IN PROGRESS — always "pursuing," never
   "board-certified," until earned. Preferred self-description:
   "physician" / "primary care physician," not "internist." Homepage
   Section 7 blurb corrected accordingly (was "board-certified" — now
   removed). All credential language gets a TMB-advertising counsel pass
   before publishing.

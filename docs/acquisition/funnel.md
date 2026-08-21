# Funnel Design — Stage by Stage

*2026-08-21. The working design for each funnel stage, plus the two
engines the linear funnel doesn't describe: the referral-source engine
(§5) and the employer lane (§6). Channel-level detail lives in
`channels.md`; numbers and instrumentation in `measurement.md`.*

---

## 1. Top of funnel — Discovery

The question: *how does someone who might benefit discover the practice
exists?* Two families of channels, deliberately different in character:

- **Digital discovery** — compounding, mostly passive once built, slow
  to mature (6–18 months for organic search), captures people at the
  moment they are actively looking.
- **Direct/physical outreach** — immediate, relationship-based, scales
  with physician hours, produces the highest-trust prospects, and is
  the realistic source of most of the first 25 patients.

### 1.1 Search-intent capture — what is actually winnable

Search-intent prospects (someone typing "house call doctor Austin") are
worth far more than interrupted audiences: they have a felt need, now.
But intent capture only works where ranking is *earnable*. Honest
tiering for an Austin-lean market (assessment 2026-08-21, unverified
until keyword research is run at runway — `REFRESH-AT-RUNWAY`):

| Tier | Queries | Competition | Verdict |
|---|---|---|---|
| **1 — Don't budget on it** | "primary care doctor near me", "primary care doctor Austin" | Hospital systems, large groups, and aggregators (Zocdoc, Healthgrades) own organic page one | Winnable only in the **map pack** via Google Business Profile + reviews + proximity — that's the play, not blue-link ranking |
| **2 — Winnable, 6–12 mo** | "direct primary care Austin", "DPC Austin/near me", "membership doctor Austin", "cash pay / no insurance doctor Austin", "concierge medicine cost Austin" (comparison intent) | A handful of local DPC practices, mostly thin sites | Core SEO targets; a substantive site + pricing transparency + directory citations can compete |
| **3 — Most winnable, highest differentiation** | "house call doctor Austin", "home visit doctor Austin", "doctor who makes house calls", "mobile doctor Austin" | Very few credible local competitors | The home-visit capability (D-014) is a genuine ranking wedge; dedicated page + GBP service attributes. *Message with care: home visits are clinically indicated, not on-demand (Q-16) — the page must say so or it manufactures mismatched leads* |
| **4 — Long-tail content** | "does direct primary care work with Medicare", "what does DPC cost", "primary care doctor accepting new patients Austin", condition/problem queries ("why won't my doctor spend time with me", specific chronic-condition questions) | Varies; mostly national informational content | The education library (§1.2). Converts at low rates but compounds, earns authority for Tier 2/3, and feeds the newsletter |

**What earning these rankings requires** (standard local-SEO mechanics,
unverified specifics — refresh with keyword tooling at runway): a real
Google Business Profile with reviews accumulating steadily (the map-pack
currency); exact-topic pages for Tier 2/3 queries (the six-page MVP site
covers "direct primary care" and pricing; a **home-visits page** and an
**accepting-new-patients/panel-status page** are additions this
workstream feeds back to the website track); consistent
name-address-phone citations across directories (`channels.md` §D);
and time — local organic results move on a quarters-not-weeks clock.

**Constraint from the roadmap:** GBP requires an operating practice at a
real location and mostly can't be built in Era 1. What *can* start now:
the content library, the domain (buy at decision, age helps), and the
site's query-matched pages. This asymmetry drives the phased plan.

### 1.2 Content as a compounding asset (not a blog nobody reads)

Why medical blogs die: they publish generic advice ("5 tips for heart
health") that answers no specific query, targets no one, links to
nothing, and stops after eight posts. The design that compounds instead:

1. **Write to real queries and real objections.** Two content types
   only: **decision content** (the FAQ architecture's questions, in
   essay depth: how DPC works with Medicare in Texas; what $100/month
   does and doesn't cover; DPC vs. concierge vs. insurance-based care;
   what a home visit is actually for) and **sense-making content** (the
   clinical voice of the practice: how to think about a borderline lab
   result; what "normal" bloodwork doesn't rule out; how five
   specialists end up with no one holding the picture). Decision
   content converts; sense-making content differentiates and earns
   trust. Both are searched for.
2. **One canonical essay per topic, maintained, not a stream.** ~12
   cornerstone pieces (list in `channels.md` §A3) beat 50 disposable
   posts. Each is reviewed annually, internally linked to the relevant
   service page, and carries the one CTA.
3. **Every piece is distribution-ready:** it goes to the newsletter, is
   shareable as an answer when a real person asks the question in a
   community context, and can be re-voiced as a short video later.
   Nothing is published *for the archive*.
4. **Measure by qualified traffic, not traffic:** organic visits that
   reach the book page (`measurement.md` §3), not pageviews.
5. **Claims discipline applies fully (R-13):** educational content is
   general education with a "talk to your physician" posture — it is
   also *advertising* in TMB terms once it promotes the practice, so it
   stays inside the credential guardrails (website design, standing
   rule 3) and gets the same counsel pass before publishing.

This is the single best Era-1 asset: it is buildable now, it travels to
Texas, and it appreciates.

### 1.3 Direct and physical outreach

The old-fashioned channel family, and the one that will produce most of
the first patients. Design principles:

- **Outreach sells the conversation, not the membership.** The ask at
  every touch is small: "if you meet someone this would help, here's
  what I do; they can book a free conversation and I'll be honest about
  fit — and refer them onward if I'm not it."
- **The referral packet is the leave-behind** (spec in `channels.md`
  §B1 — the physical outreach packet already in design belongs to this
  workstream). One page for the professional, one for the person they
  hand it to.
- **Never remunerated in any direction** — Texas's all-payer
  anti-kickback statute reaches every referral arrangement
  (`compliance.md` §3). Relationships run on reciprocity of *service*:
  fast honest triage, good notes back (with patient authorization),
  and referring well in the other direction.
- **Physician time is the spend.** Outreach hours are logged like cash
  (`measurement.md` §4). Early inefficiency is accepted (learning +
  relationship capital), but it is *measured* inefficiency.

Priority referral-source categories (profiles in `channels.md` §B):
specialists frustrated by unmanaged patients (cardiology, endo, GI,
rheum — the "who is quarterbacking this person?" problem) · therapists
and counselors (their clients are often the D-014 signature patient —
also the strongest heavy-mix pull; see README §4) · pharmacists
(independent > chain; they meet medication confusion daily) · physical
therapists, chiropractors, dietitians · urgent-care and ER physicians
(the "you need a real primary doctor" discharge line) · clergy and
congregational/parish nurses · senior-serving organizations (D-033
makes Medicare-age members servable — a differentiator most DPCs
underuse) · employers and benefits brokers (Engine C, §6) · gyms,
wellness studios, community centers · librarians and community-education
programs (venues for talks, §1.4).

### 1.4 Discovery channels commonly overlooked (candidates worth testing)

- **Community talks and teaching** — library health-literacy series,
  church health ministries, senior-center sessions, employer
  lunch-and-learns. One prepared talk ("How to get more out of your
  doctor visits" / "Making sense of your lab results") reused
  everywhere. High trust, near-zero cash, directly seeds the newsletter.
- **DPC-specific directories** — the DPC Frontier mapper lists 1,300+
  practices and is where DPC-aware searchers look (researched
  2026-08-21: mapper.dpcfrontier.com; free listing); DPC Alliance
  member directory. Tiny audiences, perfect intent, ~zero cost.
- **Neighborhood platforms** — Nextdoor and local Facebook groups are
  where "can anyone recommend a doctor who…" questions are actually
  asked in 2026. Posture: be the genuinely helpful answer (and let
  patients answer), never self-promotional carpet-posting.
- **Local press and podcasts** — "the doctor who still makes house
  calls" and "$100/month, no insurance needed, works alongside
  Medicare" are legitimate local-interest stories. One good story
  outperforms months of ads; pitch at launch, not before (R-13 pass
  first).
- **The physician's existing professional network** — colleagues from
  training and moonlighting, and professional communities in senior
  care and health tech, are launch-announcement audiences with real
  trust. The announcement (personal note, not blast) is a designed
  artifact in the phased plan.
- **Google Ads, small and surgical** — the honest exception to
  organic-first (§7 of the request): exact-match ads on Tier 2/3
  queries fill the 6–12-month organic gap at launch for a bounded
  budget, with health-category personalization restrictions respected
  (`compliance.md` §6). Treated as a test, killed or kept on ledger
  evidence.

## 2. Middle of funnel — Trust, at the prospect's pace

Reality: most discoverers are not ready. They just met the concept, or
the price needs household discussion, or nothing hurts *today*. The
middle funnel exists so that "not now" doesn't mean "lost" — without
pressure mechanics.

**Primary mechanism — the letter (newsletter).** Formalizing the
design doc's "occasional letter about the practice":

- **Cadence:** monthly-ish; skipping a month is fine, twice a week is a
  breach of register. Consistency over frequency.
- **Content:** one useful thing per issue — a cornerstone essay, a
  plainly explained common question, a preventive-care reminder framed
  as education, a lifestyle-medicine topic — plus, occasionally, practice
  news (launch progress, panel status). Education:promotion ratio ≈ 5:1.
- **Voice:** the physician writing to people on a first-name basis. No
  templates that look like a hospital system's newsletter.
- **The quiet CTA:** footer, every issue — panel status + "book a free
  conversation" + "forward this to someone who needs it."
- **Explicitly rejected:** lead magnets, multi-step welcome sequences,
  segmentation, urgency sends, open-rate-optimized subject lines.
  Subscribe/unsubscribe mechanics per CAN-SPAM (`compliance.md` §5).
- **Pre-launch mode — the founding interest list:** before the practice
  can enroll anyone, the letter *is* the practice's public existence:
  "I'm building this; here's what I'm learning; be first to know when
  doors open." A pre-launch interest list is the highest-leverage
  marketing asset Era 1 can build, and it converts launch from a cold
  start into an announcement to a warm list.

**Supporting middle-funnel mechanisms:**

- **The transparency assets** — published agreement, published price,
  the who-it-isn't-for section (website design §7). These do silent
  trust-building for every returning visitor; they are middle-funnel
  infrastructure, already built.
- **The personal follow-up** — after a consultation that ends "not
  yet," a short personal email, permission to check in once in ~3
  months, calendarized in the ledger. At this scale the physician's
  personal note *is* the nurture sequence (design doc §2).
- **A shareable explainer** — one page (print and web) written to be
  *handed to* someone: "what this practice is, in two minutes."
  Referral sources, patients, and newsletter readers all need something
  forwardable that isn't "the whole website."
- **Talks** (§1.4) double as middle-funnel: attendees who aren't ready
  join the letter list.
- **YouTube/short-form** — optional, later, only if the physician
  enjoys it (sustainability rule); each video is a voiced cornerstone
  essay, doing TOF (search) and MOF (trust: prospective patients can
  *meet* the physician's manner before booking) simultaneously.

**Middle-funnel metric:** list growth, and letter-attributed
consultations ("I'd been reading your emails for months") — expected to
be slow and then suddenly material; tracked in the ledger.

## 3. Bottom of funnel — Consultation to enrollment

At booking, the question changes from *awareness* to *mutual fit*
(D-016). The consultation is already designed (Track B): what they're
struggling with · what they want to accomplish · can I reasonably help ·
does the model fit · do they understand $100/month and the terms · do
they want to establish care. This section designs the *path around* the
conversation and hunts friction.

### 3.1 The conversion path and its friction map

```
book → (gap) → consultation → decision → agreement → payment → enrolled → first visit
```

| Step | Drop-out risk | Design answer |
|---|---|---|
| **Booking** | Scheduler asks too much, or slots are 3 weeks out. Momentum decays fast — a booking made in a moment of resolve loses value every day it waits *(illustrative prior; measure the booking→consult lag from ledger day one)* | Name/email/phone only (no-PHI rule, design §8) + "how did you find me?" as the one extra field. Hold slots so a consult is always available within ~2–5 business days, including one early-evening block |
| **Book → consult gap** | No-shows | Scheduler's automated confirmation + day-before reminder (email; SMS only with consent — `compliance.md` §5). A one-line "what to expect + what to have handy" note. No-show gets one graceful personal rebook offer, then rests |
| **The consultation** | Feels like a sales call → distrust; or ends warmly but *vaguely* | Already designed (D-016). One addition from funnel logic: **every consult ends with an explicit next step**, one of: (a) enroll now, (b) scheduled second conversation, (c) "I'll email you X by Y", (d) honest "not a fit" + a real onward referral, (e) "not yet" + letter-list offer. Vague endings are where funnels silently die |
| **Decision** | "Let me think about it" → silence. The natural deliberators (D-016 offers a second conversation) get lost not from doubt but from life | Follow-up email within 24h: recap of what we discussed, the honest recommendation, the agreement to read, one link to enroll or book conversation #2. Then *one* check-in at ~1 week. Then the 3-month "not yet" rhythm (§2). Never more |
| **Agreement** | A PDF that needs print-sign-scan kills same-day momentum; five calm pages help, but only if reading them is easy | The agreement is already published on the site (read *before* the consult — unusual, disarming, and a real filter). Execution must be e-sign, same sitting, phone-friendly. Tool choice rides on X-03/billing selection; interim: any simple e-sign flow |
| **Payment** | A separate "we'll send you an invoice" step, or card entry that lives apart from signing | **Sign + card-on-file + first-visit booking in one sitting** — the D-016 "enroll in minutes" exit criterion, operationalized. This is a hard requirement fed to the X-03 billing-platform selection; enrollment friction is a platform-selection criterion, not an afterthought |
| **Enrolled → first visit** | Weeks of dead air after paying; buyer's-remorse window with nothing happening | First visit scheduled *at enrollment*, ideally within 7–10 days; records request + intake started immediately so something visibly happens on day one. The onboarding visit design (Track B) takes it from there |
| **The whole path** | Any step that requires the physician to remember to do something manually | Each step has a ledger column; the weekly funnel review (`measurement.md` §6) sweeps for stalled prospects |

**Program-specific step (D-033):** Medicare-age enrollees need the
private contract signed *before* care; Medicaid enrollees the
private-pay acknowledgment. These add one document, not one meeting —
build them into the same e-sign packet (forms per Q-21's counsel list).

**Anti-friction ≠ pressure.** Removing friction means a *willing* person
never stalls on logistics. It never means shrinking deliberation:
the second conversation and read-the-agreement-first postures stand.

### 3.2 Bottom-funnel metrics

Booking rate from site visits · booking→consult completion (no-show
rate) · consult→enrollment rate *split by fit verdict* (the honest
number is enrollment rate among mutual-fit consults; overall conversion
is diagnostic of upstream targeting, not of the consultation) ·
time-to-decision · where in the path stalls happen. Definitions in
`measurement.md` §3.

## 4. Patient — Retention, engagement, referral

Enrollment flips the relationship from marketing to medicine. Nothing
here is "selling"; retention is a *product* outcome that the funnel
measures but care produces.

**Retention = the value dashboard promise kept (D-023).** The
mechanisms are already designed and clinical: good care, visible
progress (portal trends), clear follow-up, responsiveness within D-017
bounds, preventive-care reminders, the living care plan. This
workstream adds only instrumentation: churn (and stated reasons —
always ask, in a leaving-is-easy tone per D-027) and tenure by channel,
because acquisition sources differ in retention (researched: employer
members churn least, price-sensitive individuals most — R-03) and CAC
math is wrong without it.

**Moments that do double duty (care first, acquisition as a side
effect):** the day-30 check-in (D-027's possible first-month courtesy)
· the first solved problem (the moment word of mouth is born) · the
annual review, where progress is explicitly shown (D-023's story, told
to the one audience allowed to hear outcomes: the patient it belongs
to).

**Referral design — easy without being a scheme:**

- **Posture, stated once and repeated rarely:** "This practice grows by
  referral. If someone you care about needs a doctor with time, I'd be
  honored to talk with them — and I'll be honest if I'm not the right
  fit." In the letter footer; verbally only when a patient volunteers
  praise.
- **Tooling = the shareable explainer** (§2) and a few physical cards a
  patient can hand over. Nothing to sign up for, no portal "referral
  program" module.
- **No rewards, no discounts, no gifts for referrals — designed out on
  purpose.** Texas Occ. Code ch. 102 reaches remuneration for
  soliciting patients in every payer context, and Medicaid/Medicare
  members add federal inducement rules; even where a nominal thank-you
  might be defensible, a practice whose brand is "no games" shouldn't
  spend counsel hours to find the line (`compliance.md` §3, Q-23).
  The thank-you is a handwritten note and excellent care of the person
  they sent. *(Value judgment, not just compliance: paying for referrals
  converts advocates into affiliates and reads instantly as such.)*
- **Close the loop, PHI-safely:** thank the referrer without disclosing
  whether their friend booked, enrolled, or anything else ("thank you
  for thinking of the practice" — full stop) unless the new patient has
  explicitly authorized more.
- **Metric:** referral rate (%, patients who have referred ≥1 person),
  referred-patient share of enrollments, and referred-patient retention
  (prior: highest of any channel; verify from ledger).

## 5. Engine B — The referral-source engine (design)

Professional/community sources are a funnel of their own:

```
IDENTIFY → FIRST CONTACT → EQUIP → FIRST REFERRAL → REPORT BACK → HABIT
```

- **Identify:** a living source list (a tab in the ledger), built from
  §1.3's categories, prioritized by (a) how often they meet the
  frustrated, (b) trust with their people, (c) reachability. Target:
  every source has a name, not an org.
- **First contact:** in person where possible; the ask is 15 minutes
  and the packet. Specialists: the pitch is *"I do the primary-care
  work nobody is doing for your patients — workups before referral,
  follow-through after, and I'll actually read your notes."*
  Therapists: *"medical partner who takes the whole-person history
  seriously"* (with eyes open re: mix, README §4). Pharmacists/PTs:
  *"send me the person whose medication list or recovery nobody is
  coordinating."*
- **Equip:** the packet + the explainer page + the promise: any person
  they send gets a fast, kind, honest answer — including "they need
  something I'm not."
- **Report back:** the engine's flywheel and the most-skipped step.
  With the patient's signed authorization, the referring professional
  gets a real note. Without it, at minimum a thank-you (§4's PHI rule).
  Sources refer twice because the first one was handled visibly well.
- **Habit:** quarterly light-touch (a letter issue for professionals,
  or a personal note with something useful), plus reverse referrals —
  the practice sends people *to* its sources, which is both good
  medicine and the only currency this engine is allowed to trade in.
- **Metric:** active sources (≥1 referral in trailing 12 mo), referrals
  and enrollments per source, physician-hours per source. Prior to
  verify: a mature engine of ~10–15 active sources sending ~1–3 good
  referrals/year each covers most of steady-state replacement demand
  (~28/yr, R-03). *(Illustrative arithmetic, not a researched claim.)*

## 6. Engine C — The employer lane (design sketch)

Researched context (D-022): employer-sponsored memberships are ~58% of
the national DPC market and its lowest-churn, lighter-utilization
segment — the panel's natural ballast (R-26 mitigation). Two 30-member
employers ≈ 40% of the target panel. This lane gets a full design of
its own when Track F's employer exploration returns; funnel skeleton:

```
target list (10–100-employee Austin firms, owner-reachable, benefits-poor)
  → warm path in (owner network, chambers, benefits BROKERS as multipliers)
  → the economics conversation (one pager: what $100/employee/mo buys vs. what it offsets)
  → pilot (a handful of members) → full group → renewals
```

Notes now: brokers are a *source* in Engine B terms and the fastest
multiplier — but broker compensation expectations collide with the
no-remuneration rule and need counsel before any arrangement (Q-23,
`compliance.md` §3). Employer members still pass the D-016 onboarding
gate individually; the group contract covers payment, not fit. Timing:
first employer conversations belong in the 25→50 phase
(`phased-plan.md`) — after individual-patient proof exists to point at,
except where Track F validation surfaces an eager early adopter.

## 7. Organic-first, paid-later — the examined version

The instinct is right as a *center of gravity* (trust-based practice,
$20k ceiling, 140-patient goal), but three paid exceptions are worth
planned tests rather than reflexive deferral:

1. **Google Search ads on Tier 2/3 exact-match queries at launch** —
   bounded (~$300–500/mo for a defined 3-month test — *planning number,
   not a quote*), because organic needs 6–12 months the launch ramp
   doesn't have, and these searchers are the highest-intent strangers
   that exist. Kill/keep on cost-per-consultation from the ledger.
2. **Targeted local print/direct-mail around the home-visit story** —
   only if the ledger later shows home-visit-indicated patients (often
   older, less Google-centric) under-represented vs. intent; EDDM-style
   zip targeting is cheap to test once. Not a launch item.
3. **Sponsorships-as-relationship** (a community event, a church health
   fair table): trivially cheap, bought for the conversations not the
   logo placement; belongs to Engine B budget-wise.

Everything else paid (social ads, Yelp ads, Zocdoc's booking
marketplace, SEO retainers, lead-gen services) is deferred until the
ledger shows a gap organic can't close — with Zocdoc specifically noted
as an insurance-era marketplace whose per-booking economics and
audience fit the model poorly (`channels.md` §D).

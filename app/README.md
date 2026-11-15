# Direct Lifestyle Medicine — EMR prototype

Interactive prototype of the physician workspace. Fictional patients
only; no PHI, no backend, no network calls.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

## Why it is shaped this way

The structure follows `docs/systems/emr-build-assessment.md`: own the
application layer, standardize the data layer, buy the regulated edges.

- **`src/domain/types.ts`** — the clinical model. Each type names the
  FHIR R4 resource it maps to, so the storage layer can be swapped for
  a real FHIR backend without the screens changing.
- **`src/lib/store.tsx`** — the entire data layer sits behind one hook.
  Screens never import fixtures directly. Replacing `src/data/` with a
  FHIR client is a change to this file and nowhere else.
- **`src/lib/nav.tsx`** — navigation as state, not a router, because
  path and hash routing are unreliable where this prototype runs.
  Swapping in react-router is a change to this file alone.
- **`src/components/AiPanel.tsx`** — the AI surface, which enforces the
  three rules below rather than leaving them to discipline.

## Design decisions worth knowing

**Visual.** Shares the practice's typographic DNA (Source Serif 4
headings, Source Sans 3, juniper accent) but not the website's warm
ivory ground: at clinical density warm paper muddies, and lab values
need a clean low-chroma surface. Clinical semantics (normal / low /
high / critical) are a separate palette from the brand accent on
purpose — an abnormal value must never be the same colour as a button.

**Provenance is visible everywhere.** Every clinical record carries an
author, and the four classes from `docs/systems/ai-layer-and-hda.md`
are enforced at the type level: source, physician-authored,
patient-reported, AI-derived.

**The AI never writes to the record.** It drafts, the draft is visibly
marked, and a physician action turns it into a record. This is also
what keeps the design inside the FDA non-device CDS carve-out: the
clinician can always see the basis.

**Results cannot be silently cleared.** An inbound report is
acknowledged by an explicit act, recorded with a name and a date. A
result that arrives and is never seen is the failure mode that matters
most in a record system.

**Stopped medicines keep the reason they were stopped.** That sentence
is usually the most useful thing on the screen and almost every EMR
throws it away.

## Starting from nothing

The record opens empty, because that is where a practice starts and it
stays that way for a while. The first screen offers two paths: add a
real patient, or load three fictional examples to look around with.
`Clear all data` in the rail returns to empty.

State persists in `localStorage` per browser, wrapped so a private
window or blocked storage degrades to "nothing saved" rather than a
white screen. Nothing clinical should ever live there; it is so that a
prototype you are evaluating survives a reload.

## Navigation

No rail and no Today page. A solo practice has one list and the charts
hanging off it, so a navigation rail with two items in it is furniture.
The patient list is home, sorted so whoever needs something is at the
top, and it carries the open-item signal the inbox used to.

Chart tabs follow how the work actually goes: **Care plan, Medicines,
Prevention, Results, Notes, Specialists.** Care plan is the landing
tab, because it is what the practice is for. There is no Summary tab;
it duplicated the others.

## The patient header

Name, demographics, contact, then the generated clinical one-liner and
the active problem list. The reminder is a note icon under the avatar
that lights up only when there is one: a banner across the top of every
chart stops being read by the second week.

Portraits are deliberately **illustrations, not photographs**
(`src/components/Portrait.tsx`). A photograph of a real-looking person
in a medical record is either a real person who did not consent to
appearing in one, or a synthetic face indistinguishable from one. They
are deterministic per patient and grey with age.

## The visit

Note on the left, workspace on the right, no page changes mid-visit.

The note is **structured, not four text boxes** (`VisitNote` in
`domain/types.ts`), because the sections have different sources. On
open, the chart is assembled into it: the one-liner, the patient's own
reason for coming, a selective chart review, recent results and recent
specialist care. The plan is **problem-oriented** — assessment,
treatment, orders and follow-up per problem.

Provenance is visible per section. Pulled text is marked **From
chart**, ambient text **From the room**, and anything typed is unmarked
and therefore the physician's own. **A mark clears the moment you edit
that section**, because once you have rewritten it, it is yours.

**Start listening** simulates ambient capture: sections arrive in the
order a consultation produces them, history then findings then
reasoning. The interface is real; the capture is not.

The right panel is Today's priorities (from the patient, with the full
narrative one click away), Medicines, Measures, and Orders. Orders can
be tied to a problem in the care plan.

Exam templates for in-person and telehealth are in `lib/clinical.ts`.
The telehealth one ends with its own limitations, which is the part
that matters medicolegally.

## The patient portal

Same record, different reader, reached from any chart as **See their
view** — which is a real thing a physician needs, not a demo toggle.

The portal reads through `src/lib/portalScope.ts` and nothing else.
That file is deliberately small and self-contained, because it decides
whether a person meets an unreleased result or a half-written
assessment about themselves. The rule in one sentence: the patient sees
what the physician has finished, plus everything they contributed.

So a **draft care plan is invisible** until it is signed, and an
**unacknowledged result is invisible** until it is reviewed. The
end-to-end test asserts both.

## Time moves

The clinic date is state, not a constant (`src/lib/clock.ts`), and the
bar advances it by a day, a week or a month. A prototype frozen at one
instant cannot test longitudinal care: a goal never ages, a follow-up
never falls due, a result never lands overnight.

Advancing is not relabelling. `src/lib/tick.ts` runs the interval:

- **Ordered labs come back** four days later, as an unreviewed report
  with a task. Values drift toward the target where a care-plan goal
  covering that measure is on track, and away from it where nothing is
  being done. That is a simulation, not a claim about medicine; it
  exists so the chart answers back when the plan changes.
- **Prevention goes overdue** when its due date passes.
- **Patients who track at home keep tracking** while you are away.

What changed is reported in the bar rather than left to be discovered.
Silent state changes are how people stop trusting a system.

The loop worth walking: place a lab order in a visit, sign it, press
**+1w**, and find the result sitting unreviewed in the chart.

## Keyboard

`⌘K` opens the command palette: every patient, every chart tab and
every action, filtered together, because mid-clinic you do not want to
decide first what kind of thing you are looking for. Subsequence
matching, so `mrey` finds Marcus Reyes.

`/` searches the list, `j`/`k` move, `↵` opens. In a visit, `⌘↵` signs,
`⌘S` saves, `⌘⇧L` starts and stops listening. `.` advances a day.
`?` shows the lot.

## Measuring the thing being decided

`src/lib/metrics.ts` times the prototype against itself, because the
question behind the build is whether a self-made record beats a bought
one, and that is settled in minutes per patient rather than in
features.

Per visit: minutes from opening to signature, clicks, keystrokes,
seconds of chart review immediately beforehand, and how many
AI-drafted sections survived to signature unedited. Under **Usage**.

The AI-kept figure needs watching in both directions. Very low means
the drafting is not earning its place; very high may mean it is good,
or may mean the review has gone thin, and those two look identical
from here.

## Patients writing into their own record

Under **Track** in the portal, two acts kept deliberately apart:

**Log a measurement** picks from a catalogue (`src/domain/measures.ts`)
rather than a free-text box, so a home blood pressure becomes a number
on a trend instead of a sentence nobody can plot. Each measure carries
its own units, input bounds and LOINC code.

**Write something** is prose, in their words, with a checkbox asking
for it to be looked at.

Two rules decide what reaches the physician's inbox:

- A measurement does **not** create a task. A blood pressure reading is
  data, not a summons. The exception is a reading far outside the
  ordinary, which raises an urgent task and tells the patient to make
  contact, routing to the usual urgent and emergency pathways. Those
  thresholds are deliberately wide: a prototype that cries wolf teaches
  people to ignore it.
- A journal entry reaches the inbox only if the patient ticks the box.
  Everything they write is in the chart regardless; not everything is a
  summons. That keeps agency with them and the inbox usable.

**Patient-measured values never merge into clinical series.** They get
their own series, drawn dashed and in a different colour, shown in
their own section on the chart and in Results. Two reasons: provenance,
and the fact that a reading taken on a kitchen table and one taken in
clinic are not the same measurement and are judged against different
targets. Averaging them would be wrong.

## Tests

```
npm run build
cd dist && python3 -m http.server 4600
EMR_URL=http://localhost:4600/ node test/new-patient.e2e.cjs
EMR_URL=http://localhost:4600/ node test/patient-logging.e2e.cjs
```

`test/new-patient.e2e.cjs` walks the whole path: empty start, intake,
free-text medicine parsing, adding a problem and a medicine, writing
and signing a care plan, documenting and signing a visit, and the
portal before and after signing. 24 assertions.

`test/clock-keyboard-metrics.e2e.cjs` walks the clock, the palette and
the timing: place a lab, sign with `⌘↵`, advance a week, find the
result unreviewed, and check the visit was timed. 13 assertions.

`test/patient-logging.e2e.cjs` walks the other loop: the patient logging
readings and a journal entry, the out-of-range warning, and all of it
arriving on the physician's chart, results and inbox. 15 assertions.

## Not built yet

Patient portal, scheduling, orders, messaging, prescribing (bought, not
built), search across the chart, and any form of persistence — state
resets on reload.

## Real volume, and an AI that is wrong

Two additions that change what the prototype can tell you.

### A generated panel, then deliberately dirtied

`src/data/generate.ts` builds about 120 adults with clustered
conditions, medication regimens that follow from them, lab series with
history, years of signed notes and care plans. It is seeded, so the
same panel comes back every time.

Then `dirty()` damages it on purpose, because no chart you inherit is
clean and a design that only works on tidy data does not work:

- the same medicine listed twice, from two sources, spelled differently
- an allergy recorded twice with two severities that disagree
- a medicine with no dose, because the sending system had none
- outside results with no reference range, so nothing flags
- a medicine started before the problem it treats was recorded
- two charts that may be the same person

`src/lib/dataQuality.ts` finds all six and says what to do about each.
The result shows on the patient list as a column, as a filter, and on
the chart as a strip that is silent when there is nothing to say.
About 40% of the generated panel carries at least one issue.

Allergies and outside records live on a Records tab. Documents arrive
in three states of repair: read, images only, and would not parse. The
last two say plainly that nothing in them reaches search, the chart
review or the assistant.

The whole panel is roughly 740 KB in `localStorage`. `save()` now
reports failure and the header says "Not saved" when a write is
refused, because silently losing a write is the wrong failure.

### Capture that makes mistakes

`src/lib/ambient.ts` holds two versions of the same consultation. The
fallible one introduces seven errors of the kinds ambient scribes
actually produce:

| Kind | In the draft | Should read |
|---|---|---|
| Left and right swapped | Left knee aches | Right knee aches |
| A negative nobody took | Denies chest pain, shortness of breath and palpitations | Never discussed |
| Digits transposed | Weight 189 lb | Weight 198 lb |
| The wrong drug | a supervised losartan taper | a supervised lisinopril taper |
| Attributed to the wrong person | Patient feels the knee is nothing to worry about | The physician judged it mechanical |
| The wrong dose | Halve lisinopril to 2.5 mg | Halve lisinopril to 5 mg |
| A plan item nobody said | Refer to orthopaedics for the left knee | No referral was discussed |

"Check the draft" compares the note as it stands against the truth and
says which errors are still in it. At signature it does the same and
records the score, which the Usage screen carries across visits.

This comparison is only possible because the prototype wrote the
errors and kept the answer key. Real capture has no answer key, and
nothing downstream of a signed note can tell a mistranscribed dose
from a real one. That is the argument the screen exists to make: the
reading before signature carries the whole safety burden, and the
measured catch rate is the only evidence about whether it is carrying
it.

## Real codes, and a real check

### Where the terminology comes from

`scripts/build-terminology.mjs` fetches a subset from US National
Library of Medicine services and writes
`src/domain/terminology.generated.ts`, which is committed:

| System | Count | Source |
|---|---|---|
| ICD-10-CM | 560 of ~74,000 | Clinical Table Search Service |
| RxNorm | 160 ingredient concepts, with brand names and ATC classes | RxNav + RxClass |
| LOINC | 115 of ~100,000 | Clinical Table Search Service |

Nothing in that file was typed from memory. If a code is in it, an NLM
service returned it for a query in the script. Re-run the script to
refresh it.

It is bundled rather than looked up live for a reason that is itself a
design point: a search box in a clinical record is clinical. What you
are typing is a question about the patient in front of you, and
sending every keystroke to a third party is a disclosure decision
nobody made. A real deployment runs a terminology server inside its own
boundary; the bundled subset is the prototype's version of that.

The picker searches generic names, brand names and the code together,
so "Lipitor" finds atorvastatin and "Motrin" finds ibuprofen. Free
text is always still allowed, and what it produces is marked uncoded
rather than quietly coded to the nearest thing. An uncoded problem now
shows up in the data-quality strip, because it reads fine and matches
nothing.

### The check

`src/lib/interactions.ts` runs four checks against 43 hand-written
rules: drug-drug (23 pairs), drug-allergy (5), drug-condition (7) and
duplicate therapy (8 classes). Classes come from ATC via RxClass, so a
rule written for "ACE inhibitor" matches every ACE inhibitor rather
than a list of names.

Three things it does on purpose:

- **Every alert carries its basis.** FDA's non-device clinical decision
  support carve-out turns partly on whether the clinician can
  independently review the reasoning. An alert that says "severe" and
  nothing else fails that test, and also the practical one: an alert
  you cannot evaluate is an alert you learn to dismiss.
- **It checks before saving, not after.** Checking a prescription once
  it is in the chart is checking after the decision.
- **It collapses repeats.** Three NSAIDs against one ACE inhibitor is
  one clinical fact, not three.

The sulfa rule deliberately does *not* fire on furosemide,
hydrochlorothiazide or celecoxib, which are non-antibiotic
sulfonamides and do not cross-react. A checker that flagged those
would be training you to ignore it.

This is a demonstration set, stated as such on screen, not a drug
knowledge base. Production records license one (First Databank,
Medi-Span, Lexicomp) and that is a real line item. `NEEDS-COUNSEL` on
redistribution terms before any licensed content is bundled.

The generated panel was also widened, because a panel that produces no
interactions is a tidy one rather than a realistic one: it now carries
over-the-counter painkillers, supplements, brand names from outside
pharmacies and courses nobody stopped. 61 of 122 charts have at least
one alert on them.

## Three identities, and a log

### Signing in as somebody

"Their view" was a fiction: it showed the patient's screen while still
being the physician, which hides every question worth asking. There
are now three real identities, switched from the bar:

- **Physician** — the panel is theirs, so everything is open.
- **Covering clinician** — bounded by a date. Can read, write and sign
  a note, prescribe, and acknowledge results. Cannot sign a care plan,
  change membership or move the clock. Every chart they open is logged.
- **Patient** — the portal, and nothing else. No route to the chart,
  no practice-wide log, and no way back except signing in as someone
  else.

`src/lib/permissions.ts` is one file on purpose, for the same reason
`portalScope.ts` is: a rule about who may see what has to be readable
in full, and rules scattered across twenty components are readable by
nobody. Three of its answers are genuinely arguable and are marked as
such in the code. The most interesting:

- **Signing the care plan stays with the patient's own physician.** The
  plan is an agreement built over years. A clinician covering for a
  week can change it and write what they think; signing it is not
  theirs.
- **Journal entries the patient did not flag are not part of cover.**
  What someone writes to their own physician is not automatically
  what a covering clinician needs. The screen says how many were
  withheld and why.

`NEEDS-COUNSEL` before any of this governs a real record: whether a
covering arrangement is a business associate or a workforce member
under HIPAA determines the paperwork, not this file.

### Who did what

`src/lib/audit.ts` derives the log by comparing the record with the
record as it was, rather than by calling a logger at each action. A
log that depends on every author remembering to write to it has holes,
and the holes are always in the code someone added in a hurry. This
way an action nobody instrumented is in the log, correctly, the first
time it runs. Clinically meaningful transitions get named sentences
("Signed the care plan, which released it to the patient"); everything
else is recorded as the change it is, with the field-level diff behind
a toggle.

Reads are logged only for people who are not the responsible
physician. Logging every chart the owner opens buries the one entry
that matters.

Per-patient history is a chart tab; the practice-wide view is under
**Log**, with a per-person summary and a filter for everyone who is
not the physician.

The log lives in the same browser storage as everything else, which
the screen says out loud. A real record keeps it server-side and
append-only, where the person being audited cannot reach it.

## Documents that leave the building

A chart that cannot produce a document is a notebook. `src/lib/documents.ts`
generates five from the record, so none of them can disagree with it.

| Document | For | What shapes it |
|---|---|---|
| Visit summary | The patient | House Style: ~5th grade, short sentences, no em dashes, no marketing |
| Referral letter | Another clinician | Problem list, medication with RxNorm identifiers, allergies, recent results |
| Work or school note | An employer | The least that does the job |
| Prior authorization | A health plan | The clinical case, and nothing about coverage |
| Whole record | The patient, or another system | FHIR R4 Bundle, plus a readable copy |

Three choices worth stating:

**The work note withholds by default.** An employer needs to know the
person was seen and what they can do. They do not need the diagnosis.
Including it is a checkbox that is off, with a warning chip when it is
on, because that disclosure is the patient's decision and not a
template's.

**The prior authorization says nothing about the membership.** How
this practice's membership interacts with any coverage is unsettled
(D-039 guardrail 4b), so the letter argues the clinical case only. A
template that asserted a payer position would put the practice's name
to a claim nobody has checked. `NEEDS-COUNSEL`.

**The export is FHIR R4, not C-CDA.** The original idea said CCD.
Producing real C-CDA takes a toolkit and a validator, and a
hand-rolled approximation would be worse than useless: it would look
exportable and fail at the receiving end. The domain model has been
shaped for FHIR R4 from the first commit, so that is the export this
can stand behind. Resources carry real ICD-10-CM, RxNorm and LOINC
codings from the terminology work. C-CDA stays on the list as real
work, not as a checkbox.

### Information blocking

This is where the rule stops being theoretical. Stated on screen, with
what is checkable separated from what is not:

- Information blocking is **45 CFR Part 171**. It prohibits practices
  likely to interfere with the access, exchange or use of electronic
  health information, with named exceptions.
- Provider disincentives were established by a final rule published
  **1 July 2024 (89 FR 54718)** and run through Medicare programs.
- That last point is `NEEDS-COUNSEL` here: a direct-pay practice that
  is not Medicare-enrolled sits differently from the practices most
  guidance is written for, and *not being reachable by a disincentive
  is not the same as being outside the prohibition*. The two get
  conflated.
- Separately, the HIPAA right of access (**45 CFR 164.524**) gives a
  patient their record within an outer limit measured in days, with a
  limit on fees.

The design answer is to make the question not arise. The export is one
button in the chart and another in the patient's own portal. It is the
whole record rather than a summary chosen by us. No request, no delay,
no fee. A record built this way cannot block, because there is nothing
in the path to block with.

## A diary bound to the real working year

Visits used to appear from nowhere, which made every question about
capacity unaskable. `src/domain/schedule.ts` holds the working year,
with every input tagged:

| Input | Value | Where from |
|---|---|---|
| Hours a week | 30 | sourced, D-018 |
| Weeks worked | 39 | sourced, D-018 |
| Clinic days | Monday to Friday | sourced, D-017 |
| Away | up to ~3 months a year | sourced, D-017 |
| Panel target | ~140 at 5 to 6 hours each | sourced, D-018 |
| Break-even | 19 adults | sourced, working-model.md §3 |
| Home visit | 150 minutes with travel | sourced, working-model.md §4 |
| Day start, end, lunch | 9 to 5, 45 minutes | assumed |
| Admin per clinic day | 90 minutes | assumed |
| Messaging per week | 180 minutes | assumed, and load-bearing |

Booking now collides with that. A Saturday is refused with the reason.
An away block is refused with its dates. A day that cannot take a 150
minute home visit says what is already in it, by name and time, and
offers the next day that can. The home visit is the appointment that
teaches the lesson: two and a half hours out of about seven is a third
of the day for one patient.

### The arithmetic disagrees with the target, and the screen says so

1,170 hours a year, minus the messaging assumption, divided by the
sourced 5 to 6 hours per patient, gives a panel of **175 to 210**.
D-018 targets about **140**. That is a gap of roughly 213 hours a
year, about 5.5 hours a week.

One of three things is true: the messaging assumption is too small
(most likely), the sourced hours per patient already include work this
model double counts, or D-018 held back capacity on purpose and the
reason was never written down. The gap is shown rather than tuned
away, because closing it by adjusting an assumption until the two
agree would destroy the only evidence that something is missing.
`REFRESH-AT-RUNWAY`: three months of real messaging and admin time
settles it.

### A layout bug this surfaced

`.wrap` is the page container, carrying 26px of top and 72px of bottom
padding. Nine wrapping flex rows across the app were written as
`className="row wrap"` and had been silently 98px taller than the
markup suggested. Renamed to `.row.flow`.

Both are logged: **D-040** (the working year and the capacity gap) and
**D-041** (what the record produces and the information-blocking
posture) in `docs/charter/decision-log.md`.

## One workspace, not eight tabs

The chart was a header full of administration above eight tabs. Eight
tabs across the top meant the first thing the record said about a
patient was "here are eight places to look", which is a statement
about the software rather than about the person. This iteration is one
screen: who they are, the longitudinal plan, and what is coming.

### The header is generated, not typed

Two new structured fields carry it:

- `Condition.managed` — does this practice actively manage this
  problem, or is it history we carry?
- `Patient.services` — two independent switches, preventative and
  lifestyle medicine. Not a tier: a patient can have chronic disease
  management and lifestyle medicine without preventative services.

From those, `practiceSummary()` composes the line. Sharon White reads:

> **Sharon White**
> 60 F | PMH: `Essential hypertension` `Type 2 diabetes mellitus` `Mixed hyperlipidemia` `Hypothyroidism` `Osteoarthritis, both knees`
> Following with our office for management of `Essential hypertension` `Type 2 diabetes mellitus` `Mixed hyperlipidemia`, preventative services, and lifestyle medicine services.

Past medical history and what we are doing are different lists, and
most charts conflate them. Here the managed ones are tinted and the
rest are plain, and a patient with no preventative services simply
does not get that clause. Both switches and the per-problem ticks are
in the Details drawer, next to a line saying that nothing in the
header is typed.

Gone from the header: membership pill, sign-in-as-patient, the
reconciliation indicator, Start Visit, contact details, date of birth,
pronouns, and the avatar. The pinned clinical reminder stays, as a
line rather than an icon.

### The master care plan

`MasterPlan` is one living SOAP document per patient, not an encounter
note. Each section carries two kinds of content, distinguished by how
they look rather than by a label on every line:

- **Prose** is the physician's, typed in place and saved on blur.
- **Derived blocks** are composed from the structured record at read
  time: measurements with their latest value, recent reports, goal
  progress, outstanding prevention, the medicine list, co-management.
  Composing rather than copying is what stops a longitudinal document
  drifting out of date with the record it describes.

Signing a visit note carries its plan into the master plan as a dated
line per problem. The note itself is kept exactly as signed and lives
in the visits drawer, so the longitudinal document stays current
without anyone retyping it and without the visit being overwritten.

### The rail, and the drawers

The right column holds two things. The next visit, because that is the
frame every decision on the left is made against, and it is sticky so
it stays there while you read. And the pending orders, expandable to
send, close or cancel.

Starting a visit moved into the visits drawer behind **All**: read a
past note, start one that is booked, or book a new one. Booking is a
scheduling act and belongs next to the schedule rather than beside the
patient's name.

Everything that was a tab is still here, reached from the place in the
plan that refers to it ("All results" in Objective, "Manage" by the
medicine list) or from one quiet row at the foot of the rail. Drawers
own the Escape key: the global handler now skips when any
`role="dialog"` is open, which also stops the clock moving under one.

### Two bugs this surfaced

The old navigation rail was removed two iterations ago but its CSS
stayed behind, including `background: var(--rail)`. The moment a new
element used the class name it came back as a black column down the
side of the chart. Deleted rather than renamed around.

The global Escape handler called `nav.back()` from anywhere, so
closing a drawer also navigated out of the chart.

### Three gaps the redesign surfaced in older work

Rewriting the chart moved the test suites off their old selectors,
which is how these turned up.

**Duplicate therapy was only checked on the saved list.** Adding a
third NSAID to a list that already had two was silent, because the
duplicate-therapy pass ran only when no candidate drug was being
typed. It now runs in both directions, and the candidate version says
"already on naproxen, meloxicam", which is the single most useful
thing to know before prescribing and the one a checker that waits for
the row to be saved cannot tell you in time.

**Booking gave up on a non-clinic day.** The screen said "not a clinic
day" and stopped. The "next day it fits" offer existed only for a
clinic day that happened to be full, so a Saturday was a dead end. It
is now offered whenever the chosen day cannot take the visit, for any
reason.

**Allergies went back into the header.** They had been in the old
header as "No allergies recorded" on every chart. The minimal header
dropped them, which was wrong: allergies are read at every prescribing
decision. They are back as one quiet line, rendered only when there
are any, so most charts still say nothing.

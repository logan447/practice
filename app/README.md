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

## Physician time

How much time the panel can have, how it is spread, and how much each
person actually gets. It answers Q-20 (panel-mix instrumentation) and
the unit-economics rule that utilization is tracked from patient one.

**Internal only.** The portal never imports it and the end-to-end test
asserts the patient's view shows none of it. **The allocation is a
planning benchmark, never a limit on care**, and every surface that
shows it says so. A patient past their allocation is still seen on
clinical need; the dashboard lists them so heavy phases are planned
for, not rationed.

**The arithmetic** (`src/lib/time.ts`, pure functions, one source for
every number): hours a week × weeks a year × share for patient care and
chart work = care hours; ÷ active patients = minutes per patient a year.
Defaults are 30 h × 39 wk (the D-018 base case), 60% (the owner's
worked example: 700 h, 140 patients, 300 min each) and a 140 panel.
`ASSUMPTION`: the unit-economics weekly rhythm (about 20 of 30 hours on
visits, messages, results and per-patient admin) implies nearer 67%,
which gives 336 min. The settings sit on the dashboard so either can be
tried in a second. The year is the calendar year of the clinic date;
mid-year joiners are measured against the months they have been members.

**Two clocks, one running at a time.**

- *Visit time* starts when ambient listening starts (or by hand, for a
  call without it), keeps running after listening stops, and ends at
  signature or on Stop. After signing, the minutes can be adjusted in
  place.
- *Chart time* is a one-click Start on the chart, beside the time strip.
  Its activity (reviewing, documenting, results, coordinating, messages,
  other) is guessed from the tab you started on and can be changed.
- *No double counting, by construction.* Only one clock runs across the
  whole practice; starting one pauses the other and the paused one
  resumes when the new one stops. A visit starting takes over the same
  patient's chart clock (banking what it had), and chart time cannot be
  started while that patient's visit clock is running, because that time
  is already visit time.
- The running clock sits in the top bar so it can be paused or stopped
  from any screen. Clocks under five seconds are treated as stray clicks
  and not logged.

**Where it shows.** No new tab. The chart header carries one strip:
minutes used of the allocation, a two-segment bar (visit, chart) with a
tick where an even pace would be by today, and the chart clock.
*Details* opens the breakdown and the full history in place, where any
entry can be retimed, reclassified, removed, or added by hand. A
corrected entry keeps what the clock measured ("was 14"). The patient
list gets a slim bar per person.

**Panel time** (top bar, or `⌘K`) is the roll-up: care hours available,
allocated, used, remaining, average per patient, projected year, a
plain-language verdict on how many patients the hours cover at the
last twelve weeks' pace, hours by week against the planned week, where
the panel sits against allocation, and who is far above or below.
Pace uses the recent window because the panel grows; a one-off initial
visit is counted once rather than extrapolated; under two months of
membership is reported as too new to project.

**Load a full panel** on the first screen gives the three example
charts inside 140 fictional members with a year of time
(`src/data/panel.ts`, deterministic). Their intensity is drawn from the
archetype priors in unit-economics §3 (55% light ~3.5 h, 36% moderate
~6, 6% heavy ~14, 3% very heavy ~20), split about 55/45 visit and chart,
with 13 weeks away. Those priors are estimates, not observations; the
data exists to exercise the dashboard, not to forecast the practice.

Colours: visit and chart time have their own two tokens
(`--t-visit`, `--t-chart`), checked as a pair for colour-vision
separation in light and dark. The brand teal and the info blue were
too close to tell apart.

Not built yet: idle detection (a chart clock left running over lunch is
corrected by hand for now), and per-membership-year rather than
calendar-year views for renewal conversations.

## Tests

```
npm run build
cd dist && python3 -m http.server 4600
EMR_URL=http://localhost:4600/ node test/new-patient.e2e.cjs
EMR_URL=http://localhost:4600/ node test/patient-logging.e2e.cjs
EMR_URL=http://localhost:4600/ node test/time-tracking.e2e.cjs
```

`test/time-tracking.e2e.cjs` walks physician time: the chart clock,
correcting and adding entries, ambient listening starting the visit
clock and taking over the chart clock, signing stopping it, adjusting
it afterwards, the portal showing none of it, the dashboard and its
settings, reload, dark mode, and phone width. 29 assertions.

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

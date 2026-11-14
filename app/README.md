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

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
node test/new-patient.e2e.js    # needs playwright on NODE_PATH
```

`test/new-patient.e2e.js` walks the whole path: empty start, intake,
free-text medicine parsing, adding a problem and a medicine, writing
and signing a care plan, documenting and signing a visit, and the
portal before and after signing. 24 assertions.

`test/patient-logging.e2e.js` walks the other loop: the patient logging
readings and a journal entry, the out-of-range warning, and all of it
arriving on the physician's chart, results and inbox. 15 assertions.

## Not built yet

Patient portal, scheduling, orders, messaging, prescribing (bought, not
built), search across the chart, and any form of persistence — state
resets on reload.

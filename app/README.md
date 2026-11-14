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

## Not built yet

Patient portal, scheduling, orders, messaging, prescribing (bought, not
built), search across the chart, and any form of persistence — state
resets on reload.

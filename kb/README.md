# Knowledge Base (KB) — How This System Works

**Status: PROPOSED architecture, pending owner review.** On approval,
log as a decision in `docs/charter/decision-log.md` and delete this
line.

This is the living medical knowledge repository: a source-based system
for learning, board review, and clinical practice. It complements — it
does not replace — OpenEvidence, primary literature, and current
guidelines. **Nothing here is current merely because it was saved.**
Every clinically important statement traces to a source record with
dates and a verification status.

Internal working documents. House Style (`docs/style/`) does **not**
gate KB notes — write fast, use abbreviations, keep friction low.
House Style still governs anything patient-facing that gets *derived*
from KB content.

---

## 1. The design in one paragraph

One note lives in exactly **one file** — no duplicate notes across
folders. Folders answer *"what kind of note is this?"* (source record,
synthesis, board review), never *"what topic is it about?"* Topics,
conditions, specialties, clinical tasks, and organizations are
**faceted tags** in each note's front matter, so any note is
discoverable from every angle that matters, and cross-cutting queries
are a `grep` (or a question to Claude) rather than a filing decision.
Links point one way — synthesis cites sources by stable ID — and
backlinks are recovered by searching the ID, so there is no
bidirectional-link maintenance debt.

## 2. Layout

| Path | Note kind | What it holds |
| --- | --- | --- |
| `kb/sources/` | **Source records** | One file per source: what *that source* says, with full provenance. Guidelines, trials, textbook chapters, lectures, teacher pearls, own observations. Never silently "corrected." |
| `kb/topics/` | **Synthesis** | One page per topic (hypertension, physical activity, …): our current understanding across sources, every claim cited, disagreements explicit, personal notes labeled. |
| `kb/boards/lifestyle-medicine/` | **Board review** | The LM board material as a coherent body of exam-oriented knowledge, organized by pillar. Kept intact even where it lags current guidance (see §6). |
| `kb/templates/` | — | Copy-paste skeletons for source records and topic pages. |
| `kb/tags.md` | — | The tag vocabulary (extensible; add tags there when a new one is needed). |

Flat folders on purpose. `sources/` can hold hundreds of files;
`grep` doesn't care, and stable IDs (§3) keep names unambiguous. If a
folder ever becomes genuinely unwieldy, subfoldering by year or source
class is a cheap later change.

## 3. Source records and provenance

Every source gets a stable ID: `src-<org-or-author>-<year>-<slug>`,
which is also the filename (`kb/sources/acc-aha-2017-htn.md` holds
`src-acc-aha-2017-htn`). Front matter carries the provenance:

```yaml
---
id: src-uspstf-2021-htn-screening
kind: guideline        # guideline | trial | meta-analysis | review |
                       # textbook | lecture | teacher | observation |
                       # board-review
title: Screening for Hypertension in Adults (USPSTF Recommendation)
org: USPSTF
published: 2021-04
doi: 10.1001/jama.2021.4987
url: https://www.uspreventiveservicestaskforce.org/...
added: 2026-08-23
last-verified: UNSET   # date we last confirmed it is still current
review-by: UNSET       # when to recheck (guidelines get one)
status: unverified     # current | superseded | unverified
superseded-by: —       # src-id, when status: superseded
population: adults 18+
tags: [cond/hypertension, task/screening, org/uspstf, sys/cardiology]
---
```

The body records **what the source says** — key recommendations with
their stated strength/certainty (USPSTF grade, ACC/AHA class/LOE, GRADE),
population and scope, and caveats. A teacher's pearl or an own
observation gets the same treatment with `kind: teacher` or
`kind: observation` — attributed and dated, so its evidentiary weight
is visible without pretending it is a systematic review.

**Verification states** (the honesty mechanism):

- `unverified` — captured but not yet checked against the live source.
  Anything seeded from Claude's memory starts here.
- `current` — checked on `last-verified` date; recheck by `review-by`.
- `superseded` — kept for the record; `superseded-by` names the
  replacement. Superseded sources are **not deleted** (they explain
  where older teaching came from).

## 4. Topic pages (synthesis, kept separate from evidence)

One page per topic in `kb/topics/`, with fixed sections that enforce
the evidence/interpretation separation:

1. **Current practice snapshot** — synthesis across sources; every
   bullet ends with the source IDs it rests on.
2. **Where sources disagree** — explicit conflicts, stated as
   "A recommends X; B recommends Y; likely because…". Never resolved
   by silent deletion.
3. **Board-review angle** — links into `kb/boards/` where the exam
   framing differs from or extends practice.
4. **My notes & experience** — personal reasoning and observations,
   unmistakably labeled as such.
5. **Open questions** — what needs fresh research; feeds future
   research sessions.
6. **Sources cited** — the ID → file list for the page.

Topic pages are the retrieval hubs: "pull up everything on
hypertension" starts at `kb/topics/hypertension.md` and fans out to
sources via IDs and to neighbors via tags.

## 5. Tags and retrieval

Tags are faceted, `facet/value`, spelled out (no abbreviations —
predictable grep beats short). Facets: `cond/` condition · `sys/`
specialty or system · `task/` clinical task · `domain/` cross-cutting
domain · `org/` issuing body · `board/` board-review track. The
vocabulary lives in `kb/tags.md`; add new tags there first so spelling
stays canonical.

Typical retrievals (run directly, or ask Claude in a session):

```
# everything on hypertension, any note kind
grep -rl "cond/hypertension" kb/

# exercise × blood pressure
grep -rl "domain/physical-activity" kb/ | xargs grep -l "cond/hypertension"

# everything from USPSTF
grep -rl "org/uspstf" kb/sources/

# where is this source cited?  (backlinks = grep the ID)
grep -rn "src-sprint-2015" kb/ --include="*.md" -l

# what needs rechecking?
python3 tools/kb_audit.py
```

A multimorbidity question ("obesity + hypertension + poor sleep +
social isolation") is a tag-union query across `topics/` — the fixed
section structure means the snapshots and personal notes surface
together with their citations.

## 6. Board review vs. current practice

Board material is preserved **as the exam teaches it** — it is a
source in its own right (`kind: board-review`), because the exam is a
real audience with its own canon. Where the board answer and current
guidance diverge, the divergence is marked in place:

> **BOARDS-VS-PRACTICE:** the review course teaches X; current
> guideline (src-…) says Y. For the exam, answer X.

`grep -rn "BOARDS-VS-PRACTICE" kb/` lists every known divergence —
useful the week before the exam and the week after.

## 7. Keeping it honest over time (staleness audit)

`tools/kb_audit.py` reads the front matter of every source record and
reports: sources still `unverified`, sources past `review-by`,
superseded sources still cited by topic pages, and
guidelines/recommendations with no verification in over 12 months.
Run it periodically ("What in this repository needs to be
rechecked?") and after any news of a major guideline update. The
audit only works if the metadata exists — which is why clinically
important sources always get the full front matter block.

## 8. Effort calibration (avoiding document debt)

- **Full provenance block:** guidelines, trials, anything that could
  change what you do for a patient.
- **Lightweight notes:** quick study notes need only `id`, `kind`,
  `added`, and `tags`. Don't force `review-by` onto a mnemonic.
- **No duplicate prose.** If a fact is needed in two places, one place
  states it and the other cites the ID.
- **No speculative structure.** New folders, facets, or fields are
  added when the third real note needs them, not before.

## 9. Ingestion workflow (what happens when material arrives)

1. New material (chapter, paper, lecture, pearl) → create or update
   **one source record** capturing what it says, with provenance and
   tags. Seeded-from-memory content stays `unverified` until checked.
2. Wire it into the relevant **topic pages**: add or revise cited
   bullets; if it conflicts with existing sources, write the conflict
   into "Where sources disagree" — do not overwrite.
3. Board material additionally lands in its `kb/boards/` pillar file,
   with `BOARDS-VS-PRACTICE` markers where needed.
4. Research questions Claude answers from live literature follow the
   same path: findings become source records (with DOI/PMID/URL and
   access date), then synthesis.

Adding one paper should take minutes, not become a project.

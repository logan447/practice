# Lifestyle Medicine Board Review

The LM board material as a coherent, exam-oriented body of knowledge.
Files here are `kind: board-review` sources: they preserve **what the
review material teaches**, organized by section, even where current
guidance has moved on — divergences get an inline
`BOARDS-VS-PRACTICE:` marker citing the current source record
(see `kb/README.md` §6).

## Source and status

Everything here derives from the owner's LMBR manual
(`kb/sources/lmbr-manual.md` — edition/year still UNSET, owner to
confirm). The six pillar chapters were ingested 2026-11-21, each as a
notes file + a full reference list resolving `[LMBR ref N]` citations
to DOIs/URLs:

| Book section | Notes | References |
| --- | --- | --- |
| §5 Nutrition | `nutrition.md` | `nutrition-refs.md` (431) |
| §6 Physical Activity | `exercise.md` | `exercise-refs.md` (152) |
| §7 Emotional & Mental Health | `mental-health.md` | `mental-health-refs.md` (230) |
| §8 Sleep Health | `sleep.md` | `sleep-refs.md` (84) |
| §9 Substance Use | `substances.md` | `substances-refs.md` (93) |
| §10 Connectedness & Positive Psychology | `connection.md` | `connection-refs.md` (71) |

**Not yet provided:** the book's other sections (LM fundamentals,
behavior change/coaching, assessment tools, clinical applications —
§§1–4 and any later sections). Ingest the same way if the owner
uploads them: one notes file + one refs file per section.

Reference lists are OCR-extracted (tesseract, 300 dpi) and
sequence-validated; character-level errors are possible — verify a
DOI resolves before citing it externally.

`grep -rn "BOARDS-VS-PRACTICE" kb/` lists every noted divergence
between the book and current guidance. Board notes are capped at
`assistant: clinician` (kb/README §10): the book is copyrighted study
material, and any patient-facing or product reuse is an open counsel
question (Q-24; `docs/systems/lm-assistant.md` §6).

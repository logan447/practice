# Lifestyle Medicine Board Review

The LM board material as a coherent, exam-oriented body of knowledge.
Files here are `kind: board-review` sources: they preserve **what the
review material teaches**, organized by pillar, even where current
guidance has moved on — divergences get an inline
`BOARDS-VS-PRACTICE:` marker citing the current source record
(see `kb/README.md` §6).

Planned pillar files, created as studying reaches them (one file per
pillar; split only if a file gets unwieldy):

- `fundamentals.md` — LM definitions, evidence base, scope
- `nutrition.md`
- `physical-activity.md`
- `sleep.md`
- `stress-management.md`
- `social-connection.md`
- `substance-use.md`
- `behavior-change.md` — coaching, motivational interviewing, models
- `clinical-applications.md` — LM in T2DM, CVD, obesity, cancer
  prevention, mental health, healthy aging

## Ingesting the board-review book

When the owner's LM board study guide arrives: the **book itself gets
one book-level source record** in `kb/sources/` (title, edition, year,
publisher — the provenance anchor), and each pillar file here cites it
(`source: src-<book-id>, ch. N`) so every board note traces back to
the book without repeating the metadata. Material is added pillar by
pillar as studying reaches it. Board notes default to
`assistant: clinician` at most (kb/README §10) — the book is
copyrighted study material; its use in any patient-facing product is
an open counsel question (lm-assistant.md §6).

Each file's front matter names the source material it came from
(course, syllabus, lecture, chapter) with dates — board notes get
provenance too. Concepts worth cross-topic discovery are tagged
(`board/lifestyle-medicine` plus condition/domain tags) and cited from
the relevant `kb/topics/` pages, so board knowledge and clinical
knowledge stay linked without being blended.

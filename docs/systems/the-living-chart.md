# The living chart

What the main chart view is, where each thing on it comes from, and
which questions are still open. Written while the architecture is
still being decided, so the open questions at the end are the point of
the document as much as the settled parts.

Status: design in progress. Nothing here is a commitment, and nothing
here has been reviewed by counsel.

## The claim

A patient's chart should be one document that says where everything
stands today, continuously maintained, rather than a pile of visit
notes with a summary nobody updated. The visits are still kept exactly
as they were signed; they are the record of what happened on a date
and they are never rewritten. The living document sits above them and
answers a different question: given everything on file, where are we
now.

## Three sources, never merged

Every problem on the chart is described from three places, and the
screen keeps them apart on purpose.

**The chart review** is a clinician's reading of the notes across
time. It is prose, physician-authored, editable in place. It is the
only one of the three that a person writes.

**The composed measures** are built from the structured record at read
time: the labs, the vitals, the dates. They are never typed, so they
cannot go stale, and each carries the previous value beside it because
a number without its predecessor is not yet information. A problem
with no measure of its own says so. Silence is reported as silence,
never rendered as normal.

**The patient's own words** come from a check-in sent before each
visit, one question per problem: how is this going, and are you doing
the plan as we wrote it. Kept verbatim, attributed, dated, never
merged into the paragraph above them.

The reason for keeping the third apart from the first is the whole
argument for having it. A longitudinal subjective written only from
visit notes is a clinician's account of a patient's account, filtered
twice, and updated only on the days we happened to see them. When the
gauge says improving and the patient says worse, the disagreement is
the most useful thing on the screen, and merging the two sources into
one paragraph is exactly how it disappears. The synthesis step calls
these clashes out by name rather than leaving them to be noticed.

## What is on the page, in order

1. Name, then the power statement: age and sex, past medical history,
   what the practice is following for management, and the service tags
   (preventative, lifestyle). Nothing else. No reminders, no counts,
   no actions.
2. **Subjective.** One opening statement, unlabelled, saying where the
   work stands across everything. Then one block per managed problem,
   per outstanding preventative service, and per lifestyle
   prescription, each carrying its chart review, its measures, the
   patient's words, any relevant specialist comment, and what is
   outstanding for it. Last, their account of their health overall.
3. **Objective.** Vitals, office and home kept apart. The physical
   examination, dated to the day it was performed and flagged when it
   predates the last visit. Key labs as fishbones. Other diagnostics.
4. **Assessment.** A gauge per problem, then whether preventative
   services are up to date and on what, then lifestyle status.
5. **Plan.** Per problem, following from the gauge, with that
   problem's own medicines, testing and specialist.

Notices (records added since the summary was written, things to
reconcile) live in the right rail. They used to sit under the header,
which is the one part of the screen that has to stay clear: the eye
goes from the name to the problem list to the first line of the
subjective, and anything in that path is read before the clinical
content and remembered instead of it.

## Keeping it current

Nothing is generated until it is asked for, and nothing generated
reaches the document without a physician accepting it.

The chart counts the records that have arrived since the summary was
last touched, including the patient's own answers. Asking for a draft
produces proposals, each one carrying the record ids it was built from
and labelled either as something the chart documents or as something
the assistant read into it. Accepting is an event with a name and a
date on it. There is a proposal for what the record does not say,
because the dangerous failure for a summariser is not getting a number
wrong, it is rendering an absence as a normal finding.

## What this does not do

It does not replace the signed note, and it does not carry billing
documentation. The summary says where the patient is now; an E/M
record says what happened on one date; a care management log says what
was done in one calendar month. None of the three can be reconstructed
from either of the others. See `documentation-and-billing.md`.

## Open questions

- Does one living document hold up for a patient with ten problems
  rather than three? The per-problem structure grows linearly and
  nothing on the page is collapsed yet.
- Does the check-in get answered? A subjective that depends on the
  patient writing six short answers before every visit degrades to the
  old shape when they do not, and the screen has to be honest about
  that rather than hiding it. Unanswered problems currently say so.
- Who writes the opening statement over time? It is the one paragraph
  whose entire job is to be current, which argues for regenerating it
  rather than editing it, which argues against it being prose at all.
- Does the review step stay read, or become a button people click
  through? Nothing in the design prevents the second.
- Should the patient see the chart review written about them? The
  record is theirs and the export already includes everything. Nothing
  here is written as though it were private, but that has not been
  decided deliberately.

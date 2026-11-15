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

## Derived, not stored

Nothing in the subjective is saved anywhere. It is computed from the
record every time the chart is opened, and recomputed the moment a new
record arrives. There is no summary document, no draft, and no review
queue, because there is nothing to review: the summary cannot drift
out of date with the chart, since it is not a copy of the chart but a
reading of it.

This replaces the earlier design, in which the summary was a stored
document that a synthesis step proposed edits to and a physician
accepted. That workflow put a queue of work in front of a document
whose entire value was that it maintained itself. What review should
look like on a derived summary is an open question, deliberately left
open; the current answer is that the physician reads it, and every
sentence is traceable to the record behind it.

## What it reads

Signed visit notes. Health updates the patient submitted, prompted or
not. Messages between the patient and the practice. Per problem
answers to the questions we send. Specialist letters, with what they
found and what they advised. Lab panels, vitals, and the status of
every intervention.

An encounter is not only a visit. On a membership model most of what
is learned arrives between appointments, and a record that only counts
appointments is built from six data points a year rather than sixty.

## Three sources, never merged

## What is on the page, in order

1. Name, then the power statement: age and sex, past medical history,
   what the practice is following for management, and the service tags
   (preventative, lifestyle). Nothing else. No reminders, no counts,
   no actions.
2. **Subjective.** Two or three sentences on how the patient
   describes their health, what the record shows has moved, and what
   is unsettled. Then one block per active problem: one or two
   sentences combining their account with what the visits document and
   what the measure did, then the status of every intervention for
   that problem, each attributed to whoever last reported it.
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

## How it updates

A physician signs a note, or a patient sends an update, or a message
arrives. That record joins the longitudinal record. The next render of
the chart reflects it. There is no step in between.

The Encounters panel holds every source record, newest first, and each
one opens to its original text. The subjective says beneath itself how
many records it was built from and when the most recent arrived, and
every problem lists the records behind it.

Three demo buttons in that panel add a record of each kind, so the
claim can be checked rather than believed: add a patient update and
the summary changes, with nothing edited and nothing accepted.

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

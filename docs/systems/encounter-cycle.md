# The encounter cycle

An evaluation of the proposed workflow, a recommended architecture,
and the questions it leaves open.

Status: design. Nothing here has been reviewed by counsel, and the
billing content carries NEEDS-COUNSEL and NEEDS-CPA throughout.

## The verdict first

The workflow is clinically sound and it is the right correction to
what the prototype did before.

The previous model derived the summary at read time from every record
on file. That made drift impossible, which was the point, but it also
meant the chart could change because a patient sent a message at
eleven at night. A clinical summary that moves without a clinician
is not a clinical summary; it is a feed. The proposed model puts a
person between new information and the record, which is what makes
the document attributable, and it does so at the moment a person is
already reading the chart rather than as a separate review queue.

The cost is a new failure mode. An approved document can go stale,
and it will, because the thing that keeps it current is now a human
act. The design has to make staleness visible rather than pretend it
cannot happen. That is one line on the chart, and it is non-optional.

One structural recommendation changes the amount of machinery
required by about half, and it is in the next section.

## The architecture, in one idea

**Version the structured state, not the prose.**

The summary is already assembled from structured parts: a per-problem
status, the interventions and their statuses, the narrative clauses,
the plan text. The renderer takes those parts and produces the page.

So an approved version is a snapshot of exactly those parts, stored
whole, and the chart renders from the snapshot rather than from live
data. Nothing else has to be built to satisfy "unchanged between
approvals": the chart is unchanged because it is reading a frozen
object, not because anything is holding new information back.

What was the derivation engine becomes the **draft generator**. It
runs once, when an encounter opens, over the records that have
arrived since the last approval, and produces the proposed next
version. The physician edits that, not a parallel document.

Three records, and no others:

| Record | Answers | Mutable |
|---|---|---|
| `ChartVersion` | Where the patient is now, as approved | Never |
| `Encounter` | What happened on one date | Until signed |
| `InfoRequest` | What we asked the patient for | Status only |

Everything else already exists: the source records, the time log, the
consent records.

## The eight questions

**Should the note and the summary be edited together, or should one
generate the other?** One generates the other. The physician edits
the living summary inside the encounter; the signed note is produced
from what changed plus the encounter's own fields. Two editable
documents in one screen is the complexity trap, and a note is almost
exactly a diff: what was different today, what was done about it,
what was decided. Writing both by hand means writing the same thing
twice and having them disagree by Thursday.

**How to show new information without cluttering the chart?** It is
not on the chart. The chart shows the approved version and a count.
New information lives in the encounter, in one tray, grouped by the
problem it touches, next to the working copy. Outside an encounter
the only place it appears is that count and the Encounters list,
which is where someone goes looking for it.

**How to distinguish patient-reported from physician-verified?** In
words, not typography, and by where it lives. Until a physician
writes it into an approved version, patient-reported information is
only in the tray and in the source records, attributed and dated.
Approving is the act that turns an account into a finding, and that
act has a name and a timestamp on it.

**How to handle conflict with the approved summary?** Name it and
refuse to resolve it. The draft lists conflicts explicitly: recorded
at goal, patient reports worse. The physician can accept the new
reading, keep the old one, or leave the conflict standing, but the
system never picks. Silently preferring the newer record is how a
summary becomes something nobody can audit.

**How are urgent updates handled between encounters?** Urgency is a
property of the inbound record, set by the patient when they send it
and raisable by anybody who reads it. Flagged records surface on the
chart header and in the day's list. Clearing a flag is either an
encounter or an explicit "reviewed, no change", which still writes a
version, because "a physician looked at this on Tuesday" is worth
recording.

**How to keep a complete audit trail without complicating the
interface?** Versions are immutable and diffable, so the trail is a
by-product rather than a feature. The interface shows one line:
version, date, who. Everything else is behind it.

**Where do monthly CCM and BHI documentation fit?** CCM and BHI
reviews are encounters with a type, not a separate workflow. They
contribute time entries to a month; the monthly record is a view over
those entries, not a document somebody maintains. A review can
usefully happen without being billable on its own, so the system must
keep three things apart: the clinical encounter, the time entry, and
the claim. It already does.

**What about an encounter that changes nothing?** It still writes a
version, marked as reviewed with no change. It is cheap, it is
clinically meaningful, and the alternative, skipping the write, makes
the version history lie about how often the chart was actually read.

## What this does not solve

The chart ages when encounters do not happen, and the people most
likely to go a long time without an encounter are the people it
matters most for. The count of unincorporated records has to be on
the chart, and should probably grow teeth with age.

The draft is only as good as the derivation, and the derivation is
now load-bearing in a way it was not before: a physician reviewing a
draft will accept more than they would write. That argues for the
draft being conservative, for conflicts being loud, and for the
system never pre-accepting anything.

Ambient capture and dictation feed the working copy, which means the
error rates already measured in this prototype apply to a document
that becomes the record on approval. The existing check at signature
belongs in this workflow too.

## Billing

NEEDS-COUNSEL and NEEDS-CPA before any of this supports a claim. See
`documentation-and-billing.md` for what was established earlier about
E/M selection, CCM and BHI documentation, and why the summary cannot
carry any of it. Nothing in this cycle changes those conclusions: the
encounter still keeps its own record of decision making and time, and
the monthly time log is still a separate thing from both the note and
the summary.

# The consultative model, evaluated

Written 2026-11-16 against the direction set out in the brief of the
same date. Everything here is an engineering and operations reading.
The three questions that decide whether the model is lawful at all
are marked `NEEDS-COUNSEL` and are not answered here.

The summary, before the detail: **the model is coherent and the
arithmetic works, with one exception that is not close.** A sixty
minute care plan review every month for two hundred patients is 2,400
physician hours a year against the 1,040 the year contains. That is
the only number in the brief that does not survive its own
constraints, and everything in part 4 follows from fixing it.

---

## 1. What is being proposed, and what is actually new

The practice stops being anybody's primary care physician and becomes
a consulting physician for named conditions and named services. That
is a real change and it is the right one for a solo practice working
eight months a year. It is also the change that carries the most
legal weight, because the thing being limited is not the service, it
is the relationship.

Four things follow from it, and they are the whole evaluation:

1. A scope that is written down per patient, not per practice.
2. Closures that are planned rather than survived.
3. A panel size that the year can actually hold.
4. A record that can show, afterwards, what was agreed and what was
   done.

---

## 2. Clinical and legal concerns, in order of weight

### 2.1 You cannot contract out of a duty you have taken on

`NEEDS-COUNSEL`, and it is the first one.

A patient agreement can define **what you will do**. It cannot define
away the standard of care for what you actually did. If you prescribe
a statin, you own the monitoring that statin requires. If you order a
metabolic panel and it comes back with an eGFR of 38, you own that
result, whether or not kidney disease is on the agreed list.

The practical rule the system should enforce: **anything you
prescribe or order creates follow-up you are responsible for, and
that follow-up has to fit inside your service periods.** Not inside
the membership year. Inside the periods you are actually working.

### 2.2 The patient with no primary care physician

This is the sharpest edge in the model.

The brief says patients without a PCP can still enrol, with a
recommendation and an explanation of limits. In practice, a patient
who has no other physician and sees you four or five times a year
**has one physician, and it is you.** A court, a board, or the
patient's family will look at the relationship that existed, not the
sentence in the agreement. Where you are the only physician in
someone's life, "I am not your primary care doctor" describes your
intention and not their situation.

Three options, and only the third is comfortable:

- Decline patients without a PCP. Clean, and it excludes the people
  most likely to need the practice. It also sits badly beside the
  sliding-scale and pro bono memberships (D-039).
- Enrol them with a disclaimer. This is the option that reads as
  settled and is not.
- **Enrol them, and treat establishing primary care as a care plan
  item with a status, like any other.** It appears in the plan, it
  has an owner, it is reviewed at every encounter, and the record
  shows what was recommended and what happened. If they never
  establish, that is visible and it is a decision somebody made
  rather than a gap nobody noticed.

The third is what the prototype should implement, because it is the
only one that leaves evidence.

### 2.3 The four months away

A planned closure is not abandonment. An unplanned absence from an
active treatment relationship can be.

What makes the difference is: the dates are known in advance and were
disclosed before enrolment; nothing clinically live is left spanning
the gap; there is a stated route for urgent matters; and the patient
has somewhere to go. "Completely unavailable" is achievable. "No
arrangement at all" probably is not.

**The structure of the four months matters more than the total.** One
contiguous four-month closure is the worst version: it is longer than
a ninety day prescription, longer than most follow-up intervals, and
long enough that a problem found in the last week before closing has
nowhere to go. Four one-month closures spread through the year is the
best version: each gap is shorter than a routine prescription and
shorter than almost any monitoring interval.

Recommended shape, and the one the prototype now models:

| Block | Length | Note |
|---|---|---|
| Service period | 2 months | Visits and reviews scheduled |
| Closure | 1 month | No routine service |
| Repeated | 4 times | 8 months open, 4 closed |

The system consequence is concrete: **before a closure begins, every
patient needs a check that nothing is left hanging.** Prescriptions
that run out mid-gap. Labs due inside the gap. Open information
requests nobody will read. Referrals with no follow-up date. That is
a screen, and it is listed in part 5.

### 2.4 Medicare, and the employment collision

`NEEDS-COUNSEL`. Two facts that interact badly:

Opting out of Medicare under section 1802(b) is a **decision about
the physician, not about the practice**. It applies to everything
that physician does, everywhere, for the two-year term. The brief
mentions other clinical employment. If that employer bills Medicare
Part B for this physician's professional services, opting out is not
available while that job continues.

Not opting out does not make the problem go away. Charging a Medicare
beneficiary a membership that covers services Medicare would
otherwise pay for raises exposure under the beneficiary inducement
civil monetary penalty, and the preventive and chronic-care
counselling at the centre of this practice is squarely the kind of
service Medicare covers.

The sequence that works is the one already in D-033: **Medicare
beneficiaries enrol after the other employment ends, through opt-out
and private contracts**, or not at all. The system should hold a
Medicare status per patient and refuse to pretend the question is
settled, which it already does.

### 2.5 Smaller, still real

- **Prescribing across state lines and across closures.** A
  telemedicine-predominant practice with a physician who is away for
  a month needs its refill policy written down, not improvised.
- **Controlled substances.** The model as described should probably
  exclude them entirely. A practice with planned month-long closures
  is a poor place for anything requiring monthly review.
- **Conditions that decompensate faster than the service interval.**
  Heart failure, brittle diabetes, active psychiatric illness, and
  anything needing titration do not belong in scope for a practice
  whose next contact may be seven weeks away. The scope list is a
  clinical safety mechanism, not a marketing one.
- **"At least 200 patients."** Every patient over 200 reduces the
  minutes available to all of them. The panel number is a clinical
  parameter and the system should show it as one.

---

## 3. Recommended scope of services

Written as a per-patient agreement with four lists, because the thing
that makes a consultative model safe is that both sides can say what
is on each one.

**What this practice manages.** Named conditions, by diagnosis, each
with the physician who owns it. Some are ours. Some are the PCP's and
we co-manage. Some are theirs alone and we do not touch them.

**What this practice provides regardless of diagnosis.** The
comprehensive assessment, the preventive schedule, the lifestyle
prescriptions, the care plan itself, and the periodic review of all
of it.

**What this practice does not provide.** Primary care. Urgent care.
Emergency care. Continuous availability. Care during closures. Care
for conditions not on the list. Anything requiring in-person
examination the practice cannot provide.

**What the patient is responsible for.** Having a primary care
physician, or working toward one as a plan item. Telling us about
hospital stays, new diagnoses, and new prescriptions. Sending the
measurements we ask for. Going elsewhere for anything urgent.

The first and fourth lists are per patient and live in the chart. The
second and third are the practice's and live in the agreement.

---

## 4. The annual structure that fits

### 4.1 The arithmetic, shown

30 hours a week times 34.7 working weeks is **1,040 physician hours a
year**. Divided across 200 patients that is 5.2 hours each, and after
reserving 20 percent for administration, **250 clinical minutes per
patient per year**.

The brief's allocation is internally consistent and is adopted:

| Activity | Minutes per patient per year |
|---|---:|
| Synchronous consultations | 120 |
| Care plan reviews | 90 |
| Messages, coordination, follow-up | 40 |
| **Total** | **250** |

### 4.2 The one thing that does not fit

A monthly sixty minute care plan review is **720 minutes per patient
per year**. Across 200 patients that is 2,400 physician hours against
1,040 available: over by a factor of 2.3, before a single
consultation is booked.

It was the right design at a 140-patient panel with nine months
worked and a primary care scope. It is not compatible with 200
patients, eight months, and 250 minutes each. **The monthly review
has to go, and what replaces it is a quarterly one.**

### 4.3 The recommended package

Five physician contacts a year, inside four service periods:

| Contact | Length | When |
|---|---:|---|
| Consultation | 60 min | Service period 1 |
| Care plan review | 30 min | Service period 2 |
| Consultation | 60 min | Service period 3 |
| Care plan review | 30 min | Service period 3 |
| Care plan review | 30 min | Service period 4 |
| Messaging and coordination | 40 min | Across all four |
| **Total** | **250 min** | |

Which gives a patient contact roughly every seven weeks while the
practice is open, and never more than about ten weeks between a
review and the next one, closure included.

**Year one is different and should be priced or staged as such.** A
first comprehensive assessment plus the work of building a care plan
from nothing is realistically 90 to 120 minutes more than the steady
state. Either the first year is a larger package, or enrolment is
staged so that no service period carries more than a manageable
number of new patients. The second is simpler and does not require a
second price.

### 4.4 What this means for the economics

200 members at $1,188 is **$237,600 a year gross**, which against 832
clinical hours is about **$286 an hour gross**, before any overhead.
That is a figure to hand to the CPA, not a conclusion. `NEEDS-CPA`,
`REFRESH-AT-RUNWAY`.

Note the direction of the sensitivity: at this panel size, **time is
the binding constraint and price is not.** Adding patients adds
revenue linearly and subtracts minutes from everybody. The system
should make that visible rather than letting it be discovered.

---

## 5. What the clinical system needs

The workflow is kept exactly as it is: **one schedule, two encounter
types, one living care plan, one inbox.** Nothing below changes that.

### 5.1 Service periods

The working year stops being "30 hours for 39 weeks with some away
blocks" and becomes an explicit calendar of open and closed periods.
Consequences: the day screen says when the practice is closed and why;
nothing can be booked into a closure; and the capacity arithmetic
counts only open weeks.

### 5.2 Scope of care, per patient

Each managed problem gains an owner: this practice, the patient's
PCP, or shared. The patient record gains their PCP, or the fact that
they have none, with establishing one as a plan item that has a
status like any other.

### 5.3 The membership year as a ledger

Each patient has a membership year with a budget of contacts and
minutes, and a running total of what has been used. Not to ration
care: to make it visible when a patient is using three times the
planned time, which is clinical information before it is commercial
information.

### 5.4 The closure check

Before a service period ends, one screen per patient: prescriptions
that run out during the closure, labs due inside it, open information
requests, and referrals with no follow-up. This is the single most
valuable new screen in the brief, because it is the thing that turns
a planned absence into a safe one.

### 5.5 Billing, demoted

CCM, BHI, the wellness visit and office visit levels come off the
daily path. The research, the rules and the citations stay in
`docs/systems/billing-architecture.md` and in `lib/monthly.ts`,
because they were expensive to establish and will be needed if the
practice ever bills. The drawer stays reachable and stops being
something the daily workflow passes through.

### 5.6 What does not change

The living care plan, the versioning, the approval cycle, the
reconciliation tray, the inbox and its three answers, the demo data,
and the two encounter types. All of it survives the repositioning
unchanged, which is the main evidence that the workflow was designed
around the clinical work rather than around the billing.

---

## 6. Implementation order

1. **Service periods.** The calendar, the closed-day states, the
   capacity arithmetic at 200.
2. **Scope of care.** Condition ownership, the PCP field, and the
   agreement view that shows all four lists.
3. **The membership ledger.** Contacts and minutes used against the
   annual package, on the chart and in the capacity screen.
4. **The closure check.** One screen, run per patient before a period
   ends.
5. **Demote billing.** Move the drawer off the daily path.
6. **Re-cadence the demo.** The demo day currently books monthly
   reviews; it should book the quarterly package instead, and the
   capacity screen should show the 200-patient arithmetic.

Steps 1, 5 and 6 are small. Step 2 is the one with clinical weight.
Step 4 is the one that is worth the most.

---

## 7. What this document does not settle

- Whether the physician can opt out of Medicare while employed
  elsewhere. `NEEDS-COUNSEL`.
- Whether a membership covering Medicare-covered services can be sold
  to a beneficiary who has not privately contracted. `NEEDS-COUNSEL`.
- What a Texas medical board expects of a practice with planned
  month-long closures, and what notice and coverage arrangements
  satisfy it. `NEEDS-COUNSEL`.
- Whether the economics hold after overhead. `NEEDS-CPA`.
- D-039 guardrail 4b still stands: no patient-facing piece states how
  Medicare works with the membership until counsel settles it.

# The FCHC plan

*Settled 2026-10-25, timeline added 2026-10-25. House Style applies. Every figure traces to a
model in `tools/`. Items marked UNSET are not confirmed.*

---

## What I am asking for

A salaried position. **0.75 FTE, 30 hours per week annualized,
$41,500 a year.** Schedule provided quarterly, as I already do.

Those exact words matter. A day rate or an hourly rate does not work,
for reasons in the last section.

## The schedule

I work only the days Jamie is home with our children. That comes to
about **83 clinic days a year**, roughly two a week. Ten hours each.

We start at **sixteen patients a day**, which is 38 minutes a visit.
If the demand is there, we work up to **twenty**, which is 30 minutes.
Both are normal primary care pacing. My salary is the same either way.

I give you the days a quarter at a time. Some weeks will have four.
Some will have one. About six weeks a year will have none. You will
see each of those coming three months out.

I keep twelve weeks off: two in January, one at spring break, two in
May, three in summer, two at Thanksgiving, and the winter holidays.

## Childcare

None. That is the point of working only Jamie's free days. There is no
week where we are both at work and paying someone.

## What it costs you

Salary $41,500, or $45,235 with payroll taxes. That figure does not
move between the two cases.

| | at 16 a day | at 20 a day |
|---|---|---|
| encounters a year | 1,328 | 1,660 |
| my cost per encounter | $34.06 | $27.25 |
| share of collections at $90 | 38% | 30% |
| share at $103 | 33% | 26% |

I could not source a published band for physician pay as a share of
collections. MGMA tracks the ratio but the percentiles are paywalled, so
that comparison is out of the document until the clinic or I can buy the
figure. What stands on its own is the direction: twenty a day costs the
clinic a smaller share than sixteen, and my salary does not move.

## What the clinic keeps

Overhead here is **marginal**, at 40 percent of collections, not the
~60 percent family medicine averages (EST, derived from AAFP). Rent,
records, management and the front desk do not change because I am there
on a Tuesday. After that overhead and after paying me:

| | at $90 a visit | at $103 a visit |
|---|---|---|
| 16 a day | $26,477 | $36,811 |
| 20 a day | **$44,405** | **$57,323** |

The same figures as a return on what I cost are 59 cents, 81 cents, 98
cents and $1.27 per dollar of my loaded cost. That ratio stays internal.
The document presents the dollars kept, not the ratio: showing what the
clinic makes reads better than showing a percentage return on me
(owner direction, 2026-10-25).

The clinic's whole surplus last year was $21,133 on $1,643,163 of
revenue, a 1.3 percent margin (FACT, Form 990 FY2024, EIN 54-2061482).

Growing from sixteen to twenty adds about $18,000 to $20,500 of
surplus and costs the clinic nothing, because my salary is fixed. All
of the upside from a fuller schedule stays with the clinic.

If we do reach twenty, there is room to revisit the salary and still
leave the clinic ahead. That is a conversation for later, not a
condition now.

My rate works out to $26.60 an hour of paid time. The medical
director's is $66.97.

## What it does for me

$500 a clinic day. $50 an hour of clinic time.

I have 20 qualifying payments toward Public Service Loan Forgiveness
and need 100 more, which is eight years and four months. At $41,500 my
income-driven payment is $0, and a $0 payment still counts. So I reach
forgiveness having paid nothing, and about $490,000 is written off
tax free.

**The start date is 1 June 2028, not January 2027.** The schedule above
is built for the years when we expect young children at home, which
begin in 2029, and starting a quarter early leaves room to find the
problems before the schedule has to hold.

That timing has a cost I should not hide from myself. The current hourly
arrangement is about 16 hours a week, which is under the 30-hour test, so
the months from January 2027 through May 2028 are unlikely to produce
qualifying payments. Counting 100 payments from June 2028 puts
forgiveness around **September 2036** rather than spring 2035 (EST,
assumes no other qualifying employment in the interim and no break in
payments). That is roughly sixteen months later. If that delay is not
acceptable, the lever is to start the salaried role earlier, not to
change anything else in this plan.

After everything, our household saves about $16,866 a year. I wanted
$25,000. I am choosing the forgiveness.

## Why the wording matters

The forgiveness form asks you to report my average hours per week. The
instruction says to check Full-Time if the average is 30 hours or
more, and that the figure **should include vacation and leave time**.

If my contract says 0.75 FTE at 30 hours a week, you enter 30 and I
qualify. If it says a day rate or an hourly rate, a timesheet shows
about 16 hours a week and I do not. Same money, same work, different
outcome.

## What goes in the document

**One page. Everything on it, including the example year.** 41 words,
two figures, no footnotes, no page break.

- The title, the byline, and one sentence, owner's wording: "Transition
  to a 0.75 FTE salaried position at $41,500 annually beginning June 1,
  2028, while maintaining the current hourly arrangement until then to
  demonstrate sufficient demand and financial viability."
- One combined figure (`docs/fchc/timeline-figure.html`): the timeline
  across 2027 and 2028 with the three milestones, and directly beneath
  it, tied to the same two bars, what the arrangement is now and what it
  becomes on 1 June 2028. The old separate now/then table is folded into
  this.
- The example year calendar, under a plain heading.

**The vacation strip is gone.** It said the same thing as the grey weeks
in the calendar. Redundant, so it came out.

**The clinic economics are not in the document** (see iteration 10
below). `tools/fchc_roi.py` holds the break-even work for the
negotiating table.

**The salary and the market comparison are not in the document either.**
Owner deleted them 2026-10-25. The salary still appears once, in the
opening sentence, as part of the ask.

**The PSLF wording risk stands, and iteration 12 raised it.** Owner
direction, 2026-10-25, put "$50 per hour" into the figure alongside
"Salary, 0.75 FTE, 83 days per year, 10 hours per day". Two
consequences:

1. The document now states an hourly rate, which is the framing that
   fails the 30-hour test if it reaches the contract. **A contract that
   comes back phrased as a day rate or an hourly rate must be caught and
   corrected**, most likely in January 2028.
2. The arithmetic is now visible. 83 days at 10 hours is 830 clinic
   hours, and $41,500 over 830 is exactly $50. But 0.75 FTE at 30 hours
   a week is about 1,560 hours a year, which is $26.60 an hour. A
   reader who multiplies may ask how 830 hours is 0.75 FTE. The answer
   is the one the PSLF form already gives: leave counts at the
   contracted weekly rate. We should have that answer ready rather than
   be surprised by the question.

The phrase "30 hours per week annualized" no longer appears in the
figure, only "0.75 FTE". It is worth confirming that the contract still
carries the full phrase.

**The calendar legend reads "In clinic", "In town", "Weekends and time
off".**

## Between now and then

| | |
|---|---|
| January 2027 | Current hourly arrangement continues. Tracking begins. |
| October 2027 | First check. Are collections and volume where they need to be? |
| January 2028 | Decide, and write the contract if the answer is yes. |
| 1 June 2028 | Salaried position begins. |
| August 2028 | Review the first quarter, then each August after. |

The two things being tracked are the two UNSET inputs below. If October
2027 says they do not hold, we do not do this and the hourly arrangement
continues.

## Still open

- What the clinic actually collects per encounter. Everything above
  assumes $90 to $103. UNSET.
- How quickly we try to grow from sixteen a day to twenty. That is a
  demand question rather than a pace question: twenty on 83 days is
  332 more encounters a year.
- Confirming my payment count with the servicer before anything is
  signed.

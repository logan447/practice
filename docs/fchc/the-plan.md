# The FCHC plan

*Current as of 2026-10-25. House Style applies. Every figure traces to a
model in `tools/`. Items marked UNSET are not confirmed. The version
built around a June 2028 salaried start is archived at
`docs/archive/fchc-the-plan-SUPERSEDED-2026-10-25.md`.*

---

## The contract

**35 weeks a year, two clinic days a week, 15 clocked hours a day,
$40 an hour, beginning January 2027.**

| | |
|---|---|
| Contract period | 35 Service Weeks = 8.05 months |
| Clinic days | 70, exactly two in every Service Week |
| Clocked hours a day | 15, including inbox, charting and overage |
| Total hours | 1,050 |
| Average | **30.0 h/week**, exact |
| Pay | $42,000 (loaded $45,780) |
| Patients a day | 16, so about 1,120 visits a year |
| Paid childcare | **none** from 2029 |
| Weeks not working | 17: twelve blocks plus five off contract |

Schedule given a quarter in advance. Model:
`tools/fchc_schedule_2027.py` (2027) and `tools/fchc_schedule_2029.py`
(2029). Both produce the same shape.

**There is no proving period.** Earlier versions ran the current hourly
arrangement until June 2028 to demonstrate demand first. That came out
on owner direction (2026-10-25): the contract is the same contract
whatever fills the other days, so there is nothing to wait for and 17
months of qualifying payments to gain.

**The margin on the eight-month floor is 0.2 weeks.** 34.32 weeks is
exactly eight months. One quarter at eight weeks instead of nine lands
the year at 34, which is 7.82 months, and the whole year's
certification fails. Make up any shortfall in the next quarter.

**Quarters are not even: 9, 9, 10, 7.** Q4 carries both Thanksgiving
and Christmas, so it runs a week under the eight-a-quarter rule of
thumb. The annual total is what has to hold, not the quarter.

## Which days, and why it changes in 2029

The contract shape never changes. Only which weekdays get used.

**2027, no children.** Clinic days go where Jamie is **already
working**, so their off time lines up. All 70 land on her working days.

**2029, with children.** Clinic days go where Jamie is **home**, so
somebody is already doing childcare and nothing is paid for. That is the
2029 model, unchanged.

### One car, in 2027

Owner, 2026-10-25: a second car may not be needed at first, because on
a clinic day he can either ride in with Jamie or she is off and he takes
the car. The 2027 model now picks for this, after lining the days up:
it prefers her post-call days and her 12s, which are days she is
working **and** the car is home.

| On the 70 clinic days | |
|---|---|
| Jamie working | 70 of 70 |
| Car at home | 46 (22 post-call, 22 twelves, 2 all-day weeks) |
| Car away overnight (she starts a 24) | 24 |

The 24 cannot be fixed inside the preference. On a week with two 24s
there is only one weekday that is both hers and car-safe, so the second
day has to be a 24 day or a day she is off. Six of the 35 weeks end up
with the two clinic days back to back, which is the other cost of
picking for the car.

`ASSUMPTION, owner to confirm:` that riding in together is possible at
all, which needs her hospital and the clinic to be a shared trip. If it
is not, only her days off give a free car and the day picks change.

## What it costs the clinic, and what it keeps

$42,000, or $45,780 with payroll tax. At 16 patients a day that is
1,120 visits and **$40.88 of my cost per visit**.
Model: `tools/fchc_roi_2027.py`. Collection per visit is UNSET;
$90 and $100 bracket it.

| Marginal overhead | Clinic keeps at $90 | at $100 |
|---|---|---|
| 19% (already open and staffed those days) | $35,868 | $44,940 |
| 40% (central estimate) | $14,700 | $21,420 |
| 55% (dedicated staffing) | -$420 | $4,620 |

Break-even overhead is 55 percent at $90 and 59 percent at $100. The
question that decides which row applies is not "what is your overhead"
but "will I be working on days you are already open and staffed".

Growing from 16 a day to 20 adds $15,120 to $22,680 and costs the
clinic nothing, because the hours are what is paid for. All of that
upside stays with the clinic.

The clinic's whole surplus last year was $21,133 on $1,643,163 of
revenue, a 1.3 percent margin (FACT, Form 990 FY2024, EIN 54-2061482).

**None of this goes in the document** (D, iteration 10). It is for the
negotiating table, volunteered only if asked.

## What it does for me

$600 a clinic day. 20 qualifying PSLF payments made, 100 to go.

Starting January 2027 rather than June 2028 moves forgiveness from
about September 2036 to about **April 2035**, seventeen months earlier,
at no extra cash cost. The payments happen either way, because he is
already in repayment; the contract is what makes the months count.
Model: `tools/fchc_early_start.py`.

**The savings floor, and why the car decides it.** On FCHC income
alone, with the second car in the budget, $40 an hour saves $17,649
against a $25,000 floor. Take the second car out and it clears.
Model: `tools/fchc_one_car.py`.

| | saves | against the $25,000 floor |
|---|---|---|
| Two cars, as modelled | $17,649 | short $7,351 |
| One car, he drives it on clinic days | $25,099 | clears by $99 |
| One car, he rides in with Jamie | $26,613 | clears by $1,613 |

The second car is $8,964 a year, $7,450 of it fixed. It is the whole
difference between missing the floor and meeting it, and the margin
either way is thin. In 2027 none of this decides anything, because the
other days carry Olera income, which is UNSET. From 2029, with Olera
gone and the other days going to children, this table is the household.
`REFRESH-AT-RUNWAY`

## What goes in the document

One page, 25 words, two figures. Title, one sentence, a strip of four
numbers, then the example year.

The sentence:
"A contract of 35 weeks a year, two clinic days a week at 15 clocked
hours and $40 per hour, beginning January 2027. Schedule provided a
quarter in advance."

The strip carries 70 clinic days, 1,050 clocked hours, 1,120 visits at
16 a day, and $42,000 at $40 an hour. The Gantt chart and the now/then
columns came out with the proving period: with nothing to wait for
there was nothing for a timeline to draw.

The example year is 2027, generated from `tools/fchc_schedule_2027.py`.
Its three keys are "In clinic", "In town" and "Weekends and time off".
The five weeks outside the contract read as time off; the clinic does
not need to know why.

Built by `tools/make_fchc_docx.js`. **Page fit is measured by rendering
the same content at the same typography in Chromium and reading
`offsetTop + offsetHeight`, not in Word, which is not installed here.**
Content bottom 810 px against a 965 px page.

## Still open

- Whether the 8-month provision reaches a clinic, whether a Service
  Period may be non-continuous, whether an average suffices where the
  regulation says "throughout", and whether FCHC will certify hours
  against the Service Period rather than the employment dates.
  `NEEDS-COUNSEL` See `docs/fchc/pslf-fulltime-research.md` and
  `docs/fchc/contract-language-draft.md`.
- **The paid-leave clause is gone** from 34 CFR 685.219(b). It is in
  the 2024 and 2025 annual editions and absent from the current text.
  This plan does not rely on it: every hour counted is an hour worked.
- Confirming the payment count with the servicer before anything is
  signed, and confirming the loans sit on IBR. SAVE, PAYE and ICR
  sunset 1 July 2028; RAP has a statutory $10 minimum and never reaches
  $0. IBR survives for borrowers who take no new loans.
- What the clinic actually collects per visit. UNSET.
- Whether riding in with Jamie is geographically possible. UNSET.

**All assumptions:** `docs/fchc/assumptions.md`.

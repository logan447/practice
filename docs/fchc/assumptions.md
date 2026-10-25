# Everything this calendar assumes

*2026-10-25. Plain language. Each line is something that could be
wrong, and most of them you can check or change.*

## About Jamie's work

1. **She works one or two 24-hour shifts most weeks.** On a one-24
   week she also does a 12.
2. **A 24 means she is unavailable that day and the next.** Post-call
   counts as gone.
3. **A 12 means she is unavailable that day only.** Including nights,
   which may be wrong: a night shift probably costs the next day too.
4. **Her 24s never land on a weekend in this version.** That is a
   change from what you told me. A weekend 24 frees up weekdays, so
   assuming none is the pessimistic case. If she really does a few a
   year, you gain days.
5. **One backup week a year and one regular Monday-to-Friday week.**
   You said about two of each. I used one of each, placed on the week
   of Valentine's and the week of 1 October, taken as a fall break.
6. **Her schedule is shaped to leave exactly two free weekdays every
   week.** This is the big one. It is a *request* of her rota, not a
   prediction. A real rota is lumpy; this one is not.
7. **She takes about 70 percent of her own leave during your twelve
   weeks off**, so the family is together on trips.

## About your schedule

8. **Two clinic days a week, every week of the contract.** 76 days.
9. **Fifteen clocked hours a day.** That is the number that makes two
   days reach thirty hours. Not ten, not thirteen.
10. **Clocked hours include documentation, inbox, results and
    overage**, and the clinic pays for all of it at $50 an hour.
11. **You work only on days Jamie is already home.** No paid
    childcare anywhere in the year.
12. **Twelve weeks off**: New Year's, spring break (w/c 26 Mar),
    Belize, summer, Thanksgiving, Christmas. Plus two off-contract
    weeks: Valentine's and the fall break w/c 1 Oct.
13. **A 2.5-hour round-trip commute** on every clinic day, in the car
    costs but not in the clocked hours.
14. **16 patients a day.** At 15 clocked hours that is 56 minutes
    each, including documentation.

## About the contract and PSLF

15. **35 is the floor, 38 is the plan.** 34.32 weeks is exactly eight
    months, so 35 is the least that qualifies. 38 is simply what the
    year leaves after twelve weeks off and the two weeks Jamie covers
    nothing. Dropping to 35 would mean deliberately not working three
    more weeks, which costs six clinic days and about $4,050, and
    leaves only 0.2 weeks of margin above the floor instead of 3.2.
16. **The Service Period is counted, not chosen.** The average is
    hours divided by the weeks actually worked in, so working in 38
    weeks and calling the period 35 does not work.
17. **The Service Period is 38 weeks**, which is 8.74 months, and is
    counted as the weeks you actually work rather than an elapsed
    span. **This is the single most contestable assumption.** The
    regulation says "a period", singular.
18. **The 8-month provision applies to a clinic**, not only to
    schools. Textually it is not excluded, but nobody has published
    an example outside education.
19. **An average across the period is enough.** The regulation says
    "throughout", which may mean every single week.
20. **FCHC will certify the hours** against the Service Period rather
    than against your employment dates, in writing.
21. **You stay employed all twelve months** even in the weeks you do
    not work.
22. **You are on IBR, not RAP**, before 1 July 2028. RAP has a $10
    minimum and never reaches zero.
23. **You take no new federal loans**, which is what keeps IBR
    available.

## About the money

24. **$45 an hour.** $51,300 for the year. Between the $50 that
    clears your floor and the $40 that gives the clinic the most room.
25. **The clinic's marginal overhead is 40 percent of collections.**
    Built bottom-up in `tools/fchc_overhead_bottomup.py` and it lands
    between 19 and 55 percent depending on one thing: whether you work
    on days the clinic is already open and staffed. Published
    benchmarks of 55 to 70 percent are *average* overhead, which
    includes rent, management and the front desk. Those do not change
    because you are there on a Tuesday, so they are the wrong number
    for this decision.
26. **The clinic collects $90 to $110 a visit.** UNSET. Nobody has
    told us the real number and it drives everything on their side.
27. **Employer payroll burden is 9 percent.**
28. **Two cars**, $9,094 a year, so nobody is stranded.
29. **150 percent of the poverty line for a family of four is
    $48,225.** An estimate for 2026; it moves yearly and your IBR
    payment moves with it.
30. **Three children by 2029.**
31. **Married filing separately**, so only your income counts for IBR.
32. **Your savings floor is $25,000. At $45 an hour this saves
    $24,066**, short by $934. $47 clears it at $25,533.

## Where the opportunities are

- **Line 4 and line 6 are worth the most.** If Jamie's rota naturally
  gives more than two free weekdays in some weeks, the day gets
  shorter than 15 hours. Every extra covered day is worth about
  0.4 hours off the day.
- **Line 26 decides whether the clinic says yes.** At $40 an hour
  and sixteen patients they keep $15,960, a 32 percent return, and
  break even at $68 a visit. Ask them what they actually collect.
- **Line 9 is the one Dr. Stinar will question.** Fifteen clocked
  hours for 16 patients is 56 minutes each.
- **Lines 17 to 20 are the ones that need a lawyer**, not more
  modelling.

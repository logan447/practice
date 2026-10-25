# PSLF full-time: what the regulation actually says

*Researched 2026-10-25 against primary sources. FACT = quoted from the
regulation or the Federal Register. EST = my arithmetic. ASSUMPTION =
mine, owned. Everything here is `NEEDS-COUNSEL` before it drives a
signed contract.*

---

## 1. The current regulatory text (FACT)

34 CFR 685.219(b)(11), as of the eCFR current text dated 2026-10-01,
and identical in the final rules at 90 FR 48966 (31 Oct 2025) and
91 FR 23768 (1 May 2026, effective 1 July 2026):

> **Full-time means:**
> (i) Working in qualifying employment in one or more jobs—
> (A) A minimum average of 30 hours per week during the period being
> certified,
> (B) A minimum of 30 hours per week throughout a contractual or
> employment period of at least 8 months in a 12-month period, such as
> elementary and secondary school teachers and professors and
> instructors, in higher education, in which case the borrower is
> deemed to have worked full time; or
> (C) The equivalent of 30 hours per week as determined by multiplying
> each credit or contact hour taught per week by at least 3.35 in
> non-tenure track employment at an institution of higher education.

## 2. The headline finding: the paid-leave clause is gone (FACT)

The 2022 final rule (87 FR 65904) added, as part of the same
definition:

> (ii) Routine paid vacation or paid leave time provided by the
> employer, and leave taken under the Family and Medical Leave Act of
> 1993 (29 U.S.C. 2612(a)(1)) will be considered when determining if
> the borrower is working full-time.

That clause is **present** in the annual CFR editions revised as of
1 July 2024 and 1 July 2025. It is **absent** from the current text.
Three independent sources agree, each searched in full for "vacation",
"leave time", "Routine paid" and "Family and Medical Leave", all
returning zero hits anywhere in § 685.219:

- eCFR API, full section text dated 2026-10-01
- Cornell LII current text of 34 CFR 685.219
- The regulatory text as printed in both the Oct 2025 and May 2026
  final rules, which run from (11)(i)(C) straight to (12)

**What happened (EST).** The Oct 2025 rule restructured § 685.219(b)
from unnumbered alphabetical definitions into a numbered list
(b)(1)–(b)(35). The leave clause did not survive the renumbering. The
Department issued a correction on 13 March 2026 (91 FR 12302) stating
that the Oct 2025 amendatory instructions "did not correctly capture
the intended change as described in the preamble" and addressed "errors
in the placement" of the regulatory text. That correction did not
restore the leave clause.

**Why this matters to us.** Every version of the FCHC plan built in
this repo has relied on leave counting toward the 30-hour average. The
PSLF form still instructs employers to include vacation and leave. But
the regulation no longer says so, and the regulation is what controls
in an audit or a dispute. **This is the single most important open
question in the plan.** `NEEDS-COUNSEL`

**It may matter less than it looks (ASSUMPTION).** Counting paid leave
is arguably inherent in "working ... a minimum average of 30 hours per
week" for a salaried employee, and the 2022 clause may have been
treated as surplusage. But that is an argument, not a rule.

## 3. Does the 8-month provision reach non-educational employment?

**Textually, yes. "Such as" is illustrative (FACT).** The 2022 preamble
says of this provision: *"The original language was a nonexhaustive
list, and this change adds clarity."* The Department said that while
adding professors and instructors to the examples. So the provision is
not limited to education on its face.

**But three cautions.**

1. Every example in (B), and every comment the Department answered
   about it, is educational. There is no published FSA guidance,
   example, or decision applying (B) to clinical employment. (FACT:
   none found in this search. Absence of evidence, not evidence of
   absence.)
2. (B) says **"a minimum of 30 hours per week throughout"**. (A), one
   line above, says **"a minimum average of 30 hours per week."** The
   drafters used "average" in one and not the other. The conservative
   reading is that (B) requires at least 30 hours in **every week** of
   the 8-month period, not 30 on average across it.
3. The PSLF form's paraphrase of (B) says "an average of 30 hours of
   work per week for a minimum of 8 months". That is **looser than the
   regulation**. Do not build on the form's wording where it differs.

This is the direct answer to the handoff's central question: the
exception is not confined to education, but the handoff's Scenario C
(1,040 hours spread as an average across 8 months) does not clearly
satisfy the text as written.

## 4. What each pathway actually requires (EST)

Arithmetic in `tools/pslf_hours.py`. 8 months = 34.8 weeks.

| Pathway | Requirement | 10-hour days | 12-hour days |
|---|---|---|---|
| (A) average 30/wk, no leave credit | 1,560 h/yr | 156 days | 130 days |
| (A) average 30/wk, 12 wks paid leave credited | 1,200 h over 40 wks | 120 days | 100 days |
| (B) 30/wk every week, 8 months, clinic only | 1,044 h | 104 days | 104 days |
| (B) 2 clinic days/wk plus admin to reach 30 | 1,044 h | 70 days + 348 admin h | 70 days + 209 admin h |

**Leave does not lift the average.** If paid leave is credited at the
contracted weekly rate, it is neutral: it neither helps nor hurts. The
working weeks still have to average 30 hours on their own. Leave only
means he need not work during those weeks.

**83 days does not reach any pathway.** 83 twelve-hour days is 996
hours, a 19.2-hour weekly average over 52 weeks. 83 ten-hour days is
830 hours, 16.0 per week.

**The lowest legitimate clinical workload** is pathway (B) with genuine
administrative time counted: about **70 twelve-hour clinic days** inside
an 8-month period, with roughly 6 hours a week of real, documented,
employer-acknowledged administrative work, and no week in that period
below 30 hours. That is fewer clinic days than the current plan. It
also carries the most interpretive risk of any option here.

## 5. A separate and more urgent finding: the $0 payment

The plan assumes $41,500 sits below 150% FPL, so the income-driven
payment is $0, and $0 payments count. The second half still holds:
§ 685.219 expressly contemplates a borrower who "otherwise qualified
for a $0 payment on an income-driven repayment plan under § 685.209"
(FACT).

**But the repayment plans themselves changed.** Per the May 2026 final
rule implementing Public Law 119-21 (FACT):

- REPAYE/SAVE, PAYE and ICR **sunset on 1 July 2028**. "Congress was
  clear that income-contingent repayment plans sunset and will be no
  longer available after July 1, 2028. The Department has no authority
  to alter this sunset date."
- The new Repayment Assistance Plan carries a **statutory $10 monthly
  minimum**. "the statute requires us to establish a minimum payment of
  $10 for all monthly payment calculations for the Repayment Assistance
  Plan". **RAP therefore never produces a $0 payment.**
- **IBR survives.** "Borrowers who do not take out additional loans
  will retain access to IBR as well." IBR remains 15 percent of AGI
  above 150 percent of the poverty guideline, with no minimum payment
  stated, so it still reaches $0 below that threshold.

**Consequence.** The $0-payment plan works **only on IBR**, not on RAP.
The salaried position starts 1 June 2028 and the sunset is 1 July 2028.
Confirm the loans are on IBR well before that date, and take no new
federal loans. `NEEDS-COUNSEL`

## 6. Answers to the handoff's ten questions

1. **Does (B) reach nonprofit healthcare?** Not excluded. "Such as" is
   nonexhaustive per the 2022 preamble. No authority applying it to
   clinical employment. **Uncertain.**
2. **Required contract structure?** The regulation says "a contractual
   **or employment** period of at least 8 months", so a standard
   salaried agreement can satisfy the form of it. **Reasonably
   inferable.**
3. **Work 8 months, no work 4 months, credit for 12?** (B) says the
   borrower "is deemed to have worked full time". It does not itself
   say "for 12 months"; the form adds that. The 2022 preamble describes
   "the treatment of teachers on an employment contract being
   considered to work for 12 months", which supports it. **Reasonably
   inferable, not explicit.**
4. **Must he be paid during the 4 months?** The regulation is silent.
   **Uncertain.**
5. **How should the employer report hours?** Not resolved here; the
   form's instructions are the operative guidance and I could not reach
   studentaid.gov during this research. **Unverified.**
6. **83 twelve-hour days plus ~44 hours?** No. That reasoning treats
   (B) as an annual total. Under "throughout", the weekly distribution
   is the test, and 996 + 44 hours spread unevenly fails it. **Does not
   satisfy as described.**
7. **Special provisions for physicians or seasonal workers?** None
   found in § 685.219. **No.**
8. **Does 0.75 FTE matter?** No. The regulation counts hours, not the
   employer's FTE label. The pre-2021 "employer's own definition of
   full-time" test is gone. **Explicit.**
9. **Documentation?** Not addressed by the regulation. At minimum the
   contract should state the hours basis, and contemporaneous records
   should show weekly hours including administrative time.
   `NEEDS-COUNSEL`
10. **Interpretations or examples supporting this structure?** None
    found. **Uncertain.**

## 7. What I could not verify

- The current PSLF form's exact Section 7 text. studentaid.gov returned
  503 throughout. The handoff's quotation is taken on trust, and where
  it differs from the regulation, the regulation controls.
- Whether FSA has ever applied (B) outside education.
- Whether the removal of the paid-leave clause was deliberate.

## 8. What this means for the FCHC proposal

The document as it stands proposes 83 ten-hour days at 0.75 FTE, "30
hours per week annualized". On the current regulation, **830 clinic
hours is 16 hours a week and does not meet any pathway**, and the leave
mechanism that was supposed to bridge the gap no longer has express
regulatory support. The arrangement needs either materially more
documented hours or a different structure before the wording in the
contract is worth anything. Do not sign on the current numbers without
counsel.

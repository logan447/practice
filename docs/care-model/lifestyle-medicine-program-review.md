# Lifestyle Medicine Program: Design Review (v1)

Internal working document. Not patient-facing copy (House Style governs
the later patient and referral descriptions, not this review).

Status: **[O] open, under owner review.** Nothing here is decided until
logged in `docs/charter/decision-log.md`. Tracked as Q-24.

Tags: **[F]** fact with source · **[E]** estimate with derivation ·
**[A]** assumption, owner named · **[O]** open decision.
Clinical citations below are from memory and marked `VERIFY`: confirm
each against the current source before any external use (R-13).

Created 2026-11-08.

---

## 1. The proposal, restated

A structured, personalized, one-year program built on the six pillars
of lifestyle medicine (nutrition, physical activity, restorative sleep,
stress management, avoidance of risky substances, social connection),
delivered inside ordinary medical care.

| Stage | Cadence | Content |
|---|---|---|
| **Before enrollment** | 3 steps | (1) 30-min virtual consult: concerns, history, goals, what info is needed. (2) Assessments: records, labs, questionnaires, six-pillar baselines; physician builds a plan. (3) Plan review visit. Then (4) the patient decides. |
| **Phase I: Foundation** (mo 1–3) | 6 visits, every 2 weeks | One pillar introduced per visit; prescriptions accumulate. Visit 1 in person with full exam; rest may be virtual. Order adjustable. Ends with an active plan across all six pillars. |
| **Phase II: Reinforcement** (mo 4–6) | 3 visits, monthly | Review all pillars, adherence, barriers; adjust prescriptions; monitor outcomes. |
| **Phase III: Independence** (mo 7–12) | 2 visits, quarterly | Maintain with less contact; handle setbacks; refine the long-term plan. |
| **Final assessment** (mo 12) | 1 visit, in person | Repeat baselines, exam, review goals; decide graduation. Not ready: a targeted plan repeating selected phase components. |
| **Maintenance** | 1 visit/yr, in person | Six-pillar review, exam, updated prescriptions; more support when needed. |
| **Medical management** | Throughout | Physician manages conditions directly, or coordinates with the patient's existing physicians. Roles set during planning. |

---

## 2. How it fits the practice as currently decided

Three existing decisions bear directly on this program. They are the
first things to settle, because they shape everything else.

**2.1 D-014 says the opposite, in words.** "We are not building a
pre-designed care program patients are fitted into. The price is the
only standardized thing." A one-year, fixed-cadence program is a
pre-designed structure. This is reconcilable (§5, E1), but it needs an
explicit decision, not drift.

**2.2 The time budget.** The practice is built on ~5.6 hours of
physician time per patient per year at a 140-adult panel, with heavy
users (~14+ hr/yr) sustainable at about 1 in 8–10 of the panel
(unit economics §1, §3) **[F: repo model]**.

Year-one physician time for one program patient **[E]**:

| Item | As proposed | Lean version (§5) | Basis |
|---|---|---|---|
| Pre-enrollment (consult, record and assessment review, plan build, plan review) | 2.5–3.0 h | 1.0–1.5 h | 0.5 + 1.5–2.0 + 0.5–0.75 / lean defers plan build to first paid month |
| Phase I visit 1, in person, full exam | 1.0–1.5 h | 1.0 h | plus rented-space or home-visit travel (home visit ~2–2.5 h total, unit economics §1) |
| Phase I visits 2–6 | 2.5–3.75 h | 1.7–2.5 h | 5 × 30–45 min / lean: 20–30 min with education pre-delivered in writing |
| Phase II, 3 visits | 1.5–2.25 h | 1.0 h | 30–45 min / lean 20 min |
| Phase III visit (mo 9) | 0.5 h | 0.33 h | |
| Final assessment, in person | 1.0–1.5 h | 1.0 h | |
| Documentation, prescriptions, summaries to other clinicians | 2.0–3.0 h | 1.5 h | ~10–15 min per visit |
| Between-visit check-ins and messages | 1.5–3.0 h | 1.0 h | ~26 biweekly reviews |
| **Year-one total** | **~12–18 h** | **~8.5–10 h** | |

Reading: as proposed, every program patient is a "heavy" patient in
year one, about 2–3× the panel mean. Lean, about 1.5–1.8×.

**2.3 Cancel-anytime and front-loading (D-027).** The program spends
most of its hours in months 1–3, but billing is month to month. A
patient who completes Phase I and cancels has paid $300 for roughly
6–8 hours of work (as proposed), plus 2.5–3 unpaid pre-enrollment hours.
The "commitment" in the proposal is a behavioral one, not a financial
one; the materials must say so clearly.

**2.4 Where it does work: the lifecycle.** A graduate in maintenance
looks like a light patient (~3.5 h/yr prior, unit economics §3). The
program "pays back" its year-one excess when the patient stays a member
long enough **[E]**:

- Need: (Y1 + 3.5 × (n − 1)) / n ≤ 5.6 hours, where n = years of membership.
- Lean year one (~9 h): n ≥ ~2.6 years.
- As proposed (~15 h): n ≥ ~5.4 years.

At the researched 20% annual churn, mean tenure is ~5 years **[E: 1 ÷
0.20]**, but patients who keep an outside primary care physician and
only want the program are likely to churn faster once they graduate,
because one annual visit is thin value for $1,200 a year **[A: owner to
test]**. So the program is economically sound **only** if (a) year one is
lean, (b) concurrent enrollment is capped, and (c) graduates have a real
reason to stay members. See decisions U1–U3.

**2.5 Credential language.** The physician is not residency-trained or
board-certified; lifestyle medicine certification (IBLM) is expected
January 2027 and is "in progress" until earned (House Style §6.1)
**[F: repo]**. Referral-facing materials for health systems will meet
credentialing questions; the program description must stand on
structure, process, and coordination, not on titles.

---

## 3. Strengths

1. **The taper is right in shape.** Frequent early contact, then
   spacing, matches how behavioral programs with evidence are built.
   CDC's National DPP uses weekly-to-biweekly sessions for 6 months
   then monthly (≥16 sessions months 1–6, ≥6 months 7–12) **[F, VERIFY:
   CDC DPRP Standards]**. Planned spacing also builds self-efficacy.
2. **Plan before commitment.** Patients see the plan before enrolling.
   This matches D-016 (onboarding as the first act of care and the fit
   gate) and is respectful.
3. **Cumulative design.** Layering one change at a time is gentler
   than six changes at once.
4. **Graduation is not weight or labs alone.** Good clinical judgment
   and good ethics; it also avoids an outcome-promise trap (D-027, R-13).
5. **"Not yet" is not failure.** Targeted repetition instead of
   repeating the whole program.
6. **Medical care is integrated, and co-management is respected.**
   This is the program's real differentiator from coaching apps, and it
   matches the existing referral posture ("your care stays yours").
7. **Easy to explain.** One year, three phases, six pillars, one final
   check. People can hold that in their heads.

## 4. Weaknesses and concerns

### Clinical

1. **Six equal pillar visits fit few patients.** A non-smoker who
   drinks lightly does not need a full substances visit. A smoker
   should not wait until visit 5 for tobacco treatment, the highest
   yield change on the list. Untreated sleep apnea, heavy drinking, or
   significant depression should change the plan on day one, not in
   week 6.
2. **Six stacked prescriptions by week 12 is a lot.** Evidence on
   doing multiple behavior changes at once versus in sequence is mixed
   **[F, VERIFY: e.g., Spring et al., Make Better Choices, Arch Intern
   Med 2012]**. By visit 6, review of five earlier pillars can crowd out
   the new one. Load needs a ceiling.
3. **The exam comes after the plan.** In the proposal, the plan is
   built in Step 2, but the first exam is Phase I visit 1. Blood
   pressure, waist, joints, gait, and fitness for exercise all shape the
   plan. Pre-participation screening for exercise (ACSM 2015 algorithm)
   belongs in the assessment **[F, VERIFY]**.
4. **Intensity is below the bar for weight-focused goals.** The
   2013 AHA/ACC/TOS obesity guideline defines high-intensity lifestyle
   intervention as ≥14 sessions in 6 months, with ≥monthly contact for
   maintenance **[F, VERIFY]**. This program has 9 in 6 months. That is
   fine for a whole-person program, but the materials must not imply it
   is an intensive weight-loss program, and weight-primary patients may
   need extra support (more contact, a group, or medication).
5. **The months 6–12 gap is the relapse window.** Two visits three
   months apart, with nothing in between, is thin at exactly the time
   regain and drift are most common. Ongoing contact during maintenance
   reduces weight regain **[F, VERIFY: Wing et al., STOP Regain, NEJM
   2006]**.
6. **Medication safety when lifestyle works.** Real diet and activity
   change can cause hypoglycemia (insulin, sulfonylureas) and low blood
   pressure (antihypertensives). If another clinician prescribes, who
   lowers the dose on a Friday? This is the most important safety gap.
7. **No stated eligibility or exclusions.** Active eating disorder,
   active substance use disorder needing specialty care, pregnancy,
   advanced kidney disease (diet needs a renal dietitian), recent
   cardiac event (cardiac rehab first), and unstable psychiatric illness
   need a defined pathway.

### Behavioral

8. **"Remediation" and "criteria" can read as grading.** The
   respect principle needs language to match.
9. **No plan for disengagement or life events.** Missed visits,
   illness, a new baby, a job loss. A pause rule is kinder and simpler
   than an implicit failure.
10. **Graduation rules set at the end feel arbitrary.** They should be
    agreed at enrollment.

### Operational

11. **Time per patient** (§2.2): the core risk.
12. **Unpaid pre-enrollment depth** (§2.2–2.3): building a full plan
    for someone who may not join is the costliest free work in the
    practice.
13. **Two in-person exams a year per patient** require rented space or
    home visits (2–2.5 h each with travel). These need batching.
14. **Biweekly scheduling for many patients at once** fills the ~11
    visit-hours a week (unit economics §1) quickly.
15. **Maintenance value for patients with an outside physician** is
    one visit a year (§2.4).

---

## 5. Recommended changes

### Essential

**E1. Make the program a pathway inside the membership, with a cap.**
Frame: *the membership is the relationship; the program is one
structured pathway inside it,* offered when it fits. The price stays
the only standardized thing (D-014 and D-029 hold); the program
standardizes a *default path*, which the physician adapts. Cap
concurrent program patients (starting point **[A]**: ~10–15 active in
year one at a full 140 panel, from §2.2 and the 1-in-8–10 heavy
rule; owner to set) and enroll on a schedule (for example, 2–3 starts
a month). A separate program price is the alternative; see U1.

**E2. Move the exam and the heavy assessment into the first paid
month.** Proposed front end:

| Step | When | What | Time **[E]** |
|---|---|---|---|
| 1. Free conversation | Before enrollment | Goals, fit, care arrangement (§5 E5), what the program asks of them. Leaves with a one-paragraph *plan outline*, not a full plan. | 30 min |
| 2. Enroll | Patient decides | Monthly, cancel anytime. | |
| 3. Assessment visit | Month 1, in person | History, exam, exercise screening, baseline measures already collected by questionnaire. | 60 min |
| 4. Plan visit | Month 1, virtual | Review the written plan, agree goals and graduation terms, pick the first focus. | 30–45 min |
| 5. Phase I | Weeks 3–14 | Five focus visits, every 2 weeks. | |

This keeps "understand before committing" (step 1 plus cancel anytime
means low risk), puts the exam before the plan, and cuts unpaid time by
roughly 1.5 hours per inquiry. Owner choice; see U3. The visit count is
unchanged in spirit: assessment + plan + 5 focus visits in Phase I.

**E3. "One focus per visit, whole plan every visit."**

- Screen all six pillars at baseline. Rate each: *active* (needs a
  prescription now), *light* (brief advice, check later), or *strong*
  (already healthy; reinforce).
- Most patients get **2–4 active pillars** in Phase I. Visits for
  light or strong pillars are short or combined.
- **Safety-first overrides**, addressed at the first visit whatever the
  order: tobacco use, unhealthy alcohol use (AUDIT-C positive),
  suspected sleep apnea, depression with risk, uncontrolled blood
  pressure or glucose, and any medication made riskier by the plan.
- **Ceiling:** no more than ~6 active behaviors at once (about 1–2 per
  active pillar) **[A: owner, clinical judgment]**.
- Every visit opens with a 5-minute review of the whole one-page plan.

**Default order** (kept simple, used unless a rule overrides):
nutrition, physical activity, sleep, stress, substances, connection.
Override rules, in order: (1) safety first; (2) a barrier pillar goes
early (poor sleep or high stress usually undermines everything else);
(3) otherwise, start where the patient's importance and confidence are
highest, for an early win. This gives one sentence for patients ("we
start where it matters most for you") and a standard path for referral
partners.

**E4. Fill the Phase III gap and fix the count.** Phase III = a month-9
visit + the month-12 final assessment (so 2 quarterly contacts, not 2
plus a separate final). Add a **monthly 5-question check-in** in the
portal in months 7–12, with drift triggers (for example, two "yellow"
pillars, or a measure out of range) that prompt a short visit.

Program totals: 1 free conversation; then assessment + plan + 5 focus
visits + 3 monthly + 1 month-9 + 1 final = **12 paid-year visits**,
2 of them in person.

**E5. Name the care arrangement in writing at the plan visit.** Three
arrangements:

| | A. Primary care here | B. Shared care | C. Lifestyle care only |
|---|---|---|---|
| Who is the primary care physician | This practice | Outside PCP | Outside PCP |
| Prescribing for program conditions (BP, lipids, glucose, weight) | This practice | Split by condition, in writing | Outside clinicians |
| Ordering and following labs | This practice | Whoever orders owns the result | Outside; this practice may order program-specific measures and owns those |
| Medication changes as lifestyle works | This practice | Per condition table | Physician sends recommendations; patient told who to call |
| Urgent findings at a visit (e.g., BP 180/110) | This practice | This practice acts, then notifies | This practice acts within standard of care, then notifies |

Rules for every arrangement: one *care responsibility table* per patient
in the EHR care plan (condition, who prescribes, who adjusts, who
orders, who follows up, who to call); a **medication safety plan** for
anyone on insulin, sulfonylureas, or blood pressure drugs (home
monitoring, numbers that mean "call," and which clinician to call);
summaries to outside clinicians at baseline, 3, 6, and 12 months, and
same-day for urgent findings (with permission). Recommend offering A and
C at launch, B only with a per-condition table. Scope and liability of
C: `NEEDS-COUNSEL` `NEEDS-BROKER` (malpractice fit for consultative
care, R-11).

**E6. Graduation: a fair floor plus the patient's own goals, agreed at
the plan visit.** Proposed name: "ready for maintenance." Four parts:

| Domain | Required? | Measure | Starting threshold **[A: owner to set]** |
|---|---|---|---|
| 1. Habits | Yes | Core behavior in each active pillar, from the tracker | Done in most weeks (e.g., ≥ 9 of the last 12) |
| 2. Self-management | Yes | Patient can state their plan and their "if I slip" plan; confidence ruler | Confidence ≥ 7/10 per active pillar |
| 3. Medical safety | Yes | Each condition is at goal **or** on an agreed current plan with a named clinician; no open red flags | Yes/no |
| 4. Personal goals | Counts, not a gate | Goal Attainment Scaling on 2–3 patient goals **[F, VERIFY: Kiresuk and Sherman 1968]** | Progress shown; reported to the patient either way |

Labs and weight appear in domain 3 only as "managed," never as targets
to graduate. A patient with a hard year who keeps habits and has a plan
can graduate. A patient with great labs but no habits does not yet.

If not ready: an **extended support plan** (not "remediation"): one
named focus, a short block (for example, 2–3 visits over 6–8 weeks)
drawn from the relevant phase, then recheck.

**E7. Define who the program is for, and the alternates.** Good fit:
adults with or at risk for hypertension, high cholesterol, prediabetes
or type 2 diabetes, overweight or obesity, GERD, sleep problems, mild to
moderate stress, anxiety, or depression, who want to change habits.
Needs another path first or alongside: active eating disorder; substance
use disorder needing specialty treatment; pregnancy; advanced CKD
(renal dietitian); recent cardiac event (cardiac rehab); unstable
psychiatric illness. Insurance-covered complements to refer to readily:
registered dietitian (medical nutrition therapy), CBT-I, physical
therapy, counseling, CDC-recognized diabetes prevention programs.

**E8. Pause, don't fail.** A written pause rule: life events may pause
the program for up to a set time (**[A]** 8–12 weeks) without losing
progress; two missed visits trigger a check-in message, not a
discharge.

**E9. Language and claims discipline for both audiences.** No outcome
promises; say what the program *does* (structure, time, measures,
coordination) until the practice has its own results (R-13, D-027).
Say plainly that lifestyle change works alongside medicine and does not
replace needed medication. Credential language exact (§2.5). Graduation
is "ready for maintenance"; the not-yet path is "extended support."

### Optional

- **O1. Group pillar classes.** One recorded or live session per
  pillar for many patients at once; individual visits then focus on the
  prescription. The biggest single scale lever. Needs a group-privacy
  consent; virtual first, rented space later.
- **O2. A prescription library.** One template and handout per pillar,
  written once (House Style), reused for every patient. Cuts visit and
  documentation time.
- **O3. Household session.** One optional visit with a partner or
  family member (nutrition at home, support, connection pillar).
- **O4. Cohort start dates.** Start new patients on set dates (for
  example, the first and third week of the month) to batch scheduling
  and in-person exam days.
- **O5. Baseline and 12-month reports.** A one-page patient report
  (portal value view, D-023) and a matching clinician summary. These
  become the program's outcome record for referral partners.
- **O6. Wearables.** Skip at launch (vendor sprawl, R-12). Accept a
  patient's own step count if they already track it.

---

## 6. Lifestyle prescription standard

One page per active pillar, same seven fields every time:

1. **Why** (the patient's reason, in their words)
2. **The prescription** (what, how much, how often, when)
3. **Start → next step** (a graded path; start smaller than feels needed)
4. **One number we track**
5. **If-then plan** for the most likely barrier
6. **Support** (handout, class, referral, person)
7. **Review date**

Examples (starting doses, individualized in practice):

| Pillar | Prescription example | One number |
|---|---|---|
| Nutrition | Half the plate vegetables or fruit at lunch and dinner, 5 days a week; water instead of sugary drinks. Condition variants: DASH pattern for blood pressure; carbohydrate quality and timing for diabetes. | Days per week |
| Activity | Brisk walk 20 min, 5 days a week, building toward 150 min a week; strength work 2 days a week (5 moves, 2 sets of 8–12). Targets per 2018 Physical Activity Guidelines **[F, VERIFY]**. | Minutes per week; strength days |
| Sleep | Same wake time every day within 30 min; 30-min wind-down; out of bed if awake > ~20 min. CBT-I elements; CBT-I is first-line for chronic insomnia **[F, VERIFY: ACP 2016]**. | Days on wake time |
| Stress | 10 minutes a day of a practice the patient chooses (breathing, walking, prayer, journaling). | Days per week |
| Substances | Tobacco: quit date plus medication (medical management, starts at once). Alcohol: agreed weekly limit and alcohol-free days. | Cigarettes or drinks per week |
| Connection | One planned contact with someone who matters, each week; name a support person for the plan. | Contacts per week |

Open choice: nutrition stance. ACLM teaches a whole-food,
plant-predominant pattern **[F, VERIFY]**; a pattern-flexible approach
(Mediterranean, DASH, or plant-predominant, fit to the patient) is easier
for referral partners and patients to accept. See U8.

---

## 7. Measures

Rule: short, free to use, repeatable by video, and each one tied to a
decision. Licensing to confirm for each instrument `VERIFY`.

**When:** baseline · 3 months · 6 months · 12 months · yearly in
maintenance. Plus a 1-minute check-in every 2 weeks (Phase I–II) and
monthly (Phase III).

| Domain | Everyone | When indicated |
|---|---|---|
| Clinical | Home BP with a validated cuff, 7-day average; weight; waist; resting heart rate; medication list | A1c; lipids; other labs per condition, on the patient's insurance or cash price (outside the membership, Practice Terms §1) |
| Function | 30-second chair stand (works by video) | Grip strength, 6-minute walk (in person) |
| Overall health | PROMIS Global Health-10 | |
| Mood | PHQ-2 → PHQ-9; GAD-2 → GAD-7 | |
| Sleep | PROMIS Sleep Disturbance short form | STOP-BANG, Epworth (sleep apnea); ISI if licensed |
| Stress | Perceived Stress Scale (PSS-4 or PSS-10) | |
| Nutrition | MEDAS 14-item diet screener (or a similar short screener) | |
| Activity | Exercise Vital Sign (minutes/week) + strength days | |
| Substances | Tobacco status; AUDIT-C | |
| Connection | UCLA 3-item loneliness | |
| Behavior | Tracker: weeks the core behavior was done, per active pillar | |
| Self-management | Importance and confidence rulers (0–10) | |
| Goals | Goal Attainment Scaling, 2–3 goals | GERD-Q for reflux |

Burden **[E]**: ~15–20 minutes of questionnaires at baseline, ~10 at
follow-up, completed in the portal before the visit.

Program-level measures (for the practice and, later, referral partners):
enrollment, completion, and graduation rates; share with improvement on
each core measure; medication changes (started, stopped, reduced);
physician hours per program patient (Q-20). Report counts and changes
only once real data exists (R-13).

---

## 8. Between visits

Keep to three things, all in the EHR portal (D-021, minimal vendors):

1. **The one-page plan** (all active prescriptions).
2. **The check-in**: 3–5 questions, one per active pillar plus "anything
   you need from me?" Green / yellow / red for each pillar.
3. **The pillar handouts** (O2), and class recordings if O1 is adopted.

Messaging follows D-017 (business hours, ~24–72 hours). The physician
reviews check-ins in a weekly block, not as they arrive. No daily
coaching by the physician; if patients want daily support, point to a
support person (connection pillar) or a free tool.

---

## 9. Maintenance

An annual visit alone is likely too thin for many graduates (§4.5).
Recommend three levels, all inside the membership, chosen by need and
preference at graduation:

| Level | Contact | For |
|---|---|---|
| **Standard** | Yearly in-person visit + a 6-month virtual check + quarterly check-in questions | Most graduates |
| **Closer** | Visits every 6 months | Higher-risk conditions, or by preference |
| **Booster** | 2–3 visits over 6–8 weeks, then back | Triggered by drift on check-ins, a life event, or patient request |

For arrangement A patients, maintenance sits inside ongoing primary
care, which is the strongest reason to stay a member (§2.4). For
arrangement C patients, maintenance value is the open question (U2).

---

## 10. Operations at a solo scale

Feasible **if** the lean design (§2.2), the cap (E1), and batching hold.

At launch (small panel): time is plentiful; this is the window to build
the prescription library, handouts, check-in forms, and templates once,
and to measure real hours per program patient (Q-20).

As the panel grows toward 140:

1. Cap concurrent enrollment and run set start dates (O4).
2. Move education to group classes (O1); keep individual visits short.
3. Batch in-person assessment and final exams onto set rented-space days.
4. Use templates for prescriptions and outside-clinician summaries.
5. Use allied referrals (dietitian, CBT-I, PT, counseling) for depth.
6. If demand stays above the cap: lower the panel target, price the
   program separately, or fund it through employers (U1). A health
   coach is a staffing change (D-001 revisit trigger).

---

## 11. Unresolved decisions (in order)

| # | Decision | Options | Recommendation | Owner |
|---|---|---|---|---|
| U1 | How the program relates to the $100 membership | (a) pathway inside the membership, capped; (b) separate program price; (c) employer or partner-funded | (a) at launch; revisit with measured hours | YOU; (b)/(c) `NEEDS-COUNSEL` (Texas DPC statute fit) |
| U2 | Patients who keep an outside PCP (arrangement C): same membership, same price, what maintenance means | | Same price; maintenance at Standard level; watch churn | YOU |
| U3 | How much happens before enrollment | Full plan before commitment (as proposed) vs plan outline, with assessment in month 1 (E2) | E2 | YOU |
| U4 | Concurrent cap and start dates | | ~10–15 active at full panel; set start dates | YOU, after Q-20 data |
| U5 | Care arrangements offered at launch | A, B, C | A and C; B with a condition table | YOU; `NEEDS-COUNSEL` `NEEDS-BROKER` |
| U6 | Graduation framework and thresholds | Individualized, standardized, or both | Both (E6) | YOU |
| U7 | Pillar sequencing | Fixed vs individualized | Default order + 3 override rules (E3) | YOU |
| U8 | Nutrition stance | ACLM plant-predominant vs pattern-flexible | Pattern-flexible, plant-forward | YOU |
| U9 | Group classes | Yes / later / no | Yes, virtual, once there are ~6 concurrent patients | YOU |
| U10 | Eligibility and exclusions | | E7 list | YOU |
| U11 | Program name, phase names, and timing of referral outreach relative to the January 2027 certification | | Settle names with the patient description; referral outreach after certification is earned | YOU |
| U12 | Any program-length commitment vs cancel-anytime | | Keep cancel-anytime (D-027); commitment is behavioral | `NEEDS-COUNSEL` if changed |

Once U1–U7 are settled, log the program as a decision (it amends the
D-014 wording), then write the patient and referral descriptions
against House Style.

# Lifestyle Medicine Program: Solo Capacity, First Pass

Internal planning note. Not for patients or partners. Status **[O]**,
tracked under Q-24. Created 2026-11-09.

Tags: **[F]** fact with source · **[E]** estimate with derivation ·
**[A]** assumption, owner named. Every per-patient hour below is an
estimate to be replaced by measured time from the first patients (Q-20).

The owner's working hypothesis is **~100 active patients**. This note
tests it; it does not set a capacity.

---

## 1. Hours available

| | Hours/yr | Basis |
|---|---|---|
| Working time | 1,170 | 30 hr/wk × 39 wk (D-018) **[F: repo]** |
| Practice admin (billing, systems, outreach, CME) | −234 | ~6 hr/wk (unit economics §1) **[E]** |
| **Patient-related time** | **~936** | |

## 2. Physician time per patient

Program as shown in the deck (13-slide version, 2026-11-09).

| Item | Lifestyle-only role | With direct medical management | Basis **[E]** |
|---|---|---|---|
| Pre-enrollment: consult, record review, plan build, plan review | 2.5 | 2.75 | 0.5 + 1.5–1.75 + 0.5 |
| Phase I: in-person first visit + 5 visits | 4.75–5.25 | 4.75–5.25 | 1.0 + 0.5 travel/setup (batched) + 5 × 0.65–0.75 |
| Phase II: 3 visits | 1.5 | 1.5 | 30 min each |
| Phase III: 2 visits | 1.0 | 1.0 | 30 min each |
| Final assessment, in person | 1.25 | 1.25 | incl. setup |
| Documentation, summaries to other clinicians | 2.0–2.5 | 2.0–2.5 | ~10–12 min per visit |
| Medicines, labs, results, messages | 1.0 | 2.5–3.5 | role-dependent |
| **Year one, enrolled patient** | **~14–15** | **~15.5–17.5** | |
| Inquiry who does not enroll | ~2.5 | ~2.5 | pre-enrollment only, unpaid |
| **Maintenance year** | **~2.5** | **~3.5–4** | annual visit 1.0 + travel 0.25 + reassessment 0.5 + notes 0.25 + messages/meds 0.5–2.0 |
| Continuation (not yet ready to graduate) | +2–4 | +2–4 | a short block of 2–4 extra visits |

**[A: owner to set]** Mix of roles. Below uses ~15.5 h as a blended
year one, 3 h as a blended maintenance year, one non-enrolling inquiry
per enrollee (conversion UNSET), and 1 in 5 year-one patients needing
continuation (+3 h).

## 3. What "100 active" can mean

Annual hours ≈ starts × (15.5 + 2.5 + 0.6) + maintenance patients × 3.

| Scenario | Year-one starts | In maintenance | Hours **[E]** | vs ~936 |
|---|---|---|---|---|
| A. All 100 in year one | 100 | 0 | ~1,860 | **~200%. Not feasible.** |
| B. Half and half | 50 | 50 | ~1,080 | ~115%. Over. |
| C. 40 / 60 | 40 | 60 | ~925 | ~99%. Full, no slack. |
| D. 30 / 70 | 30 | 70 | ~770 | ~82%. Workable. |
| Year-one only, no maintenance | ~50 | 0 | ~930 | the ceiling on new starts per year |

Reading:

- **~100 active is plausible only as a steady state where most are in
  maintenance**, with about 30–40 people starting each year. It is not
  plausible as 100 people in their first year.
- **The binding number is new starts per year (~30–40), not active
  patients.** Year one costs ~5× a maintenance year.
- **The first year of the practice is the hardest.** Everyone is new,
  so the practice can take ~50 starts at most, and only if nothing else
  claims time.
- **Unpaid pre-enrollment time is large.** At one non-enrollee per
  enrollee, it is ~15% of the total. Shortening it (a plan outline
  before enrollment, the full plan after) is the cheapest capacity gain.
- **Direct medical management adds ~2 h per patient per year.** If most
  patients choose it, capacity falls ~10–15%.

## 4. Levers, largest first

1. Group education sessions for the pillar content (Phase I).
2. Lighter pre-enrollment work (above).
3. 30-minute Phase I visits backed by reusable written materials.
4. Batching in-person exams on fixed days in rented space.
5. Templates for plans and clinician summaries.
6. A capped intake: set start dates and a yearly start limit.

## 5. Strategic note for the owner

The revised deck defines the program as its own priced product with a
defined scope ("not unlimited primary care, urgent care, or complex
care outside the plan"), separate program and maintenance prices, and
sliding-scale pricing. That is a different model from the current
decided practice: **$100/month flat, broad-scope primary care, no tiers
(D-029, D-014)**. Before pricing is set, decide whether:

- the program **replaces** the $100/month membership as the practice
  model,
- the two **run side by side** (two products, two panels to balance), or
- the program sits **inside** the membership (the v1 review's
  recommendation).

The capacity math above and any revenue math depend on that choice.
Revenue is not modeled here because prices are UNSET. Sliding-scale
pricing is a form of D-003 (affordability mechanism) and needs counsel
on Texas DPC statute fit `NEEDS-COUNSEL`.

## 6. Next steps

- Owner: pick the model in §5; set the role mix and conversion
  assumptions.
- Then: extend `tools/practice_model.py` with a program cohort model
  (starts, maintenance retention, hours, revenue by price) so these
  numbers reproduce from code.

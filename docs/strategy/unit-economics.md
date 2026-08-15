# Unit Economics and Capacity

The question this document answers: **can one physician deliver this care model
to enough patients, at $5,000 each, to make a sustainable practice — and what
determines the answer?**

> **Read this first.** Every number below marked *illustrative* is a placeholder
> chosen to demonstrate the structure of the model. None is a benchmark, a
> market figure, or a recommendation. I do not have credible data on concierge
> panel sizes, conversion rates, or cost lines for your market, and I am not
> going to invent it. The value here is the *shape* of the model and which
> inputs actually matter. Replace the placeholders with your own figures using
> `tools/practice_model.py`.

---

## 1. The core insight

In a solo practice, **physician time is the only real constraint**. Revenue is
panel size × price. Panel size is not a business choice — it is a division
problem:

```
                    annual clinical capacity − fixed admin time
  panel size  =  ─────────────────────────────────────────────────
                 hours per patient per year  +  acquisition time per patient
```

Price does not appear. Price determines what a given panel is *worth*; it has
no effect on how large the panel can be. So the two levers that matter are the
numerator (how much time you have) and the first term of the denominator (how
much time each patient consumes).

Everything else in this project — brand, systems, protocols, automation — earns
its place by moving one of those two terms, or by improving care without
worsening either.

## 2. Where the time goes

Per patient, per year, built from the decisions already made:

| Component | Driven by | Illustrative |
| --- | --- | --- |
| Annual comprehensive in-person visit (contact + prep + documentation) | D-006 | 2.5 hr |
| Three additional routine contacts to meet the quarterly floor | D-005 | 3.0 hr |
| Asynchronous care — messaging, results, refills, referrals, coordination | Q-07 access promise | **4.0 hr** |
| Acute episodes | Patient mix | 1.0 hr |
| **Total** | | **10.5 hr** |

**The asynchronous line is the dominant uncertainty in this entire project.**
It is the one number nobody can hand you, because it is set by two things you
have not yet decided: how you word the access promise (Q-07), and who you
enroll. It is also the line most likely to be underestimated, because it has no
appointment attached to it and therefore never appears on a schedule.

## 3. What that uncertainty is worth

Holding everything else at the illustrative values — 46 working weeks, 30
clinical hours/week, 250 hr/yr fixed admin, 10% attrition, 30% consultation
conversion, 1.5 hr per prospect:

| Hours per patient / yr | Panel size | Gross at $5,000 |
| --- | --- | --- |
| 8.0 | ~133 | ~$665,000 |
| 10.5 | ~103 | ~$515,000 |
| 13.0 | ~84 | ~$420,000 |
| 16.0 | ~68 | ~$340,000 |

A four-hour-per-patient swing in a category with no calendar entries moves
gross revenue by roughly a factor of two. This is the single most important
number in the practice, and it is currently unmeasured and unbounded.

**Recommendation:** instrument it from patient one. Track asynchronous time per
patient per month from the first enrollment. It should be a required output of
whatever system is selected in Phase 3, which is another reason measurement
design (Q-09) has to precede systems selection.

## 4. Two findings worth acting on

### Finding 1 — The model is internally coherent, which is not guaranteed

A panel in the ~85–135 range at $5,000 produces a gross figure that can plausibly
support a solo practice, *and* it is small enough that "at least quarterly
contact, substantially more when appropriate" is actually deliverable. Many
concierge models fail one of these two tests — they either need a panel too
large to serve intensively, or they serve intensively at a panel too small to
sustain. Yours passes both under the illustrative assumptions.

That is a real result and it means the $5,000 price and the quarterly-contact
promise are compatible rather than in tension. It does **not** yet mean the
practice is profitable — that depends on cost lines I do not have (§6).

### Finding 2 — The free two-part consultation is cheap at steady state and
### expensive during ramp, but ramp is exactly when you have spare capacity

At steady state, replacing 10% annual attrition at 30% conversion costs about
**0.5 hours per patient per year** — under 5% of the per-patient time budget.
D-008 is affordable and does not need defending on time grounds.

During ramp the picture inverts. Adding 30 patients in year one at 30%
conversion means about 100 consultations, roughly 150 hours of unpaid physician
time. But year one also has only 30 patients to serve — about 315 hours against
1,130 available. **Total year-one load is well under half of capacity.**

The conclusion: in the ramp years the binding constraint is not your time, it
is lead flow. At steady state it flips to time. These are opposite problems and
they call for opposite responses, so the plan should not treat "growth" as one
undifferentiated phase.

Sensitivity worth noting: if conversion is 10% rather than 30%, the same 30
patients require ~300 consultations and ~450 hours. Still fits inside year-one
capacity, but it becomes the dominant activity of the year. **Conversion rate
matters enormously during ramp and barely at all at steady state.** Measuring it
early — even on a handful of prospects — is high-value.

## 5. The ramp is the actual risk

Revenue is roughly linear in patient count. Fixed costs are not. A practice that
is comfortable at 103 patients may be a cash crisis at 25, and the path from 25
to 103 is measured in years, not months.

This is why Q-03 (financial floor and runway) is gating. Without those two
numbers, any ramp plan is decoration. With them, the model produces a required
growth rate, which in turn sets the marketing budget, the sequencing, and
whether a small pilot cohort is a sensible first step or an unaffordable delay.

## 6. Costs — deliberately unset

Break-even is:

```
  break-even panel  =  annual fixed costs / effective revenue per patient
```

Where effective revenue per patient is $5,000 reduced by the reduced-fee
discount across the panel (D-003) and by payment processing.

**I have not populated the cost side.** Malpractice premium, licensure, EHR and
platform subscriptions, in-person space, equipment, legal and accounting,
insurance, marketing, and your own benefits are all real numbers with real
ranges, and quoting figures I cannot source would make this document worse than
useless — it would make a spreadsheet that looks authoritative and isn't.

`tools/practice_model.py` runs with every cost line at zero and prints a
prominent warning naming each unset line. Fill them from actual quotes as you
gather them; the model will start producing real break-even and profitability
numbers as it goes. Getting the malpractice quote (Q-08) and EHR pricing early
turns this from a capacity model into a business model.

## 7. What would change my analysis

Stated plainly, so this can be checked rather than trusted:

- **If asynchronous care runs much higher than illustrated** — plausible if the
  access promise is generous and the panel skews complex — the panel ceiling
  drops toward 70, and $5,000 may not clear costs. The response is either a
  higher price, a tighter access promise, or a more selective panel. Best
  identified in the first 20 patients, not the first 80.
- **If conversion is well below 30%**, ramp becomes consultation-dominated and
  the marketing plan has to carry far more volume. This is measurable early and
  cheaply.
- **If in-person blocks require owned space**, fixed costs step up sharply and
  break-even moves materially. Sessional or itinerant models keep costs
  variable during exactly the years when that matters most (Q-04).
- **If Medicare posture (Q-02) restricts who can enroll**, the addressable
  market shrinks and the ramp lengthens — a market constraint, not a clinical
  one, but it hits the same cash-flow line.

---

## Using the model

```
python3 tools/practice_model.py                 # steady-state + sensitivity
python3 tools/practice_model.py --ramp          # year-by-year ramp
python3 tools/practice_model.py --help          # all inputs
```

All inputs are named flags. Change one thing at a time and watch what moves —
the point of the tool is to show you which inputs deserve real research and
which do not.

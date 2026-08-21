# Measurement — The Funnel as Instrument

*2026-08-21. Enough instrumentation to answer the questions that steer
effort — no more. The toolset is deliberately small (R-12, README §5
rule 6): one spreadsheet ledger, the scheduler's records, Search
Console, GBP insights, privacy-light site analytics, the newsletter
tool's own counts. No CRM, no attribution platform, no pixels.*

---

## 1. The questions this instrumentation must answer

Where do patients come from? · Which channels produce consultations,
and which produce *enrolled, retained* patients? · What does a patient
cost to acquire (cash **and** physician hours)? · Which referral
relationships work? · Which queries and essays bring qualified traffic?
· How many letter subscribers become patients? · What share of consults
convert (and among mutual-fit consults)? · How long do patients stay,
by channel? · How many patients refer? · **Therefore: where should the
next hour and dollar go?**

## 2. The funnel cascade — stages and definitions

```
IMPRESSIONS / DISCOVERY   (per-channel proxies: GSC impressions, GBP views,
        │                  talk attendees, packets placed — not summable, don't try)
        ▼
SITE VISITORS             (Plausible sessions)
        ▼
ENGAGED VISITORS          (sessions reaching /book, /pricing, or an essay ≥2 min —
        │                  the "qualified traffic" definition)
        ▼
LETTER SUBSCRIBERS        (MOF pool; some skip this stage entirely)
        ▼
CONSULTS BOOKED  ──────►  CONSULTS COMPLETED   (no-show gap measured)
        ▼
        FIT DECISION      (mutual fit? — D-016 verdict recorded per consult:
        │                  fit / not-yet / not-me / referred-onward)
        ▼
PATIENTS ENROLLED         (agreement + card + first visit booked)
        ▼
PATIENTS RETAINED         (still enrolled at 3/12 mo; churn + stated reason)
        ▼
PATIENT REFERRALS         (new prospects whose asked-source = existing patient)
```

Referred and employer prospects legitimately skip stages (README §2);
the cascade is a map, not a gauntlet. **Stage-skipping is itself data:**
the ledger records entry stage per prospect.

## 3. The instruments

### 3.1 The prospect ledger (the system of record — one spreadsheet)

One row per prospect from first identifiable contact. Columns:

| Column | Notes |
|---|---|
| Date first seen | |
| Name / contact | prospects only — **the ledger holds no clinical information, ever**; once enrolled, clinical life lives in the EHR and the row just carries status |
| Source (asked) | the answer to "how did you find me?" — verbatim, then coded to the channel list |
| Source detail | which essay / which professional / which talk / which patient (name only with the referrer's own disclosure) |
| Entry stage | letter / booked / referred-direct / employer |
| Consult booked → completed dates | no-show tracking |
| Fit verdict | fit / not-yet / not-me / referred-onward |
| Enrolled date | |
| Next action + date | the follow-up engine: 24h recap · 1-wk check · 3-mo not-yet — the weekly sweep works off this column |
| Status | active / enrolled / resting / closed |
| Departed date + stated reason | churn, by channel |

Second tab — **source list** (Engine B): per professional source:
category, contact, packets left, visits/touches (dated), referrals →
consults → enrollments, hours spent, last-touch date, next-touch date.

Third tab — **channel scorecard** (§5), monthly rollup.

*Privacy posture: prospect contact info is confidential business
data — kept in one place, not synced into marketing tools; letter
signup lives only in the newsletter tool; the two lists serve different
purposes and are never merged (`compliance.md` §5).*

### 3.2 Per-channel proxies (glanced monthly, not tallied daily)

- **Search:** Search Console — queries, positions, clicks; the Tier 2/3
  target-query watchlist. **Site:** Plausible — sessions, sources,
  /book funnels. **GBP:** views, calls, website clicks, review count.
- **Letter:** subscriber count, growth, unsubscribes. (Open rates are
  unreliable and optimizing them is off-posture — track size and
  replies instead.)
- **Physician hours by channel:** logged coarsely — half-hour
  granularity, weekly, from the calendar. Precision is not the point;
  honesty about where time goes is.

## 4. Economics — value, cost, and guardrails

**What an enrolled patient is worth (derivation, unit-economics
inputs):** $1,200/yr revenue. Researched churn 20% (individuals up to
30–40%, R-03) → expected tenure ≈ 1/churn ≈ 2.5–5 yr → **planning
lifetime value ≈ $3,000–6,000 revenue per enrolled patient.**
*(Derivation from researched churn bands, not a measured actual;
replace with ledger tenure by channel as it accrues.)*

**Physician time is priced, not free:** planning rate **~$100/hr**
*(illustrative: ~mature-practice revenue ÷ working hours,
$14k/mo ÷ ~120 hr/mo ≈ $115; rounded down)*. Four hours visiting
offices = ~$400 of acquisition spend. Log it as such.

**Fully-loaded CAC per channel** = (cash + hours × $100) ÷ enrollments.

**Guardrails** *(planning positions, revisit with actuals)*:

| Phase | Acceptable fully-loaded CAC | Rationale |
|---|---|---|
| Ramp (first ~50) | up to ~$1,000/patient | ~1 yr of revenue; buys learning + relationship capital that amortizes across future patients; still << planning LTV |
| Mature / replacement (~28/yr) | ~$300/patient (≈3 mo revenue) | steady-state replacement must not consume the practice's margin or its hours; at 28/yr this caps acquisition at ~$8.4k + the hours inside it |

**Cash ceiling:** total pre-launch marketing cash sits inside the $20k
prep ceiling (D-020) — planning envelope ≤ ~$2–3k (packets, printing,
domain, newsletter tool, the ads test) *(planning allocation, not a
decision — flag for the budget review)*.

## 5. The channel scorecard (monthly, ~30 minutes)

One row per active channel per month:

```
channel | MD hours | cash | leads | consults | enrolls | CAC-to-date |
early-utilization flag | notes
```

- **Early-utilization flag (the R-26 tie-in):** for each channel's
  enrollees, a coarse first-90-days read (light / expected / heavy)
  from the Q-20 utilization instrument. This is how channel weighting
  becomes panel-mix management (README §4) — e.g., "therapist referrals
  are converting beautifully *and* running heavy; balance with
  employer/prevention channels before accepting the next several."
- **Net adds vs. ramp plan** (R-03's early-warning line) sits at the
  bottom of the scorecard: adds, departures, net, plan, cumulative.

## 6. Review cadence and decision rules

- **Weekly (~15 min):** ledger sweep — every prospect has a next
  action with a date; stalled rows get one.
- **Monthly (~30 min):** scorecard update; GBP/GSC/Plausible glance;
  net-adds vs. plan.
- **Quarterly (~1–2 h):** channel re-weighting using the decision
  rules below; source-list pruning (Engine B touches); content
  calendar for the next quarter.
- **Annually:** full audit — CAC by channel with real tenure data,
  retention by channel, kill/scale calls, refresh of every prior in
  these docs.

**Decision rules (pre-committed to resist narrative drift):**

1. A channel gets a fair test before judgment: organic/relationship
   channels ≥ 2 quarters; paid tests get their defined budget and
   window, then a kill/keep call — no zombie spend.
2. Scale what produces *enrolled patients who stay*, not what produces
   activity (consults from a channel that never converts are a cost,
   and conversions that churn at 6 months are a warning, not a win).
3. If a channel's enrollees run persistently heavy, the response is
   weighting and gate discipline (R-26), never quiet message changes
   that promise less care.
4. Anything requiring a new tool must displace a measured pain, not a
   hypothetical one (R-12).
5. When the ledger and a strong intuition disagree, run one more
   deliberate test of the intuition — then believe the ledger.

## 7. What is deliberately not measured

Ad-platform conversion pixels, cross-site attribution, open-rate
optimization, per-visitor identity resolution, heatmaps, and multi-touch
attribution models. At 140 patients, asked-attribution plus the ledger
answers every question in §1; surveillance-grade analytics would cost
trust (the practice's core asset), create HIPAA-adjacent tracking risk
(`compliance.md` §5), and produce precision the decisions don't need.

#!/usr/bin/env python3
"""Home-based primary care, insurance-billed: capacity, cashflow, break-even.

ALTERNATIVE MODEL (2026-10-24). This is NOT the D-029 flat-fee DPC
practice. It models a solo physician doing scheduled home/residence
E/M visits billed to Medicare/commercial/Medicaid. Kept separate so
the two models can be compared, not merged.

Provenance labels:
  VERIFIED  primary source
  EST       derived estimate (owner may correct)
  UNSET     no value yet; must be supplied before relying on output
  REFRESH   perishable; re-check at runway

Run: python3 tools/home_visit_model.py
"""

# ---------------------------------------------------------------
# 1. RATES
# ---------------------------------------------------------------
# RVUs: PALTmed table of the CY2026 PFS (total non-facility RVUs).
#   REFRESH - that table is from the PROPOSED rule.
# CF: $33.40 non-QP, CY2026 final rule (earlier verified research).
# Cross-check: 5.78 x 33.40 = $193.05 vs PayerPrice's $193.06 for
#   99350. The two independent sources agree, so the method holds.
CF = 33.40                                   # VERIFIED (non-QP, CY2026)
RVU = {                                      # REFRESH (proposed-rule RVUs)
    "99341": 1.47, "99342": 2.35, "99344": 4.42, "99345": 6.29,   # new
    "99347": 1.38, "99348": 2.35, "99349": 3.96, "99350": 5.78,   # established
}
MEDICARE = {c: round(r * CF, 2) for c, r in RVU.items()}
G2211 = 16.57          # VERIFIED; billable with 99341-99350 from CY2026

# Payer rates as a multiple of Medicare. Source: PayerPrice national
# averages for 99350 (BCBS 219.44, UHC 204.56, Aetna 187.83,
# Cigna 265.69, Medicaid median 157.275) / Medicare 193.06.
# EST - third-party national averages, NOT his contracted rates.
PAYER_INDEX = {"medicare": 1.000, "commercial": 1.137, "medicaid": 0.815}
PAYER_MIX   = {"medicare": 0.60, "commercial": 0.30, "medicaid": 0.10}  # EST

# ---------------------------------------------------------------
# 2. CAPACITY (owner-specified)
# ---------------------------------------------------------------
SLOTS_PER_DAY   = 4       # 8am, 10am, 12pm, 2pm - 2hr slots
DAYS_PER_WEEK   = 5
# 40 working weeks; 12 weeks off clustered as ~1 month at Christmas
# and ~2 months in summer. Clustering matters: it creates months with
# zero collections but full fixed costs.
WORK_WEEKS = [2.5, 4.0, 4.5, 4.5, 4.5, 4.5, 0.0, 0.0, 4.5, 4.5, 4.5, 2.0]
assert abs(sum(WORK_WEEKS) - 40.0) < 0.01

# ---------------------------------------------------------------
# 3. VISIT AND CODE MIX
# ---------------------------------------------------------------
NEW_SHARE_STEADY = 0.12   # EST: new patients once panel is established
# Code distribution. 75-min slots legitimately support high-level
# time-based codes, but billing 99350 on nearly every visit is a
# statistical outlier. Two scenarios are modeled.
MIX_DESIGNED = {   # what the 75-min design supports
    "new":  {"99345": 0.55, "99344": 0.35, "99342": 0.10},
    "est":  {"99350": 0.55, "99349": 0.30, "99348": 0.15},
}
MIX_CONSERVATIVE = {   # audit-defensive
    "new":  {"99345": 0.25, "99344": 0.45, "99342": 0.30},
    "est":  {"99350": 0.30, "99349": 0.40, "99348": 0.30},
}

FILL_RATE = 0.88          # EST: no-shows, cancellations, travel slippage
NET_COLLECTION = 0.93     # EST: denials, write-offs, uncollected patient share
AR_LAG_MONTHS = 1.5       # EST: days-in-A/R ~45 days

# ---------------------------------------------------------------
# 4. COSTS
# ---------------------------------------------------------------
FIXED_MONTHLY = {
    "EMR (Cerbo bracket, prescriber+portal+telemed)": 280.0,   # EST
    "Clearinghouse / claims submission": 125.0,                # EST
    "Malpractice (home visits + FFS; NEEDS-BROKER)": 625.0,    # EST ~$7.5k/yr
    "Comms (Spruce) ": 24.0,                                   # VERIFIED
    "Accounting / bookkeeping": 200.0,                         # EST
    "VA SCC registration + domain + email": 13.0,              # VERIFIED
    "Licenses/DEA/CME amortized": 100.0,                       # EST
}
OWNER_HEALTH_INS = 0.0    # UNSET - OWNER-FACT (spouse coverage?). See sensitivity.

BILLING_PCT = 0.00        # set >0 (e.g. 0.06) to use a billing service
                          # instead of the in-house clearinghouse line

MILES_PER_VISIT = 15.6    # EST: ~12.5mi between stops, 5 legs/day / 4 visits
MILEAGE_RATE = 0.70       # REFRESH - IRS business rate
SUPPLIES_PER_VISIT = 4.0  # EST
VAR_PER_VISIT = MILES_PER_VISIT * MILEAGE_RATE + SUPPLIES_PER_VISIT

ONE_TIME = {
    "PLLC formation + fictitious name": 110.0,        # VERIFIED
    "Counsel (VA compliance, agreements)": 2000.0,    # EST; NEEDS-COUNSEL
    "Home visit clinical kit": 3000.0,                # EST
    "Laptop, phone, misc hardware": 2000.0,           # EST
    "Credentialing support service": 2000.0,          # EST
    "EPCS identity proofing": 100.0,                  # EST
}

# ---------------------------------------------------------------
# 5. RAMP - gated by credentialing, not demand
# ---------------------------------------------------------------
# Months 1-3: entity, enrollment filed, equipment. No revenue.
# Medicare 855I 30-90 days; commercial credentialing 90-180 days.
# Visits/day by month index (0-based), then steady state.
RAMP = ([0.0]*3 + [0.8, 1.2, 1.6] + [2.0, 2.2, 2.4] + [2.6, 2.8, 3.0]
        + [3.0, 3.1, 3.2, 3.3, 3.4, 3.5] + [3.5]*6
        + [3.6]*24)
STEADY_VPD = 3.6          # EST: 90% of 4 slots


def blended_rate(code_mix):
    """Average collected revenue per visit for a code mix."""
    out = {}
    for kind, dist in code_mix.items():
        allowed = 0.0
        for code, share in dist.items():
            base = MEDICARE[code] + G2211
            per_payer = sum(PAYER_MIX[p] * PAYER_INDEX[p] * base
                            for p in PAYER_MIX)
            allowed += share * per_payer
        out[kind] = allowed
    return out


def run(mix, label, health_ins=OWNER_HEALTH_INS, months=48, verbose=True):
    rates = blended_rate(mix)
    per_visit = (1 - NEW_SHARE_STEADY) * rates["est"] + NEW_SHARE_STEADY * rates["new"]
    fixed = sum(FIXED_MONTHLY.values()) + health_ins

    charges, cash, cum = [], [], []
    balance = -sum(ONE_TIME.values())
    annual = {}
    be_month = None

    for m in range(months):
        wk = WORK_WEEKS[m % 12]
        vpd = RAMP[m] if m < len(RAMP) else STEADY_VPD
        visits = vpd * DAYS_PER_WEEK * wk * FILL_RATE
        gross = visits * per_visit
        charges.append(gross)

        # collections lag A/R
        lag = AR_LAG_MONTHS
        lo, hi = int(lag), int(lag) + 1
        frac = lag - lo
        collected = 0.0
        if m - lo >= 0:
            collected += (1 - frac) * charges[m - lo]
        if m - hi >= 0:
            collected += frac * charges[m - hi]
        collected *= NET_COLLECTION

        var = visits * VAR_PER_VISIT + collected * BILLING_PCT
        net = collected - var - fixed
        balance += net
        cash.append(net)
        cum.append(balance)
        if be_month is None and net > 0:
            be_month = m + 1
        yr = m // 12 + 1
        a = annual.setdefault(yr, {"visits": 0.0, "coll": 0.0, "net": 0.0})
        a["visits"] += visits; a["coll"] += collected; a["net"] += net

    if verbose:
        print(f"\n{'='*70}\n{label}\n{'='*70}")
        print(f"  Collected per visit (blended payer + code mix): ${per_visit:,.2f}")
        print(f"    established visit ${rates['est']:,.2f} | new visit ${rates['new']:,.2f}")
        print(f"  Fixed ${fixed:,.0f}/mo | variable ${VAR_PER_VISIT:.2f}/visit"
              f" | one-time ${sum(ONE_TIME.values()):,.0f}")
        print(f"  Max capacity: {SLOTS_PER_DAY*DAYS_PER_WEEK*40:.0f} slots/yr;"
              f" at {FILL_RATE:.0%} fill and {STEADY_VPD} visits/day ="
              f" {STEADY_VPD*DAYS_PER_WEEK*40*FILL_RATE:,.0f} visits/yr")
        print(f"\n  {'Year':>4} {'visits':>8} {'collected':>12} {'net cash':>12} {'cum cash':>12}")
        running = -sum(ONE_TIME.values())
        for yr in sorted(annual):
            a = annual[yr]; running += a["net"]
            print(f"  {yr:>4} {a['visits']:>8,.0f} {a['coll']:>12,.0f}"
                  f" {a['net']:>12,.0f} {running:>12,.0f}")
        print(f"\n  First cash-positive month: {be_month}")
        print(f"  Worst cumulative cash position: ${min(cum):,.0f} (month {cum.index(min(cum))+1})")
        pay = [i for i, c in enumerate(cum) if c > 0]
        print(f"  Cumulative payback month: {pay[0]+1 if pay else 'not within horizon'}")
    return annual, cum, per_visit




# ---------------------------------------------------------------
# 6. SCENARIO VARIANTS
# ---------------------------------------------------------------
# Wraparound care-management revenue. Home-based primary care
# practices typically live on this, not visit fees alone.
# CCM 99490 = $66.30/member/month (VERIFIED, CY2026).
CCM_RATE = 66.30
def ccm_revenue(panel, enrolled_share=0.45):
    """EST: monthly CCM collections for a panel."""
    return panel * enrolled_share * CCM_RATE * NET_COLLECTION


def variant(name, payer_mix=None, vpd=None, miles=None, mix=None):
    """Re-run with overrides, restoring globals after."""
    global PAYER_MIX, STEADY_VPD, MILES_PER_VISIT, VAR_PER_VISIT, RAMP
    old = (PAYER_MIX, STEADY_VPD, MILES_PER_VISIT, VAR_PER_VISIT, RAMP)
    if payer_mix: PAYER_MIX = payer_mix
    if vpd:
        STEADY_VPD = vpd
        RAMP = [0.0]*3 + [x * vpd / 3.6 for x in old[4][3:]]
    if miles is not None:
        MILES_PER_VISIT = miles
        VAR_PER_VISIT = miles * MILEAGE_RATE + SUPPLIES_PER_VISIT
    res = run(mix or MIX_DESIGNED, name)
    PAYER_MIX, STEADY_VPD, MILES_PER_VISIT, VAR_PER_VISIT, RAMP = old
    return res


if __name__ == "__main__":
    print("HOME-VISIT INSURANCE MODEL - 2026-10-24")
    print("Rates: PALTmed CY2026 RVUs x CF $33.40; cross-checked vs PayerPrice.")
    print("Commercial/Medicaid multiples are third-party national averages (EST),")
    print("NOT contracted rates. Credentialing is assumed; see chat for that risk.")
    print(f"\nMedicare non-facility rates used:")
    for c in ["99341","99342","99344","99345","99347","99348","99349","99350"]:
        print(f"    {c}  ${MEDICARE[c]:>7,.2f}   (+G2211 ${G2211})")

    run(MIX_DESIGNED, "SCENARIO A - designed mix (75-min slots, high-level codes)")
    run(MIX_CONSERVATIVE, "SCENARIO B - conservative/audit-defensive code mix")

    print(f"\n{'='*70}\nSENSITIVITY\n{'='*70}")
    for label, kw in [
        ("owner health insurance at $900/mo", dict(health_ins=900.0)),
        ("billing service at 6% instead of clearinghouse", dict()),
    ]:
        pass
    a, c, pv = run(MIX_DESIGNED, "A + owner health insurance $900/mo",
                   health_ins=900.0, verbose=False)
    print(f"  A with $900/mo owner health insurance:"
          f" year-3 net ${a[3]['net']:,.0f} (vs baseline)")
    print(f"\n  NOTE: net cash is PRE-TAX owner income. Self-employment tax")
    print(f"  (~15.3% to the wage base) and income tax come out of it.")
    # --- Variant 1: Medicare-only (credentialing-realistic) ---
    variant("SCENARIO C - Medicare only (no commercial credentialing)",
            payer_mix={"medicare": 1.0, "commercial": 0.0, "medicaid": 0.0})

    # --- Variant 2: facility clustering (the drive-time unlock) ---
    # Several patients at one address (assisted living / senior housing):
    # drive time collapses, slots per day rise.
    variant("SCENARIO D - facility-clustered, 6.5 visits/day",
            vpd=6.5, miles=5.0)

    # --- Variant 3: CCM wraparound on the base case ---
    print(f"\n{'='*70}\nCCM WRAPAROUND (added to any scenario)\n{'='*70}")
    for panel in (100, 150, 200):
        mo = ccm_revenue(panel)
        print(f"  panel {panel:>4}: ~{panel*0.45:>5.0f} on CCM"
              f" -> ${mo:>8,.0f}/mo  ${mo*12:>10,.0f}/yr")
    print("  EST: 45% of panel CCM-enrolled, collected at"
          f" {NET_COLLECTION:.0%}. Requires 20+ min/month of staff or")
    print("  physician care-management time per patient, documented.")

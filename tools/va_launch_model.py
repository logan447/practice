#!/usr/bin/env python3
"""Virginia/DC minimum-viable-launch economics.

Companion to docs/strategy/va-dc-launch-decision.md. Every input is
labeled with provenance (research brief 2026-08-22, estimate, or UNSET).
Run: python3 tools/va_launch_model.py
"""

FEE = 100.0  # $/member/month (D-029)

# ---- Cost scenarios (monthly fixed) -------------------------------
# Sources: channel/pricing research brief 2026-08-22 (vendor pages);
# malpractice = derived estimate from published part-time discount
# schedules, NEEDS-BROKER.

SCENARIOS = {
    "lean (DIY stack)": {
        "EMR/notes + eRx w/ EPCS (MDToolbox Complete + notes)": 45.0,
        "Telehealth video (Doxy.me free tier)": 0.0,
        "Comms: Spruce Basic (phone/fax/messaging, BAA)": 24.0,
        "Malpractice (part-time IM, VA; est $2,400/yr)": 200.0,
        "VA SCC annual registration ($50/yr)": 4.17,
        "Registered agent (self)": 0.0,
        "Domain + email (Google Workspace)": 9.0,
        "Bank (Mercury/Relay) + Wave accounting": 0.0,
        "Site hosting (Cloudflare Pages)": 0.0,
    },
    "standard (DPC-native stack)": {
        "Hint Clinical Launch (EMR+billing+telehealth+eRx)": 290.0,
        "Comms: Spruce Basic": 24.0,
        "Malpractice (part-time IM, VA; est $3,000/yr)": 250.0,
        "VA SCC annual registration": 4.17,
        "Registered agent (service, $100/yr)": 8.33,
        "Domain + email": 9.0,
        "Bank + Wave accounting": 0.0,
        "Site hosting": 0.0,
    },
}

# One-time launch costs (both scenarios; DC items listed separately)
ONE_TIME = {
    "VA PLLC formation (SCC articles)": 100.0,
    "Counsel: VA DPC agreement adaptation + ad review (est band mid)": 2000.0,  # NEEDS-COUNSEL quote; band $1.5-3.5k
    "EPCS identity proofing / setup": 100.0,
    "Print run: packets + explainers": 300.0,
    "Misc (stamps/cards/supplies)": 200.0,
}
ONE_TIME_DC = {
    "DC license by endorsement (fees, est)": 780.0,   # verify from DC brief
    "DC CSR + misc DC filings (est)": 400.0,          # verify
}

# Variable cost per member per month
ACH_FEE = 1.25        # Hint ACH 1% + $0.25 (cap $5) on $100
CARD_FEE = 3.30       # Hint card 3.0% + $0.30 on $100
ACH_SHARE = 0.6       # assumption: 60% of members on ACH
PER_MEMBER_VAR = ACH_SHARE * ACH_FEE + (1 - ACH_SHARE) * CARD_FEE
FRICTION = 0.02       # failed payments/proration at micro scale (est)

# Optional marketing test budget (Stage-gated, not fixed cost)
ADS_TEST = 300.0      # $/mo bounded test, 3 months


def table(scn_name, fixed):
    fixed_total = sum(fixed.values())
    print(f"\n=== {scn_name} — fixed ${fixed_total:,.0f}/mo ===")
    for k, v in fixed.items():
        print(f"  {k:58s} ${v:8,.2f}")
    print(f"  {'TOTAL fixed':58s} ${fixed_total:8,.2f}")
    print(f"\n  per-member variable: ${PER_MEMBER_VAR:.2f}/mo "
          f"({int(ACH_SHARE*100)}% ACH) + {FRICTION:.0%} friction")
    hdr = f"  {'members':>8s} {'revenue':>9s} {'variable':>9s} {'fixed':>8s} {'net/mo':>9s} {'net/yr':>10s}"
    print(hdr)
    be = None
    for n in [0, 5, 10, 15, 25, 50]:
        rev = n * FEE * (1 - FRICTION)
        var = n * PER_MEMBER_VAR
        net = rev - var - fixed_total
        print(f"  {n:8d} {rev:9,.0f} {var:9,.0f} {fixed_total:8,.0f} {net:9,.0f} {net*12:10,.0f}")
    # break-even members
    per_net = FEE * (1 - FRICTION) - PER_MEMBER_VAR
    be = fixed_total / per_net
    print(f"  break-even: {be:.1f} members "
          f"(each member nets ${per_net:,.2f}/mo)")
    return fixed_total, be


if __name__ == "__main__":
    print("VA/DC minimum-viable launch — economics"
          "\n(inputs: research brief 2026-08-22; malpractice NEEDS-BROKER;"
          "\n counsel band NEEDS-COUNSEL; ads budget stage-gated)")
    for name, fixed in SCENARIOS.items():
        table(name, fixed)
    ot = sum(ONE_TIME.values())
    otdc = sum(ONE_TIME_DC.values())
    print(f"\nOne-time launch (VA only): ${ot:,.0f}"
          f"   (+DC option: ${otdc:,.0f})")
    print(f"Optional ads test: ${ADS_TEST:,.0f}/mo x 3 mo = ${ADS_TEST*3:,.0f} (stage-gated)")
    print(f"\nD-020 context: $20k prep ceiling; VA-only launch commits"
          f"\n  ~${ot:,.0f} one-time + ~$4,200-7,000/yr run-rate if zero patients"
          f"\n  (both scenarios), fully covered by ceiling.")

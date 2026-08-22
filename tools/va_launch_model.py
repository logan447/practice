#!/usr/bin/env python3
"""Virginia/DC minimum-viable-launch economics — v2 (2026-08-22).

v2 replaces estimates with two real documents:
  1. Malpractice: Core Specialty / StarStone quote HLC01208813Q-00
     (Concierge Medicine no surgery, $1M/$3M, $2,500 deductible,
     claims-made, $5,472.25 total incl. surplus-lines taxes/fees).
     QUOTE EXPIRED at its 5/13/2026 effective date -> re-quote needed.
     Carries a DC-sitting exclusion (no coverage for care rendered
     while the physician is physically in DC, incl. telemedicine)
     and tail at 150-250% of annual premium. NEEDS-BROKER rework.
  2. EMR: Cerbo quote (Erica Smith email): sign-up $595 -> $1,
     monthly line items 50% off for months 1-3. The line-item detail
     behind the emailed link is NOT in the project -> monthly base is
     bracketed from Cerbo's published list prices (cer.bo/pricing,
     fetched 2026-08-22), labeled PLACEHOLDER until the quote PDF/CSV
     arrives. Do not treat the bracket as the quote.

Run: python3 tools/va_launch_model.py
"""

FEE = 100.0  # $/member/month (D-029)

# ---- Malpractice (VERIFIED quote, expired; re-quote + fix DC excl) --
MALPRACTICE_YR = 5472.25          # Core Specialty total incl. taxes/fees
MALPRACTICE_MO = MALPRACTICE_YR / 12   # ~$456/mo
# Tail (claims-made ERP): 12mo @150%, 36mo @200%, 60mo @250% of premium
TAIL_36MO = 0.5 * 5000.0 * 4       # illustrative: 200% of $5,000 premium

# ---- Cerbo bracket (PLACEHOLDER from published list; quote UNSET) ---
# Erica's email VERIFIED: signup $1; 50% off monthly, months 1-3.
CERBO_LOW = {  # part-time prescribing provider + portal + 1:1 telemed
    "Cerbo part-time prescriber (list $174)": 174.0,
    "Cerbo patient portal (list $79)": 79.0,
    "Cerbo telemedicine 1:1 (list $27)": 27.0,
}
CERBO_HIGH = {  # full-time prescriber + portal + telemed + e-fax in
    "Cerbo full-time prescriber (list $281)": 281.0,
    "Cerbo patient portal (list $79)": 79.0,
    "Cerbo telemedicine 1:1 (list $27)": 27.0,
    "Cerbo incoming e-fax (list $27)": 27.0,
}
CERBO_DISCOUNT_MONTHS = 3
CERBO_DISCOUNT = 0.5

# ---- Non-EMR fixed (unchanged from v1 research brief) ---------------
BASE_FIXED = {
    "Comms: Spruce Basic (phone/fax/messaging, BAA)": 24.0,
    "Malpractice (Core Specialty quote / 12; NEEDS re-quote)": MALPRACTICE_MO,
    "VA SCC annual registration ($50/yr)": 4.17,
    "Domain + email (Google Workspace)": 9.0,
    "Bank (Mercury/Relay) + Wave accounting": 0.0,
    "Site hosting (Cloudflare Pages)": 0.0,
}

# ---- One-time -------------------------------------------------------
ONE_TIME = {
    "Cerbo sign-up (quoted: $595 -> $1)": 1.0,
    "VA PLLC formation + fictitious name (SCC)": 110.0,
    "Counsel: VA DPC agreement + Rx rule + ad review (mid)": 2000.0,  # NEEDS-COUNSEL; band $1.5-3.5k
    "EPCS identity proofing / setup": 100.0,
    "Print run: packets + explainers": 300.0,
    "Misc (stamps/cards/supplies)": 200.0,
}
ONE_TIME_DC = {
    "DC license (DMV reciprocity; $805 + verifications)": 1000.0,
    "DC controlled substance registration (biennial)": 130.0,
    "DC foreign entity registration (FN-1, NEEDS-COUNSEL)": 220.0,
}

# ---- Variable cost per member per month (Stripe via Cerbo) ----------
ACH_FEE = 0.80        # Stripe ACH 0.8% (cap $5) on $100
CARD_FEE = 3.20       # Stripe card 2.9% + $0.30 on $100
ACH_SHARE = 0.6       # assumption: 60% of members on ACH
PER_MEMBER_VAR = ACH_SHARE * ACH_FEE + (1 - ACH_SHARE) * CARD_FEE
FRICTION = 0.02       # failed payments/proration at micro scale (est)

ADS_TEST = 300.0      # $/mo bounded test, 3 months (stage-gated)

MEMBER_TIERS = [0, 5, 10, 15, 25, 50]


def phase_totals(cerbo):
    steady = sum(BASE_FIXED.values()) + sum(cerbo.values())
    intro = sum(BASE_FIXED.values()) + CERBO_DISCOUNT * sum(cerbo.values())
    return intro, steady


def econ_table(label, cerbo):
    intro, steady = phase_totals(cerbo)
    per_net = FEE * (1 - FRICTION) - PER_MEMBER_VAR
    print(f"\n=== {label} ===")
    for k, v in {**cerbo, **BASE_FIXED}.items():
        print(f"  {k:58s} ${v:8,.2f}")
    print(f"  {'FIXED months 1-3 (Cerbo 50% off)':58s} ${intro:8,.2f}")
    print(f"  {'FIXED month 4+':58s} ${steady:8,.2f}")
    print(f"\n  per-member variable ${PER_MEMBER_VAR:.2f}/mo "
          f"({int(ACH_SHARE*100)}% ACH via Stripe) + {FRICTION:.0%} friction"
          f"  -> each member nets ${per_net:,.2f}/mo")
    print(f"  {'members':>8s} {'net/mo (m1-3)':>14s} {'net/mo (m4+)':>13s} {'net/yr (m4+)':>13s}")
    for n in MEMBER_TIERS:
        net_i = n * per_net - intro
        net_s = n * per_net - steady
        print(f"  {n:8d} {net_i:14,.0f} {net_s:13,.0f} {net_s*12:13,.0f}")
    print(f"  break-even: {intro/per_net:.1f} members (months 1-3), "
          f"{steady/per_net:.1f} members (month 4+)")


if __name__ == "__main__":
    print("VA/DC minimum-viable launch — economics v2, 2026-08-22"
          "\n  malpractice: Core Specialty quote (EXPIRED; re-quote,"
          "\n    fix DC-sitting exclusion) — VERIFIED document"
          "\n  Cerbo monthly: PLACEHOLDER bracket from published list"
          "\n    prices; actual quoted line items UNSET (send the quote)")
    econ_table("Cerbo LOW bracket (part-time prescriber + portal + telemed)",
               CERBO_LOW)
    econ_table("Cerbo HIGH bracket (+ full-time rate, e-fax)", CERBO_HIGH)
    ot = sum(ONE_TIME.values())
    print(f"\nOne-time launch (VA only): ${ot:,.0f}"
          f"   (+DC option: ${sum(ONE_TIME_DC.values()):,.0f})")
    print(f"Optional ads test: ${ADS_TEST:,.0f}/mo x 3 = ${ADS_TEST*3:,.0f} (stage-gated)")
    print(f"\nMalpractice exit cost if claims-made stands: 36-mo tail"
          f" ~${TAIL_36MO:,.0f} (200% of premium). Occurrence or a"
          f" carrier with free death/disability/retirement tail avoids"
          f" this. NEEDS-BROKER.")

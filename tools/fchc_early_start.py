"""Start the FCHC contract January 2027, alongside Olera.

The contract is unchanged: 35 weeks, 2 days a week, 15 clocked hours.
What changes is that it runs while he is also at Olera, so his income
is much higher and his IBR payment is not $0.

The question is not whether the payments cost money. He is in
repayment already, so he is making payments during 2027 and 2028
whatever he does. The question is whether those payments COUNT.
"""
import sys
sys.path.insert(0,"tools")
from phase2_personal_model import ibr_payment, FPL150_FAM4
FPL150_FAM2 = 31_320.   # EST 2026, family of 2, no children yet
W,D,H,RATE = 35,70,15.0,40.
FCHC = D*H*RATE
print(f"FCHC at ${RATE:.0f}/h: {D} days x {H} h = {D*H:,.0f} hours = ${FCHC:,.0f}")
print(f"Hours test: {D*H/W:.1f} h/week over {W} weeks = "
      f"{W/52.1786*12:.2f} months. Qualifies.\n")
print("A 60-HOUR WEEK IN A CONTRACT WEEK")
print(f"  2 days x 15 h at FCHC = 30 h")
print(f"  3 days x 10 h at Olera = 30 h")
print(f"  In the 17 non-contract weeks, Olera only.\n")
print("MONTHLY IBR PAYMENT WHILE BOTH RUN (married filing separately,")
print(f"no children yet, 150% FPL for a household of 2 = ${FPL150_FAM2:,.0f})\n")
print(f"{'Olera salary':>14}{'total AGI':>12}{'IBR/month':>12}{'over 20 months':>16}")
for ol in (0, 80_000, 120_000, 150_000, 200_000):
    agi = ol + FCHC
    m = ibr_payment(agi, FPL150_FAM2)/12
    print(f"${ol:>13,}${agi:>11,.0f}${m:>11,.0f}${m*20:>15,.0f}")
print("\n  Those payments happen whether or not he is at FCHC, because he")
print("  is already in repayment with an Olera income. Starting the")
print("  contract does not create the cost, it makes the months count.\n")
print("WHAT THE 20 MONTHS ARE WORTH")
print("  100 qualifying payments remain.")
print("    start Jan 2027 -> forgiveness about April 2035")
print("    start Jun 2028 -> forgiveness about September 2036")
print("    17 months earlier, at no extra cash cost.\n")
print("PARTIAL FINANCIAL HARDSHIP holds. IBR needs the payment to be")
print("  under the 10-year standard, which on $319,221 at 6.5% is")
print("  $3,625 a month. That holds until AGI reaches about $321,000.\n")
print("THE TWO QUESTIONS THAT DECIDE IT")
print("  1. Is Olera a 501(c)(3)? If it is, 30 hours a week there may")
print("     already qualify on its own and FCHC is not needed for PSLF.")
print("     If it is for-profit, its hours do not count, but they do not")
print("     disqualify either: the rule needs 30 hours in QUALIFYING")
print("     employment, and nothing about exclusivity.")
print("  2. Are the payments he is making right now counting? If some")
print("     already qualify, the gain is smaller than 17 months.\n")
print("QUARTERLY TARGET")
print(f"  35 weeks / 4 = {35/4:.2f} a quarter. 7 a quarter is only 28 and")
print(f"  fails. The workable band is 8 to 10, averaging 8.75.")

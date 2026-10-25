"""The negotiation ladder for 4 x 10 clocked hours at FCHC.

$55/hr was the owner's GUESS at what FCHC would accept, not a figure
FCHC stated (OWNER-FACT 2026-10-25). The only hard ceiling is the
medical director's implied $66.97/hr, and the rate that clears the
$25,000 floor is $65.85 -- $1.12 under it. So there is $11.97/hr
between the guess and the real constraint.

No backup weeks moved (owner declined): 92 care days of 160.
"""
import sys; sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
FLOOR, DIR, WD = 25_000., 66.97, (1,2,3,4)
d,c = count(WD, prep(0))

print(f"4 x 10 clocked hrs, Tue-Fri, {d} clinic days, {c} care days, "
      f"20 patients/day\n")
print(f"{'rate':>7}{'income':>9}{'@$24 care':>11}{'@$26':>9}{'@$28':>9}"
      f"{'$/enc':>8}{'% @$90':>8}{'% @$103':>9}{'vs dir':>8}")
for r in (55.,58.,60.,62.,64.,65.85,66.97):
    inc=d*10*r; loaded=inc*1.09
    row=f"{r:>7.2f}{inc:>9,.0f}"
    for ch in (24.,26.,28.):
        s=econ(10.,d,c,ch,r)[2]
        row+=f"{s:>8,.0f}"+("*" if s>=FLOOR else " ")
    print(row+f"{loaded/(d*20):>8.2f}{loaded/(d*20*90):>8.0%}"
              f"{loaded/(d*20*102.97):>9.0%}{r-DIR:>+8.2f}")
print("\n  Normal primary care physician share is 35-45% of collections.")

print("\nTHE CARE RATE IS LOAD-BEARING")
for ch in (24.,25.,26.,28.):
    lo,hi=40.,200.
    for _ in range(80):
        m=(lo+hi)/2
        if econ(10.,d,c,ch,m)[2]<FLOOR: lo=m
        else: hi=m
    print(f"  care ${ch:>2.0f}/hr -> need ${hi:>6.2f}/hr   "
          + ("under the director, askable" if hi<=DIR
             else "ABOVE the director, breaks the rule"))

print("\nTHE LADDER")
for lab,r in (("anchor",66.00),("target",65.85),("acceptable",62.00),
              ("floor",60.00),("owner's guess",55.00)):
    s=econ(10.,d,c,24.,r)[2]
    print(f"  {lab:<14}${r:>6.2f}/hr  income ${d*10*r:>8,.0f}  "
          f"saved ${s:>7,.0f}  ({s-FLOOR:+,.0f})")

print("\nTHE EVIDENCE")
print(f"  pay now:   8 hrs x $50    = ${8*50*1.09:>6,.0f} loaded/day"
      f" = ${8*50*1.09/20:>5.2f}/encounter = "
      f"{8*50*1.09/(20*90):.0%}-{8*50*1.09/(20*102.97):.0%} of collections")
print(f"  the ask:  10 hrs x $65.85 = ${10*65.85*1.09:>6,.0f} loaded/day"
      f" = ${10*65.85*1.09/20:>5.2f}/encounter = "
      f"{10*65.85*1.09/(20*90):.0%}-{10*65.85*1.09/(20*102.97):.0%}")
print(f"\n  FCHC currently buys physician labour at roughly HALF the")
print(f"  going rate. That is the argument, and it comes from their own")
print(f"  Form 990 plus standard comp benchmarks.")
print(f"  No benefits taken; the director's package costs them $73-86/hr.")
print(f"  Adds {d*20:,} encounters against a ~10,000 baseline (EST).")
print(f"\n  CAUTION: their margin was 1.3% and ${d*10*65.85:,.0f} is ~6.5% of")
print(f"  their expense base, so the percentage argument alone will not")
print(f"  fund it. Fundable only if the {d*20:,} encounters are genuinely")
print(f"  NEW rather than ones existing providers would have seen.")

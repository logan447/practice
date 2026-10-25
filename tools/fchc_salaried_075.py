"""0.75 FTE salaried, 30 hrs/week, paid leave included. $65,000.

Paid leave counts (form: "Vacation or leave time provided by the
employer ... is equivalent to hours worked"), so:
  40 working weeks x 30 + 12 leave weeks x 30 = 1,560 = 30.00 hr/wk.

The shape of the working week is then free, and FEWER, LONGER days is
cheaper: fewer trips to pay a sitter for, and more of them can be
placed on the 83 weekdays Jamie is already home.
"""
import datetime as dt, sys
sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
FLOOR, SAL, WKS = 25_000., 65_000., 40
bz = prep(0)
FREE = [JAN1+dt.timedelta(i) for i in range(365)
        if (JAN1+dt.timedelta(i)).weekday() < 5
        and (JAN1+dt.timedelta(i)) not in off and not bz[i]]
NFREE = len(FREE)
print(f"Jamie is home on {NFREE} weekdays outside the 12 weeks off.")
print(f"Those are free clinic days. Anything beyond them needs a sitter.\n")

def shape(days_yr, hrs_day, sal=SAL, care_hr=28.):
    bought = max(0, days_yr - NFREE)
    away   = hrs_day + 2.5
    care   = bought*away*care_hr
    mi     = 110.*days_yr
    carc   = mi/30*3.20 + mi*0.09 + 1_750. + 4_200. + 1_500.
    other  = 8_460. - 1_200. + 10.*days_yr
    tx=(sal*FICA_EMPLOYEE+tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    loan=ibr_payment(sal, FPL150_FAM4)
    fsa=min(care,3_750.)*0.30
    return dict(bought=bought, care=care, car=carc, other=other, tx=tx,
                loan=loan, away=away,
                saved=sal-tx-loan-care-carc-other+fsa)

print("PSLF is identical in every row: 40 x 30 + 12 x 30 = 1,560 = 30.00\n")
print(f"{'shape':>22}{'days':>6}{'bought':>8}{'away':>7}{'care':>9}"
      f"{'car':>8}{'SAVED @$28':>12}{'@$24':>9}")
SHAPES=[("3 days x 10 hrs",120,10.),("alternating 2/3 x 12",100,12.),
        ("2 days x 15 hrs",80,15.),("alternating 3/4 x 8.5",140,8.5),
        ("4 days x 7.5 hrs",160,7.5)]
for lab,d,h in SHAPES:
    a=shape(d,h); b=shape(d,h,care_hr=24.)
    print(f"{lab:>22}{d:>6}{a['bought']:>8}{a['away']:>7.1f}"
          f"{a['care']:>9,.0f}{a['car']:>8,.0f}{a['saved']:>11,.0f}"
          + ("*" if a['saved']>=FLOOR else " ")
          + f"{b['saved']:>8,.0f}" + ("*" if b['saved']>=FLOOR else " "))
print("\n  * clears the $25,000 floor.  'bought' = clinic days beyond the")
print(f"  {NFREE} Jamie is already home for.")

print("\nFULL LEDGER, best shape, care at $24")
best=max(SHAPES, key=lambda s: shape(s[1],s[2],care_hr=24.)['saved'])
lab,d,h=best; r=shape(d,h,care_hr=24.)
print(f"  {lab}, {d} clinic days, {r['bought']} with a sitter\n")
for k,v in [(f"salary, 0.75 FTE with paid leave", SAL),
            ("federal MFS + DC + FICA", -r['tx']),
            ("student loan, IBR", -r['loan']),
            (f"childcare, {r['bought']} days x ${r['away']*24:.0f}", -r['care']),
            ("second car, all in", -r['car']),
            ("disability, life, licence, tolls, meals", -r['other']),
            ("dependent-care FSA back", min(r['care'],3_750.)*0.30)]:
    print(f"  {k:<44}{v:>10,.0f}")
print(f"  {'SAVED':<44}{r['saved']:>10,.0f}")
print(f"  {'vs the $25,000 floor':<44}{r['saved']-FLOOR:>+10,.0f}")

print("\nSALARY NEEDED, by shape and care rate")
print(f"{'shape':>22}{'@$28 care':>11}{'@$26':>9}{'@$24':>9}")
for lab,d,h in SHAPES:
    row=f"{lab:>22}"
    for ch in (28.,26.,24.):
        lo,hi=40_000.,160_000.
        for _ in range(80):
            m=(lo+hi)/2
            if shape(d,h,m,ch)['saved']<FLOOR: lo=m
            else: hi=m
        row+=f"{hi:>9,.0f}" + (" " if hi>65_000 else "*")
    print(row)
print("  * $65,000 is enough for that cell")

print("\nWHAT $65,000 COSTS FCHC (20 patients a day)")
for lab,d,h in SHAPES[:3]:
    enc=d*20; loaded=SAL*1.09
    print(f"  {lab:<22} {enc:>5,} encounters  ${loaded/enc:>6.2f}/enc  "
          + "  ".join(f"{loaded/(enc*ev):.0%} @${ev:.0f}" for ev in (90.,102.97)))
print(f"\n  $65,000 / 1,560 paid hrs = ${SAL/1560:.2f}/hr, far under the")
print(f"  director's $66.97. Loaded ${SAL*1.09:,.0f}.")

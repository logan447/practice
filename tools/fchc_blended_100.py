"""The settled shape, checked at a $100 blended collection rate.

2 days a week, 15 clocked hours, $40 an hour, 16 patients a day.
Marginal overhead 40 percent, employer burden 9 percent.
"""
import io, contextlib
buf=io.StringIO()
with contextlib.redirect_stdout(buf):
    exec(open('tools/fchc_worked_hours_only.py').read().split('print("WHAT REACHES')[0])
H,RATE,EMP,OH,FEE,PTS=15.0,40.,1.09,0.40,100.,16
print("A SINGLE WORKING WEEK")
print(f"  2 days x {PTS} patients          = {2*PTS} encounters")
print(f"  {2*PTS} x ${FEE:.0f} blended         = ${2*PTS*FEE:,.0f} collected")
print(f"  less {OH:.0%} marginal overhead  = ${2*PTS*FEE*(1-OH):,.0f} contribution")
print(f"  your pay, 30 h x ${RATE:.0f}        = ${2*H*RATE:,.0f}  "
      f"(${2*H*RATE*EMP:,.0f} loaded)")
print(f"  clinic keeps                 = ${2*PTS*FEE*(1-OH)-2*H*RATE*EMP:,.0f} a week\n")
print(f"{'wks':>5}{'per qtr':>9}{'months':>8}{'days':>6}{'h/wk':>6}"
      f"{'your pay':>10}{'you save':>10}{'clinic keeps':>14}{'ret':>6}")
for W in (34,35,36,38,40):
    D=W*2; hrs=D*H; L=hrs*RATE*EMP
    keep=D*PTS*FEE*(1-OH)-L
    inc,care,sav=econ(H,D,0,rate=RATE)
    mo=W/52.1786*12
    print(f"{W:>5}{W/4:>9.2f}{mo:>8.2f}{D:>6}{hrs/W:>6.1f}${inc:>9,.0f}"
          f"${sav:>9,.0f}${keep:>13,.0f}{keep/L:>6.0%}"
          + ('   FAILS THE 8-MONTH MINIMUM' if mo<8 else ''))
print(f"\n  break-even ${(H*RATE*EMP)/(PTS*(1-OH)):,.2f} a visit, "
      f"your cost ${(H*RATE*EMP)/PTS:,.2f} an encounter")
print("\n  THE EDGE: 34.32 weeks is exactly 8 months. Aiming at 35 leaves")
print("  0.68 weeks of slack; one light quarter puts the year at 34 and")
print("  the certification fails. Aim at 38.")

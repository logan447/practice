"""Rate cut or more patients? They buy the clinic the same thing.

76 clinic days, 15 clocked hours, 38-week contract, $90 a visit,
40 percent marginal overhead, 9 percent employer burden.
"""
import io, contextlib
buf=io.StringIO()
with contextlib.redirect_stdout(buf):
    exec(open('tools/fchc_worked_hours_only.py').read().split('print("WHAT REACHES')[0])
D,H,EMP,OH,FEE=76,15.0,1.09,0.40,90.
def clinic(rate,pts):
    L=D*H*rate*EMP
    return (D*pts*FEE*(1-OH)-L)/L
print("CLINIC RETURN AT $90 A VISIT\n")
print(f"{'rate':>8}"+"".join(f"{str(p)+' pts/day':>13}" for p in (16,18,20)))
for r in (50,47,45,42,40):
    print(f"${r:>7}"+"".join(f"{clinic(r,p):>13.0%}" for p in (16,18,20)))
print(f"\n{'rate':>8}{'pay':>10}{'his saves':>12}{'vs $25k floor':>15}")
for r in (50,47,45,42,40):
    inc,care,sav=econ(H,D,0,rate=r)
    d=sav-25000
    print(f"${r:>7}${D*H*r:>9,.0f}${sav:>11,.0f}"
          f"{('+$'+format(d,',.0f')) if d>=0 else ('-$'+format(-d,',.0f')):>15}")
print("\nTHE POINT")
print(f"  $50 @ 16 patients -> {clinic(50,16):.0%} for the clinic")
print(f"  $40 @ 16 patients -> {clinic(40,16):.0%}  and costs him $7,594 of savings")
print(f"  $50 @ 20 patients -> {clinic(50,20):.0%}  and costs him nothing")
print("\n  Four more patients a day buys the clinic exactly what a $10 rate")
print("  cut buys them. One is free to him; the other breaks his floor.")
print("  The floor breaks between $47 and $45, so $47 is the lowest rate")
print("  that still clears $25,000, and even there 16 patients is only 12%.")

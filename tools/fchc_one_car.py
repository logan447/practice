"""Does the $40 contract clear the $25,000 savings floor without a second car?

Owner, 2026-10-25: "I probably wouldn't even have to get a car at first
because there are always two days where I can either ride with Jamie to
work, or she's off and I can take the car."

The 2027 day picks in tools/fchc_schedule_2027.py put all 70 clinic days
on days Jamie is working, and 46 of them on days the car is at home.
That makes the second car a choice rather than a requirement, so this
runs the floor three ways.

Everything else is the settled shape: 35 weeks, 70 days, 15 clocked
hours, $40 an hour, no paid childcare.
"""
import io, contextlib, sys
sys.path.insert(0,"tools")
buf=io.StringIO()
with contextlib.redirect_stdout(buf):
    src=open('tools/fchc_worked_hours_only.py').read()
    exec(src.split('print("WHAT REACHES')[0])

H, D, RATE, FLOOR = 15.0, 70, 40.0, 25_000.
FIXED = 1_750.+4_200.+1_500.          # purchase, insurance, parking
full  = car(D)                        # fixed plus fuel and maintenance
variable = full - FIXED

inc, care, sav = econ(H, D, 0, rate=RATE)

print(f"35 weeks, {D} clinic days, {H:.0f} clocked hours, ${RATE:.0f} an hour")
print(f"  income ${inc:,.0f}   paid childcare ${care:,.0f}\n")
print(f"Second car, as modelled: ${full:,.0f} a year")
print(f"  fixed (purchase, insurance, parking)  ${FIXED:,.0f}")
print(f"  fuel and maintenance over {D} trips    ${variable:,.0f}\n")

rows=[("two cars, as modelled", sav),
      ("one car, he drives it on clinic days", sav+FIXED),
      ("one car, he rides in with Jamie", sav+full)]
w=max(len(r[0]) for r in rows)
for label, s in rows:
    gap=s-FLOOR
    print(f"  {label:<{w}}  saves ${s:>8,.0f}   "
          f"{'clears' if gap>=0 else 'SHORT  '} ${abs(gap):,.0f}")

print(f"\nThe floor is ${FLOOR:,.0f}. The second car is the difference between")
print("missing it and clearing it, and the margin either way is thin.")
print("\nASSUMPTION, owner to confirm: that riding in together is possible,")
print("which needs Jamie's hospital and the clinic to be a shared trip.")
print("From 2029 this also has to survive three children and car seats.")

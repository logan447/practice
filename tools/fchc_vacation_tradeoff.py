"""How much vacation must go to reach 1,560 worked hours with NO nanny?

Only days Jamie is free are workable. Her synced leave (about 70% of
each of my blocks) means that during my vacation weeks she IS home
with the children, so a sacrificed vacation week yields clinic days.
"""
import datetime as dt, sys
sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
TARGET = 1_560.
bz = prep(0)                       # Jamie's year, 70% leave sync applied

wd_free_out, wd_free_in = [], []   # Jamie-free weekdays outside / inside my blocks
for i in range(365):
    d = JAN1+dt.timedelta(i)
    if d.weekday() > 4: continue
    if bz[i]: continue
    (wd_free_in if d in off else wd_free_out).append(d)
print("THE UNIVERSE OF WORKABLE DAYS (Jamie free, weekday)\n")
print(f"  outside my 12 weeks off          {len(wd_free_out)}")
print(f"  inside my 12 weeks off           {len(wd_free_in)}"
      f"   <- these are what vacation buys")
print(f"  total Jamie-free weekdays        {len(wd_free_out)+len(wd_free_in)}\n")

# vacation weeks ranked by how many workable days each contains
wk_in = {}
for d in wd_free_in:
    wk_in.setdefault((d-JAN1).days//7, []).append(d)
ranked = sorted(wk_in.items(), key=lambda kv: -len(kv[1]))
print(f"  my 12 weeks off hold {len(wk_in)} distinct calendar weeks with")
print(f"  workable days in them, {len(wd_free_in)} days in total\n")

def reachable(cap, hrs, wks_given_up):
    """Days available if I give up the `wks_given_up` best vacation weeks."""
    give = set(w for w,_ in ranked[:wks_given_up])
    per, days = {}, 0
    for i in range(365):
        d = JAN1+dt.timedelta(i)
        if d.weekday() > 4 or bz[i]: continue
        wk = i//7
        if d in off and wk not in give: continue
        if per.get(wk,0) >= cap: continue
        per[wk] = per.get(wk,0)+1; days += 1
    return days, days*hrs

print("WEEKS OF VACATION THAT MUST GO, by day cap and clocked hours")
print(f"  (target {TARGET:,.0f} worked hours = 30.00 hr/wk)\n")
print(f"{'cap':>5}{'hrs/day':>9}{'days needed':>13}{'weeks given up':>16}"
      f"{'weeks left':>12}{'result':>10}")
for cap in (3,4,5):
    for hrs in (12.,13.,14.):
        need = TARGET/hrs
        hit = None
        for g in range(0, len(ranked)+1):
            d,h = reachable(cap,hrs,g)
            if h >= TARGET: hit = (g,d,h); break
        if hit:
            g,d,h = hit
            print(f"{cap:>5}{hrs:>9.0f}{need:>13.0f}{g:>16}{12-g:>12}"
                  f"{'':>4}{h/52:>5.1f} hr/wk")
        else:
            d,h = reachable(cap,hrs,len(ranked))
            print(f"{cap:>5}{hrs:>9.0f}{need:>13.0f}{'all 12':>16}{0:>12}"
                  f"   FAILS at {h/52:.1f} hr/wk ({d} days)")

print("\nWHAT ALL TWELVE WEEKS BUYS YOU, at 3 days a week")
for hrs in (12.,13.,14.,15.):
    d,h = reachable(3,hrs,len(ranked))
    print(f"  {hrs:.0f}-hour days: {d} days, {h:,.0f} hrs, {h/52:.2f} hr/wk"
          + ("  PASSES" if h>=TARGET else "  fails"))

print("\nTHE CHEAPEST PASSING COMBINATIONS")
best=[]
for cap in (3,4,5):
    for hrs in (12.,13.,14.,15.):
        for g in range(0, len(ranked)+1):
            d,h = reachable(cap,hrs,g)
            if h >= TARGET:
                best.append((g,cap,hrs,d,h)); break
best.sort()
for g,cap,hrs,d,h in best[:6]:
    print(f"  give up {g:>2} weeks | {cap} days/wk | {hrs:.0f} hrs/day | "
          f"{d} clinic days | {h/52:.1f} hr/wk | {12-g} weeks off left")

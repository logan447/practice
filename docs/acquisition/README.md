# Patient Acquisition — Workstream Index & Architecture

*Started 2026-08-21. This is the dedicated marketing and patient-
acquisition workstream (extends D-022: grassroots + employer growth).
It treats acquisition as a designed, measured system — a funnel with
jobs assigned to every channel — not a list of marketing ideas.*

**Standing premise:** a good website does not create demand by existing.
Demand is earned channel by channel, relationship by relationship, and
measured from the first prospect.

---

## 1. What this workstream must produce

A practice that reaches ~140 enrolled adults (unit economics §1) and
then replaces ~28 patients/year at researched churn (R-03) — forever.
Acquisition is a **permanent function**, not a launch campaign. The
system therefore optimizes for:

- **Fit over volume** — ~140 good-fit patients, not maximum reach.
  The bottom of the funnel is a two-sided gate (D-016), and "not yet /
  not me / let me refer you well" are successful outcomes.
- **Trust over persuasion** — no urgency tactics, no lead-magnet
  funnels, no drip campaigns (website design doc §7 posture extends to
  every channel).
- **Panel-mix awareness** — channels differ in the utilization mix they
  attract (R-26). Channel selection is partly a *clinical-sustainability*
  decision, not only a growth decision. See §4.
- **Efficiency in physician time and cash** — every channel is costed in
  both currencies (`measurement.md` §4); the $20k prep ceiling (D-020)
  and ~30 hr/wk structure (D-018) bound what "working hard for patients"
  can mean.

## 2. The funnel framework, pressure-tested

The proposed frame — *Top → Middle → Bottom → Patient/Nurture* — is
correct for one kind of prospect: **the stranger who finds the practice
digitally.** It under-describes the other two ways patients actually
arrive at a practice like this. The working architecture is therefore
**one funnel fed by three engines:**

```
ENGINE A · Stranger funnel          ENGINE B · Relationship engine       ENGINE C · Employer lane
(search, content, directories,      (referral sources: physicians,       (owners, benefits brokers,
 maps, community visibility)         therapists, pharmacists, clergy,     small-employer groups)
                                     community orgs, patients)
        │                                    │                                   │
   DISCOVER ──► TRUST ──► ─┐          borrowed trust:                     contract covers members:
   (TOF)       (MOF)       │          referred people enter               members skip the funnel;
                           ▼          at or near the MEET stage           onboarding = D-016 gate
                     ┌──────────┐            │                                   │
                     │   MEET    │ ◄─────────┘                                   │
                     │ (BOF: fit │ ◄─────────────────────────────────────────────┘
                     │  gate)    │
                     └────┬─────┘
                          ▼
                   ENROLL ──► PATIENT (retain · engage · demonstrate value)
                                   │
                                   └──► referrals & word of mouth ──► feeds all three engines
```

**Amendments to the original four-stage frame:**

1. **It is a loop, not a line.** Retained patients are the terminal
   stage *and* the highest-trust top-of-funnel channel. The system is a
   flywheel: care quality → retention → word of mouth → lower-cost
   acquisition. Design retention and referral as acquisition
   infrastructure from patient one.
2. **Referral sources have their own funnel.** A specialist or therapist
   is not a lead; they are a *channel* with a lifecycle (identify → meet
   → equip → first referral → report back → refer again). Engine B is
   designed in `funnel.md` §5.
3. **Bottom of funnel is a mutual-fit gate, not a close.** The
   consultation is D-016's capacity/mix gate wearing its public face.
   The metric is *qualified-fit conversion*, and a well-executed "no"
   that ends in a good referral elsewhere is a trust asset, not a loss.
4. **A stage precedes discovery: audience choice.** Which channels we
   feed determines who arrives (R-26). The frame gets a stage zero:
   **AIM** — the deliberate channel mix that keeps heavy-utilization
   patients at ~1 in 8–10 of the panel.
5. **Time is a dimension.** Launch is 12–24 months out, after the Texas
   move (D-019). Every channel is classed as a **compounding asset**
   (buildable now, appreciates: content, domain authority, the referral
   packet, the interest list, relationships that travel) or a
   **perishable activity** (only meaningful near launch: GBP, local
   outreach, ads). Era 1 builds assets; Era 2 activates activities.
   The phased plan (`phased-plan.md`) is organized around this split.

With those amendments, the four stages stand and organize the rest of
the workstream: **Discover (TOF) · Trust (MOF) · Meet/Enroll (BOF) ·
Patient (retain/refer).**

## 3. Files in this workstream

| File | What it holds |
|---|---|
| `funnel.md` | Stage-by-stage design: discovery strategy (search-intent capture, content, physical outreach), middle-funnel mechanisms, the consultation→enrollment conversion path with its friction map, patient retention/referral design, the referral-source engine, the employer lane |
| `channels.md` | The channel map: master table of every meaningful channel with stage, intent, cost, physician time, time-to-result, scalability, and launch priority; full 13-attribute profiles for the priority channels; the referral-packet spec |
| `measurement.md` | The instrumentation: the prospect ledger, stage definitions, the monthly channel scorecard, per-channel economics (cash + physician-time CAC vs. patient value), decision rules |
| `phased-plan.md` | Pre-launch → first 10 → 25 → 50 → mature system, with the concrete weekly rhythm at each phase |
| `pre-launch.md` | The 6–12-month pre-launch campaign: the legal-boundary ladder (what's allowed before Texas licensure), founding-list/waitlist design, per-channel pre-launch map, launch-position targets, and the T-12 → T+90 backward timeline |
| `compliance.md` | Healthcare-marketing constraints: TMB advertising, testimonials/reviews, Texas all-payer anti-kickback, HIPAA in marketing, platform rules — with `NEEDS-COUNSEL` flags (feeds Q-15/Q-23) |

## 4. Channel mix as panel-mix management (the R-26 coupling)

The flat rate carries heavy-utilization patients at ~1 in 8–10 of the
panel (unit economics §3). Acquisition channels skew the mix:

| Pulls heavier | Roughly neutral | Pulls lighter |
|---|---|---|
| Condition-problem content ("fatigue never explained", "too many specialists") · therapist referrals · complex-care specialist referrals · "untangling" messaging in high-need venues | General local search ("DPC Austin", "house call doctor") · directories · community talks · clergy | Employer memberships (researched: lighter average utilization, lowest churn — D-022) · gyms/wellness venues · prevention-framed content · word of mouth from light patients |

**Standing rule:** the heavier-pulling channels are the soul of the
practice (D-014) and are never turned off — they are *balanced*, most
deliberately during ramp when every enrollee is welcome and the gate
feels expensive (R-26). The monthly scorecard tracks enrollments by
channel *and* early utilization by channel (`measurement.md` §5), so
mix correction is a channel-weighting decision, not a bedside one.

## 5. Standing rules for all acquisition work

1. **Claims discipline (R-13):** process, time, attention, price,
   structure — never outcomes that don't exist yet. Applies to every
   channel: packets, talks, directory blurbs, ads, the newsletter.
2. **No dark patterns anywhere:** no urgency, no countdowns, no
   manufactured scarcity, no aggressive sequences (website design §7
   posture, extended workstream-wide).
3. **One primary CTA everywhere:** *Book a free introductory
   conversation* — with its de-risking subtext. Channels differ in
   message; they converge on the same next step.
4. **Ask, don't surveil:** source attribution is collected by asking
   ("how did you find me?") and logged in the ledger — no ad pixels, no
   cross-site tracking (design §2; OCR tracking guidance in
   `compliance.md` §5).
5. **Every claim in these docs follows repo discipline:** researched
   facts are cited and dated; planning numbers are labeled illustrative
   priors to be replaced by ledger actuals; regulatory items carry
   `NEEDS-COUNSEL`.
6. **Simplicity is a design requirement (D-029 spirit):** one
   spreadsheet ledger, the scheduler's own stats, privacy-light site
   analytics, one newsletter tool. No CRM, no marketing platform, no
   attribution software until a measured pain justifies it (R-12).

## 6. What this workstream connects to

- **D-022** (grassroots + employer growth) — this is its execution design
- **D-016** (onboarding as enrollment/capacity gate) — the bottom of the funnel
- **R-26** (adverse selection) — §4 above; the mix-aware channel weighting
- **R-03** (ramp underperformance) — the phased plan's milestones and the
  scorecard's net-adds line are its early-warning instrument
- **R-13** (claims discipline) — standing rule 1
- **Website design** (`docs/website/design.md`) — the site is the funnel's
  LEARN surface and conversion point; this workstream feeds it traffic
  and adds the education library it deliberately deferred
- **Unit economics** — CAC guardrails and patient-value math in
  `measurement.md` §4 derive from it
- **Q-15 / Q-23** — the counsel items this work generates

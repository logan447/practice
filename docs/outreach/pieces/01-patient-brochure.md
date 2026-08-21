# Patient Brochure — Copy, v2

*Piece 1 of the standard outreach packet. Status: **v2 draft for
review** (owner feedback 2026-08-21). This version is written to House
Style from scratch: no em dashes, short sentences, ~5th-grade level, no
comparisons with other clinicians. Two visuals replace paragraphs. The
physician's credentials now appear on the back panel.*

**Owner decisions recorded (2026-08-21):**

1. The cover headline "A doctor with time to actually figure it out
   with you." is **removed**. It implies other doctors lack time.
   Nothing in the packet may compare this practice to anyone's care.
2. The brochure is **no longer verbatim website copy**. v1 condensed
   the approved site; the owner directed a strict House Style rewrite,
   which the site has not yet had. The site keeps its approved copy
   until its own House Style pass (style §8). When that pass runs,
   align the two again. Until then this file is the brochure's source
   of record.
3. One standard brochure for every audience. A physician's office must
   be able to hand it to a patient without explanation or discomfort.

**Job:** handed to a person by someone who trusts the practice enough
to pass it on. A quick scan answers: what this is, who it may help,
what I provide, how care is delivered, that it is ongoing care, the
price, who I am, how to learn more, how to book. Details live on the
website.

## Format

Letter sheet, tri-fold (roll fold). Reading order: cover → flap →
inside spread → back. Build: `print/brochure/build.py`.

---

## Panel 1 · Front cover

> **DuBose, M.D.**
> DIRECT PRIMARY CARE
>
> # Ongoing primary care for adults.
>
> **$100 a month · Cancel anytime**
> Works alongside your insurance.

*Portrait photo, lower half. Type-led, left-aligned.*

## Panel 2 · Flap (seen on opening)

> ## What this is
>
> A small medical practice with one doctor. Members pay one flat
> monthly price. I provide their ongoing primary care and stay with
> them over time.
>
> ## Who it may help
>
> - Adults who need a primary care doctor
> - Adults managing ongoing health conditions
> - Adults who want to prevent future problems
> - Adults who want care that fits their schedule

## Panel 3 · Inside left

> ## What I provide
>
> - Visits as long as they need to be
> - Direct messaging with me
> - Results reviewed and explained
> - Prescriptions and refills
> - Preventive care and checkups
> - Care for ongoing conditions
> - Referrals and coordination
>
> This is ongoing care from one doctor, not one-time advice. There are
> no per-visit charges.

## Panel 4 · Inside middle

> ## How care works
>
> *[Visual 1 — three line icons in a row]*
> **Video visits · Home visits · In-person visits**
>
> Most care is by video. I see people at home or in a clinic when an
> exam is needed.
>
> *[Visual 2 — four-step path]*
> **1 Understand your health → 2 Make a plan → 3 Work on it together →
> 4 Track progress**
>
> I answer messages within 1 to 2 business days.

## Panel 5 · Inside right

> ## The price
>
> **$100 a month**
> per adult · no contract · cancel anytime
>
> | Included | Not included |
> |---|---|
> | All care from me, with no per-visit charges | Labs and imaging · medicines · care from other doctors · hospital care |
>
> Your insurance keeps paying for those, as it does today. People with
> Medicare or Medicaid can join. One extra form is needed.
>
> ## Plain limits
>
> - I keep business hours. This is not an emergency service.
> - I take real time away each year and plan ahead for it.
> - I care for adults only.
> - When my panel is full, it is full.
>
> If the price would keep you from care, tell me. I hold a small
> number of reduced-rate memberships.

## Panel 6 · Back cover

> ## About Dr. DuBose
>
> | | |
> |---|---|
> | M.D. | Texas A&M College of Medicine |
> | Internship | Internal medicine, George Washington University |
> | Research | NIH-funded work on aging and caregiving |
> | In progress | Lifestyle medicine certification |
> | Full CV | [site]/cv |
>
> ## Start with a free conversation
>
> Thirty minutes by video, at no cost. Tell me what is going on. I
> will say honestly whether I can help. If I'm not the right fit, I'll
> say so and point you toward someone good.
>
> `[QR]` **Book:** [site]/book
> Learn more: [site]
>
> **DuBose, M.D.** · [City], Texas
> [phone] · [email]

*Bottom strip:*

> If this is an emergency, call 911 or go to the nearest ER.
> This practice is a direct primary care medical service agreement
> under Texas law. It is not health insurance.

---

## House Style check (§9)

No em dashes anywhere. No comparisons with other clinicians or the
system. No slogans. Headings state facts. Sentence enumerations
minimized; lists are vertical. One QR destination pair, back cover
only. Credentials match the About table; lifestyle medicine marked in
progress. Canonical phrases used: "when my panel is full, it is full"
and the fit phrase (both dash-free). Adults-only stated once (limits).
Price on the cover and in the price panel; the panel adds terms, so it
is not a repeat.

## Open items

1. Cover portrait: keep, or type-only cover.
2. v1's recognition panel ("If your health has started to feel like
   too much") is gone. Its job is done by "Who it may help" in fewer
   words. Confirm the owner agrees with the cut.

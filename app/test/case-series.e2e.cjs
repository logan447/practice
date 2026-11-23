/**
 * One patient across one whole year.
 *
 * The other suites each test a visit. This one tests a year: that
 * five notes written at five sittings still read as one story, that
 * the numbers in them move the way the chart says they moved, and
 * that the money adds up across the whole of it rather than only
 * within each note.
 *
 * The money is the part worth guarding. A first visit quotes three
 * visits and tells the patient a membership would cost more than
 * that. Then he gets gout in March, the year holds four visits
 * instead of three, and by the annual the membership is the cheaper
 * of the two. Every one of those four numbers is derived, and a
 * change to the per-visit price or to the quote has to move all of
 * them together or one of these assertions is wrong.
 */
const { chromium } = require('playwright');
const U = 'http://localhost:4900/';
const { tab } = require('./tabs.cjs');
const pass = []; const fail = [];
const ok = (n, c) => { (c ? pass : fail).push((c ? 'PASS  ' : 'FAIL  ') + n); };

/** Open a record by its date and return the faxed note as flat text. */
async function faxOf(p, date) {
  await p.locator(`.rec:has-text("${date}")`).first().click();
  await p.waitForTimeout(600);
  await p.click('button:has-text("Send this note")');
  await p.waitForTimeout(350);
  await p.click('.faxform .btn.ghost.small >> nth=0');
  await p.waitForTimeout(200);
  await p.fill('.faxform .fld:has-text("Fax number") input', '(512) 555-0412');
  await p.click('.faxform .btn:has-text("Preview the note")');
  await p.waitForTimeout(600);
  const raw = await p.locator('.faxout').innerText();
  /*
   * The headings off the DOM rather than out of the text. The
   * printed page is hidden on screen, so its innerText is really
   * its textContent and every line break is gone; and "Lifestyle"
   * appears in the power statement as a word long before it
   * appears as a heading.
   */
  const heads = await p.locator('.faxout .svc').allTextContents();
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const t = new String(raw.replace(/\s+/g, ' '));
  t.lines = heads.map((h) => h.trim());
  return t;
}

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  await p.goto(U, { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(900);
  await p.click('.acctbtn'); await p.waitForTimeout(200);
  await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(500);
  await p.click('text=Raymond Teal'); await p.waitForTimeout(800);
  await tab(p, 'Notes'); await p.waitForTimeout(400);

  // ----------------------------------------------- 1. the year is there
  const recs = (await p.locator('.rec').allTextContents()).join(' | ');
  ok('five visits across the year, newest first',
    ['17 Nov 2026', '19 May 2026', '24 Mar 2026', '17 Feb 2026', '18 Nov 2025']
      .every((d) => recs.includes(d)));
  ok('and the unplanned one is in among the planned ones',
    recs.indexOf('24 Mar 2026') > recs.indexOf('19 May 2026')
    && recs.indexOf('24 Mar 2026') < recs.indexOf('17 Feb 2026'));

  // ----------------------------------------------- 2. the initial
  const initial = await faxOf(p, '18 Nov 2025');
  ok('the first visit is the age he was on the day, not the age he is now',
    /4 Aug 1973 . 52 M . 18 Nov 2025/.test(initial));
  ok('four diagnoses are made at it that he arrived without',
    ['Type 2 diabetes mellitus', 'Albuminuria in diabetes', 'Mixed hyperlipidaemia',
      'Obstructive sleep apnoea'].every((d) => initial.includes(d)));
  ok('the one he arrived with is the one that is not new',
    /Hypertension — Not at goal(?!, new)/.test(initial));
  ok('a drug is stopped as well as started, with the reason',
    initial.includes('Stop hydrochlorothiazide 25 mg today')
    && initial.includes('Start lisinopril 10 mg')
    && /with protein in the urine an ACE inhibitor/.test(initial));
  ok('the sleep apnoea is suspected rather than diagnosed, and measured first',
    /Obstructive sleep apnoea — Suspected/.test(initial)
    && /no amount of advice about sleep hygiene treats an apnoea/.test(initial));
  /*
   * The pro bono first visit and the year that comes out of it.
   *
   * Every figure here is derived from the code the visit's own
   * documentation supports, so a change to one rate has to move all
   * of them together or one of these assertions is wrong. The year is
   * two planned reviews at 99215, an annual at 99215 and G0439, and
   * two visits nobody booked that the projection expects.
   */
  ok('the first assessment is free and says what the work was worth',
    /This visit\s*No charge\. A first assessment is pro bono\./.test(initial)
    && /99386 and 99205, which the benchmark values at \$386\.78/.test(initial));
  ok('the year is one plan, each visit at what its own work is worth',
    /One year plan\s*3 visits/.test(initial)
    && /Planned review, 99215\s*\$192\.39/.test(initial)
    && /Annual visit, 99396 and 99215\s*\$317\.31/.test(initial)
    && /Total\s*\$702\.09/.test(initial));
  /*
   * Two ways, not three, and the discount is for paying early rather
   * than for carrying somebody's risk. There was a monthly membership
   * with unlimited visits here, priced off a projection of how ill a
   * patient with this many problems ought to get. Every part of that
   * was a place to be wrong.
   */
  ok('and it is priced three ways, per visit, upfront, or monthly',
    /Three ways to pay/.test(initial)
    && /Per visit\s*\$702\.09/.test(initial)
    && /The year upfront\s*\$596\.78/.test(initial)
    && /Monthly\s*\$49\.73\/mo/.test(initial));
  ok('and committing saves the same whether upfront or monthly',
    /Either way of committing to the year saves \$105\.31/.test(initial));
  /*
   * Unlimited is attached to the two options that commit to the year,
   * and only to them. That is the actual trade: the patient stops
   * carrying the risk of a bad year and the practice starts.
   */
  /*
   * A new problem is charged in every option. The earlier version
   * threw unlimited acute visits into the committed price and derived
   * that price from planned visits only, which lost money on anybody
   * who got ill and lost more the iller they got.
   *
   * What is not charged is a follow-up beyond the ones projected.
   * That is a promise about the accuracy of the plan rather than
   * about the patient's health, and it is the only one of the two
   * that can be kept.
   */
  ok('a new problem is charged the same whichever way the year is paid',
    /New problems\s*\$135\.61 a visit, in business hours/.test(initial)
    && /The same price whichever way the year is paid for/.test(initial));
  ok('and a follow-up the plan did not project is not charged',
    /If the plan needs more\s*Follow-up visits beyond the ones above are not charged/
      .test(initial)
    && /an estimate that comes up short is mine to put right/.test(initial));
  ok('the year is the terms, not a payment plan',
    /Taking somebody on means the year/.test(initial)
    && /agreed as a whole or not at all/.test(initial));
  ok('the portal and business-hours messaging are named as included',
    /Every feature of the portal, and messaging in business hours/.test(initial));
  ok('the basis of every price is on the page, and so is what it is not',
    /what Original Medicare would reimburse for the code the work supports/
      .test(initial)
    && /No claim is filed and no insurer is billed/.test(initial));

  // ----------------------------------------------- 3. three months in
  const three = await faxOf(p, '17 Feb 2026');
  ok('a visit inside the quoted year is priced from the quote, not again',
    /This visit\s*\$192\.39, in the year plan made on 18 Nov 2025/.test(three));
  /*
   * Three months of visits against twelve months of membership would
   * make paying per visit look cheap for the arithmetic reason that
   * the year is not over, so the look-back waits for the annual.
   */
  ok('and no year is compared until a year has been lived',
    !three.includes('The year behind'));
  ok('the second drug is added for the kidney and the note says which',
    /Start empagliflozin 10 mg/.test(three)
    && /being started for the kidney and not for the sugar/.test(three));
  ok('the A1c has moved and the number is in the line that defends it',
    /A1c 7\.1 from 7\.9/.test(three));
  ok('the home average is what the pressure is judged on, not the office reading',
    /Home average 136\/85 over fourteen days, which is the number to use/.test(three));

  // ----------------------------------------------- 4. the acute visit
  const acute = await faxOf(p, '24 Mar 2026');
  /*
   * One problem worked, the rest triaged, and the sections it did not
   * cover still on the page saying so. The old version of this
   * assertion required the preventative heading to be absent, which
   * was the behaviour the template replaced: a section that vanishes
   * cannot be told apart from one nobody wrote down.
   */
  ok('the acute visit works one problem and triages the rest',
    /Gout — Not at goal, first flare/.test(acute)
    && /Triaged as stable/.test(acute)
    && /Remainder not performed; focused visit/.test(acute));
  ok('the thing that must not be missed is named and excluded',
    /Septic arthritis is the thing that must not be missed/.test(acute));
  ok('a first flare is treated and not turned into lifelong therapy',
    /No urate lowering therapy today/.test(acute)
    && /A first flare is not a reason to treat somebody for life/.test(acute));
  ok('the steroid is chosen over a non-steroidal for a stated reason',
    /No non-steroidal: the albuminuria and the lisinopril are the reason/.test(acute));
  /*
   * A shorter visit costs less. Charging the planned rate for an
   * acute visit would be the practice profiting from an illness,
   * and the note says why it does not.
   */
  ok('and it is priced on its own, outside the year plan',
    /This visit\s*\$135\.61\. An acute visit, which is not in the year plan/
      .test(acute)
    && /99214/.test(acute));

  // ----------------------------------------------- 5. six months
  const six = await faxOf(p, '19 May 2026');
  ok('six months in, some problems are at goal and some are not',
    /Type 2 diabetes mellitus — At goal/.test(six)
    && /Albuminuria in diabetes — Not at goal, improving/.test(six));
  ok('a number in range once is a direction and not yet a result',
    /one reading in range after six months of being out of it is a direction/.test(six));
  ok('the pillar that did not move is on the page with the ones that did',
    /Financial: new\. He does not know what the CPAP supplies/.test(six));

  // ----------------------------------------------- 6. the annual
  const annual = await faxOf(p, '17 Nov 2026');
  ok('the annual is a year older than the first visit',
    /4 Aug 1973 . 53 M . 17 Nov 2026/.test(annual));
  ok('a year of A1c is readable from the note',
    /A1c 6\.1 from 7\.9/.test(annual));
  /*
   * The reversal. The year was quoted at three visits and held four,
   * so the membership that was dearer in November is cheaper by the
   * following November, and every figure here is derived from the
   * visits that actually happened.
   */
  ok('the year behind is counted and set against what upfront would have been',
    /4 visits since 18 Nov 2025, which came to \$837\.70/.test(annual)
    && /Paying that year upfront would have been \$596\.78 for the planned visits/
      .test(annual));
  /*
   * Two problems are still off target rather than six, so the
   * projection expects one unbooked visit rather than two and next
   * year is quoted lower than the one just finished. The price is
   * personal and it moves with the patient, which is the whole
   * argument for pricing this way.
   */
  ok('the next year is planned at the visit that closes this one',
    /16 Nov 2027/.test(annual) && /One year plan\s*3 visits/.test(annual));
  /*
   * Codes are on the page, because they are the answer to "why
   * that number". What must not be on it is a claim, a payer
   * being billed, or anything about how Medicare or Medicaid work
   * with a membership, which counsel has not settled (D-039
   * guardrail 4b).
   */
  ok('every note states that nothing is being claimed from anybody',
    [initial, three, acute, six, annual].every(
      (t) => /No claim is filed and no insurer is billed/.test(t)));
  /*
   * D-039 guardrail 4b: no print piece may state how Medicare or
   * Medicaid work with a membership until counsel has settled it.
   * The payer comparison names both, so what this holds is that a
   * note naming them carries the warning that none of it is in
   * use. The warning is the only thing keeping this inside the
   * guardrail, so it is the thing worth a test.
   */
  /*
   * Every note names Original Medicare now, because that is what the
   * prices are: what it would reimburse for the code, if it were
   * billed. The thing that keeps that from being read as a claim is
   * the sentence beside it, so that sentence is what is asserted.
   *
   * The payer comparison is the separate risk, and it is the block
   * that has to carry the "not in use" band.
   */
  ok('a note naming Medicare says in the same breath that nothing is claimed',
    [initial, three, acute, six, annual].every(
      (t) => !/Medicare/.test(t)
        || /No claim is filed and no insurer is billed/.test(t)));
  ok('and the payer comparison carries its own warning wherever it appears',
    [initial, three, acute, six, annual].every(
      (t) => !/If it were billed/.test(t)
        || /Not in use\. This practice bills no insurer/.test(t)));
  ok('and the payer comparison appears only where a year is being priced',
    /Medicaid/.test(initial) && /Medicaid/.test(annual)
    && !/Medicaid/.test(acute) && !/Medicaid/.test(three));
  ok('the tetanus booster is his decision rather than our oversight',
    /asked for it with next autumn’s flu vaccine\. Recorded as his decision/
      .test(annual));

  /*
   * The template. Every note carries the same sections in the same
   * order, and the acute visit is the test of it: twenty-five minutes
   * for one toe still has the lifestyle and preventative headings,
   * saying what was not done and when it last was. A reader who
   * cannot find a section has to be able to tell "not done" from
   * "not written down", and only one of those is a note worth
   * trusting.
   */
  const SKELETON = [
    'Problems addressed today', 'Lifestyle', 'Preventative Medicine Services',
    'Review of systems', 'Full problem list', 'Medications', 'Care team',
  ];
  const notes = { initial, three, acute, six, annual };
  for (const [name, text] of Object.entries(notes)) {
    const missing = SKELETON.filter((h) => !text.lines.includes(h));
    ok(`the ${name} note carries every section of the template`,
      missing.length === 0);
    if (missing.length) console.log(`   missing: ${missing.join(', ')}`);
    // In order, not merely present: a skeleton whose parts can appear
    // anywhere is not a skeleton.
    // First occurrence: the plan repeats Lifestyle and
    // Preventative Medicine Services as headings of its own.
    const at = SKELETON.map((h) => text.lines.indexOf(h));
    ok(`the ${name} note carries them in the template's order`,
      at.every((x, i) => x >= 0 && (i === 0 || x > at[i - 1])));
  }
  ok('the focused visit says what it did not cover, rather than dropping it',
    (acute.match(/Not addressed at this visit, last reviewed 17 Feb 2026/g) || [])
      .length >= 2);
  ok('and the full visits do not carry those captions',
    !annual.includes('Not addressed at this visit'));


  /*
   * The coding is the pricing argument, so it has to be the right
   * coding. G0438 and G0439 are Medicare-only wellness codes and this
   * patient is 52, which the file got wrong until it was caught: a
   * 40 to 64 year old has a preventive visit, 99386 or 99396.
   */
  ok('the preventive codes are the ones for his age, not the Medicare ones',
    /99386/.test(initial) && /99396/.test(annual)
    && ![initial, three, acute, six, annual].some((t) => /G043[89]/.test(t)));

  /*
   * What the plan is for, which a patient otherwise leaves without.
   * Five measures on the first visit, each with the guideline behind
   * it and an aim at every visit already booked, and the estimate
   * said out loud rather than buried in a footnote.
   */
  ok('the first visit says what each number is aiming at, and by when',
    /What we are aiming at/.test(initial)
    && /Haemoglobin A1c\d?\s*7\.9 %/.test(initial)
    && /under 7\.0\s*to 7\.6\s*to 7\.3\s*to 7\.0/.test(initial));
  ok('and the weight target is read off where he started, not off a chart',
    /214 lb, ten per cent below 238/.test(initial));
  ok('the aims are called estimates on the page, not in the small print',
    /columns on the right are estimates, not promises/.test(initial)
    && /a number that misses one of these is information rather than a failure/
      .test(initial));
  ok('every target names the guideline it came from',
    /American Diabetes Association/.test(initial)
    && /Kidney Disease Improving Global Outcomes/.test(initial)
    && /edition of each guideline has not been re-checked/.test(initial));
  ok('and a measure already at target says so rather than being dropped',
    /What we are aiming at/.test(annual) && /hold/.test(annual));

  /*
   * The list is the same list each visit. A first visit hands over
   * more than any visit after it and says so; the admin help between
   * visits is named, because the items that fall off a list are the
   * administrative ones.
   */
  ok('the instructions are a running list rather than a fresh one',
    /Our running list/.test(initial)
    && /the list we keep together, not a new one each time/.test(initial));
  ok('the first visit says the list should shrink from here',
    /A first visit hands over more than any visit after it/.test(initial)
    && /It should be getting shorter/.test(annual));
  ok('and what happens between visits is on the page',
    /patient portal handles the administrative side/.test(initial)
    && /support calls on weekdays, walk-in or scheduled/i.test(initial));

  /*
   * Three ways to pay, measured against one baseline, and carrying
   * its own warning. D-039 guardrail 4b has not been settled, so the
   * page must say this is not an offer before it says anything else.
   */
  ok('the payers are priced against the one published baseline',
    /If it were billed/.test(initial)
    && /Medicaid\s*\$142\.37/.test(initial)
    && /Commercial\s*\$354\.00/.test(initial));
  ok('and the one nobody could price says UNSET rather than a guess',
    /Medicare Advantage\s*UNSET/.test(initial));
  ok('the comparison says it is not an offer, before it says anything else',
    /Not in use\. This practice bills no insurer and nothing here is an offer/
      .test(initial));

  /*
   * The scale is read against the poverty line for the household,
   * which moves with the number of people the income supports.
   */
  ok('the sliding scale is worked against the poverty line, not a tax band',
    /\$85,000 across 3 people is 311 per cent of the federal poverty guideline/
      .test(initial)
    && /15 per cent comes off: \$507\.26 for the year upfront/.test(initial));

  /*
   * No separate results section. Values sit on the problem they bear
   * on, where a reader is already looking, and the block closes with
   * one line rather than repeating the numbers three inches down.
   */
  ok('labs are on the problems they bear on, not in a section of their own',
    /Type 2 diabetes mellitus \u2014 New today\. A1c 7\.9, glucose 162/.test(initial)
    && /All labs on file relevant to the above were reviewed with the patient/
      .test(initial)
    && !/Results reviewed/.test(initial));
  ok('no note anywhere promises unlimited visits',
    ![initial, three, acute, six, annual].some((t) => /unlimited/i.test(t)));
  ok('and nothing says "Not assessed" or labels a problem twice',
    ![initial, three, acute, six, annual].some(
      (t) => /Not assessed/.test(t) || /Diagnosed today\. Ours/.test(t)));

  console.log([...pass, ...fail].join('\n'));
  console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length ? `js errors: ${errs.join(' / ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length ? 1 : 0);
})();

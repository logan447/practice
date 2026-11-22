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
  const t = (await p.locator('.faxout').innerText()).replace(/\s+/g, ' ');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
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
    /Obstructive sleep apnoea — Not assessed, suspected/.test(initial)
    && /no amount of advice about sleep hygiene treats an apnoea/.test(initial));
  /*
   * The pro bono first visit and the quote that comes out of it. The
   * membership loses on a three visit year and the note says so,
   * because a comparison that always favours the thing being sold is
   * not a comparison.
   */
  ok('the first assessment is free and the year is quoted off it',
    /This visit\s*No charge\. A first assessment is pro bono\./.test(initial)
    && /3 visits at \$350\.00 each/.test(initial)
    && /Total\s*\$1050\.00/.test(initial));
  ok('and the membership is offered honestly, dearer on a three visit year',
    /Or a membership\s*\$99 a month, \$1188\.00 for the year/.test(initial)
    && /Against the \$1050\.00 above it is \$138\.00 more/.test(initial)
    && /turns at 4 visits in a year/.test(initial));

  // ----------------------------------------------- 3. three months in
  const three = await faxOf(p, '17 Feb 2026');
  ok('a visit inside the quoted year is priced from the quote, not again',
    /This visit\s*\$350\.00, quoted on 18 Nov 2025 as one of 3 visits for the year/
      .test(three));
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
  ok('the acute visit holds one problem and triages the rest',
    /Gout — Not at goal, first flare/.test(acute)
    && /triaged as stable/.test(acute)
    && !acute.includes('Preventative Medicine Services'));
  ok('the thing that must not be missed is named and excluded',
    /Septic arthritis is the thing that must not be missed/.test(acute));
  ok('a first flare is treated and not turned into lifelong therapy',
    /No urate lowering therapy today/.test(acute)
    && /A first flare is not a reason to treat somebody for life/.test(acute));
  ok('the steroid is chosen over a non-steroidal for a stated reason',
    /No non-steroidal: the albuminuria and the lisinopril are the reason/.test(acute));
  ok('and it is priced as a visit the quote did not hold',
    /This visit\s*Not in the year that was quoted/.test(acute));

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
  ok('the year behind is counted in charged visits and priced both ways',
    /4 charged visits since 18 Nov 2025, which came to \$1400\.00/.test(annual)
    && /A membership for the same year would have been \$1188\.00/.test(annual)
    && /paying by the visit cost \$212\.00 more than a membership would have/
      .test(annual));
  ok('the next year is quoted at the visit that closes this one',
    /The year ahead\s*Quoted today and fixed for twelve months\. 3 visits at \$350\.00 each/
      .test(annual)
    && /16 Nov 2027/.test(annual));
  ok('and the membership line says what the year actually held',
    /turns at 4 visits in a year\. The year just gone held 4\./.test(annual));
  ok('nothing anywhere in the year mentions a payer, a code or a claim',
    ![initial, three, acute, six, annual]
      .some((t) => /Medicare|Medicaid|insurance company|CPT|9920[0-9]|9921[0-9]/.test(t)));
  ok('the tetanus booster is his decision rather than our oversight',
    /asked for it with next autumn’s flu vaccine\. Recorded as his decision/
      .test(annual));

  console.log([...pass, ...fail].join('\n'));
  console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length ? `js errors: ${errs.join(' / ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length ? 1 : 0);
})();

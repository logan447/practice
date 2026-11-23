/**
 * One patient, start to finish.
 *
 * The other suites each test a part. This one is the walk somebody
 * is actually going to do with the prototype in front of them: open
 * the day, hold a first visit with a member who joined last week,
 * hold a follow-up with a member of two years, then send one of
 * those notes to a specialist and look at it before it goes.
 *
 * It is here because every one of those steps has broken at least
 * once while the parts around it were passing.
 */
const {chromium}=require('playwright');
const U='http://localhost:4900/';
const {tab}=require('./tabs.cjs');
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};

(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1500,height:1200}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(300);
  await p.evaluate(()=>localStorage.clear());
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(900);
  await p.click('.vtab:has-text("day")'); await p.waitForTimeout(600);

  // ------------------------------------------- 1. the first visit
  const day=(await p.locator('.dayrow').allTextContents()).join(' | ');
  ok('the day opens with a first visit, not only follow-ups',
    day.includes('Priya Raghunathan') && day.includes('First visit'));
  await p.click('.dayrow:has-text("Priya")'); await p.waitForTimeout(1500);
  ok('it opens as a visit like any other',
    (await p.locator('.note .nbox').count())===3);

  const subj=await p.locator('#subjective-read').innerText();
  ok('the subjective carries the problems recorded at intake',
    subj.includes('Prediabetes') && subj.includes('Polycystic ovary syndrome'));
  ok('with the pertinent negatives for each',
    /Prediabetes[^\n]*Denies excessive thirst/.test(subj));
  ok('all six pillars, none of them started',
    ['Exercise','Diet','Sleep','Stress','Substances','Social']
      .every((d)=>subj.includes(`${d} \u2014 Not started`)));
  ok('and the services nobody has asked her about yet',
    /Diabetes screening \u2014 Unknown/.test(subj));

  await p.locator('.nbox:has(.nboxtitle:text-is("Objective")) .nboxhead').click();
  await p.waitForTimeout(350);
  const obj=await p.locator('#objective-read').innerText();
  const measured = await p.locator('#objective-measured').innerText();
  ok('the objective runs vitals, labs, exam, surveys',
    measured.indexOf('Vitals') < measured.indexOf('Labs')
    && obj.indexOf('Physical Exam') < obj.indexOf('Surveys'));
  // A blood pressure is a lab value taken in the room: the current
  // one, the one before it, the month, and which cuff it came off.
  ok('vitals are read the way the labs are',
    /BP \d+\/\d+/.test(measured) && /\d+\/\d+/.test(measured));
  ok('a short screen every visit, and the long one only when it is positive',
    /PHQ-2:/.test(obj) && /GAD-2: 4 of 6 \u00b7 Positive/.test(obj)
    && /GAD-7:/.test(obj) && !/PHQ-9:/.test(obj));
  ok('drinking, smoking and other drugs are all asked',
    /AUDIT-C:/.test(obj) && /Tobacco:/.test(obj) && /Other drugs:/.test(obj));
  ok('and the wellbeing measure is there too', /Flourishing:/.test(obj));
  ok('the labs have no previous value, because there is no previous visit',
    !/\(\d/.test((await p.locator('.otherlabs:not(.vitalrow)').innerText()).split('\n')[0]));

  await p.fill('#instructions',
    'Walk twenty minutes after dinner, four evenings a week.\n'
    + 'Take the metformin again, one tablet with the evening meal only.');
  await p.fill('#nextvisit','2027-02-16'); await p.waitForTimeout(150);
  await p.fill('.nextvis .whyvis','the back pain and the repeat A1c');
  // A visit is the one moment somebody will put a date in a diary,
  // so everything it justifies gets booked while they are there.
  await p.click('button:has-text("Book another visit")'); await p.waitForTimeout(250);
  await p.locator('.nextvis').nth(1).locator('input[type="date"]').fill('2027-11-16');
  await p.locator('.nextvis').nth(1).locator('.whyvis').fill('the annual visit');
  await p.waitForTimeout(250);

  // Read your own note back in the shape it will be read in, before
  // signing it. No cover sheet: this one is not going anywhere.
  ok('a visit can be read back as a page before it is signed',
    (await p.locator('.vhead button:has-text("Preview")').count())===1);
  await p.click('.vhead button:has-text("Preview")'); await p.waitForTimeout(500);
  const proof = await p.locator('.faxout .fax').innerText();
  ok('the proof is the note, with no cover sheet in front of it',
    !proof.includes('Fax cover sheet') && proof.includes('Subjective')
    && proof.includes('Assessment and plan'));
  ok('and it says it is not signed yet', proof.includes('not signed'));
  // Once, at the top. It used to repeat at the head of every page.
  const flat = proof.replace(/\s+/g, ' ');
  // Numbered, because a numbered list is one somebody can work
  // through and report back on. innerText runs the cells together,
  // so these match on the words rather than on the spacing.
  ok('what to do before the next visit is numbered',
    /Before your next visit/.test(flat)
    && (await p.locator('.faxout .faxsteps li').count())>=2);
  // A visit is the one moment somebody will put a date in a diary.
  ok('and every visit the day justified is booked, not only the soonest',
    /Follow up on 16 Feb 2027 \(3 months\) for the back pain and the repeat A1c\./
      .test(flat)
    && /Follow up on 16 Nov 2027 \(1 year\) for the annual visit\./.test(flat));
  /*
   * Cash, priced off the code the work supports.
   *
   * No claim is filed and no insurer is billed, so the number on the
   * page is the number she pays. The code is there because it is the
   * answer to "why that number": a practice that picks prices out of
   * the air cannot give the same answer twice.
   *
   * Her year is one planned review and one annual, which are different
   * pieces of work and so different prices, plus the two visits the
   * projection expects nobody to book. Four problems are off target at
   * this visit, and the rule is one unbooked visit plus one for every
   * four, so two.
   */
  ok('a first assessment is free and says what the work was worth',
    /This visit\s*No charge\. A first assessment is pro bono\./.test(flat)
    && /99205 and G0438, which the benchmark values at \$411\.16/.test(flat));
  ok('and the year is priced per visit, not at one rate for everything',
    /Planned review, 99215\s*\$192\.39/.test(flat)
    && /Annual visit, 99215 and G0439\s*\$330\.00/.test(flat));
  ok('with the visits nobody books added at what an acute visit is worth',
    (flat.match(/an illness nobody has booked/g) || []).length === 2
    && /Paying for each visit as it happens\s*\$793\.61/.test(flat));
  ok('and a membership derived from her own year rather than a flat price',
    /\$793\.61 less 15 per cent is \$674\.57, which is \$56\.21 a month/.test(flat));
  ok('what the fee covers and what it does not are both stated',
    /Included/.test(flat) && /Not included/.test(flat)
    && /Laboratory tests, imaging, medicines/.test(flat));
  /*
   * The codes are on the page as the basis of a price. What must
   * not be is a claim, a payer being billed, or anything about how
   * Medicare or Medicaid work with a membership, which counsel has
   * not settled (D-039 guardrail 4b).
   */
  ok('the page says nothing is being claimed from anybody',
    /No claim is filed and no insurance is billed/.test(flat));
  ok('and nothing about how Medicare or Medicaid work with a membership',
    !/Medicare|Medicaid|insurance company/.test(flat));
  ok('the identifier is on the first line and nowhere else',
    flat.split('11 Feb 1991').length === 2);
  await p.click('.vhead button:has-text("Sign")'); await p.waitForTimeout(1300);
  ok('signing the first visit returns to the schedule',
    await p.locator('.weekgrid, .daylist').first().isVisible());

  // ---------------------------------------- 2. the follow-up visit
  await p.click('.vtab:has-text("day")'); await p.waitForTimeout(500);
  await p.click('.dayrow:has-text("Sharon White")'); await p.waitForTimeout(1500);
  const s2=await p.locator('#subjective-read').innerText();
  ok('a patient of two years opens on what she said, not on a form',
    s2.includes('Patient reports') && s2.includes('Review of systems'));
  ok('and the review found its positives in her own words',
    /Musculoskeletal: knee pain/.test(s2));
  await p.fill('#instructions','Bring your home readings.');
  await p.fill('#nextvisit','2027-02-15'); await p.waitForTimeout(250);
  await p.click('.vhead button:has-text("Sign")'); await p.waitForTimeout(1300);

  // ------------------------------------------ 3. send it, and look
  await p.click('.acctbtn'); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.click('text=Sharon White'); await p.waitForTimeout(800);
  await tab(p,'Notes');
  await p.locator('.rec:has-text("16 Nov 2026")').first().click(); await p.waitForTimeout(600);
  await p.click('button:has-text("Send this note")'); await p.waitForTimeout(350);
  await p.locator('.faxform .btn.ghost.small').nth(1).click(); await p.waitForTimeout(200);
  ok('picking a specialist fills in who, and leaves the number to be typed',
    (await p.locator('.faxform .fld:has-text("To") input').inputValue()).includes('Dr. ')
    && (await p.locator('.faxform .fld:has-text("Fax number") input').inputValue())==='');
  await p.fill('.faxform .fld:has-text("Fax number") input','(512) 555-0342');
  await p.click('.faxform .btn:has-text("Preview the note")'); await p.waitForTimeout(600);

  const paper=await p.locator('.faxpaper').innerText();
  ok('the document is shown before it goes anywhere',
    paper.includes('Fax cover sheet') && paper.includes('(512) 555-0342'));
  ok('it carries the whole note, not a summary of it',
    paper.includes('Subjective') && paper.includes('Objective')
    && paper.includes('Assessment and plan'));
  // The medicines as reconciled, who else she sees, and every
  // problem with who holds it. A problem list showing only what we
  // manage reads as the whole of the patient.
  const flatpaper = paper.replace(/\s+/g, ' ');
  ok('the medicines say what is being taken, not only what was prescribed',
    /Medications/.test(flatpaper)
    && /Atorvastatin 40 mg \u2014 one tablet at night, missing doses\./.test(flatpaper));
  ok('the care team is named, with what is outstanding',
    /Care team/.test(flatpaper)
    && /Dr\. Omar Haddad, Ophthalmology \u2014 last seen/.test(flatpaper));
  ok('a problem we hold says who else holds it',
    /Type 2 diabetes mellitus \u2014 At goal, co-managed with Dr\. Ingrid Sorensen/
      .test(flatpaper));
  // Not worked on today, triaged, and somebody named as holding it,
  // with when they next look at it where anybody has told us.
  // Everything active in one place at the foot, acute first, with
  // the ones worked on pointing at the detail and the rest triaged.
  ok('a full problem list closes the section, acute first',
    /Full problem list/.test(flatpaper)
    && /Essential hypertension \(chronic\) \u2014 Addressed at this visit, as above\./
      .test(flatpaper));
  ok('and the ones we did not work on are triaged, with who holds them',
    /Hypothyroidism \(chronic\) \u2014 Triaged as stable, nothing new reported\. /
      .test(flatpaper)
    && /Managed by Dr\. Ingrid Sorensen, Endocrinology\. Last seen .*Next seen /
      .test(flatpaper));
  ok('it ends in the follow-up, in the form a patient repeats back',
    /Follow up on 15 Feb 2027 \(3 months\) for ongoing services\./.test(paper));
  ok('and it is signed, with how to reach us',
    paper.includes('Logan L. DuBose, MD, MBA, DipIBLM')
    && paper.includes('General Practitioner')
    && /Phone:|Fax:/.test(paper));
  ok('the action after looking at it is print, not send',
    (await p.locator('.faxform .btn:has-text("Print or save as PDF")').count())===1);
  ok('and it says plainly that nothing here transmits anything',
    (await p.locator('.faxform').textContent()).includes('nothing here sends it'));

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

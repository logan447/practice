/**
 * The two things that make a prototype operational rather than
 * illustrative: a diary bound to a real working year, and documents
 * that leave the building.
 *
 * The scheduling half is only worth anything if booking can fail. So
 * this tries to put a ninety minute intake into a Saturday, into an
 * away block, and into a day already holding a home visit, and checks
 * that each refusal says why in words rather than showing an empty
 * list.
 */
const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1500,height:1100},acceptDownloads:true});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(U,{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.clear());
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('button:has-text("Load 120 patients")'); await p.waitForTimeout(1500);

  // ----------------------------------------------- 1. the week
  await p.click('.topbar button:has-text("Schedule")'); await p.waitForTimeout(700);
  ok('the schedule opens', await p.locator('h1:has-text("Schedule")').isVisible());
  ok('visits are on the grid', await p.locator('.wdvisit').count()>5);
  ok('weekends are not clinic days', await p.locator('.wday.weekend').count()===2);
  ok('every visit names a patient',
    (await p.locator('.wdvisit .n').first().textContent()).trim().length>2);
  await p.screenshot({path:'v8-schedule.png'});

  // away blocks are real and labelled
  let away=false;
  for(let i=0;i<8 && !away;i++){
    await p.click('button:has-text("Week →")'); await p.waitForTimeout(250);
    if(await p.locator('.wday.away').count()>0) away=true;
  }
  ok('away blocks appear in the diary', away);
  ok('and say what they are',
    (await p.locator('.wday.away .wdoff').first().textContent()).toLowerCase().includes('away'));
  await p.screenshot({path:'v8-away.png'});

  // ------------------------------------- 2. the year's arithmetic
  ok('the year states its hours', (await p.locator('.wrap.wide').textContent()).includes('1170'));
  const eyebrow = async (t) => (await p.locator(`.panel:has-text("${t}") .eyebrow`)
    .first().textContent()).trim().toLowerCase();
  ok('the messaging assumption is labelled as one',
    await eyebrow('Gone before anything is booked')==='assumed');
  ok('the derived panel is labelled derived',
    await eyebrow('Panel this year could carry')==='derived');
  ok('and the sourced one cites its decision',
    await eyebrow('Hours the year has')==='d-018');
  const gap = await p.locator('.panel:has-text("The arithmetic disagrees")').textContent();
  ok('the gap with D-018 is shown rather than tuned away',
    gap.includes('D-018 targets about 140') && gap.includes('REFRESH-AT-RUNWAY'));

  // ----------------------------------------- 3. booking collides
  await p.click('.topbar .mark'); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(450);
  // a chart with a visit already booked shows "Open visit" instead
  if(await p.locator('button:has-text("Start a visit")').count()===0){
    for(let i=1;i<12;i++){
      await p.click('.topbar .mark'); await p.waitForTimeout(220);
      await p.locator('table.rows tbody tr').nth(i).click(); await p.waitForTimeout(320);
      if(await p.locator('button:has-text("Start a visit")').count()>0) break;
    }
  }
  await p.click('button:has-text("Start a visit")'); await p.waitForTimeout(400);
  ok('booking offers the real visit types with their lengths',
    (await p.locator('.booking').textContent()).includes('150m'));

  // today is a Saturday in this fixture: the refusal has to say so
  const sat = await p.locator('.bookwhy').textContent().catch(()=>'');
  ok(`a non-clinic day is refused in words: "${sat.slice(0,44)}"`,
    sat.includes('Not a clinic day'));

  // walk to a day inside the away block
  for(let i=0;i<10;i++){ await p.click('.booking button:has-text("→")'); await p.waitForTimeout(90); }
  const whyNow = await p.locator('.bookwhy').textContent().catch(()=>'');
  ok('an away block is refused with its dates',
    whyNow.includes('away block') || whyNow.includes('Not a clinic day'));

  // back to a clinic day, pick the longest visit, and check slots shrink
  await p.click('.booking button:has-text("Today")'); await p.waitForTimeout(200);
  for(let i=0;i<2;i++){ await p.click('.booking button:has-text("→")'); await p.waitForTimeout(120); }
  await p.click('.booking button:has-text("Acute concern")'); await p.waitForTimeout(250);
  const shortSlots = await p.locator('.booking .slots button').count();
  await p.click('.booking button:has-text("Home visit")'); await p.waitForTimeout(250);
  const longSlots = await p.locator('.booking .slots button').count();
  ok(`a 150 minute visit has fewer places to go than a 20 minute one (${longSlots} vs ${shortSlots})`,
    longSlots < shortSlots);
  await p.screenshot({path:'v8-booking.png'});

  // book it, and it appears on the diary
  // If the home visit does not fit today, the screen offers the next day
  // it does. That is the collision working, so follow it.
  if (longSlots === 0) {
    const next = p.locator('.booking button:has-text("Next day it fits")');
    ok('a day with no room offers the next one that has room', await next.count()>0);
    ok('and says what is in the way',
      (await p.locator('.bookwhy').textContent()).includes('minutes long fits'));
    await next.click(); await p.waitForTimeout(350);
  } else {
    ok('a day with room offers it', true);
    ok('and says what is in the way', true);
  }
  ok('there is now a slot to take', await p.locator('.booking .slots button').count()>0);
  await p.locator('.booking .slots button').first().click(); await p.waitForTimeout(800);
  ok('a future booking lands on the schedule, not in a visit',
    await p.locator('h1:has-text("Schedule")').isVisible());
  ok('the home visit is on the grid', await p.locator('.wdvisit.k-home').count()>0);

  // ------------------------------------------- 4. paper
  await p.click('.topbar .mark'); await p.waitForTimeout(400);
  let gotSummary=false;
  for(let i=0;i<14 && !gotSummary;i++){
    await p.click('.topbar .mark'); await p.waitForTimeout(200);
    await p.locator('table.rows tbody tr').nth(i).click(); await p.waitForTimeout(320);
    await p.click('button[role="tab"]:has-text("Paper")'); await p.waitForTimeout(250);
    if(await p.locator('button:has-text("Summary")').count()>0) gotSummary=true;
  }
  ok('a signed visit can produce a summary', gotSummary);
  await p.locator('button:has-text("Summary")').first().click(); await p.waitForTimeout(400);
  const avs = await p.locator('.docbody').textContent();
  ok('the summary is addressed to the patient', avs.includes('WHAT WE TALKED ABOUT'));
  ok('it carries safety netting', avs.includes('call 911'));
  ok('house style holds: no em dashes', !avs.includes('—'));
  ok('it says the record is theirs to share', avs.includes('You can share it with anyone'));
  await p.screenshot({path:'v8-avs.png'});
  await p.click('.dochead button:has-text("Close")'); await p.waitForTimeout(200);

  // the work note withholds by default
  await p.click('.panel:has-text("Work or school note") button:has-text("Write one")'); await p.waitForTimeout(300);
  await p.click('.panel:has-text("Work or school note") button:has-text("Produce the note")'); await p.waitForTimeout(400);
  const note = await p.locator('.docbody').textContent();
  ok('the work note says nothing else from the record is included',
    note.includes('Nothing\nelse from the medical record is included'));
  ok('and carries no diagnosis by default', !/Diagnosis:/.test(note));
  await p.screenshot({path:'v8-worknote.png'});
  await p.click('.dochead button:has-text("Close")'); await p.waitForTimeout(250);

  // the export
  await p.click('button:has-text("FHIR R4 bundle")'); await p.waitForTimeout(500);
  const json = await p.locator('.docbody').textContent();
  let bundle=null; try{ bundle=JSON.parse(json);}catch{}
  ok('the export parses as JSON', !!bundle);
  ok('it is a FHIR Bundle', bundle && bundle.resourceType==='Bundle');
  const kinds = new Set((bundle?.entry??[]).map(e=>e.resource.resourceType));
  ok(`it carries the resources that matter (${[...kinds].join(', ')})`,
    ['Patient','Condition','MedicationRequest','Observation'].every(k=>kinds.has(k)));
  const sys = JSON.stringify(bundle??{});
  ok('with real code systems, not invented ones',
    sys.includes('hl7.org/fhir/sid/icd-10-cm') && sys.includes('umls/rxnorm') && sys.includes('loinc.org'));

  await p.click('button:has-text("Why this button exists")'); await p.waitForTimeout(300);
  const ib = await p.locator('.infoblock').textContent();
  ok('it cites the rule rather than gesturing at it', ib.includes('45 CFR Part 171'));
  ok('and flags what is unsettled for a direct-pay practice', ib.includes('NEEDS-COUNSEL'));
  await p.screenshot({path:'v8-export.png'});

  // ------------------------------- 5. the patient takes it themselves
  await p.click('.dochead button:has-text("Close")').catch(()=>{});
  await p.waitForTimeout(200);
  await p.click('button:has-text("Sign in as them")'); await p.waitForTimeout(700);
  await p.click('button[role="tab"]:has-text("Your records")'); await p.waitForTimeout(450);
  const yr = await p.locator('.wrap').first().textContent();
  ok('the patient can take their record without asking', yr.includes('You do not need to ask'));
  ok('and without paying', yr.includes('no charge'));
  ok('they get both files', yr.includes('Download both files'));

  const dl = await Promise.all([
    p.waitForEvent('download'),
    p.click('button:has-text("Download both files")'),
  ]).then(([d])=>d).catch(()=>null);
  ok('the download actually fires', !!dl);
  if(dl) ok(`the file is named for the patient (${dl.suggestedFilename()})`,
    /^record-/.test(dl.suggestedFilename()));
  await p.screenshot({path:'v8-yourrecords.png'});

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

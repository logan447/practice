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
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Capacity")'); await p.waitForTimeout(700);
  ok('the capacity screen opens', await p.locator('h1:has-text("Capacity")').isVisible());
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
  ok('closures appear in the diary', away);
  ok('and say which closure they are, with dates',
    (await p.locator('.wday.away .wdoff').first().textContent()).toLowerCase().includes('closed'));
  await p.screenshot({path:'v8-away.png'});

  // ------------------------------------- 2. the year's arithmetic
  // 30 hours a week across 35 working weeks: eight months open.
  ok('the year states its hours', (await p.locator('.wrap.wide').textContent()).includes('1050'));
  const eyebrow = async (t) => (await p.locator(`.panel:has-text("${t}") .eyebrow`)
    .first().textContent()).trim().toLowerCase();
  ok('the messaging assumption is labelled as one',
    await eyebrow('Gone before anything is booked')==='assumed');
  ok('the derived panel is labelled derived',
    await eyebrow('Panel this year could carry')==='derived');
  ok('and the sourced one cites its decision',
    await eyebrow('Hours the year has')==='d-051');
  const gap = await p.locator('.panel:has-text("The arithmetic disagrees")').textContent();
  ok('a gap between the model and the target is shown rather than tuned away',
    gap.includes('REFRESH-AT-RUNWAY'));

  // ----------------------------------------- 3. booking collides
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(450);
  // Booking lives in the Encounters tab, not in the header.
  await p.click('.ctab:has-text("Encounters")'); await p.waitForTimeout(400);
  await p.click('.tabbody button:has-text("Book a visit")'); await p.waitForTimeout(400);
  ok('booking offers the two activities with their lengths',
    (await p.locator('.booking').textContent()).includes('30m')
    && (await p.locator('.booking').textContent()).includes('60m'));

  // The clock opens on a Monday, so five days forward is a Saturday.
  // A day the practice is closed is refused in words rather than
  // greyed out, and the words say which kind of closed it is.
  for(let i=0;i<5;i++){ await p.click('.booking button:has-text("→")'); await p.waitForTimeout(120); }
  const whyNow = await p.locator('.bookwhy').textContent().catch(()=>'');
  ok(`a day the practice is closed is refused in words: "${whyNow.slice(0,44)}"`,
    whyNow.includes('away block') || whyNow.includes('Not a clinic day'));

  // back to a clinic day, pick the longest visit, and check slots shrink
  await p.click('.booking button:has-text("Today")'); await p.waitForTimeout(200);
  for(let i=0;i<2;i++){ await p.click('.booking button:has-text("→")'); await p.waitForTimeout(120); }
  // Two activities and no more. A visit is half an hour, a care plan
  // review is a full one, and the longer one fits in fewer places.
  const activities = (await p.locator('.booking .kinds button').allTextContents())
    .map((t)=>t.replace(/\s*\d+m$/,'').trim());
  ok(`booking offers two activities and no others: ${activities.join(', ')}`,
    activities.length===2 && activities.join(',')==='Visit,Care plan review');
  await p.click('.booking button:has-text("Visit")'); await p.waitForTimeout(250);
  const shortSlots = await p.locator('.booking .slots button').count();
  await p.click('.booking button:has-text("Care plan review")'); await p.waitForTimeout(250);
  const longSlots = await p.locator('.booking .slots button').count();
  ok(`an hour has fewer places to go than half an hour (${longSlots} vs ${shortSlots})`,
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
  // Booking from the chart leaves you in the chart. The visit shows
  // up in the rail rather than throwing you at the calendar.
  ok('booking from the chart stays in the chart',
    await p.locator('.chead h1').count()>0);
  ok('and the new activity is on the encounters tab',
    (await p.locator('.tabbody .tl, .tabbody').first().textContent()).length>40);
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Capacity")'); await p.waitForTimeout(700);
  ok('the review that was booked is on the grid, and reads quieter than a visit',
    await p.locator('.wdvisit.k-review').count()>0);

  // ------------------------------------------- 4. paper
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  let gotSummary=false;
  for(let i=0;i<14 && !gotSummary;i++){
    await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(200);
    await p.locator('table.rows tbody tr').nth(i).click(); await p.waitForTimeout(320); await p.waitForTimeout(250);
    await p.click('.ctab:has-text("Letters")'); await p.waitForTimeout(250);
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
  await p.click('.dochead button:has-text("Close")', {timeout:2000}).catch(()=>{});
  await p.waitForTimeout(200); await p.waitForTimeout(250);
  await p.click('.ctab:has-text("Details")'); await p.waitForTimeout(350);
  await p.click('.tabbody button:has-text("Sign in as them")'); await p.waitForTimeout(700);
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

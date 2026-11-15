/**
 * A day, walked the way the physician walks it.
 *
 * One schedule, two encounter types, one living care plan, one inbox.
 * The claim is that those four things are enough, so this test does a
 * morning with nothing else: open the day, do a visit, do a review,
 * triage what came in over the weekend, and end up back on the day.
 *
 * The assertions that matter are the ones about what does not happen.
 * A record arriving does not change the care plan. Acknowledging it
 * does not either. The plan moves when, and only when, somebody
 * approves an encounter.
 */
const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};

(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1500,height:1150}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));});
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(300);
  await p.evaluate(()=>localStorage.clear());
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);

  // ----------------------------------------------- 1. the way in
  ok('the app opens on the day', await p.locator('button:has-text("Load the day")').isVisible());
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(900);
  ok('and lands on the schedule, not a directory',
    (await p.locator('h1').first().textContent())==='Today');

  const rows = await p.locator('.dayrow').count();
  ok(`one list, five activities (${rows})`, rows===5);
  const kinds = [...new Set((await p.locator('.dayrow .dkind .chip').allTextContents()))];
  ok(`two kinds and no others: ${kinds.join(', ')}`,
    kinds.length===2 && kinds.includes('Visit') && kinds.includes('Care plan review'));
  ok('reviews come before the clinic fills up',
    (await p.locator('.dayrow').first().textContent()).includes('Care plan review'));
  ok('each row says what is waiting on it',
    (await p.locator('.dayrow .dnew').first().textContent()).length>8);
  ok('and what version of the plan it opens on',
    (await p.locator('.dayrow .dnew').first().textContent()).includes('version'));

  // ------------------------------------------- 2. the inbox is separate
  const bar = await p.locator('.inboxbar:not(.closingbar)').textContent();
  ok(`the inbox is counted on the day: "${bar.replace(/\s+/g,' ').trim().slice(0,40)}"`,
    /\d+ waiting in the inbox/.test(bar));
  ok('with urgency called out', bar.includes('flagged urgent'));

  // ------------------------------------------------ 3. a care plan review
  await p.locator('.dayrow:has-text("Sharon White")').click(); await p.waitForTimeout(900);
  ok('a review opens on the approved care plan',
    (await p.locator('.page-head').textContent()).includes('opened on version 1'));
  ok('the document is the care plan itself, not a note about it',
    (await p.locator('.panel:has-text("Living care plan, working copy")').count())===1);
  const secs = await p.locator('.wsec').allTextContents();
  ok(`it keeps the SOAP shape: ${secs.join(', ')}`,
    secs.join(',')==='Subjective,Objective,Assessment,Follow-up');
  ok('every managed problem is editable in place',
    (await p.locator('.wprob textarea').count())>=4);
  ok('a review dictates rather than listens',
    (await p.locator('button:has-text("Start dictating")').count())===1
    && (await p.locator('button:has-text("Start listening")').count())===0);

  await p.click('button:has-text("Start dictating")'); await p.waitForTimeout(12000);
  const marked = await p.locator('.markchip').count();
  ok(`dictation lands in the document itself (${marked} fields marked)`, marked>=4);
  ok('and says which parts it wrote',
    (await p.locator('.markchip').first().textContent()).includes('from the capture'));

  // reconcile, ask, approve
  const items = await p.locator('.newitem').count();
  ok(`what arrived since is beside the plan (${items})`, items>0);
  await p.locator('.newitem .linkish').first().click(); await p.waitForTimeout(250);
  ok('each record can be ticked off as read',
    (await p.locator('.newitem.done').count())===1);
  await p.fill('input[placeholder="What do you need from them?"]',
    'Send your home readings from the last two weeks.');
  await p.click('.panel:has-text("Ask the patient") button:has-text("Add")');
  await p.waitForTimeout(300);
  ok('and what we need back is written while it is in mind',
    (await p.locator('.askrow').count())>=3);

  const before = await p.locator('.panel:has-text("Living care plan") .psum').first().textContent();
  await p.click('.reviewgrid button:has-text("Approve")'); await p.waitForTimeout(1000);
  ok('approving returns to the day', await p.locator('.daylist').isVisible());
  const sharon = await p.locator('.dayrow:has-text("Sharon White")').textContent();
  ok('the row is marked approved and the plan has moved on',
    sharon.includes('Approved') && sharon.includes('version 2'));

  // ---------------------------------------------------- 4. a visit
  await p.locator('.dayrow:has-text("Marcus Reyes")').click(); await p.waitForTimeout(900);
  ok('a visit listens rather than dictates',
    (await p.locator('button:has-text("Start listening")').count())===1);
  ok('and asks how the room was arranged, not which code it is',
    (await p.locator('.panel:has-text("This encounter") button:has-text("Telehealth")').count())===1);
  ok('the wellness elements are a thing you did, not a thing you booked',
    (await p.locator('.wellrow').textContent()).includes('never because the slot was booked'));
  await p.click('button:has-text("Leave without approving")'); await p.waitForTimeout(700);

  // ------------------------------------------------- 5. the inbox
  await p.click('.inboxbar:not(.closingbar)'); await p.waitForTimeout(700);
  const waiting = await p.locator('.inboxrow').count();
  ok(`the inbox holds what arrived (${waiting})`, waiting>0);
  ok('urgent sorts to the top',
    (await p.locator('.inboxrow').first().getAttribute('class')).includes('urgent'));
  ok('and an urgent row does not lead with the deferral',
    (await p.locator('.inboxrow.urgent .iracts button').first().textContent())
      .includes('Review this now'));

  // defer a calm one and check nothing moved
  const calm = p.locator('.inboxrow:not(.urgent)').first();
  const who = (await calm.locator('.irwho').textContent()).trim();
  await calm.locator('button:has-text("Acknowledge")').click(); await p.waitForTimeout(600);
  await p.click('button:has-text("Handled")'); await p.waitForTimeout(500);
  const done = (await p.locator('.irdone').first().textContent()).replace(/\s+/g,' ');
  ok('acknowledging tells the patient something true', done.includes('I have read'));
  ok('and says the clinical work is still to come',
    done.includes('Still to be read into the plan'));

  // the expedite path
  await p.click('button:has-text("Waiting")'); await p.waitForTimeout(400);
  await p.locator('.inboxrow.urgent').first()
    .locator('button:has-text("Review this now")').click();
  await p.waitForTimeout(1000);
  ok('reviewing now opens a care plan review, not a new kind of thing',
    (await p.locator('.page-head h1').textContent())==='Care plan review');
  ok('and it is the same document as every other encounter',
    (await p.locator('.panel:has-text("Living care plan, working copy")').count())===1);
  await p.click('button:has-text("Leave without approving")'); await p.waitForTimeout(700);
  ok('and it did not add a sixth thing to the day',
    (await p.locator('.dayrow').count())===5);

  // ------------------------------------- 6. the negative assertion
  await p.click('.topbar button:has-text("Patients")'); await p.waitForTimeout(400);
  await p.fill('input[aria-label="Search patients"]',who.split(' ')[0]); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(800);
  const line = await p.locator('.derivedfrom').textContent();
  ok(`acknowledging in the inbox did not move their care plan: "${
    line.replace(/\s+/g,' ').trim().slice(0,52)}"`,
    /not yet incorporated/.test(line));

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

/**
 * A day, walked the way the physician walks it.
 *
 * One schedule, one kind of encounter, one inbox. The claim is that
 * those three things are enough, so this test does a morning with
 * nothing else: open the day, read a chart, do a visit, triage what
 * came in over the weekend, and end up back on the day.
 *
 * The assertions that matter are the ones about what does not happen.
 * A record arriving does not change the care plan. Acknowledging it
 * does not either. The plan moves when, and only when, somebody
 * approves an encounter.
 */
const {chromium}=require('playwright');
const {tab, versionLine}=require('./tabs.cjs');
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
    (await p.locator('h1').first().textContent())==='Schedule');
  ok('as a week, which is the unit a practice plans in',
    (await p.locator('.vtab.on').textContent())==='week'
    && (await p.locator('.weekgrid .wday').count())===7);
  ok('with the week it is actually in',
    (await p.locator('.page-head .sub').textContent()).includes('16 Nov 2026 to 22 Nov 2026'));

  // The day is one of three views over the same list, and it is the
  // one that carries what a physician needs before walking in.
  await p.click('.vtab:has-text("day")'); await p.waitForTimeout(500);
  const rows = await p.locator('.dayrow').count();
  ok(`one list, five activities (${rows})`, rows===5);
  // One kind of thing on the day. The care plan review was a second
  // kind and is gone: two flows meant the second was the one skipped.
  const day = (await p.locator('.dayrow').allTextContents()).join(' | ');
  ok('one kind of activity and no others',
    !/Care plan review/.test(day));
  ok('and the month is there for finding a free fortnight',
    await p.locator('.vtab:has-text("month")').isVisible());
  ok('each row says what is waiting on it',
    (await p.locator('.dayrow .dnew').first().textContent()).length>8);
  ok('and what version of the plan it opens on',
    (await p.locator('.dayrow .dnew').first().textContent()).includes('version'));

  // ------------------------------------------- 2. the inbox is separate
  const bar = await p.locator('.inboxbar').textContent();
  ok(`the inbox is counted on the day: "${bar.replace(/\s+/g,' ').trim().slice(0,40)}"`,
    /\d+ waiting in the inbox/.test(bar));
  ok('with urgency called out', bar.includes('flagged urgent'));

  // ------------------------------------------- 3. the chart review
  await p.locator('.dayrow:has-text("Sharon White")').click(); await p.waitForTimeout(900);
  ok('a visit opens on the approved care plan',
    (await p.locator('.openedon').textContent()).includes('version 1'));
  const secs = await p.locator('.fold.d1 > .foldhead .foldtitle').allTextContents();
  ok(`the note runs in the order the conversation does: ${secs.join(', ')}`,
    secs.join(',')==='Subjective,Objective,Assessment,Plan,What they do next');
  // Each one is a line until it is opened, and opening it is a field.
  const blocks = await p.locator('.note .fold.d3').count();
  ok(`every problem, pillar and service has its own block (${blocks})`, blocks>=30);
  await p.click('.note .fold.d3 > .foldhead'); await p.waitForTimeout(250);
  ok('and opening one is a field with the record already in it',
    (await p.locator('.note .fold.d3:not(.shut) textarea').count())===1);
  ok('a visit listens', (await p.locator('button:has-text("Listen")').count())===1);

  await p.click('button:has-text("Listen")'); await p.waitForTimeout(12000);
  const marked = await p.locator('.markchip').count();
  ok(`the capture lands in the document itself (${marked} fields marked)`, marked>=3);
  ok('and says which parts it wrote',
    (await p.locator('.markchip').first().textContent()).includes('from the capture'));

  await p.fill('#instructions','Bring your home readings.\nStart the half tablet on Monday.');
  await p.fill('#nextvisit','2027-02-15');
  ok('what they do next is written in steps, ending in a date',
    (await p.locator('#instructions').inputValue()).split('\n').length===2);

  await p.click('.reviewgrid button:has-text("Sign")'); await p.waitForTimeout(1200);
  // The capture is deliberately fallible, so signing shows what went
  // into the record before it lets go of the screen.
  ok('signing shows what the capture got wrong, before leaving',
    (await p.locator('.draftcheck').count())===1);
  await p.click('.draftcheck .linkish'); await p.waitForTimeout(900);
  ok('approving returns to the schedule', await p.locator('.weekgrid').isVisible());
  await p.click('.vtab:has-text("day")'); await p.waitForTimeout(500);
  const sharon = await p.locator('.dayrow:has-text("Sharon White")').textContent();
  ok('the row is marked approved and the plan has moved on',
    sharon.includes('Approved') && sharon.includes('version 2'));

  // -------------------------------------- 4. the pre-visit walkthrough
  await p.click('.acctbtn'); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr:has-text("Marcus")').first().click();
  await p.waitForTimeout(700);
  await p.click('.cacts button:has-text("Chart review")'); await p.waitForTimeout(700);
  ok('the chart review walks the tabs in the chart\'s own order',
    (await p.locator('.wstep').count())===11);
  ok('and says what each section is being opened to answer',
    (await p.locator('.walkask').textContent()).length>30);
  await p.click('.walkacts button:has-text("Dictate")'); await p.waitForTimeout(2600);
  const said = await p.locator('.walksay').inputValue();
  ok(`dictation is about this chart, not a chart: "${said.slice(0,44)}"`, said.length>20);
  for (let i=0;i<10;i++) { await p.click('.walkacts button:has-text("Next")'); await p.waitForTimeout(220); }
  await p.click('.walkacts button:has-text("Finish")'); await p.waitForTimeout(700);
  ok('it records what was opened and what was said',
    (await p.locator('.wrline.on').count())===11);
  await p.click('button:has-text("Start the visit")'); await p.waitForTimeout(1100);
  ok('and the visit offers it rather than making you type it again',
    (await p.locator('.panel:has-text("This visit")').textContent())
      .includes('Put what you said into this note'));
  await p.click('.panel:has-text("This visit") .linkish'); await p.waitForTimeout(400);
  ok('taking it fills the note',
    (await p.locator('#sOverall').inputValue()).length>10);
  ok('the right column is instructions, the visit and the orders',
    (await p.locator('.panel h2:has-text("Patient instructions")').count())===1
    && (await p.locator('.panel h2:has-text("This visit")').count())===1
    && (await p.locator('.panel h2:has-text("Orders")').count())===1
    && (await p.locator('text=Ask the patient').count())===0);
  // One way out of a visit, and it goes to the chart.
  await p.click('.backlink'); await p.waitForTimeout(700);
  ok('leaving a visit lands on the chart it belongs to',
    (await p.locator('.chead h1').count())===1);
  await p.click('.acctbtn'); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Schedule")'); await p.waitForTimeout(700);
  await p.click('.vtab:has-text("day")'); await p.waitForTimeout(400);

  // ------------------------------------------------- 5. the inbox
  await p.click('.inboxbar'); await p.waitForTimeout(700);
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
  ok('reviewing now brings their visit forward, not a new kind of thing',
    (await p.locator('.page-head h1').textContent())==='Visit');
  ok('and it is the same document as every other encounter',
    (await p.locator('.fold.d1 > .foldhead .foldtitle').count())===5);
  await p.click('.backlink'); await p.waitForTimeout(700);
  await p.click('.acctbtn'); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Schedule")'); await p.waitForTimeout(700);
  await p.click('.vtab:has-text("day")'); await p.waitForTimeout(400);
  // Bringing a visit forward moves an existing one or adds exactly
  // one. What it must never do is invent a second kind of activity.
  const after = (await p.locator('.dayrow').allTextContents()).join(' | ');
  ok(`and the day is still one kind of thing (${await p.locator('.dayrow').count()} rows)`,
    !/Care plan review/.test(after));

  // ------------------------------------- 6. the negative assertion
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.fill('input[aria-label="Search patients"]',who.split(' ')[0]); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(800);
  const line = await versionLine(p);
  ok(`acknowledging in the inbox did not move their care plan: "${line.slice(0,56)}"`,
    /not yet incorporated/.test(line));

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

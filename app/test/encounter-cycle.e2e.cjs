/**
 * The cycle, start to finish.
 *
 * Approved chart, new information arrives, encounter, review, ask,
 * sign, patient answers, next encounter reads the answer. The whole
 * claim of the design is that each of those steps is visible and that
 * nothing skips a physician, so this walks all of them.
 *
 * The assertion that matters most is the negative one: the approved
 * chart does not move when records arrive. Everything else in the
 * workflow exists to make that safe rather than merely true.
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
  await p.click('button:has-text("Load 3 examples")'); await p.waitForTimeout(700);
  await p.fill('input[aria-label="Search patients"]','Sharon'); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(800);

  // ------------------------------------------ 1. an approved chart
  const line = await p.locator('.derivedfrom').textContent();
  ok(`the chart is a version, not a feed: ${line.replace(/\s+/g,' ').slice(0,46)}`,
    /Version 1, approved/.test(line));
  ok('and says what has arrived that it has not incorporated',
    /3 records since, not yet incorporated/.test(line));
  const before = await p.locator('.soap').first().textContent();
  ok('the approved chart does not contain the unincorporated records',
    !before.includes('podiatrist') && !before.includes('urgent care place'));

  // --------------------------------------------- 3. open a review
  await p.click('button:has-text("CCM review")'); await p.waitForTimeout(800);
  ok('the review opens on the approved version',
    (await p.locator('.page-head').textContent()).includes('opened on version 1'));
  const tray = await p.locator('.panel:has-text("New since version")').textContent();
  ok('with everything new beside it', tray.includes('Health update'));
  ok('including what they said happened since the last visit',
    tray.includes('Urgent care') && tray.includes('urgent care place'));
  ok('the working copy marks what has changed',
    (await p.locator('.wprob.moved').count())>0);
  ok('and carries the plan forward from the approved version',
    (await p.locator('.wprob textarea').first().inputValue()).length>20);

  // ------------------------------------------------ 5. ask for things
  const openAsks = await p.locator('.askrow').count();
  ok(`the requests from the last approval are still open (${openAsks})`, openAsks===2);
  await p.fill('input[placeholder="What do you need from them?"]',
    'Send the home blood pressure readings from the last two weeks.');
  await p.click('.panel:has-text("Ask the patient") button:has-text("Add")');
  await p.waitForTimeout(300);
  ok('a new request can be written during the encounter',
    (await p.locator('.askrow').count())===openAsks+1);
  ok('and the review records its own time',
    (await p.locator('.panel:has-text("Time on this review")').count())===1);

  // --------------------------------------------------- 6. sign it
  ok('signing is one action, and it says what it will publish',
    (await p.locator('.reviewgrid button:has-text("Sign")').textContent())
      .includes('publish version 2'));
  await p.click('.reviewgrid button:has-text("Sign")'); await p.waitForTimeout(800);
  const after = await p.locator('.derivedfrom').textContent();
  ok('the chart advances to the next version', /Version 2, approved today/.test(after));
  ok('and nothing is left unincorporated', /Nothing new since/.test(after));
  const nowText = await p.locator('.soap').first().textContent();
  ok('the published version now contains what was reviewed',
    nowText.includes('podiatrist') || nowText.includes('urgent care'));
  ok('the chart changed only because somebody signed',
    before!==nowText);

  // ------------------------------------- 7. the patient answers
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(300);
  await p.keyboard.type('See their view'); await p.waitForTimeout(300);
  await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  const asked = await p.locator('.panel:has-text("From your doctor")').textContent();
  ok('the patient is told their plan was updated',
    asked.includes('Your care plan was updated'));
  ok('and what is needed from them',
    asked.includes('home blood pressure readings'));
  await p.fill('.panel:has-text("From your doctor") textarea',
    'Readings have been 124 to 128 at the top. I will have the mammogram if you book it.');
  await p.click('.panel:has-text("From your doctor") button:has-text("Send")');
  await p.waitForTimeout(600);
  ok('their answer is taken and the requests close',
    (await p.locator('.panel:has-text("From your doctor")').textContent())
      .includes('Nothing is needed from you right now'));

  // --------------------------------- 8. the next encounter reads it
  await p.click('button:has-text("Back to the chart")'); await p.waitForTimeout(700);
  const back = await p.locator('.derivedfrom').textContent();
  ok('the answer does not change the approved chart',
    /Version 2, approved today/.test(back) && /1 record since/.test(back));
  await p.click('button:has-text("CCM review")'); await p.waitForTimeout(800);
  const tray2 = await p.locator('.panel:has-text("New since version")').textContent();
  ok('it waits in the next encounter instead', tray2.includes('124 to 128'));
  ok('and what it answered is shown as answered',
    (await p.locator('.panel:has-text("Ask the patient")').textContent()).includes('Answered'));

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

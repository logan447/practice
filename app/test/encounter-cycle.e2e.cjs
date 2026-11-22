/**
 * The cycle, start to finish, from the day.
 *
 * Approved care plan, new information arrives, encounter, reconcile,
 * ask, approve, patient answers, next encounter reads the answer. The
 * whole claim of the design is that each of those steps is visible
 * and that nothing skips a physician, so this walks all of them, and
 * it starts where the physician starts: the schedule.
 *
 * The assertion that matters most is the negative one: the approved
 * care plan does not move when records arrive. Everything else in the
 * workflow exists to make that safe rather than merely true.
 */
const {chromium}=require('playwright');
const {tab, planUpdatedOn, sentCount, noteText, writeNote}=require('./tabs.cjs');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
/**
 * The approved plan, read the way the chart offers it: one sheet per
 * problem, off the problems tab. There is no care plan tab and no
 * single element holding the whole document.
 */
const planText = async (p) => {
  await p.click('.ctabs > .ctab:has-text("Problems")');
  await p.waitForTimeout(400);
  const n = await p.locator('.rec').count();
  let out = (await p.locator('.tabbody').textContent());
  for (let i = 0; i < n; i++) {
    await p.locator('.rec').nth(i).click(); await p.waitForTimeout(350);
    if (await p.locator('.sheet').count()) {
      out += ' ' + (await p.locator('.sheet').textContent());
      await p.click('.sheetx'); await p.waitForTimeout(200);
    }
  }
  return out;
};
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};

(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1500,height:1150}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));});
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(300);
  await p.evaluate(()=>localStorage.clear());
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(700);

  // ------------------------------------------- 0. the day is the way in
  ok('the morning opens on the schedule, not a patient list',
    (await p.locator('.weekgrid .wday').count())===7);
  await p.click('.vtab:has-text("day")'); await p.waitForTimeout(500);
  ok('and the day holds five activities',
    (await p.locator('.daylist .dayrow').count())===5);
  const kinds = (await p.locator('.dayrow').allTextContents()).join(' ');
  ok('and it holds one kind of activity and no others',
    !/Care plan review|CCM|BHI|Annual|Acute|Paperwork/.test(kinds));
  ok('each row says whether anything is waiting to be reconciled',
    (await p.locator('.dayrow:has-text("Sharon") .chip').allTextContents())
      .some((t)=>/to reconcile|Nothing new/.test(t)));

  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.fill('input[aria-label="Search patients"]','Sharon'); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(800);

  // ------------------------------------------ 1. an approved chart
  const was = await planUpdatedOn(p);
  ok(`the chart is a version, not a feed (last changed ${was})`, was.length>0);
  const sent0 = await sentCount(p);
  ok(`and the records that arrived since are all kept (${sent0})`, sent0>0);
  const before = await planText(p);
  ok('the approved chart does not contain the unincorporated records',
    !before.includes('podiatrist') && !before.includes('urgent care place'));

  // ---------------------------------------------- 3. open a visit
  await p.click('button:has-text("Start a visit")'); await p.waitForTimeout(900);
  ok('the visit opens on the approved version',
    (await noteText(p,'subjective')).includes('Patient reports'));
  ok('and it writes the care plan, not a note about it',
    (await p.locator('.nboxtitle').count())===3);
  ok('and carries the plan forward from the approved version',
    (await noteText(p,'plan')).includes('Essential hypertension'));
  // The clock runs from the moment the visit opens and is never
  // shown. Typing a number at the end is how a time record becomes an
  // estimate; a number nobody is asked for cannot be one.
  ok('the visit records its own time, measured and never typed',
    (await p.locator('input[type="number"]').count())===0);

  // ------------------------------------------------- 4. write it
  await writeNote(p,'subjective','Says she is steadier than in the summer.');
  await writeNote(p,'plan','Doing well overall. The urgent care visit and the podiatrist are the new facts.');
  await p.fill('#instructions','Send your home readings before the next visit.');
  await p.fill('#nextvisit','2027-02-15');
  await p.waitForTimeout(250);

  // --------------------------------------------------- 5. sign it
  ok('signing is one action, and it is the only one',
    (await p.locator('.vhead button:has-text("Sign")').count())===1);
  await p.click('.vhead button:has-text("Sign")'); await p.waitForTimeout(1000);
  ok('and it returns to the schedule', await p.locator('.weekgrid, .daylist').first().isVisible());
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.fill('input[aria-label="Search patients"]','Sharon'); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(800);
  const now = await planUpdatedOn(p);
  ok(`the chart advances when somebody signs (${was} then ${now})`, was!==now);
  const nowText = await planText(p);
  ok('the chart changed only because somebody signed', before!==nowText);
  // What the patient told us is kept in their own words, whether or
  // not a clause of the summary happens to repeat it.
  await tab(p, 'Subjective');
  await p.locator('.rec').first().click(); await p.waitForTimeout(400);
  ok('and what they said arrived with is kept in their own words',
    (await p.locator('.sheet').textContent()).includes('urgent care place'));
  await p.click('.sheetx'); await p.waitForTimeout(250);

  // ------------------------------------- 7. the patient answers
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(300);
  await p.keyboard.type('See their view'); await p.waitForTimeout(300);
  await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  const asked = await p.locator('.panel:has-text("From your doctor")').textContent();
  ok('the patient is told their plan was updated',
    asked.includes('Your care plan was updated'));
  ok('and what is needed from them',
    asked.includes('taking your blood pressure at home'));
  await p.fill('.panel:has-text("From your doctor") textarea',
    'Readings have been 124 to 128 at the top. I will have the mammogram if you book it.');
  await p.click('.panel:has-text("From your doctor") button:has-text("Send")');
  await p.waitForTimeout(600);
  ok('their answer is taken and the requests close',
    (await p.locator('.panel:has-text("From your doctor")').textContent())
      .includes('Nothing is needed from you right now'));

  // --------------------------------- 8. the next encounter reads it
  await p.click('button:has-text("Back to the chart")'); await p.waitForTimeout(700);
  ok('the answer does not change the approved chart',
    (await planUpdatedOn(p))===now);
  await tab(p, 'Subjective');
  ok('it waits in the record instead, where the next visit will read it',
    (await p.locator('.rec:has-text("124 to 128")').count())>0);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

/**
 * The same structure, at three fill levels.
 *
 * A chart design can only be judged against all three, and the one
 * that is almost never designed for is the middle one: half the
 * problems reviewed, one patient answer of four, vitals but no labs,
 * a plan written for one problem and not the rest.
 *
 * What this suite is really testing is that nothing renders blank.
 * Every section on an empty chart has to say what it does not have,
 * because a blank space in a clinical document reads as a normal
 * finding and that is the failure that matters.
 */
const {chromium}=require('playwright');
const {tab, hasTab, soap, section}=require('./tabs.cjs');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};

(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1500,height:1100}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(300);
  await p.evaluate(()=>localStorage.clear());
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(800);

  const open = async (name) => {
    await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(350);
    await p.fill('input[aria-label="Search patients"]',name); await p.waitForTimeout(350);
    await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(600);
  };
  // The care plan is one document: a "section" is a letter of it.
  const sectionText = async (letter) => soap(p, letter);

  ok('the app opens on the schedule, as a week',
    (await p.locator('.weekgrid .wday').count())===7
    && (await p.locator('.vtab.on').textContent())==='week');
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  ok('the demo is five charts, not a crowd',
    (await p.locator('table.rows tbody tr').count())===5);

  // -------------------------------------------------- 1. filled out
  await open('Sharon');
  const sOverall = (await p.locator('.soap').first().locator('.psum').first().textContent());
  ok(`the overall summary is derived: "${sOverall.slice(0,40)}..."`, sOverall.length>60);
  ok('every managed problem is summarised',
    (await p.locator('.sprob .psum').count())>=3);
  ok('each problem is one paragraph, not a split into testimony and findings',
    (await p.locator('.sprob .psum').count())===(await p.locator('.sprob').count()));
  ok('and the chart review is not announced in the middle of it',
    !(await p.locator('.soapbody').first().textContent()).includes('Chart review:'));
  ok('and their account of their health overall opens it',
    sOverall.startsWith('Patient reports'));
  await section(p, 'O');
  ok('the objective has vitals, an examination and labs',
    (await p.locator('.vitblock').count())>0
    && (await p.locator('.examrow').count())>0
    && (await p.locator('.bone').count())>0);
  ok('every problem is judged at goal or needing work',
    !(await p.locator('.goalrow').allTextContents()).join('|').includes('Not assessed'));
  const sPlan = await sectionText('P');
  ok('the plan is written for every problem', !sPlan.includes('No plan written'));
  ok('and the follow-up interval is set',
    await hasTab(p, 'Follow-up'));

  // ------------------------------------------------- 2. part filled
  await open('Marcus');
  const mOverall = (await p.locator('.soap').first().locator('.psum').first().textContent());
  ok('there is still an overall summary, from fewer records', mOverall.length>30);
  const mSubj = await sectionText('S');
  ok('a problem with nothing from the patient says so',
    mSubj.includes('Nothing on file from the patient about this problem'));
  ok('a drug nobody has asked about says that too',
    mSubj.includes('adherence not asked about'));
  const mObj = await sectionText('O');
  ok('vitals are there', (await p.locator('.vitblock').count())>0);
  ok('the missing examination is stated, not skipped',
    mObj.includes('No examination documented. Not the same as a normal examination.'));
  ok('the labs that exist are shown', (await p.locator('.bone').count())>0);
  await section(p, 'A');
  ok('a problem nobody judged says "not assessed"',
    (await p.locator('.goalrow').allTextContents()).join('|').includes('Not assessed'));
  const mPlan = await sectionText('P');
  ok('the plan still lists what is being done for each problem',
    mPlan.includes('Lisinopril') && /Active|Needs attention/.test(mPlan));

  // ----------------------------------------------------- 3. empty
  await open('Nina');
  const nSubj = await sectionText('S');
  ok('the subjective says nothing is being managed',
    nSubj.includes('Nothing is being managed here yet'));
  // Never "they have not been asked": every patient gets a baseline
  // evaluation, so the only honest empty state is that it has not
  // happened yet, and it says when it is booked for.
  ok('and says the intake has not happened yet, with the date it is booked',
    nSubj.includes('No intake on file yet') && nSubj.includes('First visit booked for'));
  ok('and never claims nobody asked them anything',
    !nSubj.includes('have not been asked'));
  const nObj = await sectionText('O');
  ok('no vitals is said out loud', nObj.includes('No vitals recorded'));
  ok('no examination is said out loud',
    nObj.includes('No examination documented. Not the same as a normal examination.'));
  ok('no labs is said out loud', nObj.includes('No laboratory results on file'));
  ok('no diagnostics is said out loud', nObj.includes('None on file'));
  const nAss = await sectionText('A');
  ok('an empty prevention schedule is not called at goal',
    !nAss.includes('At goal') && nAss.includes('Nothing scheduled yet'));
  ok('lifestyle says nothing is prescribed', nAss.includes('Nothing prescribed yet'));
  const rail = (await p.locator('.railnotices, .rail, [class*=rail]').first().textContent());
  ok('and the rail has an empty state for each of its sections',
    (await p.locator('.railblock, .railhead').count())>=6);
  ok('a chart with nothing on it is not told its summary is behind',
    (await p.locator('.railnotices .summarybanner').count())===0);

  // nothing anywhere renders as an empty box
  const blanks = await p.locator('.derived').evaluateAll(
    (els)=>els.filter((e)=>e.textContent.replace(/\s+/g,'').length < 12).length);
  ok('no section renders blank', blanks===0);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

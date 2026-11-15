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
  await p.click('button:has-text("Load 3 examples")'); await p.waitForTimeout(800);

  const open = async (name) => {
    await p.click('.topbar .mark'); await p.waitForTimeout(250);
    await p.fill('input[aria-label="Search patients"]',name); await p.waitForTimeout(350);
    await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(600);
  };
  const sectionText = async (n) =>
    (await p.locator('.soap').nth(n).textContent()).replace(/\s+/g,' ');

  ok('the demo is three charts, not a crowd',
    (await p.locator('table.rows tbody tr').count())===3);

  // -------------------------------------------------- 1. filled out
  await open('Sharon');
  const sOverall = (await p.locator('.soap').first().locator('.psum').first().textContent());
  ok(`the overall summary is derived: "${sOverall.slice(0,40)}..."`, sOverall.length>200);
  ok('every managed problem is summarised',
    (await p.locator('.sprob .psum').count())>=3);
  ok('the patient\u2019s own words are in it',
    (await p.locator('.sprob .psum .said').count())>=3);
  ok('and their account of their health overall opens it',
    sOverall.includes('how things were going overall'));
  ok('the objective has vitals, an examination and labs',
    (await p.locator('.vitblock').count())>0
    && (await p.locator('.examrow').count())>0
    && (await p.locator('.bone').count())>0);
  ok('every problem carries a gauge that is not "not assessed"',
    !(await p.locator('.gauge').allTextContents()).join('|').includes('Not assessed'));
  const sPlan = await sectionText(3);
  ok('the plan is written for every problem', !sPlan.includes('No plan written'));
  ok('and the follow-up interval is set',
    (await p.locator('.railhead:has-text("Follow-up")').count())===1);

  // ------------------------------------------------- 2. part filled
  await open('Marcus');
  const mOverall = (await p.locator('.soap').first().locator('.psum').first().textContent());
  ok('there is still an overall summary, from fewer records', mOverall.length>60);
  const mSubj = await sectionText(0);
  ok('a problem with nothing said about it says so',
    mSubj.includes('carried rather than worked on')
    || mSubj.includes('Nothing on file speaks to this problem'));
  ok('a drug nobody has asked about says that too',
    mSubj.includes('Adherence never asked about'));
  const mObj = await sectionText(1);
  ok('vitals are there', (await p.locator('.vitblock').count())>0);
  ok('the missing examination is stated, not skipped',
    mObj.includes('No examination documented. Not the same as a normal examination.'));
  ok('the labs that exist are shown', (await p.locator('.bone').count())>0);
  ok('a problem nobody gauged says "not assessed"',
    (await p.locator('.gauge').allTextContents()).join('|').includes('Not assessed'));
  const mPlan = await sectionText(3);
  ok('the problems with no plan written say so', mPlan.includes('No plan'));

  // ----------------------------------------------------- 3. empty
  await open('Nina');
  const nSubj = await sectionText(0);
  ok('the subjective says nothing is being managed',
    nSubj.includes('Nothing is being managed here yet'));
  ok('and says they have not been asked how they are',
    nSubj.includes('have not been asked'));
  const nObj = await sectionText(1);
  ok('no vitals is said out loud', nObj.includes('No vitals recorded'));
  ok('no examination is said out loud',
    nObj.includes('No examination documented. Not the same as a normal examination.'));
  ok('no labs is said out loud', nObj.includes('No laboratory results on file'));
  ok('no diagnostics is said out loud', nObj.includes('None on file'));
  const nAss = await sectionText(2);
  ok('an empty prevention schedule is not called up to date',
    !nAss.includes('Up to date') && nAss.includes('Nothing scheduled yet'));
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

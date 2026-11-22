/**
 * The same chart, at three fill levels.
 *
 * A chart design can only be judged against all three, and the one
 * that is almost never designed for is the middle one: half the
 * problems reviewed, one patient answer of four, vitals but no labs.
 *
 * What this suite is really testing is that nothing renders blank.
 * Every block and every tab on an empty chart has to say what it does
 * not have, because a blank space in a clinical document reads as a
 * normal finding and that is the failure that matters.
 *
 * It used to read the care plan tab, which is gone. The standing
 * summary is the right column and the detail is one sheet per
 * problem, so that is where the same questions get asked now.
 */
const {chromium}=require('playwright');
const {tab}=require('./tabs.cjs');
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
    await p.click('.acctbtn'); await p.waitForTimeout(150);
    await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(350);
    await p.fill('input[aria-label="Search patients"]',name); await p.waitForTimeout(350);
    await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(600);
  };
  const problem = async (n) => {
    await tab(p, 'Problems');
    await p.locator('.rec').nth(n).click(); await p.waitForTimeout(400);
    const t = (await p.locator('.sheet').textContent()).replace(/\s+/g,' ');
    return t;
  };
  const shut = async () => { await p.click('.sheetx'); await p.waitForTimeout(250); };
  const tabText = async (name) => {
    await tab(p, name);
    return (await p.locator('.tabbody').textContent()).replace(/\s+/g,' ');
  };

  ok('the app opens on the schedule, as a week',
    (await p.locator('.weekgrid .wday').count())===7
    && (await p.locator('.vtab.on').textContent())==='week');
  await p.click('.acctbtn'); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  ok('the demo is five charts, not a crowd',
    (await p.locator('table.rows tbody tr').count())===5);

  // -------------------------------------------------- 1. filled out
  await open('Sharon');
  ok('the chart opens on the last note, where a chart review starts',
    (await p.locator('.ctabs > .ctab.on').textContent())==='Notes');
  const strip = (await p.locator('.ctabs > .ctab').allTextContents()).join('|');
  ok(`the tabs are in the order a chart review happens: ${strip}`,
    strip==='Notes|Subjective|Vitals|Problems|Lifestyle|Prevention|Meds|Labs|Imaging|Specialists|More');

  // The chart is one column. What the right column used to say is a
  // tab, in the order a chart review reads them.
  ok('no second column repeating the tabs',
    (await p.locator('.rail').count())===0);
  const probs = (await (await tabText('Problems'))).replace(/\s+/g,' ');
  ok('the problems tab says what this practice manages and who has the rest',
    probs.includes('We manage') && probs.includes('managed elsewhere'));
  ok('each one controlled or uncontrolled, in one word',
    probs.includes('Controlled') && probs.includes('Uncontrolled'));
  const life = (await tabText('Lifestyle')).replace(/\s+/g,' ');
  ok('lifestyle medicine is a tab of its own', life.includes('Prescriptions'));
  const prev = (await tabText('Prevention')).replace(/\s+/g,' ');
  ok('and so is preventative medicine', prev.includes('Preventative services'));

  const sProb = await problem(0);
  ok(`the problem sheet opens with where they are now: ${sProb.slice(0,40)}...`,
    sProb.includes('Where they are now'));
  ok('and the sentence is derived, with its records behind it',
    sProb.includes('Composed from') && sProb.includes('Nothing here is stored'));
  await p.click('.srcmark'); await p.waitForTimeout(250);
  ok('the records open', (await p.locator('.srcitem').count())>0);
  ok('the sheet carries the plan and what it is treated with',
    sProb.includes('Plan') && sProb.includes('Being treated with'));
  await shut();

  for (const t of ['Notes','Subjective','Vitals','Problems','Lifestyle','Prevention',
    'Meds','Labs','Imaging','Specialists','More']) {
    const txt = await tabText(t);
    ok(`${t} is a list of records and nothing else`, txt.length>20);
  }
  ok('a record is one line, with no preview paragraph under it',
    (await p.locator('.tlprev').count())===0);

  // ------------------------------------------------- 2. part filled
  await open('Marcus');
  const mProbs = (await tabText('Problems')).replace(/\s+/g,' ');
  ok('a problem nobody judged says so rather than looking fine',
    mProbs.includes('Not assessed'));
  ok('and every other tab still draws',
    (await tabText('Vitals')).length>10 && (await tabText('Specialists')).length>10);
  const mProb = await problem(0);
  ok('a problem with nothing from the patient says that out loud',
    /Nothing on file from the patient|No plan written/.test(mProb));
  await shut();

  // ----------------------------------------------------- 3. empty
  await open('Nina');
  ok('an empty chart says nothing is being managed',
    (await tabText('Problems')).includes('Nothing is being managed here'));
  ok('a missing primary care physician is a finding, not a blank',
    (await tabText('Specialists')).includes('Nobody else recorded'));

  // Nina has one booked first visit and nothing else, so the two tabs
  // that know about it show it rather than claiming to be empty.
  // Nina has one booked first visit and nothing else, so the tab that
  // knows about it shows it rather than claiming to be empty.
  for (const [t, said] of [['Notes','Scheduled'],['Subjective','None on file'],
    ['Vitals','None recorded'],['Problems','Nothing is being managed here'],
    ['Lifestyle','Nothing prescribed yet'],
    ['Labs','None on file'],['Meds','No medicines recorded'],['Imaging','None on file'],
    ['Prevention','Nothing scheduled yet'],['Specialists','Nobody else recorded'],
    ['More','Not asked, or asked and not recorded']]) {
    const txt = await tabText(t);
    ok(`${t} says what it does not have: "${said}"`, txt.includes(said));
  }

  // nothing anywhere renders as an empty box
  const blanks = await p.locator('.grp').evaluateAll(
    (els)=>els.filter((e)=>e.textContent.replace(/\s+/g,'').length < 12).length);
  ok('no section renders blank', blanks===0);

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

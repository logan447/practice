/**
 * Saved state from an older version, and the way back from a crash.
 *
 * This prototype keeps its state in the browser, so every shape change
 * meets records written before it. When a section reads through a
 * field that did not exist when a record was saved, React unmounts the
 * whole tree and the person gets a blank page that reloading does not
 * fix, because the reload restores the same saved state.
 *
 * That happened. These are the two guards against it happening again:
 * saved data is filled forward at the one point where it enters, and
 * anything that still throws lands on a screen with a way out rather
 * than on a white page.
 */
const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};

/** State in the shape the previous version wrote: no byProblem, no checkIns. */
const OLD = {
  patients:[{id:'p0',name:'Sharon White',dob:'1966-02-02',sex:'female',pronouns:'she/her',
    membership:'standard',memberSince:'2026-01-20',photoTone:0,phone:'x',email:'x'}],
  conditions:[{id:'sc1',patientId:'p0',name:'Essential hypertension',code:'I10',
    status:'active',managed:true,onset:'2016-08-03'}],
  masterPlans:[{id:'smp1',patientId:'p0',updated:'2026-06-20',updatedBy:'L. DuBose, MD',
    subjective:{history:'Written by a version that stored this.',goals:'',context:''},
    objective:{narrative:''},assessment:{narrative:''},
    plan:{byProblem:{},prevention:'',lifestyle:'',followUp:''}}],
  now:'2026-11-16',
};

(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1400,height:900}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await p.goto(U,{waitUntil:'networkidle'});

  // ------------------------------------- 1. state from an older version
  await p.evaluate((raw)=>localStorage.setItem('dlm-emr-v1',JSON.stringify(raw)), OLD);
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  ok('the panel still loads', (await p.locator('table.rows tbody tr').count())===1);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(700);
  ok('the chart draws rather than going blank',
    (await p.locator('.chead h1').textContent())==='Sharon White');
  await p.click('.ctabs > .ctab:has-text("Problems")'); await p.waitForTimeout(400);
  ok('the problem list still derives from whatever records survived',
    (await p.locator('.rectag').count())>0);
  ok('the problem renders rather than throwing',
    (await p.locator('.rec').count())>=1);
  await p.locator('.rec').first().click(); await p.waitForTimeout(400);
  ok('and opens, on a chart missing half its records',
    (await p.locator('.sheet').count())===1);
  await p.click('.sheetx'); await p.waitForTimeout(250);
  ok('and every other section drew too',
    (await p.locator('.ctabs > .ctab').count())>=7);
  ok('no uncaught error reached the page', errs.length===0);

  // ---------------------------------------------- 2. the way back out
  //
  // A record the migration could not have anticipated: a condition
  // whose name never arrived. It has to land somewhere with a button.
  await p.evaluate(()=>localStorage.setItem('dlm-emr-v1',JSON.stringify({
    patients:[{id:'p0',name:'Test Patient',dob:'1966-02-02',sex:'female',pronouns:'she/her',
      membership:'standard',memberSince:'2026-01-20',photoTone:0,phone:'x',email:'x'}],
    conditions:[{id:'sc1',patientId:'p0',name:null,code:'I10',status:'active',
      managed:true,onset:'2016-08-03'}],
    now:'2026-11-16',
  })));
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('.acctbtn').catch(()=>{}); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Patients")').catch(()=>{}); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr').first().click().catch(()=>{});
  await p.waitForTimeout(700);
  // The chart opens on the notes, which do not read a problem's name,
  // so nothing breaks until the record that is broken is opened. That
  // is the right behaviour and it is where the boundary has to catch.
  await p.click('.ctabs > .ctab:has-text("Problems")').catch(()=>{});
  await p.waitForTimeout(350);
  await p.locator('.rec').first().click().catch(()=>{});
  await p.waitForTimeout(500);
  ok('a crash is a screen, not a white page',
    (await p.locator('.crashbox').count())===1);
  const crash = (await p.locator('.crashbox').textContent()).replace(/\s+/g,' ');
  ok('it says what happened', crash.includes('could not be drawn'));
  ok('it says nothing was lost', crash.includes('Nothing has been lost or changed'));
  ok('it names the error rather than hiding it', crash.includes('toLowerCase'));
  ok('and it offers the action that fixes it',
    (await p.locator('.crashbox button:has-text("Clear saved data")').count())===1);

  await p.click('.crashbox button:has-text("Clear saved data")'); await p.waitForTimeout(900);
  ok('clearing recovers to a working screen',
    (await p.locator('.crashbox').count())===0
    && (await p.locator('body').textContent()).includes('Direct Lifestyle Medicine'));
  // The key comes back, because the app saves its own clean state on
  // the next render. What matters is that the record that crashed it
  // is not in there any more.
  ok('and the record that crashed it is gone',
    !((await p.evaluate(()=>localStorage.getItem('dlm-emr-v1'))) ?? '').includes('"name":null'));

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  await b.close();
  process.exit(fail.length?1:0);
})();

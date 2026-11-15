/**
 * The living summary, and the things it must not become.
 *
 * Three claims are tested. That the summary lags the record and says
 * so. That nothing the assistant drafts reaches the record without a
 * person accepting it, and that interpretations are marked as such.
 * And that the export is the whole packet rather than a cover page.
 */
const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1500,height:1150},acceptDownloads:true})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(U,{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.clear());
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('button:has-text("Load 3 examples")'); await p.waitForTimeout(800);
  await p.click('text=Sharon White'); await p.waitForTimeout(700);

  // -------------------------------------------------- 1. the header
  const head = (await p.locator('.chead').textContent()).replace(/\s+/g,' ');
  ok('age and sex only', head.includes('60 F'));
  ok('past medical history carries everything', head.includes('Hypothyroidism'));
  ok('managed problems are tagged separately',
    (await p.locator('.csum .dx.on').count())===3);
  ok('services are tags, not prose',
    (await p.locator('.csum .dx.svc').allTextContents()).join('|')==='Preventative Services|Lifestyle Medicine');
  ok('no pinned note in the header', await p.locator('.cpin').count()===0);

  // ----------------------------------------- 2. the summary lags
  ok('the chart says the summary is behind the record',
    await p.locator('.summarybanner').isVisible());
  const banner = await p.locator('.summarybanner').textContent();
  ok(`it names what is new: ${banner.replace(/\s+/g,' ').slice(0,52)}`,
    /records added since the summary/.test(banner));

  // ------------------------------------------- 3. objective order
  const sections = await p.locator('.soaphead h2').allTextContents();
  ok(`SOAP in order: ${sections.join(', ')}`,
    sections.join(',')==='Subjective,Objective,Assessment,Plan');
  ok('vitals distinguish office from home',
    (await p.locator('.vitblock .vhead').allTextContents()).join('|').includes('Office')
    && (await p.locator('.vitblock.home').count())>0);
  ok('labs are fishbones', await p.locator('.bone').count()>=4);
  const bone = await p.locator('.bone').first().textContent();
  ok(`current with previous in brackets: ${bone.replace(/\s+/g,' ').slice(0,46)}`, /\(\d/.test(bone));
  ok('the examination carries its own date', await p.locator('.examrow').count()>0);

  // --------------------------------- 4. assessment as a gauge
  ok('each managed problem has a status', await p.locator('.gauge').count()===3);
  const gauges = (await p.locator('.gauge .grow').allTextContents()).join(' ');
  ok(`statuses are improving/stable/worsening: ${gauges.replace(/\s+/g,' ').slice(0,60)}`,
    /Improving|Stable|Worsening/.test(gauges));
  ok('preventative services report up to date or not',
    (await p.locator('.derived:has-text("Preventative services")').textContent()).includes('outstanding'));
  ok('lifestyle interventions carry a status',
    (await p.locator('.derived:has-text("Lifestyle medicine")').textContent()).includes('Struggling'));

  // ------------------------------------- 5. plan follows the gauge
  const plan = await p.locator('.soap').nth(3).textContent();
  ok('the plan states an intent per problem', plan.includes('Continue and keep pushing'));
  ok('a stable problem says hold', plan.includes('Hold'));
  ok('medicines are coded to the problem they are for',
    (await p.locator('.problemplan:has-text("Type 2 diabetes") .ppgrid').textContent()).includes('Metformin'));
  ok('and not to problems they are not for',
    !(await p.locator('.problemplan:has-text("Mixed hyperlipidemia") .ppgrid').textContent()).includes('Metformin'));
  ok('preventative orders are in the plan',
    plan.includes('Screening mammogram'));
  ok('follow-up moved out of the plan and into the rail',
    !plan.includes('FOLLOW-UP') && (await p.locator('.railhead:has-text("Follow-up")').count())===1);

  // ------------------------------------------ 6. the review step
  await p.click('.summarybanner button'); await p.waitForTimeout(700);
  const n = await p.locator('.proposal').count();
  ok(`the assistant proposes (${n})`, n>4);
  ok('interpretations are marked as such',
    await p.locator('.proposal.interpretation').count()>0);
  ok('and separated from what the record documents',
    (await p.locator('.drawerbody').textContent()).includes('Read into the record'));
  ok('every proposal shows what it was built from',
    await p.locator('.pbasis').count()===n);
  const before = await p.locator('.proposal').count();
  await p.locator('.proposal button:has-text("Accept")').first().click();
  await p.waitForTimeout(400);
  ok('accepting removes it from review', await p.locator('.proposal').count()===before-1);
  await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(500);
  ok('and the summary is now dated today',
    (await p.locator('.masterfoot.top').textContent()).includes('today'));

  // -------------------------------------------- 7. the packet
  await p.click('.railfoot button:has-text("Export")'); await p.waitForTimeout(700);
  const list = (await p.locator('.packetlist').textContent()).replace(/\s+/g,' ');
  ok(`the packet lists what is in it: ${list.slice(0,60)}`,
    await p.locator('.packetlist li').count()===7);
  ok('summary first, then the notes',
    list.indexOf('Summary of care') < list.indexOf('Signed visit notes'));
  await p.click('button:has-text("Read it here")'); await p.waitForTimeout(700);
  const pk = await p.locator('.packet').textContent();
  ok(`the packet is the whole record (${pk.length} chars)`, pk.length>18000);
  ok('it carries every signed note', pk.includes('Transfer of care'));
  ok('it carries the labs as resulted', pk.includes('Comprehensive metabolic panel'));
  ok('it carries the specialist letters', pk.includes('Endocrinology'));
  ok('it carries imaging and procedures', pk.includes('Screening colonoscopy'));
  ok('it carries files that could not be read',
    pk.includes('could not be read') || pk.includes('never searchable'));
  ok('and says the notes win if the summary disagrees',
    pk.includes('the notes are the record'));

  // ------------------------------- 8. billing records kept apart
  await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(300);
  await p.click('.railfoot button:has-text("Documentation")'); await p.waitForTimeout(700);
  const doc = await p.locator('.drawerbody').textContent();
  ok('each visit records the elements a level rests on', doc.includes('Problems') && doc.includes('Risk'));
  ok('both routes to a level are shown', /gives 992\d\d\./.test(doc));
  ok('care management time is tracked per month', doc.includes('min countable'));
  ok('time spent by software does not count', doc.includes('does not'));
  ok('and says why', doc.includes('not clinical staff time'));
  ok('consent is its own dated record', doc.includes('verbal'));
  ok('it points at where the research came from', doc.includes('NEEDS-COUNSEL'));
  await p.screenshot({path:'v10-documentation.png'});

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

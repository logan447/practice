/**
 * What a claim rests on, and where the chart stops.
 *
 * The assertions that matter here are the negative ones. A month that
 * has passed its time threshold is not billable. A requirement the
 * practice genuinely cannot meet is shown failing rather than hidden.
 * A visit whose minutes fall in the range CMS does not publish is not
 * assigned a code. Each of those is a place where it would be easy,
 * and wrong, for software to conclude.
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
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(700);

  // ------------------------------------------- a Medicare patient
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);

  // ------------------------------------------- a Medicare patient
  await p.fill('input[aria-label=\"Search patients\"]','Lindqvist'); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(700);
  await p.click('.ctab:has-text("Coding")'); await p.waitForTimeout(700);
  const doc=(await p.locator('.tabbody').textContent()).replace(/\s+/g,' ');

  // ---------------------------------------------- the wellness visit
  ok('a Medicare patient gets a wellness visit panel', doc.includes('Wellness visit'));
  ok('and it is the subsequent one, not the first', doc.includes('G0439'));
  ok('it says when the next one is billable', /Next billable/.test(doc));
  ok('it says no examination is required',
    doc.includes('not a head to toe physical'));
  ok('the subsequent list drops height and body mass index',
    doc.includes('Weight and blood pressure') && !doc.includes('Height, weight, body mass index'));
  ok('it drops the depression and functional reviews too',
    !doc.includes('Depression risk factors') && !doc.includes('Functional ability and safety'));
  ok('elements the chart cannot see are marked as the physician’s attestation',
    doc.includes('you attest'));
  ok('the frequency conflict is stated rather than resolved quietly',
    doc.includes('NEEDS-MAC') && doc.includes('eleven full months'));

  // ---------------------------------------- the month, as a ladder
  ok('the month is a ladder, not a yes or no',
    doc.includes('Time recorded') && doc.includes('Requirements satisfied')
    && doc.includes('Reviewed and ready'));
  ok('thirty-four countable minutes are counted', doc.includes('34 countable minutes'));
  ok('and six minutes of software time are not',
    doc.includes('6 recorded but not countable'));
  ok('the reason is on the screen', doc.includes('is not the physician'));

  // The two that must never pass for this practice.
  ok('the certified-record requirement is shown failing, not omitted',
    doc.includes('Certified electronic health record')
    && doc.includes('This prototype is not certified technology'));
  ok('and the call arrangement too', doc.includes('Access around the clock'));
  ok('so the month is not offered for attestation',
    doc.includes('requirements outstanding'));
  ok('passing the time threshold did not make it billable',
    !doc.includes('I have reviewed this month and it is billable'));

  // Every mandatory line carries where it came from.
  const rules=await p.locator('.ckrule').allTextContents();
  ok(`every requirement cites its source (${rules.length} shown)`,
    rules.length>8 && rules.every(t=>/FR |MLN|CFR|CPT|Manual|FAQ|CMS/.test(t)));

  // ----------------------------------- advanced primary care, declined
  ok('a service the patient is not on does not list its unmet requirements',
    !doc.includes('Management across the panel'));
  ok('but the code the practice decided against is named once',
    doc.includes('Advanced primary care management is not billed here'));
  ok('with the reason, and where the reasoning lives',
    doc.includes('provided by clinical staff') && doc.includes('89 FR 97876'));

  // --------------------------------------- the visit, on another chart
  
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(350);
  await p.fill('input[aria-label="Search patients"]','Sharon'); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(700);
  await p.click('.ctab:has-text("Coding")'); await p.waitForTimeout(700);
  const s=(await p.locator('.tabbody').textContent()).replace(/\s+/g,' ');
  ok('a patient who is not on Medicare gets no wellness visit panel',
    !s.includes('Wellness visit'));
  ok('visits still show both routes to a level', /gives 992\d\d\./.test(s));
  ok('a consent that recites every disclosure passes', /Verbal consent/.test(s));
  ok('and one that does not is named, disclosure by disclosure',
    s.includes('these disclosures are not recorded'));

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

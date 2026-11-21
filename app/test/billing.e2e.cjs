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
const {tab, hasTab}=require('./tabs.cjs');
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
  await tab(p, 'Coding'); await p.waitForTimeout(300);
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

  // ------------------------- care management, removed rather than hidden
  /*
   * Chronic care management, behavioural health integration and
   * advanced primary care management are not modelled any more. All
   * three are monthly programmes built around clinical staff and
   * certified technology, and this practice is one physician who does
   * not bill insurance.
   *
   * What the tab must still do is say so, and say why, rather than
   * quietly not mentioning them. Research that was expensive and then
   * declined is a decision, and a decision belongs in the record.
   */
  ok('care management programmes are named as not billed here',
    doc.includes('Care management programmes are not billed here'));
  ok('with the reason, which is the practice and not an oversight',
    doc.includes('clinical staff') && doc.includes('this practice has neither'));
  ok('advanced primary care management is named with its citation',
    doc.includes('provided by clinical staff') && doc.includes('89 FR 97876'));
  ok('and where the reasoning lives',
    doc.includes('billing-architecture.md') && doc.includes('D-050'));
  ok('no monthly ladder is left behind',
    !doc.includes('Reviewed and ready') && !doc.includes('countable minutes'));
  ok('and nothing is offered for attestation',
    !doc.includes('I have reviewed this month and it is billable'));

  // --------------------------------------- the visit, on another chart
  
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(350);
  await p.fill('input[aria-label="Search patients"]','Sharon'); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(700);
  await tab(p, 'Coding'); await p.waitForTimeout(300);
  const s=(await p.locator('.tabbody').textContent()).replace(/\s+/g,' ');
  ok('a patient who is not on Medicare gets no wellness visit panel',
    !s.includes('Wellness visit'));
  ok('visits still show both routes to a level', /gives 992\d\d\./.test(s));
  ok('and no consent machinery is left for a programme that is gone',
    !s.includes('these disclosures are not recorded'));

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

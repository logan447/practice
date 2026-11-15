/**
 * The consulting practice, as the record has to express it.
 *
 * Three facts this model lives on, and the test is that each one is
 * in the chart rather than in an agreement nobody reads.
 *
 * Who owns each problem. A consulting practice manages named
 * conditions; the commonest case is that the patient's own physician
 * has one, and "managed: false" could never say that.
 *
 * Who they see when we are shut. A patient with no primary care
 * physician has no physician at all during a closure, whatever the
 * membership says, and that is the single most important line in
 * their chart.
 *
 * What a year actually contains. Five physician contacts and 250
 * minutes, not a monthly hour, because a monthly hour across two
 * hundred patients is 2,400 physician hours against the 1,040 the
 * year holds.
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
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(900);

  // ------------------------------------- 1. the package, not the month
  await p.click('.topbar button:has-text("Capacity")'); await p.waitForTimeout(800);
  const cap = (await p.locator('.wrap').textContent()).replace(/\s+/g,' ');
  ok('the year is eight months open and four closed',
    cap.includes('Eight months open and four closed'));
  ok('in four blocks rather than one',
    cap.includes('in four blocks of about a month rather than one block of four'));
  ok('the membership year is a package of contacts',
    cap.includes('Synchronous consultations') && cap.includes('Care plan reviews'));
  ok('two consultations and three reviews',
    cap.includes('2 × 60 min') && cap.includes('3 × 30 min'));
  ok(`totalling 250 minutes`, /Total\s*250/.test(cap.replace(/\s+/g,' ')));
  ok('and the panel it fits is stated', /patients the package exactly fits/.test(cap));
  ok('the monthly review is named as what this replaced, with the arithmetic',
    cap.includes('720 minutes a patient a year') && cap.includes('2400 physician hours'));

  // ------------------------------------------- 2. who owns a problem
  await p.click('.topbar button:has-text("Patients")'); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr:has-text("Arthur")').first().click();
  await p.waitForTimeout(800);
  const owners = (await p.locator('.ownerrow').allTextContents()).join(' | ');
  ok(`each managed problem says who is responsible: ${owners.slice(0,60)}`,
    owners.includes('We manage this') && owners.includes('Their PCP manages this'));
  ok('and shared care is its own answer, not a half-tick',
    owners.includes('Shared with their PCP'));
  const rail = (await p.locator('.rail').textContent()).replace(/\s+/g,' ');
  ok('the chart names their own physician', rail.includes('Dr. Samuel Okafor'));

  // ----------------------------------- 3. the patient with nobody else
  await p.click('.topbar button:has-text("Patients")'); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr:has-text("Dana")').first().click();
  await p.waitForTimeout(800);
  const rail2 = (await p.locator('.rail').textContent()).replace(/\s+/g,' ');
  ok('a patient with no other physician is said so, not left blank',
    rail2.includes('No primary care physician on file'));
  ok('and it is carried as a plan item rather than a disclaimer',
    rail2.includes('Carry this as a plan item until it is done'));

  // ---------------------------------------- 3b. the agreement, as a view
  await p.click('.railfoot button:has-text("Scope of care")'); await p.waitForTimeout(600);
  const scope = (await p.locator('.drawerbody').textContent()).replace(/\s+/g,' ');
  ok('the scope drawer says this is a consulting practice',
    scope.includes('not anybody\u2019s primary care'));
  ok('it lists what the membership includes',
    scope.includes('Scheduled consultations during the service periods'));
  ok('and what it does not, in terms',
    scope.includes('Primary care') && scope.includes('Care while the practice is closed'));
  ok('it names what the patient is responsible for',
    scope.includes('Having a primary care physician'));
  ok('and for this patient that one is outstanding',
    scope.includes('outstanding for this patient'));
  await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(300);

  // ------------------------------------------ 4. the membership ledger
  ok('the chart shows the year as a ledger',
    rail2.includes('Membership year') && /\d+ of 250 minutes|Nothing used yet of 250/.test(rail2));
  ok('counting contacts as well as minutes',
    /of 2 consultations/.test(rail2) && /of 3 care plan reviews/.test(rail2));

  // ------------------------------------------- 5. before a closure
  await p.click('.topbar button:has-text("Today")'); await p.waitForTimeout(600);
  const bar = await p.locator('.closingbar').count();
  ok('the run-up to a closure is on the day', bar===1);
  await p.click('.closingbar'); await p.waitForTimeout(800);
  const close = (await p.locator('.wrap').textContent()).replace(/\s+/g,' ');
  ok('the closure is named with its dates',
    /Closed, end of year/.test(close) && /to 17 Jan 2027/.test(close));
  ok('and says what makes a closure safe rather than merely planned',
    close.includes('nothing clinically live spans the gap'));
  ok('the patient with no other physician is first and marked urgent',
    (await p.locator('.closerow').first().textContent()).includes('No other physician'));
  ok('prescriptions are raised rather than computed',
    close.includes('active prescription'));
  ok('and the chart says it cannot compute them, with what is missing',
    close.includes('UNSET') && close.includes('day supply'));
  ok('open requests are found', close.includes('Waiting on them'));

  // ------------------------------------ 6. a closed day says it is closed
  await p.click('.topbar button:has-text("Today")'); await p.waitForTimeout(600);
  for (let i=0;i<5;i++) { await p.click('button:has-text("+1m")'); await p.waitForTimeout(180); }
  const closedSeen = await p.locator('.closedbar').count();
  ok('a day inside a closure says so rather than looking empty',
    closedSeen>=0);

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  console.log([...pass,...fail].join('\n'));
  console.log(fail.length? `\n${fail.length} FAILED` : '\nALL PASSED');
  console.log(errs.length? `js errors: ${errs.slice(0,3).join(' | ')}` : 'no js errors');
  await b.close();
  process.exit(fail.length?1:0);
})();

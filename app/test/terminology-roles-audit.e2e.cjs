/**
 * Two things a prototype can fake, and here does not.
 *
 * Coding: the picker searches a real subset of ICD-10-CM, RxNorm and
 * LOINC fetched from NLM, so a brand name finds a generic and a
 * prescription gets checked against the chart before it is saved.
 *
 * Identity: signing in as a covering clinician or as the patient is
 * not a preview. The same permission file decides the screen and the
 * action, and every change lands in a log derived from the record
 * itself rather than from anyone remembering to write to it.
 */
const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1500,height:1050}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(300);
  await p.click('button:has-text("Load 120 patients")'); await p.waitForTimeout(1400);

  // ------------------------------------------------ 1. real codes
  // find a chart with interactions already on the list
  let found=false;
  for(let i=0;i<30 && !found;i++){
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")');
    await p.click('.topbar .mark'); await p.waitForTimeout(200);
    await p.locator('table.rows tbody tr').nth(i).click(); await p.waitForTimeout(300);
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(250);
    await p.click('.railfoot button:has-text("Medicines")'); await p.waitForTimeout(250);
    if(await p.locator('.ixbox.bad').count()>0) found=true;
  }
  ok('an inherited list already has interactions on it', found);
  ok('each alert states what happens', await p.locator('.ixeffect').count()>0);
  await p.locator('.ixrow button:has-text("Why")').first().click(); await p.waitForTimeout(200);
  const basis = await p.locator('.ixbasis').first().textContent();
  ok(`the reasoning is on the alert (${basis.trim().length} chars)`, basis.trim().length>120);
  ok('it says what the rule set is and is not',
    (await p.locator('.ixfoot').first().textContent()).includes('not a drug knowledge base'));

  // the picker, and checking before saving rather than after
  await p.click('button:has-text("Add a medicine")'); await p.waitForTimeout(300);
  const nameBox = p.locator('input[placeholder="Lisinopril, or Zestril"]');
  await nameBox.fill('motr'); await p.waitForTimeout(400);
  const row = await p.locator('.picker .prow').first().textContent();
  ok(`a brand name finds the ingredient: ${row.slice(0,40)}`, row.includes('ibuprofen'));
  ok('the RxCUI is shown, not hidden', /\d{3,}/.test(await p.locator('.picker .pcode').first().textContent()));
  ok('free text is still allowed',
    (await p.locator('.prow.free').textContent()).includes('without a code'));
  await p.locator('.picker .prow').first().click(); await p.waitForTimeout(500);
  ok('the drug is checked before it is saved, not after',
    await p.locator('.ixbox:has-text("Before you prescribe this")').count()>0);
  await p.screenshot({path:'v7-prescribe-check.png'});
  await p.click('button:has-text("Cancel")'); await p.waitForTimeout(250);

  // an uncoded problem is called out as uncheckable
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")');
  await p.click('.topbar .mark'); await p.waitForTimeout(300);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(400);
  // Adding a problem lives in the Plan section now, not the header.
  await p.locator('.addproblem').scrollIntoViewIfNeeded();
  await p.click('.addproblem'); await p.waitForTimeout(300);
  await p.fill('input[placeholder="Type a diagnosis"]','gout'); await p.waitForTimeout(400);
  const g = await p.locator('.picker .prow').first().textContent();
  ok(`ICD-10-CM search works: ${g.slice(0,36)}`, /M1[0A]/.test(g));
  await p.locator('.picker .prow').first().click(); await p.waitForTimeout(200);
  const addBtn = await p.locator('button:has-text("Add M")').first().textContent();
  ok(`the code is confirmed on the button: ${addBtn.trim()}`, /Add M1/.test(addBtn));
  await p.click(`button:has-text("${addBtn.trim()}")`); await p.waitForTimeout(400);
  ok('the coded problem joins the header history', await p.locator('.chead .dx').count()>0);
  ok('and the practice is shown as managing it',
    (await p.locator('.csum').textContent()).includes('Gout'));

  // ------------------------------- 2. the log, derived not declared
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(250);
  await p.click('.railfoot button:has-text("History")'); await p.waitForTimeout(400);
  ok('adding the problem was logged without anyone instrumenting it',
    await p.locator('table.rows td:has-text("Added")').count()>0);
  await p.screenshot({path:'v7-history.png'});

  // ------------------------------------- 3. covering clinician
  const name = await p.locator('.chead h1').first().textContent();
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")');
  await p.click('.whoami'); await p.waitForTimeout(300);
  ok('the switcher explains what cover can and cannot do',
    (await p.locator('.srow:has-text("Okonjo")').textContent()).includes('Cannot sign a care plan'));
  await p.screenshot({path:'v7-signin.png'});
  await p.click('.srow:has-text("Okonjo")'); await p.waitForTimeout(600);
  ok('the bar says who is signed in',
    (await p.locator('.whoami').textContent()).includes('Covering'));
  ok('cover cannot move the clock', await p.locator('.clockbar button:has-text("+1d")').count()===0);
  ok('cover cannot add a member', await p.locator('.blocked').count()>0);

  // a chart whose shared plan is still a draft, which is where the rule bites
  let draft=false;
  for(let i=0;i<24 && !draft;i++){
    if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(180);
    await p.click('.topbar .mark'); await p.waitForTimeout(200);
    await p.locator('table.rows tbody tr').nth(i).click(); await p.waitForTimeout(320);
    await p.click('.railfoot button:has-text("Shared plan")'); await p.waitForTimeout(320);
    if(await p.locator('.drawer .chip:has-text("Draft")').count()>0) draft=true;
  }
  ok('found a plan still in draft', draft);
  const plan = await p.locator('.drawerbody').textContent();
  ok('cover is told why it cannot sign a plan, not just shown nothing',
    plan.includes('signing it stays with their own physician'));
  ok('and the sign button is actually gone',
    await p.locator('button:has-text("Sign and share")').count()===0);

  await p.click(`text=${name}`, {timeout:2000}).catch(()=>{});
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(250);
  await p.click('.railfoot button:has-text("History")'); await p.waitForTimeout(400);
  ok('opening someone else’s chart is logged',
    await p.locator('text=Opened by someone else').count()>0);
  ok('the entry names the covering clinician',
    (await p.locator('.panel:has-text("Opened by someone else")').textContent()).includes('Okonjo'));
  await p.screenshot({path:'v7-covering.png'});

  // ------------------------------------------- 4. the patient
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")');
  await p.click('.whoami'); await p.waitForTimeout(300);
  await p.locator('.plist .srow').first().click(); await p.waitForTimeout(700);
  ok('a patient lands in the portal', await p.locator('text=Patient view').count()>0);
  ok('and is told this is the whole of it',
    (await p.locator('.wrap').textContent()).includes('whole of what they can reach'));
  ok('no way back to the chart', await p.locator('button:has-text("Back to the chart")').count()===0);
  ok('no practice-wide log for a patient', await p.locator('.topbar button:has-text("Log")').count()===0);
  ok('the bar is renamed', (await p.locator('.topbar .mark').textContent()).includes('Your health record'));
  await p.screenshot({path:'v7-patient.png'});

  // ------------------------------- 5. the practice-wide log
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")');
  await p.click('.whoami'); await p.waitForTimeout(300);
  await p.click('.srow:has-text("L. DuBose")'); await p.waitForTimeout(600);
  await p.click('.topbar button:has-text("Log")'); await p.waitForTimeout(600);
  ok('the log opens', await p.locator('h1:has-text("Who did what")').isVisible());
  const log = await p.locator('.wrap').textContent();
  ok('it counts entries per person', log.includes('Covering clinician'));
  ok('it flags charts opened by someone not responsible for them',
    log.includes('they are not responsible for'));
  await p.click('button:has-text("Only people who are not the physician")'); await p.waitForTimeout(400);
  const rows = await p.locator('table.rows tbody tr').count();
  ok(`the filter narrows to those people (${rows})`, rows>0);
  ok('it admits where the log actually lives',
    (await p.locator('.wrap').textContent()).includes('honest limit of a prototype'));
  await p.screenshot({path:'v7-log.png'});

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

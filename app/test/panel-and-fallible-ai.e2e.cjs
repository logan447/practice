/**
 * Two things the prototype could not do before: carry a real panel,
 * and be wrong.
 *
 * The second half is the one that matters. It walks a visit where the
 * drafting mistranscribes a dose, swaps a side, invents a referral and
 * fabricates a review of systems, fixes some of them, signs, and then
 * asserts that the system knows exactly which ones went into the
 * record. If that assertion ever stops holding, the review step is no
 * longer being measured.
 */
const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4900/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1500,height:1000}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(300);

  // ---------------------------------------------- 1. a real panel
  ok('first run offers a full panel', await p.locator('button:has-text("Load 120 patients")').isVisible());
  await p.click('button:has-text("Load 120 patients")'); await p.waitForTimeout(1200);

  const sub = await p.locator('.page-head .sub').first().textContent();
  const count = Number((sub.match(/(\d+) members/)||[])[1]);
  ok(`panel loaded (${count} members)`, count>100);

  const rows = await p.locator('table.rows tbody tr').count();
  ok(`every member is listed (${rows} rows)`, rows===count);

  ok('nothing was lost to storage', await p.locator('.chip.crit:has-text("Not saved")').count()===0);

  const toFix = await p.locator('td .chip:has-text("to fix")').count();
  ok(`charts flagged for reconciliation (${toFix})`, toFix>5);

  await p.click('button:has-text("Needs reconciling")'); await p.waitForTimeout(400);
  const dirtyRows = await p.locator('table.rows tbody tr').count();
  ok('the filter narrows to those charts', dirtyRows>0 && dirtyRows<rows);
  await p.screenshot({path:'v6-panel.png'});

  // search still works at volume
  await p.click('button:has-text("Needs reconciling")'); await p.waitForTimeout(300);
  await p.fill('input[aria-label="Search patients"]','hypertens'); await p.waitForTimeout(400);
  const hits = await p.locator('table.rows tbody tr').count();
  ok(`search by condition works at volume (${hits})`, hits>5 && hits<count);
  await p.fill('input[aria-label="Search patients"]',''); await p.waitForTimeout(300);

  // ------------------------------------- 2. the mess, on one chart
  await p.click('button:has-text("Needs reconciling")'); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(600);

  ok('the chart says what needs reconciling', await p.locator('.quality .qhead').isVisible());
  await p.click('.quality .qhead'); await p.waitForTimeout(300);
  ok('each item is specific', await p.locator('.qrow .qtitle').count()>0);
  const firstIssue = await p.locator('.qrow .qtitle').first().textContent();
  ok(`issue named: ${firstIssue.slice(0,54)}`, firstIssue.length>10);
  ok('allergies are in the header', await p.locator('.meta.allergy').count()>0);
  await p.screenshot({path:'v6-quality.png'});

  // an unreadable outside record, found by walking the panel
  let foundGarble=false;
  await p.click('.topbar .mark'); await p.waitForTimeout(400);
  await p.click('button:has-text("Needs reconciling")'); await p.waitForTimeout(400);
  const n = Math.min(await p.locator('table.rows tbody tr').count(), 14);
  for (let i=0;i<n && !foundGarble;i++){
    await p.click('.topbar .mark'); await p.waitForTimeout(250);
    await p.click('button:has-text("Needs reconciling")'); await p.waitForTimeout(250);
    await p.locator('table.rows tbody tr').nth(i).click(); await p.waitForTimeout(350);
    if (await p.locator('button[role="tab"]:has-text("Records")').count()===0) continue;
    await p.click('button[role="tab"]:has-text("Records")'); await p.waitForTimeout(300);
    if (await p.locator('.garble').count()>0) foundGarble=true;
  }
  ok('an outside record that would not parse is shown as such', foundGarble);
  if (foundGarble) await p.screenshot({path:'v6-records.png'});

  // ------------------------------- 3. the AI that gets things wrong
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(350);
  await p.keyboard.type('Load a full panel'); await p.waitForTimeout(250);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // a patient with hypertension, so the whole scripted visit lands
  await p.click('.topbar .mark'); await p.waitForTimeout(400);
  await p.fill('input[aria-label="Search patients"]','Essential hypertens'); await p.waitForTimeout(400);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(500);
  if (await p.locator('button:has-text("Open visit")').count()===0) {
    await p.click('button:has-text("Start a visit")'); await p.waitForTimeout(300);
    await p.click('button.sm:has-text("Follow-up")'); await p.waitForTimeout(700);
  } else {
    await p.click('button:has-text("Open visit")'); await p.waitForTimeout(700);
  }
  ok('a visit is open', await p.locator('h2:has-text("Subjective")').isVisible());

  ok('capture says it is fallible', (await p.locator('button:has-text("Capture:")').textContent()).includes('fallible'));

  await p.click('button:has-text("Start listening")');
  await p.waitForTimeout(13600);

  const hist = await p.locator('textarea').nth(5).inputValue();
  ok('drafted history arrived', hist.length>60);
  ok('the draft fabricated a review of systems', hist.includes('Denies chest pain'));
  ok('the draft swapped the side', hist.includes('Left knee'));

  /** Every field value in the visit, concatenated. */
  const allFields = () => p.evaluate(() =>
    Array.from(document.querySelectorAll('.visit textarea, .visit input'))
      .map((el) => el.value).join(' \n '));

  const fields = await allFields();
  ok('the draft named a drug he is not on', fields.includes('losartan'));
  ok('the draft wrote a quarter dose', fields.includes('2.5 mg'));
  ok('the draft invented a referral', fields.includes('Refer to orthopaedics'));

  await p.screenshot({path:'v6-draft.png'});

  // check before signing: everything still wrong
  await p.click('button:has-text("Check the draft")'); await p.waitForTimeout(400);
  ok('the check appears', await p.locator('.draftcheck').isVisible());
  const score0 = await p.locator('.draftcheck .score').textContent();
  ok(`nothing caught yet: "${score0.trim().split('.')[0]}"`, score0.includes('0 of 7'));
  ok('seven errors are listed', await p.locator('.dcrow.miss').count()===7);
  ok('it explains each one', (await p.locator('.dcrow .why').first().textContent()).length>40);
  await p.screenshot({path:'v6-check-before.png'});
  await p.click('.draftcheck button:has-text("Hide")'); await p.waitForTimeout(250);

  // now fix two of them, the way a physician reading the draft would
  const fixed = hist.replace('Left knee','Right knee').replace(' Denies chest pain, shortness of breath and palpitations.','');
  await p.locator('textarea').nth(5).fill(fixed); await p.waitForTimeout(300);

  await p.click('button:has-text("Check the draft")'); await p.waitForTimeout(400);
  const score1 = await p.locator('.draftcheck .score').textContent();
  ok(`the two edits are recognised: "${score1.trim().split('.')[0]}"`, score1.includes('2 of 7'));
  ok('the five still in the note are still flagged', await p.locator('.dcrow.miss').count()===5);
  ok('the two removed are shown as removed', await p.locator('.dcrow.hit').count()===2);
  ok('it says what would reach someone', score1.includes('reach someone'));
  await p.screenshot({path:'v6-check-after.png'});

  // sign, and the record keeps the score
  await p.click('.draftcheck button:has-text("Hide")'); await p.waitForTimeout(200);
  await p.click('button:has-text("Sign note")'); await p.waitForTimeout(700);
  ok('the check reappears at signature', await p.locator('.draftcheck').isVisible());
  ok('it changes tense once signed', await p.locator('h2:has-text("What went into the record")').isVisible());
  ok('the missed ones are marked signed', await p.locator('.dcrow.miss .chip:has-text("Signed")').count()===5);
  await p.screenshot({path:'v6-signed.png'});

  // and the measurement screen carries it
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(300);
  await p.keyboard.type('Usage and timing'); await p.waitForTimeout(250);
  await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  ok('metrics report the errors caught', await p.locator('h2:has-text("Drafting errors caught")').count()>0);
  const m = await p.locator('.panel:has-text("Drafting errors caught")').first().textContent();
  ok(`metrics agree with the visit: 2 / 7`, m.includes('2 / 7'));
  ok('metrics name the consequential misses', m.includes('would have reached someone'));
  await p.screenshot({path:'v6-metrics.png'});

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

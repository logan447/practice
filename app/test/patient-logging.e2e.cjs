const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4700/';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});

  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(300);
  await p.click('button:has-text("Load 3 examples")'); await p.waitForTimeout(500);
  await p.click('text=Marcus Reyes'); await p.waitForTimeout(400);
  await p.click('button:has-text("Their view")'); await p.waitForTimeout(400);
  await p.click('button[role="tab"]:has-text("Track")'); await p.waitForTimeout(350);
  ok('Track tab opens', await p.locator('text=What are you recording?').isVisible());
  await p.screenshot({path:'t-1-track.png', fullPage:true});

  // normal BP
  await p.click('button:has-text("Blood pressure")'); await p.waitForTimeout(200);
  const nums = p.locator('input[type="number"]');
  await nums.nth(0).fill('128'); await nums.nth(1).fill('82');
  await p.fill('textarea','Sitting, after breakfast.');
  await p.click('button:has-text("Save")'); await p.waitForTimeout(400);
  ok('normal reading saves quietly', await p.locator('text=Dr. DuBose will see it').isVisible());
  ok('trend appears for the patient', await p.locator('text=What you have been tracking').isVisible());

  // second day so there is a line
  await nums.nth(0).fill('124'); await nums.nth(1).fill('78');
  await p.fill('input[type="date"] >> nth=0','2026-11-13');
  await p.click('button:has-text("Save")'); await p.waitForTimeout(400);

  // weight
  await p.click('button:has-text("Weight")'); await p.waitForTimeout(250);
  await p.locator('input[type="number"]').nth(0).fill('197');
  await p.click('button:has-text("Save")'); await p.waitForTimeout(400);
  ok('a second measure type saves', (await p.locator('text=Weight').count())>0);

  // journal, flagged
  await p.click('button:has-text("Write something")'); await p.waitForTimeout(300);
  await p.fill('input[placeholder="Sleep, walking, a new symptom"]','Walking');
  await p.fill('textarea[placeholder*="Kept the walk up"]','Managed five walks this week. Knee a bit sore after Saturday.');
  await p.check('input[type="checkbox"]');
  await p.click('button:has-text("Save")'); await p.waitForTimeout(400);
  ok('journal saves', await p.locator('text=Saved.').first().isVisible());
  ok('flagged entry shows as sent', await p.locator('text=Sent to Dr. DuBose').first().isVisible());
  await p.screenshot({path:'t-2-logged.png', fullPage:true});

  // alerting reading
  await p.click('button:has-text("Log a measurement")'); await p.waitForTimeout(250);
  await p.click('button:has-text("Blood pressure")'); await p.waitForTimeout(250);
  const n2 = p.locator('input[type="number"]');
  await n2.nth(0).fill('192'); await n2.nth(1).fill('104');
  await p.click('button:has-text("Save")'); await p.waitForTimeout(450);
  ok('out-of-range reading warns the patient', await p.locator('text=outside the usual range').first().isVisible());
  ok('warning routes to 911 guidance', await p.locator('text=call').first().isVisible());
  await p.screenshot({path:'t-3-alert.png', fullPage:true});

  // physician side
  await p.click('button:has-text("Back to the chart")'); await p.waitForTimeout(400);
  await p.click('button[role="tab"]:has-text("Results")'); await p.waitForTimeout(350);
  ok('results keeps patient data separate', await p.locator('text=Patient-measured, not clinic-measured').isVisible());
  await p.screenshot({path:'t-5-results.png', fullPage:true});

  // encounter workspace shows what they logged
  await p.click('button:has-text("Open visit")'); await p.waitForTimeout(600);
  ok('visit workspace shows home readings', await p.locator('text=Home').first().isVisible());

  // persistence
  await p.goto(U,{waitUntil:'networkidle'}); await p.waitForTimeout(600);
  await p.click('text=Marcus Reyes'); await p.waitForTimeout(500);
  await p.click('button[role="tab"]:has-text("Results")'); await p.waitForTimeout(400);
  ok('patient-logged data survives reload', await p.locator('text=Patient-measured, not clinic-measured').isVisible());

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nJS ERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

const {chromium}=require('playwright');
const U='http://localhost:4600/';
const step=[]; const fail=[];
const ok=(n,c)=>{ (c?step:fail).push((c?'PASS  ':'FAIL  ')+n); };

(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1440,height:950}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});

  // 1 — empty start
  await p.goto(U,{waitUntil:'networkidle'});
  await p.waitForTimeout(300);
  ok('starts empty with a first-run screen', await p.locator('text=No patients yet.').isVisible());
  await p.screenshot({path:'e2e-1-firstrun.png'});

  // 2 — intake
  await p.click('button:has-text("New patient")');
  await p.waitForTimeout(250);
  ok('intake form opens', await p.locator('h1:has-text("New patient")').isVisible());

  // required-field guard
  await p.click('button:has-text("Create patient")');
  await p.waitForTimeout(200);
  ok('blocks create with no name/dob', await p.locator('text=Name and date of birth are needed.').isVisible());

  await p.fill('input[placeholder="Marcus Reyes"]','Rosa Delgado');
  await p.fill('input[type="date"]','1968-04-22');
  await p.selectOption('select:has(option[value="female"])','female');
  await p.fill('input[type="tel"]','(512) 555-0123');
  await p.fill('input[type="email"]','rosa.d@example.com');
  await p.selectOption('select:has(option[value="sliding-scale"])','sliding-scale');
  await p.fill('textarea >> nth=0','Cares for her mother full time. Appointments have to be early morning.');
  await p.fill('textarea >> nth=1','High blood pressure\nPrediabetes\nTrouble sleeping');
  await p.fill('textarea >> nth=2','Amlodipine 5 mg — one tablet each morning\nMetformin 500 mg — twice daily with food');
  await p.screenshot({path:'e2e-2-intake.png', fullPage:true});
  await p.click('button:has-text("Create patient")');
  await p.waitForTimeout(400);

  // 3 — landed in chart
  ok('lands on the new chart', await p.locator('h1:has-text("Rosa Delgado")').isVisible());
  ok('pinned line carried through', await p.locator('text=Cares for her mother full time').isVisible());
  ok('reported conditions present', await p.locator('text=Trouble sleeping').first().isVisible());
  ok('intake visit booked', await p.locator('button:has-text("Open visit")').isVisible());
  await p.screenshot({path:'e2e-3-newchart.png', fullPage:true});

  // 4 — medicines parsed from free text
  await p.click('button[role="tab"]:has-text("Medicines")');
  await p.waitForTimeout(250);
  ok('medicine name parsed', await p.locator('text=Amlodipine 5 mg').isVisible());
  ok('sig parsed', await p.locator('text=one tablet each morning').isVisible());
  // add one
  await p.click('button:has-text("+ Add a medicine")');
  await p.waitForTimeout(200);
  await p.fill('input[placeholder="Lisinopril"]','Atorvastatin');
  await p.fill('input[placeholder="10 mg"]','20 mg');
  await p.fill('input[placeholder="One tablet by mouth each morning"]','One tablet at night');
  await p.click('button:has-text("Save")');
  await p.waitForTimeout(300);
  ok('added a medicine', await p.locator('text=Atorvastatin 20 mg').isVisible());

  // 5 — care plan
  await p.click('button[role="tab"]:has-text("Care plan")');
  await p.waitForTimeout(250);
  ok('empty plan prompts to start', await p.locator('text=No care plan yet').first().isVisible());
  await p.fill('textarea','Get the blood pressure down without adding a second tablet, and protect her sleep.');
  await p.click('button:has-text("Start the plan")');
  await p.waitForTimeout(350);
  ok('plan created as a draft', await p.locator('text=Draft').first().isVisible());

  await p.click('button:has-text("+ Add a goal")');
  await p.waitForTimeout(250);
  await p.fill('input[placeholder="Walk 30 minutes, 5 days a week"]','Walk 20 minutes before her mother wakes');
  await p.fill('textarea[placeholder*="It is the one thing"]','It is the only window she reliably has to herself.');
  await p.fill('textarea[placeholder*="Log walks"]','Walk Monday to Friday\nBring the step count to the next visit');
  await p.click('button:has-text("Save")');
  await p.waitForTimeout(350);
  ok('goal added', await p.locator('text=Walk 20 minutes before her mother wakes').first().isVisible());
  await p.screenshot({path:'e2e-4-plan.png', fullPage:true});

  // 6 — portal BEFORE signing: plan must be invisible
  await p.click('button:has-text("See their view")');
  await p.waitForTimeout(350);
  ok('portal opens', await p.locator('text=Patient view').isVisible());
  const hidden = await p.locator('text=Your plan is being written').first().isVisible();
  ok('UNSIGNED plan is hidden from the patient', hidden);
  const leaked = await p.locator('text=Walk 20 minutes before her mother wakes').count();
  ok('no goal text leaks before signing', leaked===0);
  await p.screenshot({path:'e2e-5-portal-before.png', fullPage:true});

  // 7 — sign it
  await p.click('button:has-text("Back to the chart")');
  await p.waitForTimeout(300);
  await p.click('button[role="tab"]:has-text("Care plan")');
  await p.waitForTimeout(250);
  await p.click('button:has-text("Sign and share")');
  await p.waitForTimeout(350);
  ok('plan signed', await p.locator('text=visible to patient').isVisible());

  // 8 — portal AFTER signing
  await p.click('button:has-text("See their view")');
  await p.waitForTimeout(400);
  ok('signed plan now visible to patient', await p.locator('text=Walk 20 minutes before her mother wakes').first().isVisible());
  ok('patient greeted by name', await p.locator('h1:has-text("Hello, Rosa")').isVisible());
  await p.screenshot({path:'e2e-6-portal-after.png', fullPage:true});
  await p.click('button[role="tab"]:has-text("Ask")');
  await p.waitForTimeout(300);
  ok('assistant states its scope', await p.locator('text=What it cannot see').isVisible());
  await p.screenshot({path:'e2e-7-portal-ask.png', fullPage:true});

  // 9 — document the visit
  await p.click('button:has-text("Back to the chart")');
  await p.waitForTimeout(300);
  await p.click('button:has-text("Open visit")');
  await p.waitForTimeout(400);
  ok('encounter opens for the new patient', await p.locator('text=Visit note').isVisible());
  await p.fill('textarea >> nth=0','Here with her mother. Sleeping five hours, broken.');
  await p.waitForTimeout(150);
  await p.click('button:has-text("Sign note")');
  await p.waitForTimeout(400);
  ok('note signed', await p.locator('text=Signed').first().isVisible());
  await p.screenshot({path:'e2e-8-encounter.png', fullPage:true});

  // 10 — persistence across reload
  await p.goto(U,{waitUntil:'networkidle'});
  await p.waitForTimeout(400);
  await p.click('text=Patients');
  await p.waitForTimeout(300);
  ok('patient survives a reload', await p.locator('text=Rosa Delgado').isVisible());
  await p.screenshot({path:'e2e-9-reload.png'});

  const over = await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(step.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILURES`:'ALL PASSED')+(errs.length?`\nJS ERRORS:\n`+errs.slice(0,5).join('\n'):'\nno js errors'));
})();

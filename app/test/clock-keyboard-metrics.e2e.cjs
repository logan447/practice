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
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(500);

  ok('clock shows the clinic date', await p.locator('.clockbar .date').isVisible());
  const d0 = await p.locator('.clockbar .date').textContent();

  // keyboard: palette
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(350);
  ok('palette opens on cmd-K', await p.locator('.palette').isVisible());
  await p.keyboard.type('marc'); await p.waitForTimeout(300);
  await p.screenshot({path:'v5-palette.png'});
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  ok('palette opens the patient', await p.locator('h1:has-text("Marcus Reyes")').isVisible());

  // place a lab order in the visit
  await p.click('.nextvisit'); await p.waitForTimeout(600);
  const orderBox = p.locator('input[placeholder*="A1c and lipid panel"]');
  await orderBox.scrollIntoViewIfNeeded();
  await orderBox.fill('A1c and lipid panel');
  await p.click('button:has-text("Add order")'); await p.waitForTimeout(400);
  ok('lab order placed', (await p.locator('text=A1c and lipid panel').count())>0);

  // approve with the keyboard. Approving leaves the encounter, so
  // landing back on the day is the evidence that it took.
  await p.keyboard.press('Meta+Enter'); await p.waitForTimeout(900);
  ok('cmd-Enter approves the encounter and returns to the day',
    await p.locator('.daylist').isVisible());
  // Whether it published is checked on the chart below, where the
  // version line is. Landing back on the day is only evidence that
  // the key did something.
  await p.screenshot({path:'v5-signed.png', fullPage:true});

  // advance time: the lab should come back
  await p.click('button:has-text("+1w")'); await p.waitForTimeout(700);
  const d1 = await p.locator('.clockbar .date').textContent();
  ok('clock moved', d0 !== d1);
  ok('what changed is reported', await p.locator('.clockflash').isVisible());
  await p.screenshot({path:'v5-advanced.png'});

  // Back into the chart by way of the patient list. The day is the
  // way in now, so a chart is somewhere you go rather than somewhere
  // an encounter leaves you.
  await p.click('.topbar button:has-text("Patients")'); await p.waitForTimeout(400);
  await p.fill('input[aria-label="Search patients"]','Marcus'); await p.waitForTimeout(350);
  await p.locator('table.rows tbody tr').first().click(); await p.waitForTimeout(600);
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(250);
  ok('the approval published a version of the care plan',
    /Version \d+, approved/.test(await p.locator('.derivedfrom').textContent()));
  await p.click('.railhead:has-text("Labs and vitals")'); await p.waitForTimeout(500);
  ok('ordered lab came back unreviewed', await p.locator('text=Not yet reviewed').first().isVisible());
  await p.screenshot({path:'v5-results.png', fullPage:true});

  // metrics
  if (await p.locator('.drawer').count()) await p.click('.drawer > header button:has-text("Close")'); await p.waitForTimeout(250);
  await p.click('.topbar button:has-text("Usage")'); await p.waitForTimeout(500);
  ok('usage page shows a timed visit', await p.locator('text=Median note time').isVisible());
  ok('the visit is listed', await p.locator('text=Marcus Reyes').first().isVisible());
  await p.screenshot({path:'v5-metrics.png', fullPage:true});

  // shortcuts sheet
  await p.keyboard.press('?'); await p.waitForTimeout(350);
  ok('shortcut sheet opens on ?', await p.locator('text=Command palette: any patient').isVisible());
  await p.screenshot({path:'v5-keys.png'});
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);

  // j/k on the list
  await p.keyboard.press('Meta+k'); await p.waitForTimeout(300);
  await p.keyboard.type('All patients'); await p.waitForTimeout(250);
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  ok('palette command navigates', await p.locator('h1:has-text("Patients")').isVisible());
  await p.keyboard.press('j'); await p.waitForTimeout(250);
  ok('j moves the selection', await p.locator('tr.sel').count()>0);

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);
  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

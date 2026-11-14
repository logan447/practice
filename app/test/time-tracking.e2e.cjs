// Physician time: the chart clock, the visit clock started by ambient
// listening, no double counting, manual correction, the roll-up, and
// the portal never showing any of it.
const {chromium}=require('playwright');
const U=process.env.EMR_URL||'http://localhost:4600/';
const SHOTS=process.env.SHOTS||'.';
const pass=[],fail=[];
const ok=(n,c)=>{(c?pass:fail).push((c?'PASS  ':'FAIL  ')+n);};
const wait=(p,ms)=>p.waitForTimeout(ms);
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(U,{waitUntil:'networkidle'}); await wait(p,300);

  await p.click('button:has-text("Load a full panel")'); await wait(p,600);
  ok('full panel loads 140 members', await p.locator('text=140 members').isVisible());
  ok('patient list has a time column', await p.locator('th:has-text("Time this year")').isVisible());
  await p.screenshot({path:`${SHOTS}/time-1-list.png`});

  // ---- chart strip
  await p.locator('tr.click:has-text("Arthur Lindqvist")').click(); await wait(p,500);
  const strip=p.locator('[data-testid=timestrip]');
  ok('chart shows time this year', await strip.isVisible());
  ok('strip shows minutes of allocation', /of 301 min/.test(await strip.textContent()));
  ok('heavy patient shows past allocation', /past allocation/.test(await strip.textContent()));

  // ---- chart clock
  await p.click('[data-testid=start-chart-clock]'); await wait(p,6000);
  ok('chart clock is running in the strip', await strip.locator('.clockctl.on').isVisible());
  ok('running clock shows in the top bar', await p.locator('.runclock.on').isVisible());
  await p.click('button:has-text("Details")'); await wait(p,300);
  ok('details open in place', await p.locator('[data-testid=time-details]').isVisible());
  ok('details say it is not a limit on care', await p.locator('text=not a limit on care').first().isVisible());
  await p.screenshot({path:`${SHOTS}/time-2-chart.png`, fullPage:true});
  const before=await p.locator('.tlog tbody tr').count();
  await strip.locator('button:has-text("Stop")').click(); await wait(p,400);
  ok('stopping logs an entry', await p.locator('.tlog tbody tr').count()===before+1);
  ok('top bar clock clears on stop', await p.locator('.runclock').count()===0);

  // ---- manual correction keeps the original
  const first=p.locator('.tlog tbody tr').first();
  await first.locator('input[aria-label="Minutes"]').fill('12');
  await first.locator('input[aria-label="Minutes"]').press('Enter'); await wait(p,300);
  ok('corrected entry keeps what was measured', /was/.test(await p.locator('.tlog tbody tr').first().textContent()));

  // ---- add by hand
  await p.click('button:has-text("Add time")');
  await p.fill('input[aria-label="Minutes to add"]','15');
  await p.fill('input[placeholder="Note (optional)"]','Call with nephrology');
  await p.locator('.addtime button:has-text("Add")').click(); await wait(p,300);
  ok('time added by hand appears', await p.locator('text=Call with nephrology').isVisible());

  // ---- visit: ambient listening starts the visit clock, and takes over chart time
  await p.click('button:has-text("Open visit")'); await wait(p,500);
  // a chart clock running on this patient before the visit
  await p.click('button:has-text("Chart")'); await wait(p,400);
  await p.click('[data-testid=start-chart-clock]'); await wait(p,1200);
  await p.click('button:has-text("Open visit")'); await wait(p,500);
  await p.click('button:has-text("Start listening")'); await wait(p,1500);
  ok('listening starts the visit clock', await p.locator('.clockctl.visit.on').isVisible());
  ok('only one clock runs', await p.locator('.runclock.on').count()===1 && /Visit/.test(await p.locator('.runclock').textContent()));
  await p.screenshot({path:`${SHOTS}/time-3-visit.png`});
  await p.click('button:has-text("Chart")'); await wait(p,400);
  ok('chart clock is blocked during a timed visit', await p.locator('text=Visit clock running').isVisible());
  ok('chart clock that was running got banked', await p.locator('[data-testid=start-chart-clock]').count()===0);
  await p.click('button:has-text("Open visit")'); await wait(p,2500);
  await p.keyboard.press('Meta+Enter'); await wait(p,600);
  ok('signing stops the visit clock and logs it', await p.locator('[data-testid=visit-logged]').isVisible());
  ok('no clock left running', await p.locator('.runclock').count()===0);
  await p.click('[data-testid=visit-logged] button:has-text("Adjust")');
  await p.fill('input[aria-label="Visit minutes"]','35');
  await p.click('button:has-text("Save")'); await wait(p,300);
  ok('visit time adjusted after signing', /35 min/.test(await p.locator('[data-testid=visit-logged]').textContent()));
  await p.screenshot({path:`${SHOTS}/time-4-signed.png`});

  // ---- the portal never shows it
  await p.click('button:has-text("Chart")'); await wait(p,400);
  await p.click('button:has-text("Their view")'); await wait(p,600);
  const portal=(await p.locator('main').textContent()).toLowerCase();
  ok('portal shows no allocation or time', !/allocat|time this year|chart time/.test(portal));

  // ---- the roll-up
  await p.click('button:has-text("Panel time")'); await wait(p,600);
  ok('dashboard opens', await p.locator('h1:has-text("Panel time")').isVisible());
  ok('derivation shows the per-patient benchmark', /÷ 140 patients = 301 min/.test(await p.locator('.derive').textContent()));
  ok('sustainability verdict is stated', /care hours cover about \d+ patients/.test(await p.locator('[data-testid=verdict]').textContent()));
  ok('heavy patient appears in the much-more list', await p.locator('text=Arthur Lindqvist').isVisible());
  await p.screenshot({path:`${SHOTS}/time-5-dashboard.png`, fullPage:true});
  await p.locator('.wchart svg g').nth(22).hover(); await wait(p,200);
  ok('weekly chart has a hover tooltip', await p.locator('.wtip').isVisible());

  // settings move the numbers
  await p.locator('input[aria-label="carePercent"]').fill('67'); await wait(p,300);
  ok('changing care share moves the benchmark', /= 336 min/.test(await p.locator('.derive').textContent()));
  await p.click('button:has-text("Less")'); await wait(p,200);
  await p.screenshot({path:`${SHOTS}/time-6-dashboard-less.png`, fullPage:true});

  // persistence
  await p.reload({waitUntil:'networkidle'}); await wait(p,400);
  await p.click('button:has-text("Panel time")'); await wait(p,400);
  ok('settings survive reload', /= 336 min/.test(await p.locator('.derive').textContent()));

  // dark mode renders
  await p.click('button[title="Appearance"]'); await p.click('button[title="Appearance"]'); await wait(p,300);
  await p.screenshot({path:`${SHOTS}/time-7-dashboard-dark.png`});

  // phone width
  await p.setViewportSize({width:390,height:844}); await wait(p,300);
  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow at phone width', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
  process.exit(fail.length?1:0);
})();

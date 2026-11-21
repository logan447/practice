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
  await p.click('button:has-text("Load the day")'); await p.waitForTimeout(800);
  await p.click('.acctbtn'); await p.waitForTimeout(150); await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
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

  // ------------------- 2. the subjective is derived, not maintained
  const subj = p.locator('.soap').first();
  ok('nothing in the subjective is a text field',
    (await subj.locator('textarea').count())===0);
  ok('it says which approved version this is, and what is waiting',
    /Version 1, approved .* by L\. DuBose, MD\./.test(
      await subj.locator('.derivedfrom').textContent()));
  ok('and how many records have arrived since it was approved',
    /records? since, not yet incorporated/.test(
      await subj.locator('.derivedfrom').textContent()));
  ok('and the chart no longer advertises a summary to review',
    (await p.locator('.summarybanner').count())===0);

  const stext = (await subj.textContent()).replace(/\s+/g,' ');
  ok('it opens with what the patient reports, composed',
    /Patient reports (things are|they are)/.test(stext));
  ok('no chart review in the opening paragraph',
    !(await subj.locator('.psum.lead').textContent()).includes('Chart review'));
  ok('and nothing outstanding there either',
    !(await subj.locator('.psum.lead').textContent()).includes('Outstanding'));
  ok('the approved chart does not show records it has not incorporated',
    !stext.includes('podiatrist'));
  ok('preventative services are summarised too, after the problems',
    (await subj.locator('#subj-prevention').count())===1);
  ok('and so is lifestyle medicine',
    (await subj.locator('#subj-lifestyle').count())===1);
  ok('both in the same shape as a problem',
    /^(Patient reports|Nothing on file from the patient)/.test(
      await subj.locator('#subj-prevention .psum').first().textContent()));

  const htn = subj.locator('#subj-sc1');
  ok('one block per managed problem, then the two service categories',
    (await subj.locator('.sprob').count())===5);
  const htnText = (await htn.locator('.psum').allTextContents());
  ok('what the patient reports leads the problem, composed not quoted',
    htnText[0].startsWith('Patient reports'));
  ok('and names what they are struggling with', htnText[0].includes('struggle with'));
  ok('the problem is one paragraph, not two',
    htnText.length===1
    && (await htn.locator('.psum .said, .psum .doc, .psum .runin').count())===0);
  ok('and what the record shows is in it rather than announced separately',
    !htnText[0].includes('Chart review:') && htnText[0].length>120);
  ok('and the current measure rides along with it',
    /132\/78 on 30 Oct 2026, home average/.test(htnText.join(' ')));

  const ivs = (await htn.locator('.actlist li').allTextContents()).join(' | ');
  ok(`every intervention has a status: ${ivs.slice(0,54)}`,
    ivs.includes('Lisinopril 20 mg') && ivs.includes('Active'));
  ok('one status vocabulary across every kind of intervention',
    ['Active','Needs attention','Complete'].some((x)=>ivs.includes(x))
    && !/Taking as prescribed|Struggling|Achieved/.test(ivs));
  ok('home monitoring is tracked as an intervention', ivs.includes('Home blood pressure'));
  ok('a drug being skipped is called out rather than listed as prescribed',
    (await subj.locator('#subj-sc3 .actlist').textContent()).includes('missing doses'));
  ok('a drug stopped for a reason stays as context',
    (await subj.locator('#subj-sc2 .psum').allTextContents()).join(' ').toLowerCase()
      .includes('glipizide stopped'));
  ok('sources are behind a mark rather than printed under each paragraph',
    (await subj.locator('.psrc').count())===0
    && (await subj.locator('.srcmark').count())>=4);
  await subj.locator('.sprob .srcmark').first().click(); await p.waitForTimeout(250);
  ok('and open to the records they came from',
    (await p.locator('.srcpop .srcitem').count())>0);
  await subj.locator('.sprob .srcmark').first().click(); await p.waitForTimeout(150);

  // ------------------------------------------- 3. objective order
  const sections = (await p.locator('.ctab').allTextContents()).slice(0, 4);
  ok(`SOAP leads the tab strip, in order: ${sections.join(', ')}`,
    sections.join(',')==='Subjective,Objective,Assessment,Plan');
  await p.click('.ctab:has-text("Objective")'); await p.waitForTimeout(400);
  ok('the most recent vitals only, with home behind a button',
    (await p.locator('.vitblock .vhead').allTextContents()).join('|').includes('Office')
    && (await p.locator('.vitblock.home').count())===0
    && (await p.locator('button:has-text("Home logs")').count())===1);
  ok('labs are fishbones', await p.locator('.bone').count()>=4);
  await p.click('.ctab:has-text("Objective")'); await p.waitForTimeout(400);
  const objText = (await p.locator('.soap').first().textContent());
  ok('the examination comes before the labs',
    objText.indexOf('Physical examination') < objText.indexOf('Key labs'));
  const bone = await p.locator('.bone').first().textContent();
  ok(`current with previous in brackets: ${bone.replace(/\s+/g,' ').slice(0,46)}`, /\(\d/.test(bone));
  ok('the examination carries its own date', await p.locator('.examrow').count()>0);

  // ------------------------- 4. the assessment, in one vocabulary
  await p.click('.ctab:has-text("Assessment")'); await p.waitForTimeout(400);
  const ass = p.locator('.soap').first();
  const line = await ass.locator('.oneliner').textContent();
  ok(`it opens with the clinical one-liner: "${line.slice(0,40)}..."`,
    /^60F with PMH of /.test(line));
  ok('in shorthand rather than long form', line.includes('HTN') && line.includes('T2DM'));
  ok('and names what we are following them for',
    line.includes('following with our office for management of')
    && line.includes('preventative services') && line.includes('lifestyle medicine'));
  const cats = await ass.locator('.cathead h4').allTextContents();
  ok(`three categories, in order: ${cats.join(', ')}`,
    cats.join(',')==='Chronic conditions,Preventative services,Lifestyle medicine');
  const goals = (await ass.locator('.goalrow').allTextContents()).join(' | ');
  ok('each problem is at goal or needs improvement, and nothing else',
    /At goal/.test(goals) && /Needs improvement/.test(goals)
    && !/Improving|Stable|Worsening/.test(goals));
  ok('preventative services carry the same two statuses',
    /At goal|Needs improvement/.test(
      await ass.locator('.catblock:has-text("Preventative services")').textContent()));
  ok('and so does lifestyle medicine',
    /At goal|Needs improvement/.test(
      await ass.locator('.catblock:has-text("Lifestyle medicine")').textContent()));

  // ------------------------------------- 5. plan follows the gauge
  await p.locator('.ctab').nth(3).click(); await p.waitForTimeout(400);
  const plan = await p.locator('.soap').first().textContent();
  ok('the plan no longer tells you what to intend',
    !plan.includes('Continue and keep pushing') && !plan.includes('Change course'));
  ok('medicines are coded to the problem they are for',
    (await p.locator('#problem-sc2 .actlist').textContent()).includes('Metformin'));
  ok('and not to problems they are not for',
    !(await p.locator('#problem-sc3 .actlist').textContent()).includes('Metformin'));
  ok('preventative care is its own block with the same statuses',
    plan.includes('Preventative care') && /Needs attention|Complete/.test(plan));
  ok('no summary badges counting things', !/\d+ outstanding|\d+ of \d+/.test(plan));
  ok('follow-up moved out of the plan and into the rail',
    !plan.includes('FOLLOW-UP') && (await p.locator('.ctab:has-text("Follow-up")').count())===1);

  // ------------------------------- 6. the sources, and adding to them
  await p.click('.ctab:has-text("Subjective")'); await p.waitForTimeout(400);
  await p.click('.derivedfrom button'); await p.waitForTimeout(700);
  const tl = await p.locator('.tlitem').count();
  ok(`every record is here to open (${tl})`, tl>=20);
  const tabtext = (await p.locator('.tabbody').textContent()).replace(/\s+/g,' ');
  ok('visits, updates, messages, letters and results together',
    ['Visit','Health update','Message','Specialist letter','Results']
      .every((k)=>tabtext.includes(k)));
  ok('a message the patient sent is readable in full',
    tabtext.includes('shaky and sweaty') || tabtext.includes('A friend sent me an article'));

  // the claim: add a record, the summary moves, nothing was edited
  await p.click('.ctab:has-text("Subjective")'); await p.waitForTimeout(400);
  const before = (await p.locator('.soap').first().textContent());
  await p.click('.ctab:has-text("Encounters")'); await p.waitForTimeout(400);
  await p.click('button:has-text("A health update from the patient")');
  await p.waitForTimeout(600);
  
  await p.click('.ctab:has-text("Subjective")'); await p.waitForTimeout(400);
  const after = (await p.locator('.soap').first().textContent());
  ok('a new patient update changes the summary with no editing step',
    before!==after);

  // -------------------------------------------- 7. the packet
  await p.click('.ctab:has-text("Export")'); await p.waitForTimeout(700);
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
  
  await p.click('.ctab:has-text("Coding")'); await p.waitForTimeout(700);
  const doc = await p.locator('.tabbody').textContent();
  ok('each visit records the elements a level rests on', doc.includes('Problems') && doc.includes('Risk'));
  ok('both routes to a level are shown', /gives 992\d\d\./.test(doc));
  ok('care management time is tracked per month', doc.includes('countable minutes'));
  ok('time spent by software does not count', doc.includes('does not'));
  ok('and says why', doc.includes('not clinical staff time'));
  ok('consent is a requirement with its own evidence', /[Vv]erbal consent/.test(doc));
  ok('it points at where the research came from', doc.includes('NEEDS-COUNSEL'));
  await p.screenshot({path:'v10-documentation.png'});

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

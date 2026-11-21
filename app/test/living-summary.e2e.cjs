/**
 * The living summary, and the things it must not become.
 *
 * Three claims are tested. That every sentence about a patient is
 * composed from the records at read time and can be traced back to
 * them. That the approved plan does not move because a record
 * arrived. And that the export is the whole packet rather than a
 * cover page.
 *
 * The care plan tab is gone, so the summary is read in the two places
 * it now lives: one problem at a time from the right column, and the
 * whole working copy inside an encounter, which is where it is
 * written.
 */
const {chromium}=require('playwright');
const {tab, hasTab, palette}=require('./tabs.cjs');
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
  ok('managed problems are named separately from the history',
    (await p.locator('.csum .dx.on').count())===3);
  ok('services are named in the same sentence',
    (await p.locator('.csum .dx.svc').allTextContents()).join('|')==='Preventative Services|Lifestyle Medicine');
  ok('the header is words, not a wall of pills',
    await p.locator('.chead').evaluate((el)=>{
      const dx = el.querySelector('.dx');
      return !dx || getComputedStyle(dx).borderBottomWidth === '0px';
    }));
  ok('three actions under it and no more',
    (await p.locator('.cacts .btn').count())===3);

  // ------------- 2. the problem sheet: derived, traceable, not typed
  await p.locator('.sumrow').first().click(); await p.waitForTimeout(450);
  const sheet = p.locator('.sheet');
  ok('the sheet is the problem, not the document',
    (await sheet.locator('h2').textContent())==='Essential hypertension');
  ok('nothing in it is a text field',
    (await sheet.locator('textarea, input').count())===0);
  const psum = await sheet.locator('.psum').textContent();
  ok(`it opens with what the patient reports, composed: ${psum.slice(0,38)}...`,
    psum.startsWith('Patient reports'));
  ok('and names what they are struggling with', psum.includes('struggle with'));
  ok('the problem is one paragraph, not a split into testimony and findings',
    (await sheet.locator('.psum').count())===1);
  ok('what the record shows is in it rather than announced separately',
    !psum.includes('Chart review:') && psum.length>120);
  ok('and the current measure rides along with it',
    /132\/78 on 30 Oct 2026, home average/.test(psum));
  ok('the sentence says how many records it was composed from',
    /Composed from \d+ records? when this opened/.test(await sheet.textContent()));
  await p.click('.srcmark'); await p.waitForTimeout(250);
  ok('and opens to the records themselves',
    (await p.locator('.srcitem').count())>=3);
  ok('the plan for this problem is here, as approved',
    (await sheet.textContent()).includes('Treat to the home readings'));
  ok('with what it is being treated with',
    (await sheet.textContent()).includes('Lisinopril 20 mg'));
  ok('and how it is going', (await sheet.textContent()).includes('How it is going'));
  ok('and when it is reviewed again',
    (await sheet.textContent()).includes('Follow-up'));
  await p.screenshot({path:'v10-problem-sheet.png'});
  await p.click('.sheetx'); await p.waitForTimeout(250);

  // ------------------------------- 3. the note, inside the visit
  await p.click('.startenc:has-text("Start a visit")'); await p.waitForTimeout(900);
  const ws = (await p.locator('.wrap').textContent()).replace(/\s+/g,' ');
  const line = await p.locator('.oneliner').textContent();
  ok(`the visit opens on the clinical one-liner: "${line.slice(0,40)}..."`,
    /^60F with PMH of /.test(line));
  ok('in shorthand rather than long form', line.includes('HTN') && line.includes('T2DM'));
  ok('and names what we are following them for',
    line.includes('following with our office for management of')
    && line.includes('preventative services') && line.includes('lifestyle medicine'));
  const secs = await p.locator('.nsechead h2').allTextContents();
  ok(`the note runs in the order the conversation does: ${secs.join(', ')}`,
    secs.join(',')==='Subjective,Objective,Assessment,Plan,What they do next');
  const grps = await p.locator('.nitemhead').allTextContents();
  ok('problems, lifestyle and preventative in every section that has items',
    grps.filter((g)=>g==='Problems').length===3
    && grps.filter((g)=>g==='Lifestyle').length===3
    && grps.filter((g)=>g==='Preventative').length===3);
  ok('the record is shown beside each field rather than retyped into it',
    (await p.locator('.wfcontext').first().textContent()).length>40);
  ok('every field is writable', (await p.locator('.nsec textarea').count())>=12);
  ok('nothing sets a status by button',
    !/At goal|Needs improvement/.test(ws));
  ok('and the instructions end in a date',
    (await p.locator('#nextvisit').count())===1);

  // what was said during the chart review is offered, not retyped
  await p.fill('#sOverall','Feeling steadier overall.'); await p.waitForTimeout(250);
  ok('what the physician writes stays written',
    (await p.locator('#sOverall').inputValue()).includes('steadier'));
  await p.locator('.wfield').first().locator('.wfcomment').click(); await p.waitForTimeout(250);
  await p.locator('.wfcommentbox').first().fill('Ask about the mother again next time.');
  ok('and a field can carry a comment that is not part of the note',
    (await p.locator('.wfcommentbox').first().inputValue()).includes('mother'));
  ok('the right column is the orders and nothing else',
    (await p.locator('.panel h2:has-text("Orders")').count())===1
    && (await p.locator('text=Ask the patient').count())===0
    && (await p.locator('text=New since version').count())===0);
  await p.screenshot({path:'v10-visit-note.png'});

  // ---------------- 4. the labs, with patient readings kept separate
  await p.click('.acctbtn'); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.click('text=Sharon White'); await p.waitForTimeout(700);
  await tab(p, 'Labs');
  const labs = (await p.locator('.tabbody').textContent()).replace(/\s+/g,' ');
  ok('reports, vitals and what is tracked over time, in that order',
    labs.indexOf('Reports') < labs.indexOf('Vitals')
    && labs.indexOf('Vitals') < labs.indexOf('Tracked over time'));
  ok('what the patient measures is a group of its own, labelled',
    labs.includes('Patient-measured, not clinic-measured'));
  await p.locator('.rec').first().click(); await p.waitForTimeout(350);
  ok('a report opens to its values, not to a summary of them',
    (await p.locator('.sheet .rows tr').count())>3);
  await p.click('.sheetx'); await p.waitForTimeout(250);

  // ------------------------------- 5. the sources, and adding to them
  // Everything on file is still one list, off the strip: the chart
  // review reads the record by section, not as a feed.
  await tab(p, 'Everything on file');
  const tl = await p.locator('.rec').count();
  ok(`every record is here to open (${tl})`, tl>=20);
  const tabtext = (await p.locator('.tabbody').textContent()).replace(/\s+/g,' ');
  ok('visits, updates, messages, letters and results together',
    ['Annual physical','Answered our question','Mammogram','panels']
      .every((k)=>tabtext.includes(k)));

  await tab(p, 'Subjective');
  ok('what the patient has said is a tab of its own',
    (await p.locator('.tabbody').textContent()).includes('Messages from them'));
  await p.locator('.rec:has-text("Something I read about statins")').last().click();
  await p.waitForTimeout(350);
  ok('a message the patient sent is readable in full',
    (await p.locator('.sheet').textContent()).includes('A friend sent me an article'));
  await p.click('.sheetx'); await p.waitForTimeout(250);

  // The claim this design rests on: a record arriving is counted,
  // and changes nothing a clinician has approved.
  await p.locator('.sumrow').first().click(); await p.waitForTimeout(400);
  const before = await p.locator('.sheet .psum').textContent();
  await p.click('.sheetx'); await p.waitForTimeout(350);
  const countBefore = await p.locator('.derivedfrom').textContent();
  await palette(p, 'Simulate a record arriving'); await p.waitForTimeout(700);
  const countAfter = await p.locator('.derivedfrom').textContent();
  ok(`the arriving record is counted: "${(countAfter.match(/\d+ records? since/)||[''])[0]}"`,
    countBefore!==countAfter);
  await p.locator('.sumrow').first().click(); await p.waitForTimeout(500);
  const after = await p.locator('.sheet .psum').textContent();
  ok('and the approved plan does not move because of it', before===after);
  await p.click('.sheetx'); await p.waitForTimeout(250);
  ok('follow-up is still reachable, off the strip', await hasTab(p, 'Follow-up'));

  // -------------------------------------------- 7. the packet
  await tab(p, 'Export'); await p.waitForTimeout(300);
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
  
  await tab(p, 'Coding'); await p.waitForTimeout(300);
  const doc = await p.locator('.tabbody').textContent();
  ok('each visit records the elements a level rests on', doc.includes('Problems') && doc.includes('Risk'));
  ok('both routes to a level are shown', /gives 992\d\d\./.test(doc));
  // Care management is not modelled any more. The tab says so and
  // says where the working went, which is the honest version of
  // deleting a feature that cost something to research.
  ok('care management programmes are named as not billed here',
    doc.includes('Care management programmes are not billed here'));
  ok('and the reason is the practice, not an oversight',
    doc.includes('clinical staff') && doc.includes('this practice has neither'));
  ok('it points at where the research went',
    doc.includes('billing-architecture.md') && doc.includes('D-050'));
  await p.screenshot({path:'v10-documentation.png'});

  const over=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  ok('no horizontal overflow', !over);

  await b.close();
  console.log(pass.concat(fail).join('\n'));
  console.log('\n'+(fail.length?`${fail.length} FAILED`:'ALL PASSED')+(errs.length?'\nERRORS:\n'+errs.slice(0,4).join('\n'):'\nno js errors'));
})();

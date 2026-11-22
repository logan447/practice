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
const {tab, hasTab, palette, planUpdatedOn, sentCount, noteText, writeNote}=require('./tabs.cjs');
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
  // The header is the patient, not the practice. What this practice
  // manages is the first thing in the problems tab.
  ok('the header does not restate the first tab',
    (await p.locator('.csum').count())===0);
  await tab(p, 'Problems');
  // Who holds a problem is a tag on its own row now, not a heading
  // over a group of them.
  ok('which says, problem by problem, who holds it',
    (await p.locator('.rectag:text-is("Their PCP")').count())>0
    && (await p.locator('.rectag:text-is("Controlled"), .rectag:text-is("Uncontrolled")').count())>0);
  ok('the header is words, not a wall of pills',
    await p.locator('.chead').evaluate((el)=>{
      const dx = el.querySelector('.dx');
      return !dx || getComputedStyle(dx).borderBottomWidth === '0px';
    }));
  ok('two actions beside the name and no more',
    (await p.locator('.cacts .btn').count())===2);

  // ------------- 2. the problem sheet: derived, traceable, not typed
  await p.locator('.rec').first().click(); await p.waitForTimeout(450);
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
  const line = await p.locator('.nboxlead').first().textContent();
  ok(`the visit opens on the clinical one-liner: "${line.slice(0,40)}..."`,
    /^60F with PMH of /.test(line));
  ok('in shorthand rather than long form', line.includes('HTN') && line.includes('T2DM'));
  ok('and names what we are following them for',
    line.includes('following with our office for management of')
    && line.includes('preventative services') && line.includes('lifestyle medicine'));
  const secs = await p.locator('.nboxtitle').allTextContents();
  ok(`the note runs in the order the conversation does: ${secs.join(', ')}`,
    secs.join(',')==='Subjective,Objective,Assessment and plan');
  // Checked before anything reads a folded section open: a visit
  // opens on what the patient says and folds the rest.
  ok('three boxes, and the visit opens on the subjective alone',
    (await p.locator('.note .nbox').count())===3
    && (await p.locator('.note .nbox.shut').count())===2);
  // The objective, in the order it is read: what was measured, what
  // came back from the lab, what was found by hand, then the scored
  // questionnaires, which are measurements the patient produced.
  const obj = await noteText(p,'objective');
  ok(`the objective runs vitals, labs, examination, surveys: ${
    obj.split('\n').filter((l)=>/^(Examination|Surveys)$/.test(l.trim())).join(', ')}`,
    obj.indexOf('Examination') < obj.indexOf('Surveys'));
  ok('a short screen carries its score, the one before it, and what it means',
    /PHQ-2: 1 of 6 \(2\) \u00b7 Negative/.test(obj)
    && /GAD-2: 3 of 6 \(2\) \u00b7 Positive/.test(obj));
  ok('and a wellbeing measure carries no cut-off, because it has none',
    /Flourishing: 79 of 120 \(71\)/.test(obj) && !/Flourishing[^\n]*Positive/.test(obj));
  ok('the positive screen is the part that is marked',
    (await p.locator('.nbox:has(.nboxtitle:text-is("Objective")) .rospos').count())===1);

  const plan = await noteText(p,'plan');
  ok('the plan arrives with the problems, pillars and services written into it',
    plan.includes('Essential hypertension') && plan.includes('Exercise')
    && plan.includes('Mammogram'));
  // Heading with the status, then the sentence that says what the
  // target is and why it is or is not there, then points that are
  // verbs: continue, start, hold, order, refer.
  ok(`each one with where it stands and what is being done: ${
    plan.split('\n').slice(1, 3).join(' / ').slice(0, 60)}`,
    /\u2014 (At goal|Not at goal|Not assessed)$/m.test(plan)
    && plan.includes('Continue Lisinopril 20 mg, one tablet each morning'));
  ok('the points of the plan are verbs, not labels',
    /\u2022 Send referral to Dr\. /.test(plan)
    && /\u2022 Continue \w+ \d/.test(plan)
    && plan.includes('\u2022 Lifestyle interventions as below'));
  // A preventative service is one line: where it stands, when it was
  // last done, what happens next. Six of them with a heading, a
  // sentence of dates and a bullet each was eighteen lines to say
  // six things.
  ok('a preventative service is one line, ending in the next step',
    /Mammogram \u2014 Overdue, last done [^,]+, order today/.test(plan)
    && /Colonoscopy \u2014 Up to date, last done [^,]+, no next date set/.test(plan));
  /*
   * Every block the visit works on has the same shape: the name and
   * the status, then one or two lines defending that status, then
   * the points. Checked structurally rather than by example,
   * because the failure is always one block that drifted.
   */
  const SERVICE = /^(Lifestyle|Preventative Medicine Services|Not addressed this visit)$/;
  const lines = plan.split('\n').map((l) => l.trim());
  const isPoint = (l) => /^[\u2022\-*]/.test(l);
  const isHead = (l) => l.includes('\u2014') && !isPoint(l)
    && !/Triaged as stable/.test(l);
  let blocks = 0;
  let shaped = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!isHead(lines[i])) continue;
    let prose = 0;
    let j = i + 1;
    while (j < lines.length && lines[j] && !isPoint(lines[j])
      && !isHead(lines[j]) && !SERVICE.test(lines[j])) { prose++; j++; }
    blocks++;
    if (prose >= 1 && prose <= 2) shaped++;
  }
  ok(`every problem and pillar is a status, one or two lines, then points (${
    shaped} of ${blocks})`,
  blocks >= 8 && shaped === blocks);

  ok('and a pillar carries only whether it has started',
    /Exercise \u2014 (In progress|Not started)/.test(plan)
    && !/\u2014 (Holding|Struggling)/.test(plan));
  ok('and a pillar is written once, under its own heading',
    plan.split('Twenty minutes of walking').length === 2);
  const subj = await noteText(p,'subjective');
  ok('and the subjective with their own words about each',
    subj.includes('Patient reports'));
  // The three or four things you ask about because of the problem in
  // front of you, at the end of that problem's line. Different per
  // problem, and never under a pillar or a service.
  ok('each problem ends in its own pertinent negatives',
    /Essential hypertension[^\n]*Denies chest pain[^\n]*ankle swelling\./.test(subj)
    && /Type 2 diabetes[^\n]*Denies excessive thirst[^\n]*shakiness between meals\./.test(subj));
  ok('and a pillar or a service carries none',
    !/Physical activity[^\n]*Denies/.test(subj) && !/Mammogram[^\n]*Denies/.test(subj));
  // The sweep for what the problem list would not have asked about,
  // at the foot of the section. A system the patient's own words
  // raised reads as a positive; the rest say nothing was reported,
  // which is true, rather than that they were asked and denied.
  ok('a formal review closes the subjective',
    subj.includes('Review of systems')
    && /Constitutional: no symptoms reported\./.test(subj));
  ok('with the positives taken from what the patient actually said',
    /Musculoskeletal: knee pain\./.test(subj)
    && /Endocrine: shakiness in the evenings\./.test(subj));
  ok('and the positives are the part that is marked',
    (await p.locator('.nbox:has(.nboxtitle:text-is("Subjective")) .rospos').count())===2
    && (await p.locator('.nbox:has(.nboxtitle:text-is("Subjective")) .rospos')
      .first().textContent()).includes('knee pain'));
  // Status is a sentence you wrote, not a button you picked.
  ok('nothing sets a status by button',
    (await p.locator('.note .btn').count())===0);
  ok('and the instructions end in a date',
    (await p.locator('#nextvisit').count())===1);
  ok('the instructions are beside the note, to type into as you go',
    (await p.locator('.panel:has-text("Patient instructions") #instructions').count())===1);

  // what was said during the chart review is offered, not retyped
  await writeNote(p,'subjective','Feeling steadier overall.');
  ok('what the physician writes stays written',
    (await noteText(p,'subjective')).includes('steadier'));
  ok('and nothing on the screen is a comment box beside a field',
    (await p.locator('.wfcommentbox').count())===0);
  ok('the right column is the instructions and the orders, and nothing else',
    (await p.locator('.panel h2:has-text("Patient instructions")').count())===1
    && (await p.locator('.panel h2:has-text("Orders")').count())===1
    && (await p.locator('.panel h2:has-text("This visit")').count())===0
    && (await p.locator('text=Ask the patient').count())===0);
  await p.screenshot({path:'v10-visit-note.png'});

  // ---------------- 4. the labs, with patient readings kept separate
  await p.click('.acctbtn'); await p.waitForTimeout(150);
  await p.click('.acctrow:has-text("Patients")'); await p.waitForTimeout(400);
  await p.click('text=Sharon White'); await p.waitForTimeout(700);
  await tab(p, 'Labs');
  // One list in time order. What kind of thing each row is, and
  // whether anyone has read it, is the tag beside its date.
  const labtags = await p.locator('.rectag').allTextContents();
  ok(`reports and what is tracked over time, all on one list: ${
    [...new Set(labtags)].join(', ')}`,
    labtags.includes('Report') && labtags.includes('Tracked'));
  ok('what the patient measures says so on its own row',
    (await p.locator('.rectag:text-is("Patient-measured")').count())>0);
  await p.locator('.rec:has-text("Comprehensive metabolic panel")').first().click();
  await p.waitForTimeout(400);
  ok('a report opens to its values, not to a summary of them',
    (await p.locator('.sheet .rows tr').count())>3);

  // A value in a report is a number; the same value across every
  // report that holds it is the finding, and it used to be two
  // clicks and a different tab away.
  await p.locator('.clickrow:has-text("Creatinine")').first().click();
  await p.waitForTimeout(450);
  ok('one value out of a report opens its own trend, plotted',
    (await p.locator('.labplotsvg').count())===1
    && (await p.locator('.lpdot').count())>=2);
  ok('with the reference range drawn behind it, not as two more lines',
    (await p.locator('.lpband').count())===1);
  ok('and the readings underneath, so the plot is not the only way to read it',
    (await p.locator('.sheet').last().locator('.rows tr').count())>=2);
  const lpread = await p.locator('.lpread').textContent();
  ok(`the latest reading is named in words: "${lpread.trim().slice(0,34)}"`,
    /mg\/dL/.test(lpread) && /reference/.test(lpread));
  await p.locator('.sheetx').last().click(); await p.waitForTimeout(250);
  await p.locator('.sheetx').last().click(); await p.waitForTimeout(250);

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
    (await p.locator('.rectag:text-is("Inquiry")').count())>0
    && (await p.locator('.rectag:text-is("Update")').count())>0);
  await p.locator('.rec:has-text("Something I read about statins")').last().click();
  await p.waitForTimeout(350);
  ok('a message the patient sent is readable in full',
    (await p.locator('.sheet').textContent()).includes('A friend sent me an article'));
  await p.click('.sheetx'); await p.waitForTimeout(250);

  // The claim this design rests on: a record arriving is counted,
  // and changes nothing a clinician has approved.
  await tab(p, 'Problems');
  await p.locator('.rec').first().click(); await p.waitForTimeout(400);
  const before = await p.locator('.sheet .psum').textContent();
  await p.click('.sheetx'); await p.waitForTimeout(350);
  const countBefore = await sentCount(p);
  await palette(p, 'Simulate a record arriving'); await p.waitForTimeout(700);
  const countAfter = await sentCount(p);
  ok(`the arriving record is kept (${countBefore} then ${countAfter})`,
    countAfter > countBefore);
  await tab(p, 'Problems');
  await p.locator('.rec').first().click(); await p.waitForTimeout(500);
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

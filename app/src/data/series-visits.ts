/**
 * Raymond Teal's year, visit by visit, on one template.
 *
 * Five signed notes with the same skeleton in the same order, which
 * is the point of them. The sections are the ones in
 * domain/noteTemplate.ts: a power statement, what has happened since
 * last time, the problems worked on today, the lifestyle pillars, the
 * preventative schedule, the results read, a review of systems, the
 * whole problem list, the medicines and the care team. Then an
 * assessment and plan whose problems each carry a status line, at
 * most two lines defending that status, and then bullets.
 *
 * A visit that does not cover a section says so in one line and gives
 * the dates either side of it. The acute visit in March is the test
 * of that: twenty-five minutes for a painful toe touches one problem
 * and nothing else, and its note still has every heading the annual
 * has, with four of them saying what was not done and when it last
 * was. That is a more useful page than one where the sections quietly
 * disappear, because a reader can tell the difference between not
 * done and not written down.
 *
 * They are written by hand rather than generated, which is the thing
 * to keep in mind: the live note builds the review of systems, the
 * problem list, the medicines and the care team from the chart, and
 * these restate them. If the two ever disagree, the generated one is
 * right and these are stale.
 *
 * The clinical thread, so it can be checked rather than trusted:
 *
 *   A1c       7.9 -> 7.1 -> 6.5 -> 6.1
 *   BP        148/92 -> 134/84 -> 128/78 -> 124/76
 *   LDL       162 -> 88 -> 82 -> 78
 *   ACR       42 -> 38 -> 22 -> 14
 *   Weight    238 -> 229 -> 220 -> 211
 *
 * Two drugs started on day one, one added at three months for the
 * albuminuria and not for the sugar, one thiazide stopped on day one
 * because an ACE inhibitor was the better first drug in a man with
 * protein in his urine. One flare of gout in March, treated with a
 * steroid rather than a non-steroidal and not followed by urate
 * lowering therapy, because one flare is not a reason to treat
 * somebody for life.
 */
import type { Encounter } from '../domain/types';

const P = 'p10';

/* ------------------------------------------------------------------ */
/* 18 Nov 2025 - the initial assessment                                */
/* ------------------------------------------------------------------ */

const INITIAL: Encounter = {
  id: 'te1', patientId: P, date: '2025-11-18', start: 8 * 60, kind: 'visit',
  legacyKind: 'initial', setting: 'in-person',
  reason: 'First assessment. Full history, medicines, labs and what he wants to work on.',
  status: 'signed', duration: 90, minutes: 95, signedAt: '2025-11-18',
  note: {
    subjective: {
      oneLiner: '52M with PMH of hypertension presenting to my office today for a first '
        + 'full assessment, management of hypertension, preventative services and '
        + 'lifestyle medicine.',
      reason: 'Joined after his father died. Wants to know where he actually stands.',

      chartReview: 'His father had a first heart attack at 55 and died at 61. That is '
        + 'why he is here and he said so in the first minute. He has never had an hour '
        + 'of anybody’s time and arrives believing he has one problem.\n\n'
        + 'Problems addressed today\n'
        + 'Hypertension — Not assessed. Started on hydrochlorothiazide 25 mg at an '
        + 'urgent care in March 2024 after a reading of 156/96 and never followed up. He '
        + 'has taken it since and has never had a second reading taken anywhere. No home '
        + 'machine. Denies headache, chest pain, breathlessness, and ankle swelling.\n'
        + 'Type 2 diabetes mellitus — Not assessed, new today. No symptoms. Told '
        + 'twice that he was a bit borderline and never given a number. Denies polyuria, '
        + 'polydipsia, blurred vision, and numbness in the feet.\n'
        + 'Albuminuria in diabetes — Not assessed, new today. Found on the urine '
        + 'sent this morning. Denies frothy urine and any change in volume.\n'
        + 'Mixed hyperlipidaemia — Not assessed, new today. Untreated. Denies '
        + 'muscle aches and any previous statin.\n'
        + 'Obstructive sleep apnoea — Not assessed, suspected. Snores, which his '
        + 'wife raised rather than he did, and falls asleep in front of the television '
        + 'most nights. Fell asleep at a red light once, which he mentioned and then '
        + 'said he had not meant to. Denies morning headache and witnessed choking.\n'
        + 'Obesity — Not assessed. 238 lb, heaviest recorded 241 lb last year. Lost '
        + 'weight twice before on his own and regained it both times.',

      diagnostics: 'Lifestyle\n'
        + 'Exercise — None beyond walking to the car. Desk job, four hours a week '
        + 'driving.\n'
        + 'Diet — Two sodas a day. Breakfast is a pastry at the desk. His wife '
        + 'cooks most evenings and he describes the food as fine and the portions as '
        + 'not.\n'
        + 'Sleep — Seven hours in bed, unrefreshing, snoring. Tired through every '
        + 'afternoon for years.\n'
        + 'Stress — Not raised by him and not asked about today.\n'
        + 'Substances — Three or four beers most evenings and more at the weekend. '
        + 'Stopped smoking in 2011 after twenty pack years. No drug use.\n'
        + 'Social — Lives with his wife and a nineteen year old. Not raised today.\n'
        + 'Financial — Not raised today.\n\n'
        + 'Preventative Medicine Services\n'
        + 'Colorectal cancer screening — Overdue. Screening starts at 45 and he is '
        + '52. Never had one.\n'
        + 'Diabetic retinal screening — Due from today, with the diagnosis.\n'
        + 'Diabetic foot examination — Due from today.\n'
        + 'Shingles vaccination — Due. Over 50 and has had neither dose.\n'
        + 'Influenza vaccination — Due this season.\n'
        + 'Tetanus booster — Overdue since 2023.\n\n'
        + 'Results reviewed\n'
        + 'No laboratory results on file from anywhere. The last blood test he remembers '
        + 'was before 2020. Bloods and a urine albumin drawn this morning and resulted '
        + 'during the visit: A1c 7.9, glucose 162, LDL 162, triglycerides 240, HDL 38, '
        + 'urine albumin to creatinine 42, estimated GFR 84, ALT 62.',

      specialists: '',

      additional: 'Review of systems\n'
        + 'Constitutional: tired through the afternoon, every day, for years.\n'
        + 'Respiratory: snoring, witnessed pauses in breathing reported by his wife.\n'
        + 'Neurological: falls asleep watching television and once at a red light.\n'
        + 'Cardiovascular: no chest pain, no breathlessness, no palpitations, no oedema.\n'
        + 'Endocrine: no polyuria, no polydipsia, no weight loss.\n'
        + 'Gastrointestinal: no symptoms reported.\n'
        + 'Genitourinary: no symptoms reported.\n'
        + 'Musculoskeletal: no symptoms reported.\n'
        + 'Skin: no symptoms reported.\n'
        + 'Psychiatric: no symptoms reported.\n'
        + 'Haematological: no symptoms reported.\n'
        + 'Eyes, ears, nose and throat: no symptoms reported.\n\n'
        + 'Full problem list\n'
        + '• Hypertension (chronic) — Addressed at this visit, as above. '
        + 'Ours.\n'
        + '• Type 2 diabetes mellitus (chronic) — Addressed at this visit, as '
        + 'above. Diagnosed today. Ours.\n'
        + '• Albuminuria in diabetes (chronic) — Addressed at this visit, as '
        + 'above. Diagnosed today. Ours.\n'
        + '• Mixed hyperlipidaemia (chronic) — Addressed at this visit, as '
        + 'above. Diagnosed today. Ours.\n'
        + '• Obesity (chronic) — Addressed at this visit, as above. Ours.\n'
        + '• Obstructive sleep apnoea (chronic) — Addressed at this visit, as '
        + 'above. Suspected, not yet diagnosed. Referred today.\n'
        + '• Former tobacco use (chronic) — Triaged as stable. Resolved in '
        + '2011, twenty pack years. Nobody is managing it because there is nothing to '
        + 'manage.\n\n'
        + 'Medications\n'
        + '• Hydrochlorothiazide 25 mg — one tablet each morning. Taking. '
        + 'Reported by the patient, not verified with a pharmacy.\n'
        + '• Nothing else, prescribed or over the counter. No supplements.\n'
        + 'Reconciled with him at this visit, which is the first time anybody has.\n\n'
        + 'Care team\n'
        + '• Nobody. This practice is the only one he has, and two referrals go '
        + 'out today: sleep medicine for the study, gastroenterology for the '
        + 'colonoscopy.',
    },
    objective: {
      homeMeasures: '',
      vitals: '',
      examTemplate: 'in-person',
      exam: 'Physical Exam\n'
        + 'General: overweight, central distribution. Comfortable at rest.\n'
        + 'Neck: circumference 17.5 inches. No goitre, no bruit.\n'
        + 'Cardiovascular: rate and rhythm regular. No murmur. Pulses present and equal '
        + 'in all four limbs. No peripheral oedema.\n'
        + 'Respiratory: chest clear, air entry equal.\n'
        + 'Abdomen: soft, obese, no hepatomegaly to palpation.\n'
        + 'Feet: skin and nails intact, no deformity, no ulceration. Pulses present. '
        + 'Sensation intact to 10 g monofilament at all sites, both feet.\n'
        + 'Oropharynx: modified Mallampati class III.',
    },
    assessment: {
      oneLiner: '',
      overall: '52M with PMH of hypertension presenting to my office today for a first '
        + 'full assessment, management of hypertension, preventative services and '
        + 'lifestyle medicine. Four diagnoses are made today that he arrived without.',
    },
    plan: {
      problems: [
        {
          id: 'te1-p1',
          problem: 'Type 2 diabetes mellitus — Not at goal, new diagnosis',
          assessment: 'A1c 7.9 per cent on a venous sample today, which is diagnostic on '
            + 'its own and will be confirmed on the repeat in three months.\n'
            + 'No symptoms, no ketones, and a fasting glucose of 162, so this is '
            + 'ordinary type 2 and not anything that needs today to be an urgent day.',
          treatment: '• Start metformin 500 mg, one tablet daily with food, for two '
            + 'weeks, then 500 mg twice daily, then 1000 mg twice daily if tolerated\n'
            + '• Lifestyle interventions as below\n'
            + '• Retinal screening and a foot examination are due from today, not '
            + 'from a year from today',
          orders: '• Repeat A1c in three months\n'
            + '• Referral to optometry for diabetic retinal screening',
          followUp: '',
        },
        {
          id: 'te1-p2',
          problem: 'Hypertension — Not at goal',
          assessment: '148/92 today, on hydrochlorothiazide 25 mg and never rechecked '
            + 'since it was started twenty months ago. Target is under 130/80 because of '
            + 'the diabetes and the albuminuria.\n'
            + 'The drug is not wrong so much as not the right first one for him: with '
            + 'protein in the urine an ACE inhibitor is the one that protects the kidney '
            + 'as well as lowering the pressure.',
          treatment: '• Stop hydrochlorothiazide 25 mg today\n'
            + '• Start lisinopril 10 mg, one tablet each morning\n'
            + '• Lifestyle interventions as below',
          orders: '• Home blood pressure machine, with how to use it written down. '
            + 'Fourteen days of readings, morning and evening, before the next visit\n'
            + '• Basic metabolic panel in two weeks to check the potassium and the '
            + 'creatinine after starting the ACE inhibitor',
          followUp: '',
        },
        {
          id: 'te1-p3',
          problem: 'Albuminuria in diabetes — Not at goal, new diagnosis',
          assessment: 'Urine albumin to creatinine ratio 42 mg/g, where under 30 is '
            + 'normal. Estimated GFR 84, so the filtration is intact and this is the '
            + 'earliest stage, which is the stage at which it is reversible.\n'
            + 'It is the single most consequential finding today, and it is the one that '
            + 'decides both the blood pressure drug and the second diabetes drug.',
          treatment: '• Lisinopril as above, started for this as much as for the '
            + 'pressure\n'
            + '• Consider adding empagliflozin at the next visit if the ratio is '
            + 'still above 30',
          orders: '• Repeat urine albumin to creatinine ratio in three months',
          followUp: '',
        },
        {
          id: 'te1-p4',
          problem: 'Mixed hyperlipidaemia — Not at goal, new diagnosis',
          assessment: 'LDL 162, triglycerides 240, HDL 38, untreated. With diabetes '
            + 'diagnosed today and a father who had a myocardial infarction at 55, he is '
            + 'in the group where a statin is indicated without needing a risk score to '
            + 'argue it.\n'
            + 'Target is under 100 to begin with. Under 70 is the better number for him '
            + 'and is a conversation for when he is on treatment, not today.',
          treatment: '• Start atorvastatin 40 mg, one tablet at night\n'
            + '• Lifestyle interventions as below',
          orders: '• Repeat lipid panel in three months',
          followUp: '',
        },
        {
          id: 'te1-p5',
          problem: 'Obstructive sleep apnoea — Not assessed, suspected',
          assessment: 'Snoring, witnessed apnoeas, daytime sleepiness, a 17.5 inch neck '
            + 'and a Mallampati III. He has fallen asleep at a red light once.\n'
            + 'Nothing about this can be treated until it is measured, and no amount of '
            + 'advice about sleep hygiene treats an apnoea.',
          treatment: '• Send referral and confirm appointment with sleep medicine '
            + 'for a home sleep apnoea test\n'
            + '• Told not to drive when sleepy, and why, and he repeated it back',
          orders: '• Referral to Austin Sleep and Pulmonary',
          followUp: '',
        },
        {
          id: 'te1-p6',
          problem: 'Obesity — Not at goal',
          assessment: '238 lb, body mass index 34.1. The first five per cent is what the '
            + 'A1c and the blood pressure will follow, which is twelve pounds and not a '
            + 'number he has to find frightening.\n'
            + 'He has lost weight twice before on his own and regained it both times, so '
            + 'the plan is built to be kept rather than to be fast.',
          treatment: '• Lifestyle interventions as below\n'
            + '• Weigh at each visit here, not at home',
          orders: '',
          followUp: '',
        },
        {
          id: 'te1-p7',
          problem: 'Lifestyle',
          assessment: '',
          treatment: '• Exercise: walk thirty minutes after dinner, five evenings a '
            + 'week. Not started.\n'
            + '• Diet: breakfast that is not a pastry, one meat free dinner a week, '
            + 'and stop drinking calories. The two sodas a day are about 300 of them. '
            + 'Not started.\n'
            + '• Sleep: nothing until the study is done, because the study is the '
            + 'intervention. Not started.\n'
            + '• Substances: drinking screen positive at six. Two drink free days a '
            + 'week to start. Not started.\n'
            + '• Stress: not addressed today. Ninety minutes held four new '
            + 'diagnoses and that was enough.\n'
            + '• Social: not addressed today.\n'
            + '• Financial: not addressed today.',
          orders: '',
          followUp: '',
        },
        {
          id: 'te1-p8',
          problem: 'Preventative Medicine Services',
          assessment: '',
          treatment: '• Colorectal cancer screening — Overdue. Send referral '
            + 'and confirm appointment with gastroenterology for a colonoscopy.\n'
            + '• Diabetic retinal screening — Due now, from today’s '
            + 'diagnosis. Referred.\n'
            + '• Diabetic foot examination — Done today. Normal.\n'
            + '• Shingles vaccination — Due. Offered and he wants to think '
            + 'about it.\n'
            + '• Influenza vaccination — Due this season. Given today.\n'
            + '• Tetanus booster — Overdue since 2023. Offered and deferred to '
            + 'the next visit.',
          orders: '',
          followUp: '',
        },
      ],
      overall: '1. Start the metformin at one tablet a day with food. Go to two a day '
        + 'after two weeks if your stomach is settled.\n'
        + '2. Stop the hydrochlorothiazide. Start the lisinopril the same morning.\n'
        + '3. Start the atorvastatin at night.\n'
        + '4. Buy the blood pressure machine on the sheet and take a reading every '
        + 'morning and every evening for fourteen days before you come back.\n'
        + '5. Go for the blood test in two weeks. You do not need to fast for it.\n'
        + '6. Book the sleep study and the colonoscopy. The office will call you with '
        + 'both numbers if you have not heard in a week.\n'
        + '7. Walk for thirty minutes after dinner, five evenings a week.\n'
        + '8. Pick two evenings a week with no beer.',
      followUp: 'Follow up 17 Feb 2026, three months, for the repeat A1c, the urine '
        + 'albumin, the lipids and the home blood pressure readings.',
      booked: [
        { date: '2026-02-17', why: 'three month review of the new diagnoses' },
        { date: '2026-05-19', why: 'six month review and the lifestyle prescriptions' },
        { date: '2026-11-17', why: 'the annual visit' },
      ],
      /*
       * What he was quoted on the day: two planned reviews, an annual
       * and two unbooked visits the projection expected, discounted
       * and divided by twelve. Kept because the annual compares the
       * year against the price he was actually given, not against one
       * worked out afterwards with the year in hand.
       */
      quotedMonthly: 68.94,
    },
  },
};

/* ------------------------------------------------------------------ */
/* 17 Feb 2026 - three months                                          */
/* ------------------------------------------------------------------ */

const THREE_MONTH: Encounter = {
  id: 'te2', patientId: P, date: '2026-02-17', start: 9 * 60 + 30, kind: 'visit',
  legacyKind: 'follow-up', setting: 'in-person',
  reason: 'Three month review of the diagnoses made in November.',
  status: 'signed', duration: 45, minutes: 40, signedAt: '2026-02-17',
  note: {
    subjective: {
      oneLiner: '52M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea and obesity presenting to my office '
        + 'today for management of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea and obesity, preventative services '
        + 'and lifestyle medicine.',
      reason: 'Three month review. Brought the home readings on paper, all of them.',

      chartReview: 'Three months on from four diagnoses. The sleep study was done in '
        + 'January and he has been on CPAP since the 12th of February, which he raised '
        + 'before any of the numbers: he is awake in the afternoons for the first time '
        + 'in years.\n\n'
        + 'Problems addressed today\n'
        + 'Type 2 diabetes mellitus — Not at goal, improving. Taking metformin 1000 '
        + 'mg twice daily since early January. Loose stools for the first fortnight and '
        + 'none since. Denies hypoglycaemia, polyuria, polydipsia, and blurred vision.\n'
        + 'Albuminuria in diabetes — Not at goal. No new symptoms and none '
        + 'expected: this is a number, not a feeling.\n'
        + 'Hypertension — Not at goal, improving. Taking lisinopril 10 mg. Fourteen '
        + 'days of home readings averaging 136/85. Denies cough, dizziness on standing, '
        + 'and ankle swelling.\n'
        + 'Mixed hyperlipidaemia — At goal. LDL 88 from 162 on atorvastatin 40 mg. '
        + 'Denies muscle aches, weakness, and dark urine.\n'
        + 'Obstructive sleep apnoea — At goal. Study done 29 January, apnoea '
        + 'hypopnoea index 22, moderate. Seen by sleep medicine 10 February and on CPAP '
        + 'since the 12th. Says it was unbearable for four nights and then was not. '
        + 'Denies mask leak and dry mouth.\n'
        + 'Obesity — Not at goal, improving. 229 lb from 238.',

      diagnostics: 'Lifestyle\n'
        + 'Exercise — Walking most evenings, by his phone count about five a week.\n'
        + 'Diet — The sodas are gone and have not come back. One meat free dinner '
        + 'most weeks.\n'
        + 'Sleep — CPAP every night since the 12th. The afternoons are back.\n'
        + 'Stress — Raised today for the first time. Busy quarter, phone in the '
        + 'bedroom, lunch at the desk.\n'
        + 'Substances — The two dry days a week happen about one week in three.\n'
        + 'Social — Not raised today.\n'
        + 'Financial — Not raised today.\n\n'
        + 'Preventative Medicine Services\n'
        + 'Colorectal cancer screening — Booked 21 April with Dr. Mensah. He has '
        + 'the appointment.\n'
        + 'Diabetic retinal screening — Done 13 January. No retinopathy.\n'
        + 'Shingles vaccination — Still due. Agreed to start the course at the next '
        + 'visit.\n'
        + 'Tetanus booster — Still overdue. Offered again and deferred again.\n\n'
        + 'Results reviewed\n'
        + 'A1c 7.1 from 7.9. LDL 88 from 162. Urine albumin to creatinine 38 from 42. '
        + 'Potassium 4.2 and creatinine 1.04 on the two week check after starting the '
        + 'lisinopril, both unchanged. Home sleep apnoea test 29 January: apnoea '
        + 'hypopnoea index 22, nadir saturation 86 per cent.',

      specialists: '',

      additional: 'Review of systems\n'
        + 'Constitutional: no longer tired in the afternoons, which is new.\n'
        + 'Respiratory: snoring stopped with the machine, per his wife.\n'
        + 'Neurological: no daytime sleepiness. No further episodes at the wheel.\n'
        + 'Cardiovascular: no chest pain, no breathlessness, no palpitations, no oedema.\n'
        + 'Endocrine: no hypoglycaemia, no polyuria, no polydipsia.\n'
        + 'Musculoskeletal: no muscle aches on the statin.\n'
        + 'Gastrointestinal: no symptoms reported.\n'
        + 'Genitourinary: no symptoms reported.\n'
        + 'Skin: no symptoms reported.\n'
        + 'Psychiatric: no symptoms reported.\n'
        + 'Haematological: no symptoms reported.\n'
        + 'Eyes, ears, nose and throat: no symptoms reported.\n\n'
        + 'Full problem list\n'
        + '• Type 2 diabetes mellitus (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Hypertension (chronic) — Addressed at this visit, as above. '
        + 'Ours.\n'
        + '• Albuminuria in diabetes (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Mixed hyperlipidaemia (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Obstructive sleep apnoea (chronic) — Addressed at this visit, as '
        + 'above. Co-managed with Dr. Ingrid Halvorsen, Sleep medicine. Last seen 10 Feb '
        + '2026, next 9 Feb 2027.\n'
        + '• Obesity (chronic) — Addressed at this visit, as above. Ours.\n'
        + '• Former tobacco use (chronic) — Triaged as stable. Resolved in '
        + '2011. Nobody is managing it because there is nothing to manage.\n\n'
        + 'Medications\n'
        + '• Metformin 1000 mg — one tablet twice daily with food. Taking.\n'
        + '• Lisinopril 10 mg — one tablet each morning. Taking.\n'
        + '• Atorvastatin 40 mg — one tablet at night. Taking.\n'
        + '• Hydrochlorothiazide 25 mg — stopped 18 Nov 2025.\n'
        + 'Reconciled with him at this visit, bottle by bottle. No supplements, nothing '
        + 'over the counter.\n\n'
        + 'Care team\n'
        + '• Dr. Ingrid Halvorsen, Sleep medicine, Austin Sleep and Pulmonary '
        + '— co-managing the apnoea. Last seen 10 Feb 2026, next 9 Feb 2027. '
        + 'Nothing outstanding; machine reports come to us monthly.\n'
        + '• Dr. Paul Mensah, Gastroenterology, Capital Digestive — '
        + 'colonoscopy booked 21 Apr 2026. Referral confirmed and he has the '
        + 'appointment.',
    },
    objective: {
      homeMeasures: 'Fourteen days of home readings, morning and evening. Average '
        + '136/85. Highest 148/92, lowest 124/78.',
      vitals: '',
      examTemplate: 'in-person',
      exam: 'Physical Exam\n'
        + 'General: comfortable, visibly less puffy about the face than in November.\n'
        + 'Cardiovascular: rate and rhythm regular. No murmur. No peripheral oedema.\n'
        + 'Respiratory: chest clear.\n'
        + 'Skin: no CPAP mask pressure damage over the bridge of the nose.',
    },
    assessment: {
      oneLiner: '',
      overall: '52M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea and obesity presenting to my office '
        + 'today for management of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea and obesity, preventative services '
        + 'and lifestyle medicine. Everything is moving and the lipids are already where '
        + 'they need to be.',
    },
    plan: {
      problems: [
        {
          id: 'te2-p1',
          problem: 'Type 2 diabetes mellitus — Not at goal, improving',
          assessment: 'A1c 7.1 from 7.9 in three months, on metformin at full dose and '
            + 'nine pounds of weight loss. Target is under 7.0 and he is almost there.\n'
            + 'No second agent is needed for the sugar. One is needed for the kidney, '
            + 'which is the next problem and is where empagliflozin comes from.',
          treatment: '• Continue metformin 1000 mg, one tablet twice daily with '
            + 'food\n'
            + '• Lifestyle interventions as below',
          orders: '• Repeat A1c in three months',
          followUp: '',
        },
        {
          id: 'te2-p2',
          problem: 'Albuminuria in diabetes — Not at goal',
          assessment: 'Urine albumin to creatinine 38 mg/g, down from 42, which is not a '
            + 'change. Three months of an ACE inhibitor at a starting dose has not '
            + 'shifted it and the target is under 30.\n'
            + 'Two things to do and both are indicated on their own: double the '
            + 'lisinopril and add empagliflozin, which is being started for the kidney '
            + 'and not for the sugar.',
          treatment: '• Increase lisinopril to 20 mg, one tablet each morning\n'
            + '• Start empagliflozin 10 mg, one tablet each morning\n'
            + '• Told about genital thrush and about stopping it on any day he '
            + 'cannot eat or drink, and why',
          orders: '• Basic metabolic panel in two weeks for the potassium and the '
            + 'creatinine\n'
            + '• Repeat urine albumin to creatinine ratio in three months',
          followUp: '',
        },
        {
          id: 'te2-p3',
          problem: 'Hypertension — Not at goal, improving',
          assessment: 'Home average 136/85 over fourteen days, which is the number to '
            + 'use rather than the 134/84 taken here. Target is under 130/80.\n'
            + 'The lisinopril is going up for the albuminuria anyway, so the pressure '
            + 'gets treated by the same change and no second drug is added today.',
          treatment: '• Increase lisinopril to 20 mg, one tablet each morning, as '
            + 'above\n'
            + '• Lifestyle interventions as below',
          orders: '• Another fourteen days of home readings before the next visit',
          followUp: '',
        },
        {
          id: 'te2-p4',
          problem: 'Mixed hyperlipidaemia — At goal',
          assessment: 'LDL 88 from 162, a 46 per cent fall, which is what atorvastatin '
            + '40 does, and it is done: a statin has finished most of its work by six '
            + 'weeks.\n'
            + 'Under the target of 100. No muscle symptoms, and no reason to check a '
            + 'creatine kinase in somebody who has none.',
          treatment: '• Continue atorvastatin 40 mg, one tablet at night\n'
            + '• Lifestyle interventions as below',
          orders: '• Repeat lipid panel in three months',
          followUp: '',
        },
        {
          id: 'te2-p5',
          problem: 'Obstructive sleep apnoea — At goal, co-managed with Dr. Ingrid '
            + 'Halvorsen, Sleep medicine',
          assessment: 'Apnoea hypopnoea index 22 on the home study, moderate, and on '
            + 'CPAP for five nights with the snoring gone and the afternoons back.\n'
            + 'Five nights is too early to call adherence, so the status is about the '
            + 'diagnosis being made and treated rather than about the treatment having '
            + 'worked yet.',
          treatment: '• Continue following with Dr. Ingrid Halvorsen, Sleep '
            + 'medicine, will follow up on recs\n'
            + '• Continue CPAP every night, including naps',
          orders: '• Machine adherence report to us monthly',
          followUp: '',
        },
        {
          id: 'te2-p6',
          problem: 'Obesity — Not at goal, improving',
          assessment: '229 lb from 238, nine pounds in three months, which is 3.8 per '
            + 'cent and the rate that holds.\n'
            + 'The sodas account for most of it and he knows that, which matters more '
            + 'than the nine pounds.',
          treatment: '• Lifestyle interventions as below',
          orders: '',
          followUp: '',
        },
        {
          id: 'te2-p7',
          problem: 'Lifestyle',
          assessment: '',
          treatment: '• Exercise: walking five evenings a week and holding. '
            + 'Continue, and add nothing until it has held six months.\n'
            + '• Diet: sodas gone and not back. Go from one meat free dinner a week '
            + 'to three.\n'
            + '• Sleep: CPAP every night. This is the prescription now and the only '
            + 'one that matters for sleep.\n'
            + '• Substances: the two dry days happen one week in three. Same '
            + 'prescription, no new one, because the problem is not the instruction.\n'
            + '• Stress: new. Keep the phone out of the bedroom. Take the full '
            + 'lunch break away from the desk twice a week.\n'
            + '• Social: not addressed today.\n'
            + '• Financial: not addressed today.',
          orders: '',
          followUp: '',
        },
        {
          id: 'te2-p8',
          problem: 'Preventative Medicine Services',
          assessment: '',
          treatment: '• Colorectal cancer screening — Booked 21 April with Dr. '
            + 'Mensah. Referral confirmed and he has the appointment.\n'
            + '• Diabetic retinal screening — Done 13 January. No retinopathy. '
            + 'Next January 2027.\n'
            + '• Shingles vaccination — Still due. Offered again and he has '
            + 'agreed to start the course at the next visit.\n'
            + '• Tetanus booster — Still overdue. Offered again and deferred '
            + 'again.',
          orders: '',
          followUp: '',
        },
      ],
      overall: '1. Go up to two lisinopril tablets in the morning, or one 20 mg tablet '
        + 'if that is what the pharmacy gives you.\n'
        + '2. Start the empagliflozin in the morning. Stop it on any day you cannot eat '
        + 'or drink and tell us.\n'
        + '3. Go for the blood test in two weeks.\n'
        + '4. Keep the CPAP on every night, naps included.\n'
        + '5. Fourteen more days of blood pressure readings before you come back.\n'
        + '6. Three meat free dinners a week instead of one.\n'
        + '7. Keep the colonoscopy on 21 April.',
      followUp: 'Follow up 19 May 2026, three months, for the repeat A1c, the urine '
        + 'albumin, the lipids and the lifestyle prescriptions.\n'
        + 'Annual visit 17 Nov 2026, already booked.',
      booked: [],
    },
  },
};

/* ------------------------------------------------------------------ */
/* 24 Mar 2026 - the acute visit nobody booked                          */
/* ------------------------------------------------------------------ */

/**
 * The visit that was not in the quote, and the test of the template.
 *
 * Twenty-five minutes for one painful toe. It touches one problem and
 * nothing else, so four of its subjective sections say in a line that
 * they were not covered and when they last were. That is the behaviour
 * to look at: the skeleton does not shrink to fit a short visit,
 * because a reader who cannot find the medicines needs to know whether
 * they were not reviewed or merely not written down.
 *
 * Clinically a first flare of gout is the commonest acute problem in
 * exactly this phenotype. Commercially it is the visit that turns the
 * year from three visits into four.
 */
const ACUTE: Encounter = {
  id: 'te3', patientId: P, date: '2026-03-24', start: 16 * 60, kind: 'visit',
  legacyKind: 'acute', setting: 'in-person',
  reason: 'Painful left big toe since yesterday morning.',
  status: 'signed', duration: 25, minutes: 25, signedAt: '2026-03-24',
  note: {
    subjective: {
      oneLiner: '52M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea and obesity presenting to my office '
        + 'today for management of an acutely painful left first toe.',
      reason: 'Woke yesterday with the left big toe hot and too painful to put a shoe on.',

      chartReview: 'Seen five weeks ago for the three month review and well since. He '
        + 'asked whether this was the empagliflozin. It is not: if anything that drug '
        + 'lowers urate a little, and stopping the hydrochlorothiazide in November '
        + 'removed the one drug he was on that raises it.\n\n'
        + 'Problems addressed today\n'
        + 'Acute monoarthritis, left first metatarsophalangeal joint — Not '
        + 'assessed, new. Came on overnight, maximal within six hours, red and hot, and '
        + 'he cannot bear the bedsheet on it. Three days at a conference before it '
        + 'started with beer every evening and more meat than usual. Denies fever, '
        + 'rigors, trauma, any break in the skin, any other joint, and any previous '
        + 'episode like this.',

      diagnostics: 'Lifestyle\n'
        + 'Not addressed at this visit, last reviewed 17 Feb 2026, next planned 19 May '
        + '2026. Substances is the exception: the drinking is part of why he is here and '
        + 'he raised it himself before I did.\n\n'
        + 'Preventative Medicine Services\n'
        + 'Not addressed at this visit, last reviewed 17 Feb 2026, next planned 19 May '
        + '2026. The colonoscopy on 21 April is unchanged.\n\n'
        + 'Results reviewed\n'
        + 'Serum urate 8.9 mg/dL today. Creatinine 1.04 five weeks ago, estimated GFR '
        + '86. Nothing else new.',

      specialists: '',

      additional: 'Review of systems\n'
        + 'Musculoskeletal: left first metatarsophalangeal joint, hot, swollen, '
        + 'exquisitely tender. No other joint involved.\n'
        + 'Constitutional: no fever, no rigors, no sweats.\n'
        + 'Skin: no break in the skin, no cellulitis, no tophi.\n'
        + 'Cardiovascular: no chest pain, no breathlessness, no oedema.\n'
        + 'Genitourinary: no symptoms reported.\n'
        + 'Gastrointestinal: no symptoms reported.\n'
        + 'The rest of the review was not performed. A focused visit gets a focused '
        + 'review, and the full one was done five weeks ago.\n\n'
        + 'Full problem list\n'
        + '• Gout (acute) — Addressed at this visit, as above. New today. '
        + 'Ours.\n'
        + '• Type 2 diabetes mellitus (chronic) — Triaged as stable. Ours. '
        + 'Last reviewed 17 Feb 2026, next 19 May 2026.\n'
        + '• Hypertension (chronic) — Triaged as stable. Ours. Last reviewed '
        + '17 Feb 2026, next 19 May 2026.\n'
        + '• Albuminuria in diabetes (chronic) — Triaged as stable. Ours. Last '
        + 'reviewed 17 Feb 2026, next 19 May 2026.\n'
        + '• Mixed hyperlipidaemia (chronic) — Triaged as stable. Ours. Last '
        + 'reviewed 17 Feb 2026, next 19 May 2026.\n'
        + '• Obstructive sleep apnoea (chronic) — Triaged as stable. '
        + 'Co-managed with Dr. Ingrid Halvorsen, Sleep medicine. Last seen 10 Feb 2026, '
        + 'next 9 Feb 2027.\n'
        + '• Obesity (chronic) — Triaged as stable. Ours. Last reviewed 17 Feb '
        + '2026, next 19 May 2026.\n'
        + '• Former tobacco use (chronic) — Triaged as stable. Resolved in '
        + '2011.\n\n'
        + 'Medications\n'
        + '• Metformin 1000 mg — one tablet twice daily with food. Taking.\n'
        + '• Empagliflozin 10 mg — one tablet each morning. Taking.\n'
        + '• Lisinopril 20 mg — one tablet each morning. Taking.\n'
        + '• Atorvastatin 40 mg — one tablet at night. Taking.\n'
        + 'Confirmed with him today because a steroid is being added to all four. Not a '
        + 'full reconciliation: that was done five weeks ago and is due again in May.\n\n'
        + 'Care team\n'
        + '• Dr. Ingrid Halvorsen, Sleep medicine — unchanged, and not '
        + 'involved in this.\n'
        + '• Dr. Paul Mensah, Gastroenterology — colonoscopy 21 Apr 2026, '
        + 'unchanged.',
    },
    objective: {
      homeMeasures: '',
      vitals: '',
      examTemplate: 'in-person',
      exam: 'Physical Exam\n'
        + 'General: afebrile, in obvious pain, walking on the heel of the left foot.\n'
        + 'Left foot: first metatarsophalangeal joint red, warm, swollen, exquisitely '
        + 'tender to the lightest touch, with overlying skin shiny. Dorsalis pedis '
        + 'present. No break in the skin, no ulceration, no lymphangitis, no tophi.\n'
        + 'Other joints: no synovitis at the ankles, knees, wrists or hands.\n'
        + 'The rest of the examination was not performed, this being a focused visit.',
    },
    assessment: {
      oneLiner: '',
      overall: '52M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea and obesity presenting to my office '
        + 'today for management of an acutely painful left first toe.',
    },
    plan: {
      problems: [
        {
          id: 'te3-p1',
          problem: 'Gout — Not at goal, first flare',
          assessment: 'A hot, red, exquisitely tender first metatarsophalangeal joint '
            + 'coming on overnight after three days of beer and meat, with a urate of '
            + '8.9, is gout, and the classic site and the classic story are enough '
            + 'without aspirating it.\n'
            + 'Septic arthritis is the thing that must not be missed: he is afebrile, '
            + 'the skin is intact, no other joint is involved and he is systemically '
            + 'well, so it is not that, and he has been told what would change that '
            + 'answer.',
          treatment: '• Start prednisone 40 mg daily for five days, then 20 mg '
            + 'daily for five days, then stop\n'
            + '• No non-steroidal: the albuminuria and the lisinopril are the '
            + 'reason, and he was told that reason\n'
            + '• No urate lowering therapy today. A first flare is not a reason to '
            + 'treat somebody for life, and the decision belongs to the second one\n'
            + '• Hold the empagliflozin only if he cannot eat or drink, which he '
            + 'can',
          orders: '• Check capillary glucose daily while on the prednisone, because '
            + 'it will rise\n'
            + '• Call today if he develops a fever, if the skin breaks, or if a '
            + 'second joint goes',
          followUp: '',
        },
        {
          id: 'te3-p2',
          problem: 'Lifestyle',
          assessment: '',
          treatment: '• Not addressed at this visit, last reviewed 17 Feb 2026, '
            + 'next planned 19 May 2026\n'
            + '• Substances is the exception. Same prescription as February, now '
            + 'with a reason he can feel',
          orders: '',
          followUp: '',
        },
        {
          id: 'te3-p3',
          problem: 'Preventative Medicine Services',
          assessment: '',
          treatment: '• Not addressed at this visit, last reviewed 17 Feb 2026, '
            + 'next planned 19 May 2026\n'
            + '• The colonoscopy on 21 April is unchanged, and he has been told the '
            + 'prednisone does not affect it',
          orders: '',
          followUp: '',
        },
      ],
      overall: '1. Start the prednisone this evening. Five days at two tablets, then '
        + 'five days at one, then stop.\n'
        + '2. Check your sugar once a day while you are on it. It will be higher than '
        + 'usual and that is expected.\n'
        + '3. Keep the foot up and keep the weight off it. Ice helps.\n'
        + '4. Call today if you get a fever, if the skin over the joint breaks, or if a '
        + 'second joint starts.\n'
        + '5. Keep the colonoscopy on 21 April and the visit on 19 May.',
      followUp: 'Follow up by telephone in one week to confirm the flare has settled.\n'
        + 'Next planned visit 19 May 2026, unchanged.\n'
        + 'Annual visit 17 Nov 2026, unchanged.',
      booked: [],
    },
  },
};

/* ------------------------------------------------------------------ */
/* 19 May 2026 - six months                                            */
/* ------------------------------------------------------------------ */

const SIX_MONTH: Encounter = {
  id: 'te4', patientId: P, date: '2026-05-19', start: 10 * 60, kind: 'visit',
  legacyKind: 'follow-up', setting: 'in-person',
  reason: 'Six month review.',
  status: 'signed', duration: 45, minutes: 45, signedAt: '2026-05-19',
  note: {
    subjective: {
      oneLiner: '52M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout presenting to my '
        + 'office today for management of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout, preventative '
        + 'services and lifestyle medicine.',
      reason: 'Six month review. Nothing he wanted to raise, which is itself new.',

      chartReview: 'The gout flare in March settled in nine days and did more for the '
        + 'drinking than six months of being asked about it. He went from five evenings '
        + 'to two and the screen has dropped below the cut-off for the first time. The '
        + 'colonoscopy was done in April.\n\n'
        + 'Problems addressed today\n'
        + 'Gout — At goal. The March flare settled in nine days on the prednisone. '
        + 'No second flare. Denies any joint pain since.\n'
        + 'Type 2 diabetes mellitus — At goal. A1c 6.5. Taking metformin and '
        + 'empagliflozin. Denies hypoglycaemia, polyuria, polydipsia, and genital '
        + 'itching or discharge.\n'
        + 'Albuminuria in diabetes — Not at goal, improving. Ratio 22, in range for '
        + 'the first time. Denies any change in urine volume or colour.\n'
        + 'Hypertension — At goal. Home average 128/79 over fourteen days. Denies '
        + 'cough, dizziness, and ankle swelling.\n'
        + 'Mixed hyperlipidaemia — At goal. LDL 82. Denies muscle aches and '
        + 'weakness.\n'
        + 'Obstructive sleep apnoea — At goal. Machine reports 5.8 hours a night '
        + 'across the quarter. Denies mask leak, dry mouth, and daytime sleepiness.\n'
        + 'Obesity — Not at goal, improving. 220 lb from 229.',

      diagnostics: 'Lifestyle\n'
        + 'Exercise — Walking five evenings a week and held five months.\n'
        + 'Diet — Three meat free dinners most weeks, which his wife drove more '
        + 'than he did. No liquid calories since November.\n'
        + 'Sleep — CPAP every night, 5.8 hours a night on the report.\n'
        + 'Stress — Phone is out of the bedroom. The lunch breaks happen in quiet '
        + 'weeks and not in busy ones, which he describes accurately as most weeks.\n'
        + 'Substances — Two evenings a week instead of five. Screen 3, below the '
        + 'cut-off for the first time.\n'
        + 'Social — Raised today. He would rather walk with his wife than alone.\n'
        + 'Financial — Raised today, by him. He does not know what the CPAP '
        + 'supplies or the empagliflozin will cost when his deductible resets.\n\n'
        + 'Preventative Medicine Services\n'
        + 'Colorectal cancer screening — Done 21 April. Two adenomas removed.\n'
        + 'Diabetic retinal screening — Current to January 2027.\n'
        + 'Shingles vaccination — First dose due today.\n'
        + 'Diabetic foot examination — Due today.\n'
        + 'Tetanus booster — Still overdue since 2023.\n\n'
        + 'Results reviewed\n'
        + 'A1c 6.5 from 7.1. LDL 82 from 88. Urine albumin to creatinine 22 from 38, '
        + 'which is in range. Potassium 4.4 and creatinine 1.06 on the two week check '
        + 'after the lisinopril went up. Colonoscopy 21 April: two tubular adenomas, 4 '
        + 'mm and 6 mm, removed completely, no high grade dysplasia.',

      specialists: '',

      additional: 'Review of systems\n'
        + 'Constitutional: well. No fatigue.\n'
        + 'Respiratory: no snoring, tolerating the mask.\n'
        + 'Musculoskeletal: no joint pain since March. No muscle aches on the statin.\n'
        + 'Endocrine: no hypoglycaemia, no polyuria, no polydipsia.\n'
        + 'Genitourinary: no genital itching or discharge on the empagliflozin.\n'
        + 'Cardiovascular: no chest pain, no breathlessness, no palpitations, no oedema.\n'
        + 'Gastrointestinal: no symptoms reported.\n'
        + 'Neurological: no symptoms reported.\n'
        + 'Skin: no symptoms reported.\n'
        + 'Psychiatric: no symptoms reported.\n'
        + 'Haematological: no symptoms reported.\n'
        + 'Eyes, ears, nose and throat: no symptoms reported.\n\n'
        + 'Full problem list\n'
        + '• Gout (acute) — Addressed at this visit, as above. Ours.\n'
        + '• Type 2 diabetes mellitus (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Hypertension (chronic) — Addressed at this visit, as above. '
        + 'Ours.\n'
        + '• Albuminuria in diabetes (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Mixed hyperlipidaemia (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Obstructive sleep apnoea (chronic) — Addressed at this visit, as '
        + 'above. Co-managed with Dr. Ingrid Halvorsen, Sleep medicine. Last seen 10 Feb '
        + '2026, next 9 Feb 2027.\n'
        + '• Obesity (chronic) — Addressed at this visit, as above. Ours.\n'
        + '• Former tobacco use (chronic) — Triaged as stable. Resolved in '
        + '2011.\n\n'
        + 'Medications\n'
        + '• Metformin 1000 mg — one tablet twice daily with food. Taking.\n'
        + '• Empagliflozin 10 mg — one tablet each morning. Taking.\n'
        + '• Lisinopril 20 mg — one tablet each morning. Taking.\n'
        + '• Atorvastatin 40 mg — one tablet at night. Taking.\n'
        + '• Prednisone — course finished 3 April 2026.\n'
        + '• Hydrochlorothiazide 25 mg — stopped 18 Nov 2025.\n'
        + 'Reconciled with him at this visit. No supplements, nothing over the counter.'
        + '\n\n'
        + 'Care team\n'
        + '• Dr. Ingrid Halvorsen, Sleep medicine, Austin Sleep and Pulmonary '
        + '— co-managing the apnoea. Machine reports arriving monthly, 5.8 hours a '
        + 'night. Last seen 10 Feb 2026, next 9 Feb 2027. Nothing outstanding.\n'
        + '• Dr. Paul Mensah, Gastroenterology, Capital Digestive — '
        + 'colonoscopy done 21 Apr 2026, two adenomas removed completely. Repeat in '
        + 'seven years, which they have set at 2033. Nothing outstanding.',
    },
    objective: {
      homeMeasures: 'Fourteen days of home readings. Average 128/79. Highest 138/86, '
        + 'lowest 118/72.',
      vitals: '',
      examTemplate: 'in-person',
      exam: 'Physical Exam\n'
        + 'General: well. Comfortable.\n'
        + 'Cardiovascular: rate and rhythm regular. No murmur. No peripheral oedema.\n'
        + 'Respiratory: chest clear.\n'
        + 'Left foot: first metatarsophalangeal joint normal. No swelling, no warmth, '
        + 'full range of movement, no tophi.',
    },
    assessment: {
      oneLiner: '',
      overall: '52M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout presenting to my '
        + 'office today for management of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout, preventative '
        + 'services and lifestyle medicine. Five of seven are at target at six months, '
        + 'and the two that are not are both moving.',
    },
    plan: {
      problems: [
        {
          id: 'te4-p1',
          problem: 'Gout — At goal',
          assessment: 'One flare, in March, settled in nine days on a steroid taper. No '
            + 'second flare in eight weeks and the joint is normal today.\n'
            + 'Still no urate lowering therapy, which is the right answer after one '
            + 'flare: the drinking has halved and that is the thing most likely to keep '
            + 'the second one away.',
          treatment: '• No urate lowering therapy. Revisit if a second flare '
            + 'happens\n'
            + '• Lifestyle interventions as below, where the substances entry is '
            + 'doing this work',
          orders: '• Repeat urate at the annual',
          followUp: '',
        },
        {
          id: 'te4-p2',
          problem: 'Type 2 diabetes mellitus — At goal',
          assessment: 'A1c 6.5 from 7.9 in six months, on metformin, empagliflozin and '
            + 'eighteen pounds. Target is under 7.0 and he is comfortably inside it.\n'
            + 'No hypoglycaemia, which matters: neither of these drugs causes it, and '
            + 'that is why they are the two he is on.',
          treatment: '• Continue metformin 1000 mg, one tablet twice daily with '
            + 'food\n'
            + '• Continue empagliflozin 10 mg, one tablet each morning\n'
            + '• Lifestyle interventions as below',
          orders: '• Repeat A1c at the annual',
          followUp: '',
        },
        {
          id: 'te4-p3',
          problem: 'Albuminuria in diabetes — Not at goal, improving',
          assessment: 'Ratio 22 mg/g from 42, which is under 30 and so in range for the '
            + 'first time. It took doubling the lisinopril and adding empagliflozin, '
            + 'and three months.\n'
            + 'Improving rather than at goal, because one reading in range after six '
            + 'months of being out of it is a direction and not yet a result.',
          treatment: '• Continue lisinopril 20 mg, one tablet each morning\n'
            + '• Continue empagliflozin 10 mg, one tablet each morning',
          orders: '• Repeat urine albumin to creatinine ratio at the annual',
          followUp: '',
        },
        {
          id: 'te4-p4',
          problem: 'Hypertension — At goal',
          assessment: 'Home average 128/79 over fourteen days, against a target of under '
            + '130/80. The office reading of 128/78 agrees with it, which it did not in '
            + 'February.\n'
            + 'One drug, at a dose chosen for the kidney, doing both jobs.',
          treatment: '• Continue lisinopril 20 mg, one tablet each morning\n'
            + '• Lifestyle interventions as below',
          orders: '• Fourteen days of home readings before the annual',
          followUp: '',
        },
        {
          id: 'te4-p5',
          problem: 'Mixed hyperlipidaemia — At goal',
          assessment: 'LDL 82, from 88 at three months. The statin did its work by '
            + 'February and what has moved it since is the weight and the diet.\n'
            + 'Under 70 is the better number given his father, and that is now worth '
            + 'discussing properly at the annual rather than changing today.',
          treatment: '• Continue atorvastatin 40 mg, one tablet at night\n'
            + '• Discuss a lower target at the annual',
          orders: '• Repeat lipid panel at the annual',
          followUp: '',
        },
        {
          id: 'te4-p6',
          problem: 'Obstructive sleep apnoea — At goal, co-managed with Dr. Ingrid '
            + 'Halvorsen, Sleep medicine',
          assessment: '5.8 hours a night on the machine report across the quarter, which '
            + 'is adherent, and no daytime sleepiness.\n'
            + 'He describes this as the change he would keep if he could only keep one, '
            + 'which is worth recording because it is what will hold the rest.',
          treatment: '• Continue following with Dr. Ingrid Halvorsen, Sleep '
            + 'medicine, will follow up on recs\n'
            + '• Continue CPAP every night',
          orders: '',
          followUp: '',
        },
        {
          id: 'te4-p7',
          problem: 'Obesity — Not at goal, improving',
          assessment: '220 lb from 238, eighteen pounds and 7.6 per cent in six months. '
            + 'Past the five per cent at which the metabolic numbers move, which they '
            + 'have.\n'
            + 'The rate has slowed from three pounds a month to two, which is what '
            + 'happens and is not a problem to solve.',
          treatment: '• Lifestyle interventions as below',
          orders: '',
          followUp: '',
        },
        {
          id: 'te4-p8',
          problem: 'Lifestyle',
          assessment: '',
          treatment: '• Exercise: walking five evenings a week and held for five '
            + 'months. Add two sessions a week of resistance work with bands.\n'
            + '• Diet: three meat free dinners most weeks. Continue, no change.\n'
            + '• Sleep: CPAP every night, 5.8 hours on the report. Continue.\n'
            + '• Substances: screen down from six to three, below the cut-off. Hold '
            + 'the two drinks and two dry days, and name the gout as the reason it is '
            + 'worth holding.\n'
            + '• Stress: phone out of the bedroom, done. Lunch breaks happen in '
            + 'quiet weeks only, which is most weeks not. Same prescription.\n'
            + '• Social: new. Take the evening walk with his wife rather than '
            + 'alone, so the exercise and the company are the same half hour.\n'
            + '• Financial: new. He does not know what the CPAP supplies or the '
            + 'empagliflozin will cost when the deductible resets. Find out before it '
            + 'does, because a surprise bill is how treatment stops.',
          orders: '',
          followUp: '',
        },
        {
          id: 'te4-p9',
          problem: 'Preventative Medicine Services',
          assessment: '',
          treatment: '• Colorectal cancer screening — Done 21 April. Two '
            + 'adenomas removed. Next 2033, set by gastroenterology on the pathology.\n'
            + '• Diabetic retinal screening — Done January. Next January '
            + '2027.\n'
            + '• Shingles vaccination — First dose given today. Second due in '
            + 'August and he has the date.\n'
            + '• Diabetic foot examination — Done today, and again at the '
            + 'annual.\n'
            + '• Tetanus booster — Still overdue. Offered a third time and he '
            + 'has asked to have it with the flu vaccine in the autumn.',
          orders: '',
          followUp: '',
        },
      ],
      overall: '1. Keep taking all four tablets exactly as you are.\n'
        + '2. Add two band sessions a week. The sheet shows four exercises.\n'
        + '3. Walk with your wife in the evening instead of on your own.\n'
        + '4. Find out what the CPAP supplies and the empagliflozin will cost you after '
        + 'January.\n'
        + '5. Come in August for the second shingles dose.\n'
        + '6. Fourteen days of blood pressure readings before November.',
      followUp: 'Annual visit 17 Nov 2026, six months, for the full review and the next '
        + 'year’s plan.\n'
        + 'Nurse visit August 2026 for the second shingles dose.',
      booked: [],
    },
  },
};

/* ------------------------------------------------------------------ */
/* 17 Nov 2026 - the annual, which prices the next year                 */
/* ------------------------------------------------------------------ */

const ANNUAL: Encounter = {
  id: 'te5', patientId: P, date: '2026-11-17', start: 8 * 60, kind: 'visit',
  legacyKind: 'annual', setting: 'in-person',
  reason: 'Annual visit. Full review of the year and the plan for the next one.',
  status: 'signed', duration: 60, minutes: 65, signedAt: '2026-11-17',
  note: {
    subjective: {
      oneLiner: '53M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout presenting to my '
        + 'office today for management of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout, preventative '
        + 'services and lifestyle medicine.',
      reason: 'Annual visit, one year after the first one.',

      chartReview: 'One year on. He asked for the year on one page so he could show his '
        + 'wife, and that is what the letter is for. The thing he raised himself: the '
        + 'walking with his wife is the part he would keep. The thing he has still not '
        + 'done: the phone call about what the CPAP supplies and the empagliflozin cost '
        + 'him, which has been on the list since May.\n\n'
        + 'Problems addressed today\n'
        + 'Type 2 diabetes mellitus — At goal. A1c 6.1 from 7.9 a year ago. Denies '
        + 'hypoglycaemia, polyuria, polydipsia, genital symptoms, and numbness or '
        + 'tingling in the feet.\n'
        + 'Hypertension — At goal. Home average 124/76. Denies cough, dizziness, '
        + 'and ankle swelling.\n'
        + 'Albuminuria in diabetes — Not at goal, improving. Ratio 14 from 42. '
        + 'Denies any urinary change.\n'
        + 'Mixed hyperlipidaemia — At goal. LDL 78 from 162 untreated. Denies '
        + 'muscle aches and weakness.\n'
        + 'Obstructive sleep apnoea — At goal. 6.1 hours a night on the machine '
        + 'report. Epworth 4 from 14. Denies sleepiness, mask leak, and dry mouth.\n'
        + 'Gout — At goal. No flare since March. Denies joint pain.\n'
        + 'Obesity — Not at goal, improving. 211 lb from 238.',

      diagnostics: 'Lifestyle\n'
        + 'Exercise — Walking has held twelve months. The band work lasted six '
        + 'weeks and stopped in August.\n'
        + 'Diet — Three meat free dinners most weeks and no liquid calories for a '
        + 'year.\n'
        + 'Sleep — CPAP 6.1 hours a night across the year.\n'
        + 'Stress — Phone out of the bedroom held. The lunch breaks did not.\n'
        + 'Substances — Screen 2, from 6 a year ago.\n'
        + 'Social — Walking together four or five evenings a week, and the part of '
        + 'the year he says he would keep.\n'
        + 'Financial — Still not done. He has not made the call and it has been '
        + 'asked at two visits.\n\n'
        + 'Preventative Medicine Services\n'
        + 'Colorectal cancer screening — Current. Done April 2026, next 2033.\n'
        + 'Diabetic retinal screening — Current to January 2027, booked.\n'
        + 'Diabetic foot examination — Due today.\n'
        + 'Shingles vaccination — Complete. Both doses given.\n'
        + 'Influenza vaccination — Given 6 October 2026.\n'
        + 'Tetanus booster — Still overdue since 2023.\n\n'
        + 'Results reviewed\n'
        + 'A1c 6.1 from 6.5. LDL 78 from 82. Urine albumin to creatinine 14 from 22. ALT '
        + '31, normal for the first time, from 62 a year ago. Urate 6.4 from 8.9 in the '
        + 'flare. Creatinine 1.08, estimated GFR 85, stable across the year.',

      specialists: '',

      additional: 'Review of systems\n'
        + 'Constitutional: well. No fatigue for most of the year.\n'
        + 'Respiratory: no snoring, tolerating the mask.\n'
        + 'Cardiovascular: no chest pain, no breathlessness, no palpitations, no oedema.\n'
        + 'Endocrine: no hypoglycaemia, no polyuria, no polydipsia.\n'
        + 'Neurological: no numbness or tingling in the feet.\n'
        + 'Musculoskeletal: no joint pain since March. No muscle aches on the statin.\n'
        + 'Genitourinary: no genital symptoms on the empagliflozin.\n'
        + 'Gastrointestinal: no symptoms reported.\n'
        + 'Skin: no symptoms reported.\n'
        + 'Psychiatric: no symptoms reported.\n'
        + 'Haematological: no symptoms reported.\n'
        + 'Eyes, ears, nose and throat: no symptoms reported.\n\n'
        + 'Full problem list\n'
        + '• Gout (acute) — Addressed at this visit, as above. Ours.\n'
        + '• Type 2 diabetes mellitus (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Hypertension (chronic) — Addressed at this visit, as above. '
        + 'Ours.\n'
        + '• Albuminuria in diabetes (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Mixed hyperlipidaemia (chronic) — Addressed at this visit, as '
        + 'above. Ours.\n'
        + '• Obstructive sleep apnoea (chronic) — Addressed at this visit, as '
        + 'above. Co-managed with Dr. Ingrid Halvorsen, Sleep medicine. Last seen 10 Feb '
        + '2026, next 9 Feb 2027.\n'
        + '• Obesity (chronic) — Addressed at this visit, as above. Ours.\n'
        + '• Former tobacco use (chronic) — Triaged as stable. Resolved in '
        + '2011.\n\n'
        + 'Medications\n'
        + '• Metformin 1000 mg — one tablet twice daily with food. Taking.\n'
        + '• Empagliflozin 10 mg — one tablet each morning. Taking.\n'
        + '• Lisinopril 20 mg — one tablet each morning. Taking.\n'
        + '• Atorvastatin 40 mg — one tablet at night. Taking.\n'
        + '• Hydrochlorothiazide 25 mg — stopped 18 Nov 2025.\n'
        + '• Prednisone — course finished 3 April 2026.\n'
        + 'Reconciled with him at this visit, bottle by bottle. No supplements, nothing '
        + 'over the counter.\n\n'
        + 'Care team\n'
        + '• Dr. Ingrid Halvorsen, Sleep medicine, Austin Sleep and Pulmonary '
        + '— co-managing the apnoea. Machine reports monthly, 6.1 hours a night. '
        + 'Last seen 10 Feb 2026, next 9 Feb 2027. Nothing outstanding.\n'
        + '• Dr. Paul Mensah, Gastroenterology, Capital Digestive — '
        + 'colonoscopy April 2026, two adenomas removed. Next 2033. Nothing '
        + 'outstanding.',
    },
    objective: {
      homeMeasures: 'Fourteen days of home readings, twenty six of them. Average '
        + '124/76. Highest 134/82, lowest 114/70.',
      vitals: '',
      examTemplate: 'in-person',
      exam: 'Physical Exam\n'
        + 'General: well. 211 lb, down twenty seven pounds across the year.\n'
        + 'Neck: circumference 16.5 inches, down one inch.\n'
        + 'Cardiovascular: rate and rhythm regular. No murmur. Pulses present and equal '
        + 'in all four limbs. No peripheral oedema.\n'
        + 'Respiratory: chest clear.\n'
        + 'Abdomen: soft, no hepatomegaly to palpation.\n'
        + 'Feet: skin and nails intact, no deformity, no ulceration. Pulses present. '
        + 'Sensation intact to 10 g monofilament at all sites, both feet.\n'
        + 'Left foot: first metatarsophalangeal joint normal, no tophi.',
    },
    assessment: {
      oneLiner: '',
      overall: '53M with PMH of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout presenting to my '
        + 'office today for management of type 2 diabetes, hypertension, albuminuria, '
        + 'hyperlipidaemia, obstructive sleep apnoea, obesity and gout, preventative '
        + 'services and lifestyle medicine. Five of seven are at target and two are '
        + 'still moving.',
    },
    plan: {
      problems: [
        {
          id: 'te5-p1',
          problem: 'Gout — At goal',
          assessment: 'One flare in March, none in eight months, and a urate of 6.4 from '
            + '8.9 during it, which tracks the drinking rather than any drug.\n'
            + 'Still no urate lowering therapy, and that stays the answer unless a '
            + 'second flare happens.',
          treatment: '• No urate lowering therapy\n'
            + '• Lifestyle interventions as below\n'
            + '• He has a plan in writing for what to do on day one of another '
            + 'flare, which is to call rather than to wait for a visit',
          orders: '• Repeat urate in a year, or sooner with a flare',
          followUp: '',
        },
        {
          id: 'te5-p2',
          problem: 'Type 2 diabetes mellitus — At goal',
          assessment: 'A1c 6.1 from 7.9 at diagnosis a year ago, on two drugs neither of '
            + 'which causes hypoglycaemia, and twenty seven pounds.\n'
            + 'Nothing to change. The question for next year is whether anything can '
            + 'come off, and the answer is not yet.',
          treatment: '• Continue metformin 1000 mg, one tablet twice daily with '
            + 'food\n'
            + '• Continue empagliflozin 10 mg, one tablet each morning\n'
            + '• Lifestyle interventions as below',
          orders: '• Repeat A1c in six months',
          followUp: '',
        },
        {
          id: 'te5-p3',
          problem: 'Albuminuria in diabetes — Not at goal, improving',
          assessment: 'Ratio 14 mg/g from 42, now well under 30 across two consecutive '
            + 'measurements, with the estimated GFR unchanged at 85 across the year.\n'
            + 'Improving rather than resolved: the number is normal because of two drugs '
            + 'he is still taking, and stopping either of them is how it comes back.',
          treatment: '• Continue lisinopril 20 mg, one tablet each morning\n'
            + '• Continue empagliflozin 10 mg, one tablet each morning',
          orders: '• Repeat urine albumin to creatinine ratio in six months',
          followUp: '',
        },
        {
          id: 'te5-p4',
          problem: 'Hypertension — At goal',
          assessment: 'Home average 124/76 over twenty six readings, against a target of '
            + 'under 130/80, on one drug.\n'
            + 'He takes his own readings and brings them, which is the reason there is a '
            + 'real number here rather than one measurement in a corridor.',
          treatment: '• Continue lisinopril 20 mg, one tablet each morning\n'
            + '• Lifestyle interventions as below',
          orders: '• Fourteen days of home readings before each visit',
          followUp: '',
        },
        {
          id: 'te5-p5',
          problem: 'Mixed hyperlipidaemia — At goal',
          assessment: 'LDL 78 from 162 untreated, a 52 per cent fall, with the '
            + 'triglycerides and the HDL both normal and the ALT back in range at 31 '
            + 'from 62.\n'
            + 'Under 70 remains the better target with a father who had a myocardial '
            + 'infarction at 55, and he has chosen to try diet first for six months '
            + 'before the dose goes up.',
          treatment: '• Continue atorvastatin 40 mg, one tablet at night\n'
            + '• Decide at six months whether to go to 80 mg for a target under '
            + '70\n'
            + '• Lifestyle interventions as below',
          orders: '• Repeat lipid panel in six months',
          followUp: '',
        },
        {
          id: 'te5-p6',
          problem: 'Obstructive sleep apnoea — At goal, co-managed with Dr. Ingrid '
            + 'Halvorsen, Sleep medicine',
          assessment: '6.1 hours a night across the year on the machine reports, with an '
            + 'Epworth of 4 from 14 and his wife reporting no snoring.\n'
            + 'Twenty seven pounds down, so a repeat study to see whether the pressure '
            + 'can come down is a reasonable thing to ask sleep medicine in February.',
          treatment: '• Continue following with Dr. Ingrid Halvorsen, Sleep '
            + 'medicine, will follow up on recs\n'
            + '• Continue CPAP every night\n'
            + '• Ask them in February whether the weight loss justifies a repeat '
            + 'study',
          orders: '',
          followUp: '',
        },
        {
          id: 'te5-p7',
          problem: 'Obesity — Not at goal, improving',
          assessment: '211 lb and a body mass index of 30.3, from 238 and 34.1. Twenty '
            + 'seven pounds, eleven per cent, across twelve months.\n'
            + 'It has been flat since August, which is when the resistance work stopped, '
            + 'and that is the thing to fix rather than the diet.',
          treatment: '• Lifestyle interventions as below\n'
            + '• Weigh at each visit here',
          orders: '',
          followUp: '',
        },
        {
          id: 'te5-p8',
          problem: 'Lifestyle',
          assessment: '',
          treatment: '• Exercise: walking has held twelve months. The band work '
            + 'lasted six weeks and stopped in August. Restart at two sessions a week, '
            + 'on the days he already walks, because a new day was what failed.\n'
            + '• Diet: three meat free dinners most weeks and no liquid calories '
            + 'for a year. Continue, no change.\n'
            + '• Sleep: CPAP 6.1 hours a night. Continue. This is the change that '
            + 'carried the rest.\n'
            + '• Substances: screen six to two across the year. Continue.\n'
            + '• Stress: phone out of the bedroom held. The lunch breaks did not. '
            + 'Drop that half and keep what works.\n'
            + '• Social: walking together four or five evenings a week, and the '
            + 'part of the year he says he would keep. Continue.\n'
            + '• Financial: not done. He has not made the call and it has been '
            + 'asked at two visits. The office will make it with him on the phone this '
            + 'week rather than ask a third time.',
          orders: '',
          followUp: '',
        },
        {
          id: 'te5-p9',
          problem: 'Preventative Medicine Services',
          assessment: '',
          treatment: '• Colorectal cancer screening — Current. Done April '
            + '2026, next 2033.\n'
            + '• Diabetic retinal screening — Current to January 2027. '
            + 'Booked.\n'
            + '• Diabetic foot examination — Done today. Normal. Next November '
            + '2027.\n'
            + '• Shingles vaccination — Complete. Both doses given.\n'
            + '• Influenza vaccination — Given 6 October 2026.\n'
            + '• Tetanus booster — Still overdue since 2023. Offered a fourth '
            + 'time and he has asked for it with next autumn’s flu vaccine. '
            + 'Recorded as his decision, not as an oversight.',
          orders: '',
          followUp: '',
        },
      ],
      overall: '1. Keep taking all four tablets exactly as you are.\n'
        + '2. Restart the band work, twice a week, on two of the evenings you already '
        + 'walk.\n'
        + '3. Keep the CPAP on every night.\n'
        + '4. We will make the call about the CPAP supplies and the empagliflozin with '
        + 'you this week.\n'
        + '5. Fourteen days of blood pressure readings before May.\n'
        + '6. Go for the blood test a week before the May visit.',
      followUp: 'Follow up 18 May 2027, six months, for the repeat A1c, the urine '
        + 'albumin, the lipids and the statin decision.\n'
        + 'Follow up 17 Aug 2027, nine months, for the lifestyle prescriptions and the '
        + 'weight.\n'
        + 'Annual visit 16 Nov 2027.',
      booked: [
        { date: '2027-05-18', why: 'the repeat bloods and the statin decision' },
        { date: '2027-08-17', why: 'the lifestyle prescriptions and the weight' },
        { date: '2027-11-16', why: 'the annual visit' },
      ],
      // Two problems still off target at the annual, so the projection
      // expects one unbooked visit rather than two and next year is
      // quoted lower than the year just gone.
      quotedMonthly: 59.34,
    },
  },
};

/**
 * In date order, which is the order the chart reads them in.
 */
export const tealEncounters: Encounter[] = [
  INITIAL, THREE_MONTH, ACUTE, SIX_MONTH, ANNUAL,
];

/**
 * Everything Sharon told us between visits. Fictional throughout.
 *
 * The point of this file is that the living subjective has to be built
 * from it. Nine visits over two years is six data points a year; the
 * updates, the answers and the messages here are the other fifty, and
 * they are where most of what matters actually turns up: the glipizide
 * hypos arrived in a message three weeks before the visit that stopped
 * it, the walking stopped in August and she said so, and the reason
 * the mammogram has not been booked has never been in a note at all.
 *
 * Every record is dated and attributed, and none of it is a summary.
 * The summary is computed from these, which is the thing being tested:
 * open any sentence in the subjective and the record behind it should
 * be here, in the words it was written in.
 */
import type {
  Message, PatientUpdate, ProblemCheckIn, UpdateRequest,
} from '../domain/types';

const P = 'p0';

// -------------------------------------------------- what we asked for

export const sharonRequests: UpdateRequest[] = [
  {
    id: 'sr1', patientId: P, sent: '2026-07-20', sentBy: 'L. DuBose, MD',
    prompt: 'A month on from the change: how are the mornings, and have you had any more of the shaky episodes in the evening?',
    about: ['sc2'], answeredOn: '2026-07-22',
  },
  {
    id: 'sr2', patientId: P, sent: '2026-09-21', sentBy: 'L. DuBose, MD',
    prompt: 'You said you would start taking your blood pressure at home. How is that going, and what are the numbers?',
    about: ['sc1'], answeredOn: '2026-09-28',
  },
  {
    id: 'sr3', patientId: P, sent: '2026-11-10', sentBy: 'L. DuBose, MD',
    prompt: 'Before we meet next week: how is each of these going, and are you managing the plan we agreed?',
    about: ['sc1', 'sc2', 'sc3'], answeredOn: '2026-11-12',
  },
];

// ----------------------------------------------- what she sent back

export const sharonUpdates: PatientUpdate[] = [
  {
    id: 'su1', patientId: P, date: '2026-07-22', requestId: 'sr1',
    feeling: 'better',
    interval: [],
    overall: 'the mornings are easier than they were. No shaky episodes since the tablet came off, not one. I did not realise how much I had been planning around them until they stopped.',
  },
  {
    id: 'su2', patientId: P, date: '2026-09-28', requestId: 'sr2',
    feeling: 'same',
    overall: 'I bought the cuff. I have been doing it twice a week like you said. The numbers look lower than the ones in your office and I do not know what to make of that.',
    interval: [],
    attachments: ['Photograph of a handwritten log, four readings'],
  },
  {
    id: 'su3', patientId: P, date: '2026-11-12', requestId: 'sr3',
    feeling: 'better',
    overall: 'better than a year ago, and I understand it now, which is the part I wanted. What I would like from this visit is to stop adding things. Four tablets is enough. If one of them can go, I would like to talk about which.',
    // The interval history, which is the part a chronic disease
    // questionnaire would have missed entirely.
    interval: [
      {
        kind: 'urgent-care', date: '2026-10-11',
        text: 'Went to the urgent care place on the ring road for a chest infection. They gave me a week of antibiotics and I finished them.',
      },
      {
        kind: 'specialist', date: '2026-09-30',
        text: 'Started seeing a podiatrist for my mother and asked her about my own feet while I was there. She said they were fine.',
      },
    ],
  },
];

/**
 * Her per problem answers, attached to the update they came in with.
 *
 * Not every problem gets an answer every time, which is the normal
 * case and has to be visible as a blank rather than filled in.
 */
export const sharonCheckIns: ProblemCheckIn[] = [
  // --- July, after the glipizide came off
  {
    id: 'sci0', patientId: P, updateId: 'su1', date: '2026-07-22',
    about: { kind: 'condition', id: 'sc2' },
    feeling: 'better', onPlan: 'yes',
    text: 'No more of the shaky evenings. I am taking the metformin with food like we said and the new one in the morning. Passing water more often, which I was told to expect.',
  },

  // --- September, the home readings
  {
    id: 'sci01', patientId: P, updateId: 'su2', date: '2026-09-28',
    about: { kind: 'condition', id: 'sc1' },
    feeling: 'same', onPlan: 'yes',
    text: 'Taking both tablets every morning. The home numbers are around 124 to 129 at the top. Your machine always reads higher and I would like to know which one we are treating.',
  },

  // --- November, before the next visit
  {
    id: 'sci1', patientId: P, updateId: 'su3', encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'condition', id: 'sc1' },
    feeling: 'better', onPlan: 'yes',
    text: 'Better. The home readings are the thing that changed it for me. I can see what it does when I take it late and when I do not.',
  },
  {
    id: 'sci2', patientId: P, updateId: 'su3', encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'condition', id: 'sc2' },
    feeling: 'better', onPlan: 'partly',
    text: 'The number is better and I am pleased with that. The evenings at my mother’s are still a write-off. I eat whatever is in the house at nine o’clock.',
  },
  {
    id: 'sci3', patientId: P, updateId: 'su3', encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'condition', id: 'sc3' },
    feeling: 'unsure', onPlan: 'partly',
    text: 'I do not know about this one. I read that the statin may not be doing much at my age and I have skipped it some weeks to see if I felt different. I did not.',
  },
  {
    id: 'sci4', patientId: P, updateId: 'su3', encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'prevention', id: 'sp1' },
    feeling: 'unsure', onPlan: 'no',
    text: 'I know. My sister had hers and they called her back and it was nothing but it took three weeks. I would rather not have three weeks of that right now.',
  },
  {
    id: 'sci5', patientId: P, updateId: 'su3', encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'lifestyle', id: 'li1' },
    feeling: 'worse', onPlan: 'partly',
    text: 'The walking is the knees, not the wanting. Two evenings is what I can do. Four was never going to happen and I should have said so in January.',
  },
  {
    id: 'sci6', patientId: P, updateId: 'su3', encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'lifestyle', id: 'li3' },
    feeling: 'unsure', onPlan: 'no',
    text: 'Nothing has changed here. I do not know what I would even cook on those nights.',
  },
  {
    id: 'sci7', patientId: P, updateId: 'su3', encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'overall' },
    feeling: 'better',
    text: 'Better than a year ago, and I understand it now, which is the part I wanted. What I would like from this visit is to stop adding things. Four tablets is enough. If one of them can go, I would like to talk about which.',
  },
];

// ------------------------------------------------------- the messages

export const sharonMessages: Message[] = [
  {
    id: 'sms1', patientId: P, date: '2026-05-28', from: 'patient', author: 'Sharon White',
    subject: 'Feeling shaky in the evenings',
    about: ['sc2'],
    body: 'Twice in the last fortnight I have come over shaky and sweaty at my mother’s, both times around nine, both times before I had eaten. It passed after a biscuit. I did not want to make a fuss but my daughter said I should tell you.',
  },
  {
    id: 'sms2', patientId: P, date: '2026-05-28', from: 'practice', author: 'L. DuBose, MD',
    replyTo: 'sms1', about: ['sc2'],
    subject: 'Re: Feeling shaky in the evenings',
    body: 'Thank you for telling me, this is exactly the sort of thing I want to hear about. That sounds like low blood sugar and the most likely cause is the glipizide, which is the one that can do this when a meal is late. Do not stop anything yet. Keep something sweet with you, and let us bring your June appointment forward if it happens again.',
  },
  {
    id: 'sms3', patientId: P, date: '2026-08-14', from: 'patient', author: 'Sharon White',
    subject: 'The walking',
    about: ['sc5'],
    body: 'I have stopped the evening walks. The knees have been bad since the weather turned and by the time I have finished at my mother’s I am done. I did not want you to think I had just given up on it.',
  },
  {
    id: 'sms4', patientId: P, date: '2026-08-15', from: 'practice', author: 'L. DuBose, MD',
    replyTo: 'sms3', about: ['sc5'],
    subject: 'Re: The walking',
    body: 'That is useful to know and it is not giving up. Two evenings is better than four on paper and none in practice. Let us talk at the next visit about something the knees will tolerate.',
  },
  {
    id: 'sms5', patientId: P, date: '2026-09-09', from: 'patient', author: 'Sharon White',
    subject: 'Something I read about statins',
    about: ['sc3'],
    body: 'A friend sent me an article saying statins do very little for women my age and can cause memory problems. I have not stopped it. I would like to understand the reasoning rather than be told it is fine.',
  },
  {
    id: 'sms6', patientId: P, date: '2026-09-10', from: 'practice', author: 'L. DuBose, MD',
    replyTo: 'sms5', about: ['sc3'],
    subject: 'Re: Something I read about statins',
    body: 'That is a fair question and worth a proper answer rather than a line in a corridor. The short version is that your case is not primary prevention: with diabetes and a cholesterol that was 221 in January, the benefit is larger than in the group that article is about. Let us go through the actual numbers at the next visit and decide together.',
  },
  {
    id: 'sms7', patientId: P, date: '2026-11-03', from: 'practice', author: 'L. DuBose, MD',
    subject: 'Mammogram',
    about: [],
    body: 'I have found three places that do Saturday appointments for the mammogram, and I have put the list in your records. Shall I book one of them for you rather than leave it with you to do?',
  },
  {
    id: 'sms8', patientId: P, date: '2026-11-05', from: 'patient', author: 'Sharon White',
    replyTo: 'sms7',
    subject: 'Re: Mammogram',
    body: 'Can I think about it. It is not the appointment, it is what happens if they call me back. My sister waited three weeks and it was nothing. I will tell you at the visit.',
  },
];

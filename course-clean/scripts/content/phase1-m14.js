/* =========================================================================
 * phase1-m14.js — question bank content for module m14
 * (Defect Analysis and 8D), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 734 raw calls and 22.5 per
 * 1000 reflow rate of m14l01, the 0.2 % -> 1.5 % tombstone jump and 2.85
 * escapes/day of m14l02, the 800-board quarantine of m14l03, the 15,000 ->
 * 1,600 ppm reduction of m14l05, the 232 -> 240 °C change of m14l06 and the
 * 40/30/20/10 Pareto of m14l07.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m14l01 — data before opinions ================== */

  {
    questionId: 'q-m14l01-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm14l01',
    prompt: 'Why does the lesson audit measurement before ranking stages?',
    options: opts(
      'Raw stage counts mix true defects with false calls, so the ranking moves',
      'Auditing lets the line drop stage categories it does not want to report',
      'The audit proves that the inspection machine is within its warranty terms',
      'Measurement integrity only matters for the functional test station'
    ),
    correct: 'a',
    explanation: 'In the lesson case, correcting 270 reflow calls to 210 confirmed defects still leaves reflow on top but changes the size of the gap, and the audit is what allows that. The audit does not remove categories, it is not a warranty check, and it applies to every station whose calls feed the Pareto.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l01-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l01',
    prompt: 'How does the lesson want a stage defect rate expressed, and why?',
    options: opts(
      'Per 1,000 boards, because volume differs between windows and products',
      'As a raw count, because rates hide how many defects were actually found',
      'As a percentage of the line capacity, since that is what the plant is paid for',
      'As a cost figure, because that is what management acts on'
    ),
    correct: 'a',
    explanation: 'A rate per 1,000 boards makes two weeks comparable even when the volumes differ, which is how the lesson presents the 22.5 per 1,000 reflow figure. Raw counts do the opposite, capacity percentage mixes two different quantities, and cost belongs to a later prioritisation step.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l01-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l01',
    prompt: 'Over 12,000 boards a stage records 270 defect calls. What is its raw rate per 1,000 boards?',
    options: opts(
      '22.5 per 1,000',
      '2.25 per 1,000',
      '45.0 per 1,000',
      '270 per 1,000'
    ),
    correct: 'a',
    explanation: '270 / 12,000 x 1,000 = 22.5, which is the top stage in the lesson case before and after correction. The other options shift the decimal, double the result, or forget to scale to 1,000 boards.',
    source: 'src-034'
  },

  /* exam */
  {
    questionId: 'q-m14l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l01',
    prompt: 'What does a seeded detection audit measure?',
    options: opts(
      'How many deliberately introduced defects the inspection actually finds',
      'How many false calls the machine makes on production boards',
      'How long the inspector takes to disposition a reject image',
      'How many stages the defect table should contain'
    ),
    correct: 'a',
    explanation: 'Seeded defects give a known denominator, so the detection rate is the share that was found — 48 of 50 in the lesson case. False calls come from an AOI audit, cycle time is a separate study, and the table structure follows the process.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm14l01',
    prompt: 'Of 270 reflow calls, the audit confirms 210 defects. What do the other 60 represent, and what is the false-call rate?',
    options: opts(
      'False calls, giving a rate of about 22 % of calls',
      'Escapes, giving an escape rate of about 22 % of calls',
      'Missing defects, giving a detection rate of about 22 %',
      'Seeded defects, giving a seeded rate of about 22 %'
    ),
    correct: 'a',
    explanation: 'The 60 unconfirmed calls are false calls, and 60 / 270 is a little over 22 %. Escapes are defects the inspection missed, missing defects are the same thing counted another way, and seeded defects are the audit inputs rather than the outputs.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l01-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l01',
    prompt: 'A seeded audit places 50 reflow defects and the inspection finds 48. What are the detection and escape rates?',
    options: opts(
      '96 % detected and about 4 % escaped',
      '48 % detected and about 52 % escaped',
      '96 % detected and about 2 % escaped',
      '4 % detected and about 96 % escaped'
    ),
    correct: 'a',
    explanation: '48 / 50 = 96 % found, so 2 of 50, about 4 %, escaped. The 52 % figure confuses the count with a ratio of the misses, 2 % treats the two misses as a percentage of the defects found, and the last option inverts the whole audit.',
    source: 'src-034'
  },

  /* ===================== m14l02 — cause analysis ======================== */

  {
    questionId: 'q-m14l02-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm14l02',
    prompt: 'What is a change point, and why does the lesson reach for it first?',
    options: opts(
      'The moment the data shifts, because it points at what changed with it',
      'The point where the defect rate crosses the customer complaint threshold',
      'The station where the defect is first detected on the line',
      'The date the corrective action is due to be signed off'
    ),
    correct: 'a',
    explanation: 'A step in the data is evidence of a single cause entering the process, so the change plus whatever happened at that time is the fastest route to a cause. Complaint thresholds, detection stations and action dates are administrative markers rather than process changes.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l02-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l02',
    prompt: 'How does the lesson separate a root cause from a contributing cause?',
    options: opts(
      'The root cause is necessary; contributors make the effect worse but are not enough on their own',
      'The root cause is the one the operator reports; contributors are found by engineering',
      'The root cause is always a machine setting; contributors are always material or people',
      'The root cause is the first item in the fishbone; everything later is a contributor'
    ),
    correct: 'a',
    explanation: 'Necessity is the test: without the root cause the effect does not happen, while contributors only modify its size or frequency. Who found it, which category it belongs to and its position in a diagram say nothing about that difference.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l02-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l02',
    prompt: 'A tombstone rate rises from 0.2 % to 1.5 % at 1,000 boards a day. AOI catches 80 % and functional test 5 % of what AOI misses. What is the daily escape?',
    options: opts(
      'About 2.85 escapes a day after the change, against 0.38 before',
      'About 15 escapes a day after the change, against 2.0 before',
      'About 3.0 escapes a day after the change, against 0.4 before',
      'About 0.75 escapes a day after the change, against 0.1 before'
    ),
    correct: 'a',
    explanation: 'Fifteen defects a day less the 80 % AOI finds leaves 3.0, and functional test catches only 5 % of those, so 2.85 escape; the same chain on 2.0 gives 0.38. The second option stops at the defect count, the third stops before functional test, and the last applies the 80 % twice.',
    source: 'src-034'
  },

  /* exam */
  {
    questionId: 'q-m14l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l02',
    prompt: 'When does a 5-Why chain stop in the lesson\'s discipline?',
    options: opts(
      'When the answer is something the process can be changed to prevent',
      'When the chain reaches five steps, whatever the last answer is',
      'When the answer names a person who made the mistake',
      'When the answer is the defect that the customer reported'
    ),
    correct: 'a',
    explanation: 'The chain stops at an actionable process condition, which is what makes it a corrective action rather than a story. Stopping at a count, at a person or at the symptom all leave the process unchanged.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm14l02',
    prompt: 'What does a fishbone diagram organise, and what does it not do?',
    options: opts(
      'It organises candidate causes by category; it does not prove which one is real',
      'It proves the root cause, so no further testing is needed',
      'It ranks the stages of the line by defect count',
      'It replaces the defect table, since it contains the same data'
    ),
    correct: 'a',
    explanation: 'The diagram is a structured list of possibilities across categories such as machine, material, method and people, and causes still have to be tested. It does not prove anything, it does not rank stages, and it is not a substitute for the Pareto data.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l02',
    prompt: 'A defect rate jumps after a paste lot change, and the lot behaved normally elsewhere. What does the lesson call the paste lot?',
    options: opts(
      'A strong candidate for the root cause, subject to a controlled test',
      'A confirmed root cause, since the timing lines up',
      'A contributing cause, since the timing could be coincidence',
      'A detection escape, since the defect reached the customer'
    ),
    correct: 'a',
    explanation: 'Timing that lines up with a change makes the lot a strong candidate, but the lesson still requires a controlled test before it is declared. Calling it confirmed on timing alone, downgrading it on speculation, or relabelling it as a detection issue all skip that step.',
    source: 'src-034'
  },

  /* ===================== m14l03 — containment =========================== */

  {
    questionId: 'q-m14l03-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm14l03',
    prompt: 'How does the lesson set the start of a suspect window?',
    options: opts(
      'The earliest credible change or last verified good check, whichever is earlier',
      'The time the defect was first reported by an operator on the line',
      'The start of the shift in which the defect was found',
      'The time the line was stopped after the defect was confirmed'
    ),
    correct: 'a',
    explanation: 'The case chooses 13:45 over a 13:50 verified-good check because the change was earlier, which widens rather than narrows the net. Operator reports, shift starts and the stop time all risk leaving suspect boards outside the quarantine.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l03-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l03',
    prompt: 'What has to be included in a quarantine beyond the suspect boards still on the line?',
    options: opts(
      'Work in process, finished goods and units already shipped from the window',
      'Only the panels that failed the inspection that raised the alarm',
      'Only the boards produced after the line was restarted',
      'Nothing further, since boards already shipped are outside the plant'
    ),
    correct: 'a',
    explanation: 'Containment covers the whole traceable window, including stock and shipped units, because those are the ones that reach the customer. Failing panels alone, post-restart output and a plant boundary all leave the exposure open.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l03-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l03',
    prompt: 'A window runs from 13:45 to 14:25 at 1,200 boards an hour. How many boards are suspect?',
    options: opts(
      '800 boards',
      '1,200 boards',
      '480 boards',
      '900 boards'
    ),
    correct: 'a',
    explanation: 'The window is 40 min, and 1,200 an hour is 20 a minute, so 800 boards. The 1,200 answer assumes a full hour, 480 uses 24 min, and 900 uses 45 min.',
    source: 'src-034'
  },

  /* exam */
  {
    questionId: 'q-m14l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l03',
    prompt: 'What is the purpose of D3 containment in an 8D?',
    options: opts(
      'To stop the defect reaching more customers before the cause is known',
      'To change the process so that the defect cannot occur again',
      'To prove that the process was capable before the incident',
      'To document the team that will investigate the problem'
    ),
    correct: 'a',
    explanation: 'Containment buys time: it protects the customer while the cause is still being found, and it is explicitly not the permanent fix. Capability evidence and team records belong to other disciplines of the report.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm14l03',
    prompt: 'Why does the lesson prefer the wider suspect window even at the cost of more scrap?',
    options: opts(
      'A contained window is reversible; a shipped escape is not',
      'Wider windows reduce the amount of documentation needed',
      'The customer pays for the scrap, so the cost is not the plant\'s',
      'A wider window makes the effectiveness metric easier to meet'
    ),
    correct: 'a',
    explanation: 'Quarantined boards can be inspected and released, while a board shipped with the defect cannot be recalled as cheaply, which is the asymmetry the lesson acts on. Documentation does not shrink, cost does not disappear, and the metric is not made easier.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l03',
    prompt: 'What does the lesson require in the effectiveness metric for a containment?',
    options: opts(
      'A quantity, a time window and the inspection that will demonstrate it',
      'A statement that the defect has not recurred since the fix',
      'The signature of the customer quality representative',
      'The cost of the quarantine, compared with the cost of a recall'
    ),
    correct: 'a',
    explanation: 'The metric has to be measurable and dated, so the lesson pairs a count with a window and a method. A bare statement, an approval and a cost comparison do not demonstrate that the containment works.',
    source: 'src-034'
  },

  /* ===================== m14l04 — 8D discipline ======================== */

  {
    questionId: 'q-m14l04-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm14l04',
    prompt: 'What does the lesson say a problem statement must separate?',
    options: opts(
      'Occurrence from detection, because both failures reached the customer',
      'The cost of the defect from the cost of the corrective action',
      'The internal complaint from the external complaint about the same lot',
      'The machine that made the defect from the operator who found it'
    ),
    correct: 'a',
    explanation: 'A defect that reaches a customer is both a failure to prevent and a failure to detect, and the lesson names that pair in D2. Cost, complaint routing and attribution to person or machine are other questions.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l04-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l04',
    prompt: 'Where do 8D reports most often fail, according to the lesson?',
    options: opts(
      'At verifying that the action worked, and at preventing the same cause elsewhere',
      'At assembling a team, because the right people are rarely available',
      'At describing the problem, because customers already know the symptom',
      'At containing the stock, because warehouses are outside quality control'
    ),
    correct: 'a',
    explanation: 'The lesson points at D6 and D7 — effectiveness and prevention — as the weak disciplines, since a plausible fix is easy to write and hard to prove. Team formation, problem description and containment are usually done better, and are not the failure the lesson highlights.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l04-05',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'apply',
    lessonId: 'm14l04',
    prompt: 'A customer reports tombstoned resistors on a shipped lot. Which content does D2 need?',
    options: opts(
      'Product, line, process step, defect mode, lot trace, quantity and method',
      'The name of the customer contact and the date of the complaint only',
      'The list of team members and their availability for the week',
      'The cost of the recall, since that sets the priority of the report'
    ),
    correct: 'a',
    explanation: 'D2 describes the problem precisely enough to be investigated: what, where, at which step, how many, with what trace and measured how. A contact and a date, a team roster and a cost figure do not define the problem.',
    source: 'src-034'
  },

  /* exam */
  {
    questionId: 'q-m14l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l04',
    prompt: 'Which discipline carries the permanent corrective action?',
    options: opts(
      'D5, chosen after the root cause in D4 has been verified',
      'D3, because containment is the action that stops the defect',
      'D6, because that is where the result is measured',
      'D8, because closure is where the fix is signed off'
    ),
    correct: 'a',
    explanation: 'The action follows the verified cause, which is the order the lesson insists on. Containment is temporary by definition, D6 verifies, and closure does not introduce a fix the report has not already chosen.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm14l04',
    prompt: 'A report offers four possible causes and one action that would fix all of them. What does the lesson say?',
    options: opts(
      'The cause has to be verified before an action is chosen, or the fix proves nothing',
      'A single action is efficient, so the causes need no further work',
      'Four causes should be reduced to a fishbone diagram and left there',
      'The action can stand, provided the effectiveness metric passes'
    ),
    correct: 'a',
    explanation: 'Without verification, a successful action cannot be attributed to any of the four causes and the defect may return by another path. Efficiency, diagramming and a passing metric do not replace the verification the lesson demands.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l04',
    prompt: 'What does D7 require beyond fixing the line where the defect appeared?',
    options: opts(
      'Checking other lines, products and processes for the same failure mode',
      'A second 8D report for every other product in the plant',
      'A repeat of the customer complaint process for the same lot',
      'A re-audit of the calibration records of the whole department'
    ),
    correct: 'a',
    explanation: 'Prevention means asking where else this cause can act, which is why the lesson extends D7 beyond the original line. A report per product, a repeat complaint and a blanket calibration audit are broader than the question requires.',
    source: 'src-034'
  },

  /* ===================== m14l05 — corrective action ==================== */

  {
    questionId: 'q-m14l05-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l05',
    prompt: 'How does the lesson separate corrective from preventive action?',
    options: opts(
      'Corrective removes the cause that acted; preventive stops the same cause acting elsewhere',
      'Corrective is done by the line; preventive is done by the quality department',
      'Corrective is documented; preventive is communicated verbally',
      'Corrective addresses detection; preventive addresses occurrence'
    ),
    correct: 'a',
    explanation: 'The difference is scope: one cause removed where it occurred, the same cause kept from recurring in new places or products. Who performs it, how it is recorded and which failure it addresses are not the lesson\'s distinction.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l05-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm14l05',
    prompt: 'A fix cut defects by 89 % but the rate is still above target. What does the lesson do?',
    options: opts(
      'Keep the 8D open and strengthen or extend the action before closing',
      'Close the 8D, since an 89 % improvement is inside normal variation',
      'Reset the target to the achieved rate and close the report',
      'Close the 8D and open a new one with a lower priority'
    ),
    correct: 'a',
    explanation: 'Effectiveness is judged against the agreed metric, not against the size of the improvement, so the report stays open until the target is met. Accepting the improvement, moving the target or re-filing the problem all close a loop that has not closed.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l05-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l05',
    prompt: 'A wave line records 180 defects in 12,000 boards, then 24 in 15,000. What are the rates and the reduction?',
    options: opts(
      '15,000 ppm to 1,600 ppm, a reduction of about 89 %',
      '15,000 ppm to 1,600 ppm, a reduction of about 11 %',
      '1,500 ppm to 160 ppm, a reduction of about 89 %',
      '15,000 ppm to 1,600 ppm, a reduction of about 99 %'
    ),
    correct: 'a',
    explanation: '180 / 12,000 = 15,000 ppm and 24 / 15,000 = 1,600 ppm, and (15,000 - 1,600) / 15,000 is 89.3 %. The 11 % figure states what remains rather than what was removed, the third option drops a decimal, and 99 % overstates the change.',
    source: 'src-034'
  },

  /* exam */
  {
    questionId: 'q-m14l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l05',
    prompt: 'What makes an effectiveness check meaningful?',
    options: opts(
      'An agreed metric, a defined sample and a window long enough to see recurrence',
      'A statement from the process engineer that the fix is in place',
      'A single good shift of data after the change is implemented',
      'The absence of complaints from the customer for one week'
    ),
    correct: 'a',
    explanation: 'The lesson requires the metric, the sample and the window to be fixed in advance so the result can be judged. A statement, one shift and one quiet week are not evidence that the cause is gone.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm14l05',
    prompt: 'Defects fall after a fix but a different defect mode rises in the same window. What does the lesson call that?',
    options: opts(
      'A shift in the process that the action may have introduced, so the check is not complete',
      'A successful corrective action, since the original defect is gone',
      'Normal variation, since defect modes always trade against each other',
      'A measurement problem at the inspection station'
    ),
    correct: 'a',
    explanation: 'An action that removes one mode by creating another has not improved the process, which is why effectiveness is measured across the stage and not on one code. Calling it success, normal variation or a measurement artefact misses the trade the action made.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l05',
    prompt: 'A target is 500 ppm and a verification sample shows 1,600 ppm. What is the correct conclusion?',
    options: opts(
      'The action is not yet effective by the agreed metric',
      'The action is effective, because the rate dropped substantially',
      'The target was unrealistic, so it should be renegotiated',
      'The sample was too small, so the result can be set aside'
    ),
    correct: 'a',
    explanation: 'The lesson states the conclusion directly: above the agreed target, the corrective action is not yet effective. Improvement size, target renegotiation and sample size are not grounds for closing the report.',
    source: 'src-034'
  },

  /* ===================== m14l06 — closing the loop ===================== */

  {
    questionId: 'q-m14l06-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm14l06',
    prompt: 'What does the lesson put in the control plan after a corrective action?',
    options: opts(
      'The parameter, its limits, how it is measured, how often and by whom',
      'The name of the project and the date the 8D was closed',
      'The cost of the action and the savings it produced',
      'A copy of the customer complaint as an attachment'
    ),
    correct: 'a',
    explanation: 'A control plan is only useful if it says what to watch, against which limits, with which method and at what frequency. Project identity, economics and the complaint text do not tell an operator what to do on the line.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l06-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l06',
    prompt: 'What has to be updated in the PFMEA after a verified cause is found?',
    options: opts(
      'The failure mode, its cause, and the detection or prevention control that now applies',
      'The revision letter only, since the analysis structure stays the same',
      'The team list, because the people who investigated own the risk',
      'Nothing, because the PFMEA describes the design rather than the process'
    ),
    correct: 'a',
    explanation: 'The analysis exists to record what can fail and how it is controlled, so a newly verified cause and the control that now addresses it belong in it. A revision bump alone, a team list and leaving it untouched all leave the risk assessment out of date.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l06-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l06',
    prompt: 'A peak moves from 232 °C to 240 °C and TAL from 48 s to 55 s, against a 235-245 °C and 40-70 s datasheet range. What is the finding?',
    options: opts(
      'Both proposed values sit inside the datasheet range',
      'The peak is inside the range but the TAL is above it',
      'Both values are outside the range, so the change cannot be run',
      'The peak change is 8 °C and therefore too large for a bounded change'
    ),
    correct: 'a',
    explanation: '240 °C falls inside 235-245 °C and 55 s inside 40-70 s, so the proposal is within the window and becomes a bounded, verifiable change. The other options misread one of the ranges or invent a limit on the step size.',
    source: 'src-034'
  },

  /* exam */
  {
    questionId: 'q-m14l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l06',
    prompt: 'What does the lesson use the auditor checklist for?',
    options: opts(
      'Confirming that the documented controls are still being followed',
      'Recording the auditor\'s opinion of the line layout',
      'Replacing the control plan when the document is lost',
      'Setting the defect target for the next quarter'
    ),
    correct: 'a',
    explanation: 'The checklist verifies practice against the plan on a schedule, which is why it exists alongside the control plan. Opinions, document substitution and target setting are not its purpose.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm14l06',
    prompt: 'A change-control proposal touches the reflow peak and TAL at the same time. What does the lesson require?',
    options: opts(
      'A stated reason and a verification sample that can show the effect',
      'Only an approval signature, because both values stay inside the window',
      'A full process qualification, since any profile change is major',
      'No verification, since the paste datasheet already defines the limits'
    ),
    correct: 'a',
    explanation: 'A bounded change still needs its reason recorded and its effect proven on a sample, which the case builds into the tombstone reduction target. A signature alone, a blanket qualification and skipping verification all skip the evidence.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l06',
    prompt: 'A verification aims at below 50 ppm with a zero-defect sample. What does the lesson need to size that sample?',
    options: opts(
      'A statistical rule for zero failures, tied to the confidence required',
      'The line rate alone, since it sets how many boards an hour pass',
      'The customer\'s sample size for incoming inspection',
      'The number of boards the AOI can inspect per shift'
    ),
    correct: 'a',
    explanation: 'With zero observed defects the sample has to be large enough that the claimed rate is credible at the stated confidence, which is the binomial rule the case applies. Line rate, an incoming-inspection convention and machine capacity do not answer the statistical question.',
    source: 'src-034'
  },

  /* ===================== m14l07 — 8D workshop ========================== */

  {
    questionId: 'q-m14l07-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm14l07',
    prompt: 'What does the workshop check before trusting its own Pareto?',
    options: opts(
      'That the inspection has the resolution and repeatability for the attribute',
      'That the total defect count is above a hundred events',
      'That the stages are listed in the order of the process flow',
      'That the numbers were collected by the quality department'
    ),
    correct: 'a',
    explanation: 'A Pareto of unreliable calls ranks noise, so the workshop confirms the measurement first. Volume, flow order and the collecting department do not make the counts dependable.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l07-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l07',
    prompt: 'What does a cumulative percentage add to a stage Pareto?',
    options: opts(
      'It shows where the first few stages reach most of the defects',
      'It converts defect counts into a rate per thousand boards',
      'It removes the need for a measurement audit before analysis',
      'It ranks the stages by cost rather than by count'
    ),
    correct: 'a',
    explanation: 'The cumulative line answers how few stages carry most of the problem, which is how the workshop picks where to act. It is not a rate conversion, it does not replace the audit, and it does not switch the ranking to cost.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l07-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l07',
    prompt: 'Of 100 defects, print takes 40, placement 30, reflow 20 and wave 10. What is the cumulative share after the first two stages?',
    options: opts(
      '70 %',
      '40 %',
      '30 %',
      '90 %'
    ),
    correct: 'a',
    explanation: '40 + 30 = 70 %, so two stages carry nearly three quarters of the defects, and adding reflow brings it to 90 %. Reading a single stage, the second stage or the point after reflow all answer a different question from the one asked.',
    source: 'src-034'
  },

  /* exam */
  {
    questionId: 'q-m14l07-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm14l07',
    prompt: 'What does the workshop produce from symptom to closure?',
    options: opts(
      'A Pareto, a verified cause, an action, an owner, a date and a metric',
      'A list of complaints, sorted by the date they were received',
      'A new process specification written by the quality department',
      'A cost report showing what the defect has consumed this year'
    ),
    correct: 'a',
    explanation: 'The exercise walks the whole 8D chain, so the output is the cause, the action with an owner and date, and the metric that will show it worked. Complaint lists, specifications and cost reports are inputs or side products of other work.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l07-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm14l07',
    prompt: 'Which stage does the workshop act on first, and why?',
    options: opts(
      'The largest share, because it offers the biggest return for the same effort',
      'The last stage, because it is closest to the customer',
      'The first stage, because its defects can affect every later step',
      'The stage with the oldest open action, regardless of its share'
    ),
    correct: 'a',
    explanation: 'A Pareto is a prioritisation tool, so the largest contributor gets the first action and the cumulative line shows when enough has been addressed. Position in the flow and the age of an action are not what the counts say.',
    source: 'src-034'
  },
  {
    questionId: 'q-m14l07-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm14l07',
    prompt: 'What does the workshop require before the Pareto is published?',
    options: opts(
      'The measurement check, and a note of the period and volume it covers',
      'A signature from the plant manager and the customer',
      'A projection of the defect rate for the next twelve months',
      'A comparison against a competitor\'s published defect rate'
    ),
    correct: 'a',
    explanation: 'The counts need a measurement check and a stated period and volume so the reader knows what is being ranked. Approvals, forecasts and competitor comparisons add nothing to the integrity of the data.',
    source: 'src-034'
  }

];

/* =========================================================================
 * phase1-m15.js — question bank content for module m15
 * (Design Feedback), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 18 in 4,000 boards and the
 * 0.0099-0.0121 mm2 aperture band of m15l01, the 420 failed boards and
 * 3,969 EUR rework cost of m15l02, the 19 % volume cut and 200-board screen of
 * m15l03, the 9.61 mm2 / 60.1 % thermal-pad pattern of m15l04 and the
 * 7,900 EUR monthly COPQ of m15l05.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m15l01 — how designers read feedback =========== */

  {
    questionId: 'q-m15l01-03',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm15l01',
    prompt: 'What turns a process observation into a design rule?',
    options: opts(
      'A measurable limit that a designer can apply and a test can check',
      'A statement of intent that the design team agrees to follow',
      'A photograph of the defect attached to the drawing package',
      'A note that the issue should be considered in future projects'
    ),
    correct: 'a',
    explanation: 'The lesson converts the complaint into something like equal aperture areas within ±10 %, which can be checked on a drawing and on a stencil. Intent, a photograph and a note for later are not rules a drawing review can verify.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l01-04',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm15l01',
    prompt: 'Why does the lesson insist on a defect rate rather than a count when talking to design?',
    options: opts(
      'A rate compares across products and volumes, which a count cannot do',
      'A count is confidential, while a rate can be shared outside the plant',
      'A rate is easier to explain, since design engineers do not read counts',
      'A count is accurate and a rate introduces rounding error'
    ),
    correct: 'a',
    explanation: 'The rate is what a designer can weigh against the cost of a change, and it travels between products, lines and periods. Confidentiality, simplicity and accuracy arguments do not describe why the rate is the unit the lesson uses.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l01-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l01',
    prompt: 'Eighteen tombstones appear on 4,000 boards. What rate is that, and how does the lesson express the target?',
    options: opts(
      '0.45 %, with a target of 0.10 % or less',
      '0.45 %, with a target of 0.45 % to hold the level',
      '4.5 %, with a target of 0.10 % or less',
      '0.045 %, with a target of 0.01 % or less'
    ),
    correct: 'a',
    explanation: '18 / 4,000 = 0.45 %, and the lesson sets a target of at most 0.10 % before sizing the verification sample. The second option proposes no improvement, and the last two move the decimal in opposite directions.',
    source: 'src-038'
  },

  /* exam */
  {
    questionId: 'q-m15l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l01',
    prompt: 'Which format does the lesson want process feedback delivered in?',
    options: opts(
      'Rate, evidence with scale, the affected design feature and a proposed limit',
      'A narrative of the shift in which the defects were first seen',
      'A list of the operators and machines involved in the window',
      'A complaint record with the customer correspondence attached'
    ),
    correct: 'a',
    explanation: 'The designer needs to know how often, what it looked like, which feature it touches and what limit would prevent it. Narrative, personnel lists and complaint records do not give any of those four.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm15l01',
    prompt: 'A design change is proposed with no sample size attached. What does the lesson say?',
    options: opts(
      'The verification has to be sized to the target rate before the change is accepted',
      'The sample can be set after the pilot, when the observed rate is known',
      'A single production week is always enough to confirm a design change',
      'Sample size is a quality department decision, not part of the change'
    ),
    correct: 'a',
    explanation: 'The case sizes a sample to demonstrate 0.10 % at 95 % confidence, which is roughly 3,000 defect-free boards, precisely so the claim can be tested. Setting the sample after the data, assuming a week is enough and handing the question away all make the verification unfalsifiable.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l01',
    prompt: 'What does an aperture area balance rule look like in numbers?',
    options: opts(
      'Equal areas within ±10 %, so 0.011 mm² allows 0.0099 to 0.0121 mm²',
      'Equal areas within ±1 %, which is the printing tolerance on this size',
      'Equal areas with no tolerance, since the stencil laser is exact',
      'Areas matched to the pad, not to each other, within ±10 %'
    ),
    correct: 'a',
    explanation: 'The lesson sets equal areas within ±10 % and works the band out from a 0.011 mm² nominal. A tighter tolerance than the process can hold, a zero tolerance and a rule aimed at the pad instead of the opposite aperture all miss the intent of balancing the two ends.',
    source: 'src-038'
  },

  /* ===================== m15l02 — the evidence pack ===================== */

  {
    questionId: 'q-m15l02-03',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm15l02',
    prompt: 'Why does the lesson attach a cost estimate to a technical complaint?',
    options: opts(
      'Cost is the argument that gets a design change scheduled and funded',
      'Cost replaces the defect rate, which is too technical for management',
      'Cost is required by the change-request template in every case',
      'Cost proves the defect exists, which a rate cannot do on its own'
    ),
    correct: 'a',
    explanation: 'The cost of poor quality turns a process problem into a business case that competes for engineering time. It does not replace the rate, it is not a universal template field, and it is not evidence that the defect exists.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l02-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l02',
    prompt: 'What does the lesson include in the evidence pack beyond the numbers?',
    options: opts(
      'Images with a scale, so the feature and its size can be judged',
      'A video of the line running at production speed for one shift',
      'The full list of machine parameters for the affected product',
      'The names of the engineers who investigated the issue'
    ),
    correct: 'a',
    explanation: 'A scaled image lets a designer see the geometry under discussion, which the lesson pairs with the rate and the cost. Video, a full parameter dump and an investigator list add volume without adding evidence.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l02-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l02',
    prompt: 'Of 12,000 boards a week at 96.5 % first-pass yield, what fraction fails, and how many reworks does that give?',
    options: opts(
      '3.5 % fail, so about 420 boards, of which about 294 are reworked',
      '3.5 % fail, so about 420 boards, of which all are reworked',
      '96.5 % fail, so about 11,580 boards are reworked',
      '3.5 % fail, so about 42 boards, of which about 29 are reworked'
    ),
    correct: 'a',
    explanation: '420 boards fail, and at 70 % rework that is 294 boards needing about 88 hours of labour. Reworking all of them ignores the scrap and hold shares, inverting the yield inverts the base, and 42 boards slips a decimal.',
    source: 'src-038'
  },

  /* exam */
  {
    questionId: 'q-m15l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l02',
    prompt: 'Which elements make up the cost of poor quality in the lesson\'s estimate?',
    options: opts(
      'Rework labour, scrap, and inspection with handling cost',
      'Solder, stencil and paste consumption on the line',
      'Machine depreciation, floor space and utility charges',
      'Engineering salaries for the whole quality department'
    ),
    correct: 'a',
    explanation: 'The estimate is built from the work a failing board causes: rework time, scrapped value, and the inspection and handling around it. Consumables, fixed costs and department salaries are production overheads rather than the cost of poor quality.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm15l02',
    prompt: 'Why does the lesson compute cost per good board as well as total cost?',
    options: opts(
      'It lets two products or two periods be compared on the same basis',
      'It is the figure the accounting department asks for on the invoice',
      'It removes the need to count failed boards in the estimate',
      'It converts the labour rate into a per-minute value'
    ),
    correct: 'a',
    explanation: 'Dividing by good boards puts the cost on the output that was actually sold, which makes comparisons fair. It is not an invoicing figure, it does not remove the failure count, and it is not a unit conversion of the labour rate.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l02',
    prompt: '294 boards need 18 min of rework each at 45 EUR an hour. What does the labour cost come to?',
    options: opts(
      'About 3,970 EUR a week',
      'About 1,320 EUR a week',
      'About 12,700 EUR a week',
      'About 660 EUR a week'
    ),
    correct: 'a',
    explanation: '294 x 18 = 5,292 min, or 88.2 h, and 88.2 x 45 = 3,969 EUR. The 1,320 answer uses the failure count without the rework share, 12,700 forgets to convert minutes to hours in the right direction, and 660 drops a factor of six.',
    source: 'src-038'
  },

  /* ===================== m15l03 — writing the change request ============ */

  {
    questionId: 'q-m15l03-03',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm15l03',
    prompt: 'Which sections does the lesson require in a change request?',
    options: opts(
      'Problem, impact, proposal, alternatives, risk and verification',
      'Problem and proposal only, since the rest delays the decision',
      'Cost, schedule, owner and approval signature',
      'Defect description, photograph, customer name and ship date'
    ),
    correct: 'a',
    explanation: 'The request has to let a reviewer weigh a change against doing nothing, which is why alternatives and risk sit beside the problem and the verification. A two-part request, a purely administrative set and a customer-centred set all leave the decision uninformed.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l03-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l03',
    prompt: 'How does the lesson describe n = 1 / target rate for verification?',
    options: opts(
      'A screening sample, not a confidence statement',
      'A confidence statement at the 95 % level',
      'The statistically exact sample for any target rate',
      'A sample only valid for rates above one percent'
    ),
    correct: 'a',
    explanation: 'The lesson is explicit that 200 boards for a 0.5 % target is a screen, and that the confidence-based size has to come from the quality plan. Calling it a 95 % statement, exact, or rate-limited overstates what the rule gives.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l03-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l03',
    prompt: 'An aperture drops from 0.50 to 0.45 mm square on a 0.12 mm stencil. What paste volume change does that give?',
    options: opts(
      'A 19 % reduction, from 0.030 to 0.0243 mm³',
      'A 10 % reduction, from 0.030 to 0.027 mm³',
      'A 19 % reduction, from 0.060 to 0.0486 mm³',
      'A 20 % reduction, from 0.025 to 0.020 mm³'
    ),
    correct: 'a',
    explanation: 'Areas are 0.25 and 0.2025 mm², so volumes are 0.030 and 0.0243 mm³, a drop of 19 % because the edge reduction is squared. The 10 % figure tracks only the linear change, the third option doubles the volume, and the last rounds away the squared effect.',
    source: 'src-038'
  },

  /* exam */
  {
    questionId: 'q-m15l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l03',
    prompt: 'Why does the lesson ask for the alternatives in a change request?',
    options: opts(
      'To show the change was chosen over doing nothing and over other options',
      'To give the reviewer a menu from which the cheapest can be picked',
      'To document the options that were rejected as technically impossible',
      'To satisfy the template, which has a fixed number of sections'
    ),
    correct: 'a',
    explanation: 'A proposal is only a decision when the reader can see what else was possible, including inaction. A menu, a rejection list and a template requirement do not capture that comparison.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm15l03',
    prompt: 'What does the risk section have to state?',
    options: opts(
      'What could go wrong with the change and how it would be detected',
      'The probability that the change will be approved by management',
      'The cost of the change, expressed as a range of estimates',
      'The name of the person who will carry the risk if it fails'
    ),
    correct: 'a',
    explanation: 'The risk statement pairs a failure mode with the control that would catch it, which is how a reviewer judges whether to proceed. Approval odds, cost ranges and personal liability do not describe the technical risk.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l03',
    prompt: 'A target is 0.5 % per board. What does the screening rule give, and what does it not give?',
    options: opts(
      '200 boards as a screen, not a statement at 95 % confidence',
      '200 boards, which demonstrates 0.5 % at 95 % confidence',
      '400 boards, which is the confidence-based figure for 0.5 %',
      '2,000 boards, since the target is expressed per board'
    ),
    correct: 'a',
    explanation: '1 / 0.005 = 200, and the lesson labels that as a screen that still has to be checked against the quality plan. Calling it a 95 % demonstration, doubling it for confidence or scaling by ten all add a claim the rule does not make.',
    source: 'src-038'
  },

  /* ===================== m15l04 — DFM and DFT asks ====================== */

  {
    questionId: 'q-m15l04-03',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm15l04',
    prompt: 'What makes a DFM request usable by a designer?',
    options: opts(
      'A specific geometry, a measurable limit and the reason behind both',
      'A general recommendation to leave more room around parts',
      'A list of every defect the line has seen on similar products',
      'A request to follow the supplier reference design exactly'
    ),
    correct: 'a',
    explanation: 'The lesson turns a limitation into a testable geometry, such as a thermal-pad aperture at 60 % of pad area split into four windows. Generalities, a defect dump and a reference design do not tell the designer what dimension to draw.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l04-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l04',
    prompt: 'Why does the lesson segment a large thermal-pad aperture?',
    options: opts(
      'The segments limit paste volume and give gas a path out during reflow',
      'The segments make the stencil easier to laser cut at fine resolution',
      'The segments let the pad carry more current than a single opening',
      'The segments allow different paste heights across the same pad'
    ),
    correct: 'a',
    explanation: 'A windowed aperture controls how much paste lands and lets volatiles escape, which is the point of the 60 % target split into four sub-apertures. Cutting ease, current capacity and differential paste height are not the reasons the lesson gives.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l04-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l04',
    prompt: 'A 4 by 4 mm thermal pad gets four 1.55 mm square windows. What area fraction is that?',
    options: opts(
      'About 60 %, which is the lesson\'s target',
      'About 25 %, since each window is a quarter of the pad',
      'About 96 %, because the windows nearly fill the pad',
      'About 40 %, which leaves more margin than the target'
    ),
    correct: 'a',
    explanation: 'Four windows of 2.40 mm² give 9.61 mm² against a 16 mm² pad, so 60.1 %, which matches the target and leaves an outer margin. Counting windows rather than areas, ignoring the gaps and under-shooting the target are the three ways to misplace the fraction.',
    source: 'src-038'
  },

  /* exam */
  {
    questionId: 'q-m15l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l04',
    prompt: 'Which design features does the lesson ask test to be designed for?',
    options: opts(
      'Test points, fiducials, panel breakaway and hole-to-lead specification',
      'Component placement, silkscreen fonts and board colour',
      'Paste type, stencil thickness and squeegee hardness',
      'Reflow profile, conveyor speed and oven zone count'
    ),
    correct: 'a',
    explanation: 'Those are the fabrication features that decide whether the assembly can be tested and processed at all, which is why the lesson asks for them at design review. Placement and silkscreen are drawing questions, and the remaining two are process settings chosen later.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm15l04',
    prompt: 'Paste bleeds between the peripheral pads of a 0.4 mm pitch QFN. What does the lesson convert that into?',
    options: opts(
      'A thermal-pad aperture rule that reduces volume and gives gas a path',
      'A request to use a thicker stencil for the whole assembly',
      'A demand for a finer stencil laser and a new supplier',
      'A note that 0.4 mm pitch is beyond the process and should be avoided'
    ),
    correct: 'a',
    explanation: 'The case reduces the thermal-pad deposit to 60 % in four windows, which lowers the total paste and the pressure driving bleed. A thicker stencil, a new laser and declining the pitch all treat the symptom with a bigger change than the evidence supports.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l04',
    prompt: 'What acceptance window does the lesson attach to the windowed aperture?',
    options: opts(
      'An SPI paste height band and a volume target for the pad',
      'A visual inspection of the stencil after every print',
      'A reflow peak and TAL band taken from the paste datasheet',
      'A pull strength measured on the thermal pad after assembly'
    ),
    correct: 'a',
    explanation: 'The rule is only testable if the print itself is measured, so the lesson gives a paste height band and a volume target for SPI. Stencil inspection, a reflow band and a pull test check other things than the deposit the rule controls.',
    source: 'src-038'
  },

  /* ===================== m15l05 — negotiation and closure =============== */

  {
    questionId: 'q-m15l05-03',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm15l05',
    prompt: 'How does the lesson justify a design change to a sceptical design owner?',
    options: opts(
      'With the monthly cost of poor quality against the one-time change cost',
      'With the number of complaints received from customers that quarter',
      'With a comparison against the best competitor product on the market',
      'With the engineering preference of the process team for the new pattern'
    ),
    correct: 'a',
    explanation: 'The case compares a monthly COPQ against an 8,000 EUR change cost and finds the payback quick. Complaints, competitor comparisons and preference are weaker arguments than the money the current design consumes every month.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l05-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l05',
    prompt: 'What closes a design-feedback loop?',
    options: opts(
      'Post-change data from the line that raised the issue, against the same metric',
      'The approval signature on the change request',
      'The release of the new drawing revision to the shop floor',
      'A meeting where the design and process teams agree it is done'
    ),
    correct: 'a',
    explanation: 'The loop closes when the original metric moves, which is why the lesson asks for post-change production data. A signature, a release and an agreement record the decision but not its effect.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l05-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l05',
    prompt: 'Rework labour is 1,361 EUR and scrap 6,480 EUR a month, with 60 EUR of downtime. Against an 8,000 EUR change cost, what is the argument?',
    options: opts(
      'About 7,900 EUR a month, so the change pays back in roughly a month',
      'About 7,900 EUR a year, so the change pays back in about a year',
      'About 1,421 EUR a month, so the change is hard to justify',
      'About 66,000 EUR a month, so the change pays back in days'
    ),
    correct: 'a',
    explanation: 'The three items sum to about 7,900 EUR per month, which against 8,000 EUR is a payback of roughly one month. Treating the figure as annual, dropping scrap and slipping a decimal all change the business case by an order of magnitude.',
    source: 'src-038'
  },

  /* exam */
  {
    questionId: 'q-m15l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm15l05',
    prompt: 'What does version control have to record for a design change?',
    options: opts(
      'The revision, the effective date and which products or lots it applies to',
      'The name of the engineer who first suggested the change',
      'The meeting minutes in which the change was discussed',
      'The list of suppliers who quoted for the new stencil'
    ),
    correct: 'a',
    explanation: 'A revision is only usable if the shop floor can tell which assemblies it governs from which date. Authorship, minutes and quotations are history rather than the control the lesson asks for.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm15l05',
    prompt: 'A pilot predicts a drop from 2.4 % to 0.6 % boards with rework. What does the lesson require before closing the change?',
    options: opts(
      'Production data after the change, not the pilot prediction',
      'A second pilot on a different product line for confirmation',
      'Customer approval of the new land pattern before production',
      'A review of the change cost against the original estimate'
    ),
    correct: 'a',
    explanation: 'A pilot shows what is possible; the loop closes on what the line actually produced afterwards. A second pilot, an approval and a cost review do not substitute for the post-change metric the case asks for.',
    source: 'src-038'
  },
  {
    questionId: 'q-m15l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm15l05',
    prompt: 'The proposal changes the land pattern and the stencil aperture at the same time. What does that cost the verification?',
    options: opts(
      'Attribution: a result cannot be assigned to either change',
      'Nothing, because both changes address the same defect',
      'Accuracy, because the paste volume becomes harder to measure',
      'Speed, because two drawings have to be revised instead of one'
    ),
    correct: 'a',
    explanation: 'Two changes at once still allow a yes or no answer on the combined effect but not on which one did the work, which matters for the next product. Both changes addressing the same defect is exactly why the attribution is lost, and drawing effort is a minor cost beside it.',
    source: 'src-038'
  }

];

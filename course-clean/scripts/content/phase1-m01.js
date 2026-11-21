/* =========================================================================
 * phase1-m01.js — question bank content for module m01
 * (Incoming Inspection), plus its exam bank.
 *
 * Content rules applied here (brief, hard rules 1-3):
 *   - every number comes from the lesson's own text, its worked calculation,
 *     or a figure already established in the course data; nothing is quoted
 *     from a standard from memory;
 *   - distractor lengths are kept within +-35 % of the keyed answer, and every
 *     distractor is a mistake a technologist actually makes (forgotten
 *     subtraction, wrong code-letter row, accepted-without-evidence, and so on);
 *   - correct option ids are spread across a/b/c/d and are checked by
 *     scripts/check-quiz.js after the write.
 *
 * Lesson questions: 4-5 per lesson, mixed understand / apply / calculate /
 * situation. Exam questions: 3 per lesson, pool:"exam", never a rewording of a
 * lesson question.
 * ========================================================================= */

'use strict';

/* Convenience: build an option list from [text, ...] with ids a,b,c,d,e. */
function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) {
    return { id: 'abcdef'[i], text: t };
  });
}

module.exports = [

  /* =====================================================================
   * m01l01 — What incoming inspection protects: defect cost by stage
   * =================================================================== */

  {
    questionId: 'q-m01l01-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l01',
    prompt: 'The same latent material defect can be caught at receipt, on the line, in the field, or only after a recall. Why does the cost of that defect rise at each of those stages?',
    options: opts(
      'Each stage adds labour, material and schedule exposure before the defect is removed, and a field failure adds handling and warranty cost.',
      'Inspection labour rates are set higher at later stages, so the same operation costs more when it is performed downstream.',
      'Later stages apply tighter acceptance criteria, so a defect that was tolerated at receipt becomes a reject on the line.',
      'The supplier reimburses defects found at receipt but not those found on the line, so the cost simply moves to the plant.'
    ),
    correct: 'a',
    explanation: 'The lesson attributes the escalation to accumulated value and schedule exposure, not to a rate change or a criteria change. By the time a defect surfaces on the line the board already carries every component and print operation that came before it, and a field failure adds freight, handling, customer communication and warranty. That is why the escalation diagram runs 1x at receipt, 10x on the line, 100x in the field and up to 1000x for a recall.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l01-04',
    type: 'single',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l01',
    prompt: 'A plant can only add a limited number of characteristics to its incoming inspection plan. According to the lesson, which characteristics should be added first?',
    options: opts(
      'Those with the highest downstream cost and the lowest chance of being detected later in the process.',
      'Those that are cheapest to measure, so the plan covers as many characteristics as possible per hour.',
      'Those that fail most often in the supplier history, whatever the detection capability downstream.',
      'Those that the purchase order lists first, because the document order reflects contractual priority.'
    ),
    correct: 'a',
    explanation: 'The lesson sets the criterion explicitly: the plan should focus on the characteristics that carry the highest downstream cost and the lowest chance of being caught later. Cheap-to-measure characteristics buy coverage on paper, and a high supplier failure count on a characteristic that assembly detects reliably does not justify the same priority.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l01-05',
    type: 'calc',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm01l01',
    prompt: 'A lot of 20,000 units is released with an escape fraction of 0.5 %, and the plant cost table gives 4 currency units per defect found at receipt and 400 per defect found in the field. What is the expected field cost of the escaped defects?',
    options: opts(
      '40,000 currency units',
      '4,000 currency units',
      '400,000 currency units',
      '10,000 currency units'
    ),
    correct: 'a',
    explanation: 'Escaped defects = 20,000 x 0.005 = 100 units. Field cost = 100 x 400 = 40,000 currency units, against 100 x 4 = 400 units found at receipt. The 4,000 and 10,000 answers come from dividing the lot quantity by 2 and by 8 instead of applying the escape fraction, and 400,000 comes from treating the 0.5 % as a whole-number multiplier.',
    source: 'src-037'
  },

  /* exam bank */
  {
    questionId: 'q-m01l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l01',
    prompt: 'Which statement describes what an incoming inspection gate actually delivers to the plant?',
    options: opts(
      'It converts latent material risk into documented evidence, so a lot is released on proof rather than on appearance.',
      'It guarantees that released lots contain no defective units, provided the sampling plan is correctly chosen.',
      'It moves the responsibility for material quality to the supplier and removes the need for line monitoring.',
      'It replaces process qualification, because released material cannot cause process deviations downstream.'
    ),
    correct: 'a',
    explanation: 'Incoming inspection is a control point that produces evidence: the lot, its identity, its condition and its handling history are shown to match what the process expects. It cannot guarantee a defect-free lot, it does not transfer responsibility away from the plant, and it does not substitute for process qualification.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'analyse',
    lessonId: 'm01l01',
    prompt: 'A material defect that incoming inspection cannot see reliably causes intermittent opens after three months in the field. Which argument best justifies spending on incoming resources for that part family?',
    options: opts(
      'The cost of a field escape dominates the cost of catching the same defect at the dock.',
      'The part family has the largest purchase volume, so any inspection spend is justified.',
      'Field returns are covered by warranty, so the plant carries no cost for an escape.',
      'Incoming inspection is the only stage that can measure the characteristic at all.'
    ),
    correct: 'a',
    explanation: 'The decision criterion is relative cost, and the escalation is what makes the case: the same defect at the dock and in the field differ by orders of magnitude. Purchase volume alone is not the criterion, warranty does not absorb handling and reputation cost, and the claim that no later stage can measure the characteristic is not what the lesson establishes.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l01-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l01',
    prompt: 'Receipt-stage correction of one defect costs 2 currency units. Using the lesson escalation of 1x at receipt, 10x on the line and 100x in the field, what does the same defect cost in the field?',
    options: opts(
      '200 currency units',
      '20 currency units',
      '2,000 currency units',
      '110 currency units'
    ),
    correct: 'a',
    explanation: 'The field multiplier is 100, so 2 x 100 = 200 currency units. The 20 answer applies the 10x line multiplier, 2,000 applies a 1000x recall multiplier, and 110 adds the three multipliers instead of applying one of them.',
    source: 'src-037'
  },

  /* =====================================================================
   * m01l02 — The documentation package
   * =================================================================== */

  {
    questionId: 'q-m01l02-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l02',
    prompt: 'A restricted-substance declaration arrives with a component lot. What does that document actually prove?',
    options: opts(
      'It proves a stated compliance claim about the lot range, not that the lot will process correctly.',
      'It proves the lot conforms to the purchase order, so it can replace the certificate of conformance.',
      'It proves that the supplier tested the electrical parameters of the specific reel that was received.',
      'It proves the material is free of moisture, so the dry-pack card no longer has to be checked.'
    ),
    correct: 'a',
    explanation: 'The lesson separates declarations from quality certificates: a declaration carries a regulatory or contractual claim about origin, composition or compliance, traceable to the lot or a lot range. It says nothing about process behaviour, it does not replace a CoC, it is not a test report, and it has no bearing on moisture content.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l02-04',
    type: 'single',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm01l02',
    prompt: 'A certificate of conformance matches the part number and quantity but names a different supplier lot code than the reel labels. What is the correct disposition?',
    options: opts(
      'Quarantine the lot: a certificate for another lot does not prove this lot, even with the part number matching.',
      'Accept the lot: part number and quantity match, and the lot code is a supplier internal reference only.',
      'Accept the lot after a visual check of the markings, because the certificate confirms the specification.',
      'Reject and scrap the lot: any document mismatch means the material cannot be used under any condition.'
    ),
    correct: 'a',
    explanation: 'A certificate must be traceable to the received lot by lot code, date code or serial range. When it covers a different lot, it proves nothing about the material on the dock, whatever the part number says. That is a documentation nonconformity, so the lot is held until the evidence is corrected rather than accepted on appearance or scrapped outright.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l02-05',
    type: 'calc',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l02',
    prompt: 'A dry-pack label states a floor life of 168 h. The pack was opened 100 h ago and has not been resealed. How much floor life remains, and what does that mean for a job that still needs 80 h of open time?',
    options: opts(
      '68 h remain, which does not cover the 80 h still needed, so the parts need conditioning before use.',
      '168 h remain, because the floor-life value on the label is fixed and does not decrease with exposure.',
      '268 h remain, because the label value is added to the exposure time already recorded in the log.',
      '100 h remain, because the elapsed time is the working value and the label value is only a limit.'
    ),
    correct: 'a',
    explanation: 'Remaining floor life = 168 h - 100 h = 68 h. The remaining 80 h of planned open time would exceed it by 12 h, so the parts cannot be placed on the current schedule without an approved conditioning step. The label value is a limit that is consumed by exposure, not a fixed allowance, and elapsed time is not interchangeable with remaining time.',
    source: 'src-003'
  },

  /* exam bank */
  {
    questionId: 'q-m01l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l02',
    prompt: 'Why is a packing list not sufficient evidence to release a received lot?',
    options: opts(
      'It records what the supplier says it shipped and how it was identified, not that the lot met the criteria.',
      'It is issued by the carrier rather than the supplier, so it carries no contractual weight at all.',
      'It covers only the outer cartons, and inner reel labels always override the information it carries.',
      'It is a financial document, so it is retained by purchasing and never reaches the receiving area.'
    ),
    correct: 'a',
    explanation: 'The packing list proves shipping identity, quantity and traceability links. Conformance evidence comes from the certificate of conformance or analysis. The packing list is still a receiving document and it is the starting point for traceability, so the other three statements misstate what it is and who issues it.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm01l02',
    prompt: 'A dry pack arrives with an intact seal but the humidity indicator card has turned to its warning colour. What does this tell the receiving inspector?',
    options: opts(
      'The pack environment exceeded the supplier threshold at some point, so the lot is held for evaluation.',
      'The seal failed in transit, so the pack can be resealed and the floor-life clock starts at receipt.',
      'The indicator is a shipping label, so its colour is recorded for reference but has no disposition effect.',
      'The components are already wet, so the lot must be scrapped without further evaluation.'
    ),
    correct: 'a',
    explanation: 'The card is evidence about the environment the pack has been exposed to, so an exceedance means the lot is quarantined and evaluated before use. The lesson does not conclude that the parts are wet and unusable, that the seal has failed, or that the reading is decorative. Resealing does not reset an exposure history that has already been recorded on the card.',
    source: 'src-003'
  },
  {
    questionId: 'q-m01l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'analyse',
    lessonId: 'm01l02',
    prompt: 'Receiving has a complete document package, but the work order does not carry the paste type or the floor-life start time. Why is that a control gap rather than a filing problem?',
    options: opts(
      'The process can then run with parameters that the released documents never approved for that lot.',
      'The documents are lost for audit purposes, but production parameters are unaffected by the gap.',
      'The work order becomes invalid, so the lot must be rejected and returned to the supplier at once.',
      'It only affects traceability after a field return, so it can be closed at the end of the batch.'
    ),
    correct: 'a',
    explanation: 'The lesson calls this the handoff: values that affect the process, such as paste type, shelf-life status, floor-life start and board revision, have to reach the work order or MES record. Without the handoff a lot can be released by quality and then run with the wrong parameters — a real process risk, not a filing issue and not a rejection.',
    source: 'src-019'
  },

  /* =====================================================================
   * m01l03 — Sampling a lot
   * =================================================================== */

  {
    questionId: 'q-m01l03-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l03',
    prompt: 'A delivery mixes two date codes and two supplier plants under one purchase order line. How should the lot be defined for sampling?',
    options: opts(
      'Split it into separate lots for each date code and plant, unless the plan states the difference is irrelevant.',
      'Treat it as one lot, because the purchase order line is the only basis a receiver is allowed to use.',
      'Treat it as one lot but double the sample size to compensate for the added internal variation.',
      'Treat it as one lot and raise a nonconformance, because mixed deliveries are never inspectable.'
    ),
    correct: 'a',
    explanation: 'A lot is the smallest quantity that can be treated as one population: same part number, revision, supplier, manufacturing lot or date code, packaging and process route. Mixing revisions, date codes or supplier plants breaks that assumption, so the material is split unless the quality plan says the difference does not affect the inspected characteristics. Doubling the sample does not repair a wrong population definition.',
    source: 'src-006'
  },
  {
    questionId: 'q-m01l03-04',
    type: 'single',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm01l03',
    prompt: 'Incoming inspection classifies critical, major and minor defects. Why does the lesson insist on separate criteria for these classes instead of one AQL?',
    options: opts(
      'Pooling the classes lets a large number of minor defects hide a critical one inside the same count.',
      'Separate criteria are required because each class is measured with a different instrument type.',
      'A single AQL cannot be applied to a sample larger than 125 units under normal inspection.',
      'Separate classes allow the receiver to stop inspecting once the minor defect count is reached.'
    ),
    correct: 'a',
    explanation: 'The lesson warns that one AQL can hide risk when critical, major and minor defects are counted together: a critical defect such as a wrong part number deserves a zero-acceptance criterion, while cosmetic marks on a non-critical area do not. The classes are not separated because of instrument type, sample size or a stopping rule.',
    source: 'src-006'
  },
  {
    questionId: 'q-m01l03-05',
    type: 'calc',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l03',
    prompt: 'An incoming lot contains 5,000 units. Using ISO 2859-1 general inspection level II, normal single sampling, at AQL 1.0 % defective, what plan applies?',
    options: opts(
      'Code letter L: n = 200, Ac = 5, Re = 6',
      'Code letter K: n = 125, Ac = 3, Re = 4',
      'Code letter L: n = 200, Ac = 3, Re = 4',
      'Code letter M: n = 315, Ac = 7, Re = 8'
    ),
    correct: 'a',
    explanation: 'A lot of 3,201 to 10,000 units at level II gives code letter L, and code letter L corresponds to a sample of 200 units. At AQL 1.0 % the accept number is 5 and the reject number is 6. The K row belongs to lots of 1,201 to 3,200 units, and mixing the L sample size with the K accept number is a common transcription error.',
    source: 'src-006'
  },

  /* exam bank */
  {
    questionId: 'q-m01l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l03',
    prompt: 'What is the practical meaning of an AQL of 1.0 % defective for the supplier relationship?',
    options: opts(
      'It is the quality level the plan is built to accept most of the time, not a defect allowance per lot.',
      'It is the maximum defect rate that any single accepted lot is permitted to contain.',
      'It is the defect rate above which the supplier is contractually liable for all rework cost.',
      'It is the sampling fraction, so one unit in every hundred received must be inspected.'
    ),
    correct: 'a',
    explanation: 'AQL is the average quality at which the plan accepts with high probability, and the lesson stresses that accepted lots are not defect-free. It is not a per-lot ceiling, not a liability trigger, and not a sampling fraction. Applying it as a per-lot allowance is exactly the misreading the lesson warns against.',
    source: 'src-006'
  },
  {
    questionId: 'q-m01l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'analyse',
    lessonId: 'm01l03',
    prompt: 'A lot passes its AQL plan, and the first boards after reflow show tombstoning at one feeder. Which conclusion fits the lesson?',
    options: opts(
      'The sample may have missed a localised condition that the plan did not measure at all.',
      'The sampling plan was invalid, so every accepted lot from this supplier must be rejected.',
      'The defect rate on the line proves the supplier falsified the certificate of conformance.',
      'Nothing can be concluded, because sampling results and line results measure different populations.'
    ),
    correct: 'a',
    explanation: 'A plan protects against accepting lots whose average quality is worse than the AQL; it cannot guarantee a clean lot, and it only measures the characteristics it names. Tombstoning points to a localised tape, reel or storage condition, or to a characteristic such as solderability that the plan did not inspect. The other options overreach from one accepted lot.',
    source: 'src-006'
  },
  {
    questionId: 'q-m01l03-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l03',
    prompt: 'A lot of 2,400 units is inspected at general inspection level II with an AQL of 1.0 %. The inspector inspects the sample and finds 2 defective units. What is the disposition under the plan?',
    options: opts(
      'n = 125 with Ac = 3: accept the lot, since 2 is below the acceptance number.',
      'n = 125 with Ac = 3: reject the lot, since any defective unit exceeds a 1.0 % AQL.',
      'n = 200 with Ac = 5: accept the lot, since 2 is well below the acceptance number.',
      'n = 80 with Ac = 2: reject the lot, because the defect count equals the acceptance number.'
    ),
    correct: 'a',
    explanation: 'A lot of 1,201 to 3,200 units at level II gives code letter K, so n = 125, and at AQL 1.0 % the accept number is 3. Two defectives are at or below Ac, so the lot is accepted. AQL is not a zero-defect rule, and the L and J rows belong to larger and smaller lot sizes.',
    source: 'src-006'
  },

  /* =====================================================================
   * m01l04 — Component verification, counterfeits
   * =================================================================== */

  {
    questionId: 'q-m01l04-03',
    type: 'single',
    competencies: ['K1', 'K9'],
    bloom: 'understand',
    lessonId: 'm01l04',
    prompt: 'Which observation is a counterfeit red flag that the lesson treats as rejecting the lot regardless of the other findings?',
    options: opts(
      'One reel carries two date codes under a single supplier label, with two different marking styles.',
      'The outer carton is dented at one corner while the inner moisture bags are sealed and intact.',
      'The packing list is printed in a language other than the one used on the purchase order.',
      'The certificate of conformance arrives as a scanned copy instead of an original signed sheet.'
    ),
    correct: 'a',
    explanation: 'Mixed date codes and mixed marking styles under one label are the pattern the lesson puts at the top of the red-flag list, together with altered labels and bulk repackaging; it is treated as a reject. A dented carton with intact inner packaging, a different document language and a scanned certificate are documentation or handling issues that are quarantined and resolved, not automatic rejections.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l04-04',
    type: 'calc',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l04',
    prompt: 'A purchase order limits date-code age at receipt to 12 months and the date-code format is YYMM. A reel is marked 2401 and is received in 2504. What is the age at receipt and the finding?',
    options: opts(
      '15 months: the reel exceeds the 12-month limit by 3 months.',
      '13 months: the reel exceeds the 12-month limit by 1 month.',
      '15 months: the reel is inside the 12-month limit with 3 months spare.',
      '27 months: the reel exceeds the 12-month limit by 15 months.'
    ),
    correct: 'a',
    explanation: '2401 to 2504 crosses 15 months on a YYMM code: 2401 to 2501 is 12 months, plus 3 more to 2504. That is 3 months beyond the 12-month purchase-order limit. Reading 2401 as a year only, or subtracting as if the code were DDMM, produces the 13 and 27 month answers; the code convention is verified with the supplier rather than assumed.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l04-05',
    type: 'single',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm01l04',
    prompt: 'At the placement machine a reel is found to contain parts with two date codes, and the inner label is partly covered by a second label. Production wants to sort the reel and keep running. What is the correct action?',
    options: opts(
      'Stop the machine, quarantine the reel and the remaining lot, photograph the labels and notify the supplier.',
      'Sort the reel into date-code groups, record the split in the log and continue with the larger group.',
      'Continue running and raise the finding at the end of the shift so the batch is not interrupted.',
      'Return the reel to stores and draw a replacement, leaving the finding to the next incoming audit.'
    ),
    correct: 'a',
    explanation: 'This is the lesson defect case: a mixed, relabelled reel is a counterfeit and traceability red flag, so the affected material is stopped and quarantined and the evidence is photographed before the supplier is notified. Sorting or finishing the batch destroys the evidence, and drawing a replacement leaves the rest of the suspect lot in circulation.',
    source: 'src-019'
  },

  /* exam bank */
  {
    questionId: 'q-m01l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l04',
    prompt: 'Which four things must the receiving engineer be able to prove about a component lot before release?',
    options: opts(
      'Correct item, traceable to a lot, handled within its stated conditions, and conforming evidence on file.',
      'Lowest purchase price, shortest lead time, authorised distributor, and a valid commercial invoice.',
      'Correct package outline, correct reel diameter, correct tape width, and correct moisture level.',
      'Supplier certification, supplier audit score, supplier on-time delivery, and supplier price trend.'
    ),
    correct: 'a',
    explanation: 'The lesson states the release test as four proofs: the item is the correct part or material, it is traceable to a manufacturer or supplier lot, it has been handled within its stated storage and moisture limits, and the evidence of conformity is on file. Price, lead time, packaging dimensions and supplier scorecard data are useful context but none of them is the release basis.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'analyse',
    lessonId: 'm01l04',
    prompt: 'A distributor offers a widely used logic IC at a price well below the market and with a lead time of two weeks against a usual sixteen. What does the lesson call this, and what follows?',
    options: opts(
      'Two red flags at once: the lot is treated as suspect and cannot be released on documents alone.',
      'A commercial opportunity: price and lead time are purchasing matters and carry no technical weight.',
      'A legitimate clearance sale: the incoming check only needs to confirm the part number marking.',
      'A traceability problem only: the lot can be used once the distributor supplies a declaration.'
    ),
    correct: 'a',
    explanation: 'Unusually low price and unusually short lead time are both on the lesson red-flag list, alongside missing manufacturer traceability and unauthorised distribution. The response is risk-based: the lot is treated as suspect and quarantined pending evidence. Price and lead time do carry technical weight in this context, and a declaration alone does not close a counterfeit suspicion.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l04',
    prompt: 'A lot is physically acceptable, but the manufacturer lot traceability sheet is missing. What is the disposition and why?',
    options: opts(
      'Quarantine: without traceability the lot cannot be proven to be the single manufacturer lot that was ordered.',
      'Accept: the physical inspection passed, so the missing sheet is an administrative follow-up item.',
      'Reject: any missing document is treated as a confirmed nonconformity of the material itself.',
      'Accept with concession: traceability matters only after a field failure, so it can be added later.'
    ),
    correct: 'a',
    explanation: 'Missing traceability is exactly the quarantine case in the lesson: the material may be usable, but the evidence is incomplete, so it is held pending supplier evidence or a concession decision. It is not an automatic reject, because the material has not been shown to be nonconforming, and it is not a follow-up item, because the release decision rests on the evidence.',
    source: 'src-019'
  },

  /* =====================================================================
   * m01l05 — Solder paste, flux and adhesive receipt
   * =================================================================== */

  {
    questionId: 'q-m01l05-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l05',
    prompt: 'A paste lot arrives with a certificate of analysis that states alloy, powder type, flux classification and metal content. What does that certificate still not prove?',
    options: opts(
      'That the lot survived transport and storage inside the supplier temperature limits.',
      'That the paste was manufactured to the formulation named in the purchase order.',
      'That the metal content of the lot was measured against the agreed specification.',
      'That the flux classification of the lot matches the classification that was ordered.'
    ),
    correct: 'a',
    explanation: 'The lesson is explicit: a certificate proves the paste was acceptable at the supplier, not that it is still suitable after transport, storage or handling. Storage and cold-chain integrity come from the temperature record, not the CoA. The other three items are precisely what a CoA does establish.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l05-04',
    type: 'single',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm01l05',
    prompt: 'A paste shipment arrives with a temperature logger showing 18 degrees C for four hours, against a supplier storage range of 2 to 10 degrees C. What is the correct disposition?',
    options: opts(
      'Quarantine the lot and obtain the supplier limit for excursion time and temperature before release.',
      'Reject the lot outright, because any excursion above the storage range makes paste unusable.',
      'Accept the lot, because paste is mixed at room temperature before use in any case.',
      'Accept the lot but shorten the expiry date by the four hours that were spent above the range.'
    ),
    correct: 'a',
    explanation: 'An excursion beyond the supplier shipping or storage limit is a quarantine trigger in the lesson, not an automatic reject: the material may still be usable, but the decision needs the supplier limit and possibly a retest. Room-temperature warming before use is a controlled, documented step with its own time limit, and it does not license an uncontrolled excursion.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l05-05',
    type: 'calc',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l05',
    prompt: 'A paste lot was manufactured on 2025-01-01 with a six-month shelf life and was received on 2025-04-01. How much usable shelf life is left at receipt if the shelf life is counted as 181 days?',
    options: opts(
      'About 91 days, because 90 days were consumed between manufacture and receipt.',
      'About 90 days, because the receipt date is counted as the start of the shelf life.',
      'About 181 days, because shelf life starts when the cold chain is opened at the plant.',
      'About 45 days, because paste shelf life is halved once it leaves the supplier.'
    ),
    correct: 'a',
    explanation: 'January and February and March make 31 + 28 + 31 = 90 days from 2025-01-01 to 2025-04-01, so 181 - 90 = 91 days remain. Shelf life runs from manufacture, not from receipt and not from opening: that is the whole point of recording the manufacture and expiry dates against the lot code.',
    source: 'src-019'
  },

  /* exam bank */
  {
    questionId: 'q-m01l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l05',
    prompt: 'Why does a solder paste lot need a time-and-temperature record rather than only an expiry date?',
    options: opts(
      'Paste deteriorates with every hour spent outside its storage range, so the date alone cannot show condition.',
      'The expiry date is a commercial warranty date, and production is free to extend it by any margin.',
      'Temperature records are required by the safety data sheet, so they are kept for hazard communication.',
      'The record is only needed for lots that are returned to the supplier after a print problem.'
    ),
    correct: 'a',
    explanation: 'The lesson asks for a time and temperature record, not just a date, because printability depends on the exposure history: storage temperature, excursions and hours outside storage all change how the paste behaves. The expiry date is a supplier shelf-life statement, not a commercial warranty that production can extend, and the record is not a hazard-communication or returns-only document.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'analyse',
    lessonId: 'm01l05',
    prompt: 'Within a week of opening a new paste lot, printing shows paste balls, uneven deposit volume and poor release. Which incoming evidence is the first thing to review?',
    options: opts(
      'The lot certificate and storage history, to establish whether the paste was kept inside its range.',
      'The printer squeegee pressure and separation speed, because paste condition cannot cause these signs.',
      'The stencil wall finish, because a new lot cannot change release behaviour on an unchanged foil.',
      'The reflow profile, because paste balls form above the liquidus and are unrelated to printing.'
    ),
    correct: 'a',
    explanation: 'This is the lesson defect case: the symptoms appeared with a new paste lot, so the first question is what the incoming evidence says about that lot — chemistry, powder, expiry and cold chain. Paste condition does affect release, and a different lot can change print behaviour on identical hardware, so ruling the paste out first and changing machine settings instead is the wrong order.',
    source: 'src-019'
  },
  {
    questionId: 'q-m01l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l05',
    prompt: 'Paste is returned to storage three times with the open time logged each time. Why does the label have to record the number of opens?',
    options: opts(
      'Repeated warming and opening change printability, and the count is part of the handling evidence.',
      'The count is a stock-control field, used only to reconcile the quantity left in the container.',
      'The count determines the price of the lot, because suppliers invoice by the number of opens.',
      'The count has no technical meaning, but customers ask for it during quality system audits.'
    ),
    correct: 'a',
    explanation: 'The lesson ties the number of opens and the time outside storage to printability and to the decision to mix or discard. It is a technical record of handling exposure, not a stock-control reconciliation, a pricing field or an audit formality.',
    source: 'src-019'
  },

  /* =====================================================================
   * m01l06 — Bare PCB receipt
   * =================================================================== */

  {
    questionId: 'q-m01l06-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l06',
    prompt: 'How does shelf life differ from floor life for a moisture-sensitive item?',
    options: opts(
      'Shelf life runs in the sealed pack under stated conditions; floor life runs once exposed to factory ambient.',
      'Shelf life applies to components; floor life applies only to bare boards and to solder paste lots.',
      'Shelf life is set by the customer; floor life is set by the plant from its own process capability.',
      'Shelf life and floor life are two names for the same interval, counted from different start dates.'
    ),
    correct: 'a',
    explanation: 'Shelf life is the time a material may stay in its original sealed packaging under specified storage conditions before requalification. Floor life is the time a moisture-sensitive item may stay exposed to factory ambient before it must be reconditioned or soldered. They are different intervals with different conditions, not synonyms and not a division between components and boards.',
    source: 'src-003'
  },
  {
    questionId: 'q-m01l06-04',
    type: 'single',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm01l06',
    prompt: 'A bare-board lot shows 18 of 250 inspected boards with twist above the drawing limit, one moisture barrier bag with a failed humidity indicator, and no certificate of conformance. What is the correct disposition?',
    options: opts(
      'The lot cannot be released: flatness, packaging and documentation all fail, and the boards are affected.',
      'The lot is released on the 232 conforming boards, with the 18 affected boards segregated and scrapped.',
      'The lot is released because the missing certificate is administrative and the twist is within Class 2.',
      'The lot is scrapped without review, because any failed humidity indicator condemns the whole delivery.'
    ),
    correct: 'a',
    explanation: 'Three separate requirements fail at once: planarity against the drawing limit, packaging integrity through the indicator card, and documentation through the absent certificate. That is a nonconformance requiring a documented disposition, not a partial release on the conforming boards, not an administrative waiver, and not an automatic scrap before the material review board has seen it.',
    source: 'src-018'
  },
  {
    questionId: 'q-m01l06-05',
    type: 'calc',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l06',
    prompt: 'A board measures a bow of 1.2 mm across a 200 mm span. Using the IPC-6012 bow limit of 0.75 % of the longer dimension for an SMT board, what is the measured bow and the disposition?',
    options: opts(
      '0.60 %: within the 0.75 % limit, so the board is acceptable on this characteristic.',
      '0.60 %: above the 0.75 % limit, so the board is rejected on this characteristic.',
      '1.20 %: above the 0.75 % limit, so the board is rejected on this characteristic.',
      '0.06 %: within the 0.75 % limit, so the board is acceptable on this characteristic.'
    ),
    correct: 'a',
    explanation: 'Bow percentage = 1.2 / 200 x 100 = 0.60 %. That is below the 0.75 % SMT limit, so the board passes on flatness. The 1.20 % answer comes from dividing by 100 mm, the 0.06 % answer from dividing millimetres by millimetres and forgetting the percentage, and the second option applies the right number to the wrong conclusion.',
    source: 'src-018'
  },

  /* exam bank */
  {
    questionId: 'q-m01l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm01l06',
    prompt: 'Why is a bare-board surface finish recorded with its type and thickness at receipt rather than only as "finished"?',
    options: opts(
      'Finish type and thickness determine solderability, storage life and compatibility with the paste.',
      'The finish thickness is needed to calculate the copper current-carrying capacity of the board.',
      'The finish type is a marketing descriptor, and assembly behaviour depends only on the laminate.',
      'Recording it is a purchasing requirement, and it has no effect on how the board is assembled.'
    ),
    correct: 'a',
    explanation: 'The lesson requires the finish to be identified unambiguously, with thickness or coating class where applicable, because it drives solderability, shelf life and paste compatibility. Copper current capacity comes from conductor thickness, not finish thickness, and finish choice does affect assembly.',
    source: 'src-018'
  },
  {
    questionId: 'q-m01l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'analyse',
    lessonId: 'm01l06',
    prompt: 'A supplier writes "boards are bent" in its nonconformance reply. How does the lesson want the record rewritten?',
    options: opts(
      'With lot, sample size, measured result, the drawing limit it violates and the action requested.',
      'With a photograph attached, since an image of the deviation is stronger evidence than numbers.',
      'With the name of the inspector and the date, so responsibility for the finding is documented.',
      'With the purchase order value, so the commercial impact of the deviation is quantified first.'
    ),
    correct: 'a',
    explanation: 'The lesson contrast is concrete: instead of "boards are bent", the record states lot 4471, 12 of 250 boards measured, twist above the IPC-6012 Class 3 drawing limit, and the requested action. A photograph supports that record but does not replace the measurement, and inspector details or order value do not make the deviation reproducible for the supplier.',
    source: 'src-018'
  },
  {
    questionId: 'q-m01l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm01l06',
    prompt: 'A board meets the drawing flatness limit but is being assembled with a fine-pitch press-fit connector. What does the lesson require?',
    options: opts(
      'Check the assembly process need, which may demand tighter limits than the generic board limit.',
      'Accept the board without further check, because meeting the drawing limit closes the question.',
      'Reject the board, because a press-fit connector always needs a flatter board than the drawing.',
      'Re-measure against the component datasheet instead of against the board drawing or standard.'
    ),
    correct: 'a',
    explanation: 'The lesson notes that fine-pitch components, press-fit connectors and large area arrays may require tighter limits than the generic board limits, and that the required flatness must be verified against the placement machine datasheet, stencil release and reflow support method. So the drawing limit is necessary but may not be sufficient — and none of the other options follows: the board is not automatically rejected, and the drawing is not discarded.',
    source: 'src-018'
  },

  /* =====================================================================
   * m01l07 — Nonconforming material at the dock
   * =================================================================== */

  {
    questionId: 'q-m01l07-03',
    type: 'single',
    competencies: ['K9', 'K1'],
    bloom: 'understand',
    lessonId: 'm01l07',
    prompt: 'Which list correctly names the dispositions available to a material review board?',
    options: opts(
      'Accept, rework, sort, use as is with a concession, return, and scrap.',
      'Quarantine, hold, escalate, re-inspect, and release after a supplier visit.',
      'Accept, quarantine, reject, and scrap, with no intermediate categories.',
      'Rework, resample, re-bake, resize, and re-certify the affected lot.'
    ),
    correct: 'a',
    explanation: 'The lesson lists the MRB dispositions as accept, rework, sort, use as is with a concession, return and scrap, and requires each one to name who approved it and what verification precedes release. Quarantine is the controlled hold before the review, not one of its outcomes, and re-baking or re-sampling are actions taken to establish facts rather than dispositions of the material.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l07-04',
    type: 'single',
    competencies: ['K9'],
    bloom: 'apply',
    lessonId: 'm01l07',
    prompt: 'A supplier notification has to support a corrective action. Which version does that?',
    options: opts(
      'Part, lot, purchase order, sample basis, measured result against the requirement, and evidence attached.',
      'A description of the quality problem and a request for the supplier to investigate and respond soon.',
      'A statement that the material does not meet requirements, plus the return authorisation number.',
      'The complaint history of the supplier and the number of similar findings in the last year.'
    ),
    correct: 'a',
    explanation: 'The lesson requires objectivity and specificity so the supplier can trace the batch, reproduce the finding and prevent recurrence. A general description, a bare nonconformity statement, or a complaint history does not let the supplier reproduce the measurement, which is what closes the loop.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l07-05',
    type: 'calc',
    competencies: ['K9', 'K1'],
    bloom: 'apply',
    lessonId: 'm01l07',
    prompt: 'A lot of 1,000 chip resistors arrives on 20 reels. The plan samples 4 reels and 100 units. Five units fall outside the resistance tolerance and the internal limit for electrical nonconformance is 2 %. What is the observed rate and its classification?',
    options: opts(
      '5.0 %: above the 2 % internal limit, so the electrical finding is a reject unless the MRB agrees otherwise.',
      '5.0 %: below the 2 % internal limit, so the electrical finding is a quarantine pending review only.',
      '0.5 %: below the 2 % internal limit, so the electrical finding is acceptable and the lot can be released.',
      '20.0 %: above the 2 % internal limit, so the whole lot is rejected without material review.'
    ),
    correct: 'a',
    explanation: 'The defect rate is 5 units / 100 inspected = 5 %, which is above the 2 % internal limit, so the electrical finding classifies as reject unless the MRB accepts documented risk. The 0.5 % answer divides by the lot size instead of the sample, and the 20.0 % answer divides by the 5 defective units. The lot still goes through MRB, which is what the other distractors get wrong.',
    source: 'src-037'
  },

  /* exam bank */
  {
    questionId: 'q-m01l07-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K9'],
    bloom: 'understand',
    lessonId: 'm01l07',
    prompt: 'What makes quarantine different from simply putting material aside?',
    options: opts(
      'The hold is labelled, traceable to the receiving transaction and released only by a decision.',
      'The material is physically moved to a separate room, which is what defines a quarantine.',
      'The material is booked out of stock, so production cannot see it in the materials system.',
      'The supplier is notified, and the notice itself places the lot under quarantine status.'
    ),
    correct: 'a',
    explanation: 'Quarantine is a controlled hold: physically segregated or system-held, labelled with part, lot, quantity, date and reason, traceable to the receiving transaction, and released only through a recorded decision. A separate room without traceability, a stock booking, or a supplier notice is not a controlled hold.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l07-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'analyse',
    lessonId: 'm01l07',
    prompt: 'A lot of moisture-sensitive components arrives with crushed vacuum bags and no humidity indicator cards, while the parts look intact. What is the correct immediate step?',
    options: opts(
      'Hold the lot and verify packaging integrity, moisture status and traceability before any release.',
      'Release the lot to stores, since an intact part is the only thing the assembly process can see.',
      'Return the lot at once, because damaged packaging is never an acceptable delivery condition.',
      'Move the lot to the MRB as scrap, because moisture status cannot be reconstructed after the fact.'
    ),
    correct: 'a',
    explanation: 'The packaging carries the evidence about moisture exposure, so crushed bags without indicator cards leave the material status unclear — the textbook quarantine case. Releasing on appearance ignores the missing evidence, scrapping before review wastes usable material, and returning is a disposition decision that needs the MRB, not an automatic first step.',
    source: 'src-037'
  },
  {
    questionId: 'q-m01l07-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K9'],
    bloom: 'apply',
    lessonId: 'm01l07',
    prompt: 'The MRB releases part of a held lot to the line with special handling notes. What must happen for the release to be controlled?',
    options: opts(
      'The line receives the approved status with the handling notes, and the record names who approved it.',
      'The line is told verbally at the shift handover, because the hold is already closed in the system.',
      'The release is recorded in the inspection log only, since the line works from the work order.',
      'The supplier is informed of the release, because the supplier owns the nonconformance record.'
    ),
    correct: 'a',
    explanation: 'The lesson closes on the handoff: if material is released, the line must receive the approved status and any special handling notes, and the disposition must state who approved it and what verification is required. A verbal handover, a log entry nobody on the line reads, or a supplier notification does not carry the conditions of release to the people who will run the material.',
    source: 'src-037'
  }

];

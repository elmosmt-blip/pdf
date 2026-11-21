/* =========================================================================
 * phase1-m02.js — question bank content for module m02
 * (Storage, MSL and ESD Control), plus its exam bank.
 *
 * Numbers are taken from the lessons themselves (MSL floor lives, the 40 °C
 * tape-and-reel bake limit, the 9-day bake time for a body up to 1.4 mm at
 * 40 °C, the risk-score formula of m02l05). The dry-cabinet relative-humidity
 * threshold is deliberately NOT asked: m02l04 states 10 % RH or less and
 * m02l06 states 5 % RH or less for the same question, and a quiz must not
 * force a learner to pick one of two numbers the course itself states
 * differently. That conflict is reported to the author instead.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* =====================================================================
   * m02l01 — Moisture inside a package
   * =================================================================== */

  {
    questionId: 'q-m02l01-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l01',
    prompt: 'Why can a plastic package that passed final test at the supplier still be damaged by the customer reflow oven?',
    options: opts(
      'Absorbed moisture vaporises during reflow, and the expanding vapour can separate internal interfaces.',
      'The reflow oven runs hotter than the supplier used, so the mould compound softens and loses its shape.',
      'The package was not tested at all by the supplier, so its moisture state at receipt is unknown.',
      'Reflow melts the solder inside the package, and the expansion of that solder cracks the body.'
    ),
    correct: 'a',
    explanation: 'The damage mechanism is the popcorn effect: hygroscopic mould compound, die attach and substrate take up water vapour during ambient exposure, and the vapour expands rapidly when the package heats in reflow, separating internal interfaces. The failure can be invisible from outside. It is not caused by the oven being hotter than the supplier used, by a missing test, or by internal solder melting.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l01-04',
    type: 'single',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm02l01',
    prompt: 'Which change would most increase the amount of moisture an unopened package absorbs before it reaches the line?',
    options: opts(
      'Storing it in the open at high relative humidity instead of in a sealed bag with desiccant.',
      'Running the reflow profile with a slower ramp so the package spends more time in the oven.',
      'Handling it with a wrist strap that is not tested daily, so the charge path is uncontrolled.',
      'Using a stencil with a lower area ratio, which reduces the paste volume under the package.'
    ),
    correct: 'a',
    explanation: 'Uptake depends on storage temperature, relative humidity, exposure time and the material system, so an open, humid store is the dominant factor. Profile ramp affects the damage a given moisture content does, not how much moisture is absorbed; a wrist strap concerns electrostatic discharge; stencil geometry concerns paste volume. None of the last three changes the absorbed water.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l01-05',
    type: 'calc',
    competencies: ['K1', 'K8'],
    bloom: 'apply',
    lessonId: 'm02l01',
    prompt: 'An MSL 3 device with a 168 h floor life is reflowed 70 h after the bag was opened, which is inside its floor life. Forty hours later a second reflow is planned. What floor life remains before that second reflow?',
    options: opts(
      '128 h remain, because the qualifying first reflow reset the clock and 40 h have been used since.',
      '98 h remain, because the two exposure periods are added and subtracted from 168 h in one go.',
      '168 h remain, because a device that has already survived one reflow cannot absorb more moisture.',
      '138 h remain, because only the time after the first reflow is counted and 30 h are allowed for.'
    ),
    correct: 'a',
    explanation: 'A qualifying reflow completed within the remaining floor life resets the clock, so the 70 h before it is not carried forward. From the reset, 40 h have been used, leaving 168 - 40 = 128 h. Adding both exposure periods ignores the reset; assuming the device cannot reabsorb moisture after a reflow contradicts the lesson, which says it can; and 138 h does not follow from any figure in the case.',
    source: 'src-003'
  },

  /* exam */
  {
    questionId: 'q-m02l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l01',
    prompt: 'What does the moisture sensitivity level of a package actually express?',
    options: opts(
      'How much ambient exposure the package tolerates before reflow is likely to damage it.',
      'How long the package may sit on a shelf before its solderability degrades past acceptance.',
      'How sensitive the die is to electrostatic discharge during handling and machine placement.',
      'How much moisture the part can absorb before its electrical parameters drift out of tolerance.'
    ),
    correct: 'a',
    explanation: 'MSL is a reflow-risk classification: it is the ambient exposure budget before a reflow cycle is likely to cause package damage. The lesson separates it explicitly from shelf life, from ESD classification and from solderability life, and the failure mode it governs is mechanical (interface separation), not electrical drift.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K8'],
    bloom: 'analyse',
    lessonId: 'm02l01',
    prompt: 'A returned board shows a hairline crack along the package edge and a lifted lead, with no evidence of mechanical handling damage. What is the most probable cause?',
    options: opts(
      'Moisture-driven interface separation during reflow, which can leave no mark on the outer body.',
      'Electrostatic discharge through the lead frame, which typically shows as a cracked body edge.',
      'Excess solder paste under the lead, which lifts the lead as the deposit expands in reflow.',
      'A placement force above the component limit, which deforms the lead frame before reflow.'
    ),
    correct: 'a',
    explanation: 'The lesson gives package cracking and lifted leads as visible signs of the popcorn effect, and stresses that the damage is often internal and invisible. ESD damage is electrical, not a cracked body edge; paste volume does not lift leads this way; and a placement-force signature would show as a deformed lead at the tip, with handling damage evidence.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm02l01',
    prompt: 'An inspector cannot read the MSL marking on a reel and the bag label is missing. What is the correct working assumption?',
    options: opts(
      'Treat the device as the most restrictive applicable level until the rating is verified.',
      'Treat the device as MSL 1, since an unmarked part is normally the least sensitive type.',
      'Use the level of the previous lot of the same part number, which is close enough in practice.',
      'Proceed without a level, because the floor-life clock cannot be started without one.'
    ),
    correct: 'a',
    explanation: 'The lesson is explicit: if the marking is missing or unclear, use the datasheet or treat the device as the most restrictive applicable MSL until it is verified. Assuming the least sensitive class, borrowing a neighbouring lot value, or running blind all convert an unknown risk into an uncontrolled one.',
    source: 'src-003'
  },

  /* =====================================================================
   * m02l02 — Reading MSL reality
   * =================================================================== */

  {
    questionId: 'q-m02l02-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l02',
    prompt: 'Which floor life does the lesson give for an MSL 4 plastic package at the J-STD-033 reference conditions?',
    options: opts(
      '72 hours of ambient exposure',
      '168 hours of ambient exposure',
      '48 hours of ambient exposure',
      '24 hours of ambient exposure'
    ),
    correct: 'a',
    explanation: 'The lesson table gives MSL 3 = 168 h, MSL 4 = 72 h, MSL 5 = 48 h and MSL 5a = 24 h at 30 °C and 60 % RH. Confusing the 168 h of MSL 3 with MSL 4 is the most common slip, because MSL 3 is the level most often quoted in training material.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l02-04',
    type: 'single',
    competencies: ['K1', 'K8'],
    bloom: 'apply',
    lessonId: 'm02l02',
    prompt: 'The bag label states a 168 h floor life; the datasheet for the same part states 72 h. The bag was opened 60 h ago. What do you do?',
    options: opts(
      'Use the 72 h value, so only 12 h remain, and quarantine the batch until the conflict is resolved.',
      'Use the 168 h value, because the bag label is applied to this specific lot by the supplier.',
      'Average the two values to 120 h, leaving 60 h, and record the arbitration in the batch log.',
      'Use the 168 h value but add a safety factor of one hour, giving 59 h of remaining floor life.'
    ),
    correct: 'a',
    explanation: 'The lesson rule is to use the most restrictive valid source when sources disagree, and to quarantine until the discrepancy is resolved — so 72 h governs and 72 - 60 = 12 h remain. Preferring the label, averaging, or padding the larger value all take the decision on the side of more exposure, which is the direction the rule exists to prevent.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l02-05',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l02',
    prompt: 'When exactly does the floor-life clock start for a dry-packed device?',
    options: opts(
      'When the moisture barrier bag is opened and the device is exposed to ambient air.',
      'When the lot is received and the receiving inspection record is signed at the dock.',
      'When the reel is mounted on the placement machine and the feeder is closed.',
      'When the device enters the reflow oven for the first time in the build.'
    ),
    correct: 'a',
    explanation: 'The clock starts at bag opening, not at receipt, at feeder load or at reflow. Receipt can precede the opening by weeks or months, and a device can sit exposed on a feeder for a shift without ever seeing an oven — which is why the lesson treats feeder and line time as ambient exposure.',
    source: 'src-003'
  },

  /* exam */
  {
    questionId: 'q-m02l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l02',
    prompt: 'What does a humidity indicator card inside a moisture barrier bag tell you?',
    options: opts(
      'Whether the bag interior has exceeded the humidity range the desiccant was sized for.',
      'How many hours of floor life the devices inside have already consumed in total.',
      'Whether the desiccant has been replaced since the bag was packed by the supplier.',
      'The exact moisture content of the mould compound, measured in parts per million.'
    ),
    correct: 'a',
    explanation: 'The card is a threshold indicator for the bag interior: a spot above its limit means the environment the parts were stored in was worse than intended, so the devices are quarantined and evaluated. It is not a timer, it does not record desiccant history, and it does not measure package moisture content.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K8'],
    bloom: 'analyse',
    lessonId: 'm02l02',
    prompt: 'A bag has been open for 30 h against a 72 h floor life, but the reel has sat on an open feeder for the last 20 h of that time. How should the exposure be counted?',
    options: opts(
      'All 30 h count, because feeder time is ambient exposure unless controlled storage is documented.',
      'Only the 10 h not spent on the feeder count, because a feeder keeps the reel off the floor.',
      'Only the time in the open air of the production room counts, so 20 h is the working figure.',
      'Neither period counts once the device is on a machine, because the clock stops at feeder load.'
    ),
    correct: 'a',
    explanation: 'The lesson says time on the line, in a dry cabinet or on a feeder counts as ambient exposure unless the controlled-storage procedure explicitly allows otherwise. So the full 30 h is consumed and 42 h remain. A feeder is not a dry environment, and there is no rule that stops the clock at machine load.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm02l02',
    prompt: 'A device was reflowed once while 20 h of floor life remained, and it has since been exposed for 30 h. What is the position before its second reflow?',
    options: opts(
      'The first reflow was acceptable, but the device has reabsorbed moisture and cannot be reflowed as it stands.',
      'The first reflow used up the remaining floor life, so the device is scrap with no further options.',
      'Because one reflow succeeded, the device is proven robust and may be reflowed without further control.',
      'The exposure after reflow is irrelevant, because each reflow cycle starts from the original rating.'
    ),
    correct: 'a',
    explanation: 'A reflow completed inside the remaining floor life is acceptable from a moisture standpoint, but the lesson warns that the device can reabsorb moisture afterwards, so the exposure since that reflow has to be checked before the next one. One successful reflow proves nothing about robustness, and the allowance does not restart itself per cycle.',
    source: 'src-003'
  },

  /* =====================================================================
   * m02l03 — Floor-life accounting
   * =================================================================== */

  {
    questionId: 'q-m02l03-03',
    type: 'single',
    competencies: ['K1', 'K8'],
    bloom: 'understand',
    lessonId: 'm02l03',
    prompt: 'Which list correctly names time that accumulates against a device\'s floor life?',
    options: opts(
      'Storage outside the bag, assembly handling, feeder time, inspection and reflow handling.',
      'Shelf time in the sealed bag, plus any period in which the device was in a dry cabinet.',
      'Only the time the device spends on the placement machine and inside the reflow oven.',
      'Only the time recorded on the bag-open label, since other periods are not traceable.'
    ),
    correct: 'a',
    explanation: 'Floor life accumulates whenever the device is outside a compliant moisture barrier bag: storage outside it, handling, feeder and machine time, the oven and conveyor, inspection and waiting between operations. Sealed-bag shelf time and qualified dry-cabinet time are what the lesson treats as protected. Counting only machine time, or only the label entry, understates the budget.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l03-04',
    type: 'single',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm02l03',
    prompt: 'What does it take to reset a device\'s floor life?',
    options: opts(
      'A qualifying bake per the applicable bake table, followed by correct repacking with desiccant.',
      'Putting the reel back into a moisture barrier bag and sealing it at the end of the shift.',
      'Recording the bag-open time again once the reel has been returned to the storage cabinet.',
      'Running the device through a reflow oven again, since reflow drives the moisture out.'
    ),
    correct: 'a',
    explanation: 'The lesson is explicit that a reset is not automatic when a device is put back into a bag: it requires a bake qualified for the package and MSL, followed by correct repacking with desiccant and a humidity indicator card, and recorded with start and end times. Rebagging, re-dating or a further reflow does not restore the budget and a reflow is what the budget protects against.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l03-05',
    type: 'calc',
    competencies: ['K1', 'K8'],
    bloom: 'apply',
    lessonId: 'm02l03',
    prompt: 'An MSL 3 reel was bagged out 100 h ago, and the MES shows 6 h of open-air reflow handling. Storage stayed within the J-STD-033 reference condition. What cumulative exposure and remaining floor life apply?',
    options: opts(
      '106 h consumed, 62 h remain of the 168 h floor life.',
      '100 h consumed, 68 h remain of the 168 h floor life.',
      '94 h consumed, 74 h remain of the 168 h floor life.',
      '106 h consumed, 62 h remain of the 72 h floor life.'
    ),
    correct: 'a',
    explanation: 'Cumulative exposure = 100 h bagged-out time + 6 h reflow handling = 106 h, and 168 - 106 = 62 h remain. Using only the bag time forgets the handling; subtracting the handling instead of adding it moves the number the wrong way; and 72 h is the MSL 4 floor life, not the MSL 3 value that governs this reel.',
    source: 'src-003'
  },

  /* exam */
  {
    questionId: 'q-m02l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l03',
    prompt: 'How is floor life different from shelf life?',
    options: opts(
      'Floor life is an exposure budget outside the bag; shelf life is time in the sealed packaging.',
      'Floor life is measured in reflow cycles; shelf life is measured in calendar months.',
      'Floor life applies to bare boards; shelf life applies to moisture-sensitive components.',
      'Floor life is set by the customer contract; shelf life is set by the IPC handling standard.'
    ),
    correct: 'a',
    explanation: 'The lesson states the distinction directly: floor life is the cumulative time a device may stay outside its barrier bag under factory conditions, while shelf life is time in the original sealed packaging under specified storage. Neither is counted in reflow cycles, both apply to moisture-sensitive devices rather than boards alone, and the source of each is the supplier datasheet and J-STD-033, not a contract split.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K8'],
    bloom: 'analyse',
    lessonId: 'm02l03',
    prompt: 'No bag-open time was recorded for a batch, but the reel labels show it has been in stores for two months. What is the sound engineering position?',
    options: opts(
      'Bound the exposure from the available evidence, quarantine the batch and decide on bake or scrap.',
      'Assume the bag stayed sealed until now, so the full floor life is available from today.',
      'Start the clock today and log the reel, because an unrecorded period cannot be counted.',
      'Use the reel as normal and add the missing hours to the next lot of the same device.'
    ),
    correct: 'a',
    explanation: 'The lesson says that when records are incomplete the exposure must be bounded and the material quarantined, then bake, supplier evaluation or scrap decided. Assuming the bag stayed sealed back-dates nothing and converts an unknown into a comfortable answer, starting the clock today does the same, and carrying the hours to another lot moves a risk onto different material.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm02l03',
    prompt: 'Which record set makes floor-life accounting auditable for one reel?',
    options: opts(
      'Part and lot, MSL, bag-open time, cumulative open-air time, storage RH, bake and reflow history.',
      'Part number, receiving date, invoice number, supplier name and the inspector signature.',
      'Reel serial number, feeder position, machine program revision and the operator badge id.',
      'MSL, package type, test date of the wrist strap and the calibration date of the oven.'
    ),
    correct: 'a',
    explanation: 'The lesson lists the minimum useful records as part and lot or date code, MSL, bag-open time, current cumulative open-air time, storage temperature and humidity, desiccant and indicator status, bake records, and reflow or other handling history. The other three lists mix commercial, placement or calibration data that does not let anyone recompute the remaining budget.',
    source: 'src-003'
  },

  /* =====================================================================
   * m02l04 — Baking and dry cabinets
   * =================================================================== */

  {
    questionId: 'q-m02l04-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l04',
    prompt: 'Which combination of inputs does a bake decision actually require?',
    options: opts(
      'MSL, package type, bag status, indicator and desiccant state, and the planned time to reflow.',
      'Part number, purchase price, supplier rating and the remaining shelf life of the paste.',
      'Board thickness, copper weight, oven zone count and the conveyor speed of the line.',
      'Reel quantity, feeder count, shift pattern and the capacity of the dry cabinet.'
    ),
    correct: 'a',
    explanation: 'The lesson opens by rejecting part name alone and lists the real inputs: moisture sensitivity level, package type, whether the barrier bag was opened, dry-pack integrity, humidity indicator and desiccant condition, and the planned time to reflow. Board, oven and feeder logistics matter to the plan but none of them enters the moisture decision.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l04-04',
    type: 'calc',
    competencies: ['K1', 'K8'],
    bloom: 'analyse',
    lessonId: 'm02l04',
    prompt: 'An MSL 4 tape-and-reel batch was opened 50 h ago, the dry cabinet does not qualify for clock suspension, and reflow starts in 30 h. At 40 °C the applicable bake for a body up to 1.4 mm takes about 9 days. What is the position?',
    options: opts(
      'Only 22 h of floor life remain against a 30 h wait, and the 9-day bake does not fit the window.',
      'The 72 h floor life covers the whole 80 h of remaining schedule, so no bake is needed at all.',
      'The batch must be baked at 40 °C for 9 days, so the reflow window simply moves by that amount.',
      'The floor life resets once the reel enters the cabinet, so the remaining 30 h can be planned.'
    ),
    correct: 'a',
    explanation: 'Remaining floor life is 72 - 50 = 22 h against a 30 h wait, so the batch cannot simply proceed; and the low-temperature tape-and-reel bake takes about 9 days, which does not fit a 30 h window. The lesson offers the real options instead: move the reflow inside the remaining floor life, suspend the clock in qualified dry storage, or de-reel to a carrier that tolerates a higher bake temperature.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l04-05',
    type: 'single',
    competencies: ['K1', 'K8'],
    bloom: 'apply',
    lessonId: 'm02l04',
    prompt: 'In which case does the lesson say to quarantine rather than to bake?',
    options: opts(
      'The MSL is unknown, the package is damaged, or no bake recipe is qualified for that package.',
      'The humidity indicator card is above its threshold and the desiccant appears to be exhausted.',
      'The batch has exceeded its floor life and the reflow is planned inside the next shift.',
      'The dry cabinet was found out of range for several hours during the weekend break.'
    ),
    correct: 'a',
    explanation: 'Bake is the remedy when exposure or packaging failed but the material and the recipe are sound. Quarantine applies when the MSL is unknown, the package is damaged, the recipe is not qualified for the package, or the device has already been reflowed and the decision needs review. An exceeded indicator, an expired floor life and an out-of-range cabinet are bake triggers, not quarantine triggers.',
    source: 'src-003'
  },

  /* exam */
  {
    questionId: 'q-m02l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l04',
    prompt: 'Why can qualified dry storage extend the time a moisture-sensitive device may wait before reflow?',
    options: opts(
      'At a low enough relative humidity the device stops gaining moisture, so exposure is suspended.',
      'The cabinet removes moisture from the device, so any earlier exposure is baked out of the package.',
      'Dry storage protects the device from electrostatic discharge, which is the main reflow risk.',
      'The cabinet keeps the reel cold, and cold storage always stops the floor-life clock.'
    ),
    correct: 'a',
    explanation: 'The lesson describes dry storage as suspending or extending exposure for eligible devices, at a low relative humidity and with the cabinet calibrated, alarmed and logged; time in an out-of-range cabinet counts as floor life. A cabinet does not bake moisture out, it is not an ESD control, and cold alone is not the criterion.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K8'],
    bloom: 'analyse',
    lessonId: 'm02l04',
    prompt: 'A tape-and-reel batch needs a bake, but the tape is only rated to 40 °C and the schedule needs the parts within a day. Which route does the lesson point to?',
    options: opts(
      'De-reel into a carrier that tolerates a higher bake temperature, or move the reflow inside floor life.',
      'Bake the reel at 125 °C for the shortest time in the table, accepting the tape deformation risk.',
      'Skip the bake and add 10 °C to the reflow peak to drive the moisture out during soldering.',
      'Skip the bake and run the batch at normal settings, then inspect the packages after reflow.'
    ),
    correct: 'a',
    explanation: 'The lesson treats the 40 °C limit on tape-and-reel as a real constraint and offers de-reeling to a higher-temperature carrier, clock suspension in qualified dry storage, or moving the reflow inside the remaining floor life. Exceeding the carrier temperature rating damages the tape and is not offered as a trade; raising the peak adds thermal stress instead of removing moisture; and reflowing an unbaked batch then inspecting turns a known risk into a detection gamble.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm02l04',
    prompt: 'A batch is released without a bake. Which record makes that release defensible later?',
    options: opts(
      'The remaining floor life at release and the planned reflow window, with the MSL and lot.',
      'A note that the batch looked dry and the reel labels were intact at the time of release.',
      'The supervisor approval only, since the technical values are already in the datasheet.',
      'The bake table reference itself, because it states when a bake would have been needed.'
    ),
    correct: 'a',
    explanation: 'The lesson requires that when a batch is released without bake, the remaining floor life and the planned reflow window are recorded. Appearance and intact labels are impressions, not values; an approval without the numbers cannot be audited; and citing the table shows the rule without showing that this batch met it.',
    source: 'src-003'
  },

  /* =====================================================================
   * m02l05 — The ESD control program
   * =================================================================== */

  {
    questionId: 'q-m02l05-03',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l05',
    prompt: 'Which statement matches how the lesson frames an ESD control program?',
    options: opts(
      'A documented management system with defined areas, controls and records, not a set of gadgets.',
      'A purchasing standard for packaging materials, applied mainly to outgoing shipments.',
      'A maintenance schedule for ionizers and grounding rods, owned by the facilities team.',
      'A training requirement for operators who handle boards, verified once at induction.'
    ),
    correct: 'a',
    explanation: 'The lesson opens by insisting that a programme is a management system: the protected area is defined by the materials, the part sensitivity, the packaging and the people and equipment that move them, and both S20.20 and IEC 61340-5-1 require written procedures. Packaging purchasing, equipment maintenance and induction training are parts of a programme, not its definition.',
    source: 'src-012'
  },
  {
    questionId: 'q-m02l05-04',
    type: 'single',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l05',
    prompt: 'For which items is ionization the control the lesson points to?',
    options: opts(
      'Isolated conductors and insulators that cannot be grounded in the protected area.',
      'Workers at a bench, in place of a wrist strap that has failed its daily test.',
      'Boards inside a shielding bag, where humidity control is not practical to maintain.',
      'Storage racks, in place of the equipotential bonding that ties them to ground.'
    ),
    correct: 'a',
    explanation: 'Ionization neutralises charge on isolated conductors and insulators, which by definition cannot be drained by grounding. It is not a substitute for personnel grounding, for shielding packaging, or for the bonding network: the lesson keeps those as separate controls with their own standards and their own verification.',
    source: 'src-012'
  },
  {
    questionId: 'q-m02l05-05',
    type: 'calc',
    competencies: ['K1', 'K9'],
    bloom: 'apply',
    lessonId: 'm02l05',
    prompt: 'An audit scores control strength from 0 to 3, exposure from 1 to 5 and sensitivity from 1 to 5, with risk = (3 - control) x exposure x sensitivity. A missing grounding jumper scores 0, 5 and 4. What is its risk score?',
    options: opts(
      '60',
      '20',
      '24',
      '180'
    ),
    correct: 'a',
    explanation: 'Risk = (3 - 0) x 5 x 4 = 60. Dropping the (3 - control) term gives 20, which is the same answer a much weaker gap would produce; 24 corresponds to a control strength of 1 with exposure 4 and sensitivity 3; and 180 multiplies the raw control value instead of its complement.',
    source: 'src-012'
  },

  /* exam */
  {
    questionId: 'q-m02l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'understand',
    lessonId: 'm02l05',
    prompt: 'What is the purpose of equipotential bonding in a protected area?',
    options: opts(
      'To keep conductive items at a common potential, so charge cannot flow between them on contact.',
      'To drain charge from insulators such as plastic housings and tape that cannot conduct.',
      'To provide a low-resistance path that discharges a board directly to earth in one step.',
      'To power the ionizers that neutralise the air around sensitive assemblies.'
    ),
    correct: 'a',
    explanation: 'Bonding keeps conductive items at a common potential, so no difference exists to drive a discharge when they touch, and the network must be continuous and inspectable. Insulators are handled by ionization, not by bonding; a board is drained through controlled paths rather than a single hard earth connection; and ionizers are powered independently.',
    source: 'src-012'
  },
  {
    questionId: 'q-m02l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K9'],
    bloom: 'analyse',
    lessonId: 'm02l05',
    prompt: 'An audit finds a mat in place but never tested, on a bench where sensitive parts move all day. Why does this outrank a missing ionizer balance record elsewhere?',
    options: opts(
      'Its risk score is higher, because many sensitive parts pass over an unverified control daily.',
      'Mats are always more important than ionizers in any programme, whatever the exposure.',
      'An untested mat is a documentation gap, while a missing ionizer record is a control failure.',
      'Ionizers are only required when the relative humidity of the room falls below the setpoint.'
    ),
    correct: 'a',
    explanation: 'The lesson ranks gaps by (control weakness) x exposure x sensitivity, so an unverified control under daily traffic scores higher than a record gap on a lower-traffic control. The ranking is not a fixed hierarchy between control types, and an untested mat is a control failure rather than a paperwork issue. Ionization requirements are set by the programme, not by a single humidity setpoint.',
    source: 'src-012'
  },
  {
    questionId: 'q-m02l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1'],
    bloom: 'apply',
    lessonId: 'm02l05',
    prompt: 'A storage area holds parts in shielding bags on a metal rack that is not bonded to the EPA ground. What is the technical concern?',
    options: opts(
      'The rack can hold a charge and discharge into parts when a bag is handled or placed on it.',
      'The shielding bags will lose their metallised layer over time if the rack is not grounded.',
      'Unbonded metal attracts moisture, so the parts inside the bags will exceed their floor life.',
      'Nothing: a shielding bag makes the potential of the surface underneath it irrelevant.'
    ),
    correct: 'a',
    explanation: 'An unbonded conductor is exactly the isolated conductor the lesson warns about: it can hold charge and discharge into whatever touches it, including a bag being placed on it. Grounding does not preserve the metallised layer, metal does not attract moisture in a way that consumes floor life, and a bag protects its contents from external fields only while its own integrity and handling are controlled.',
    source: 'src-012'
  },

  /* =====================================================================
   * m02l06 — Case: expired floor life found mid-lot
   * =================================================================== */

  {
    questionId: 'q-m02l06-03',
    type: 'single',
    competencies: ['K1', 'K8'],
    bloom: 'understand',
    lessonId: 'm02l06',
    prompt: 'Which units belong in the traceability range when expired floor life is found mid-lot?',
    options: opts(
      'Every unit sharing the lot, bag, cabinet, handling window, feeder and reflow profile.',
      'Only the reels currently mounted on feeders, since the remaining reels are still bagged.',
      'Only the boards already populated, because unpopulated reels have not been exposed yet.',
      'Every unit of that part number in the plant, regardless of lot or storage location.'
    ),
    correct: 'a',
    explanation: 'The lesson defines the range by shared conditions rather than by physical proximity: same lot or date code, same storage location and cabinet, same vacuum bag, shift, feeder, work order, oven and profile. Reels on feeders alone understates the range, boards alone ignores the device risk, and the whole part number overstates it to material that never shared the exposure.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l06-04',
    type: 'calc',
    competencies: ['K1', 'K8'],
    bloom: 'apply',
    lessonId: 'm02l06',
    prompt: 'An MSL 3 lot with a 168 h floor life was bagged out 200 h before the planned reflow, and the dry cabinet sat at 7 % RH against a 5 % RH requirement. By how much is the floor life exceeded?',
    options: opts(
      '32 h, because the cabinet did not qualify and the full 200 h counts.',
      '0 h, because the cabinet was below 10 % RH and therefore suspended the clock.',
      '168 h, because an out-of-specification cabinet resets the exposure to zero.',
      '32 h, but only if the humidity indicator card is also above its threshold.'
    ),
    correct: 'a',
    explanation: 'The cabinet did not meet the dry-storage requirement stated in this lesson, so the exposure cannot be discounted: 200 - 168 = 32 h over. The 10 % RH defence belongs to a different threshold statement and does not apply here; a cabinet out of range does not reset anything; and the indicator card is separate evidence, not a condition for counting the excess.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l06-05',
    type: 'single',
    competencies: ['K8', 'K9'],
    bloom: 'apply',
    lessonId: 'm02l06',
    prompt: 'A moisture breach is confirmed mid-lot. What is the correct first move on the line?',
    options: opts(
      'Stop feeding the affected reels and quarantine all devices from the shared conditions.',
      'Finish the current panel and then hold the remaining reels until the shift handover.',
      'Continue the build and add an X-ray check at the end of line so the parts are inspected.',
      'Return the affected reels to the cabinet, which restores their floor life for the next shift.'
    ),
    correct: 'a',
    explanation: 'The lesson says to stop feeding the affected reels and trays and quarantine everything from the same lot, bag, cabinet and handling window, and not to reflow the affected batch until the bake decision is documented. Finishing the panel adds exposed material to the suspect range, X-ray at the end of line cannot recover an interface that has already separated, and returning to a cabinet does not restore floor life.',
    source: 'src-003'
  },

  /* exam */
  {
    questionId: 'q-m02l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K8'],
    bloom: 'understand',
    lessonId: 'm02l06',
    prompt: 'Which three outcomes does the lesson allow for a batch found with expired floor life?',
    options: opts(
      'Bake and repackage, scrap, or release only after the records and disposition are complete.',
      'Ship as is, sort by visual appearance, or re-test the lot electrically before use.',
      'Extend the floor life by approval, reflow at a higher peak, or hold until the next audit.',
      'Return to the supplier, blend with a fresh lot, or re-label the reels with a new date.'
    ),
    correct: 'a',
    explanation: 'The lesson closes with three outcomes: bake and repackage if the package allows it, scrap if baking is not allowed or the package is damaged, or release only after the bake record, the dry-storage record and the traceability disposition are complete. None of the alternatives removes or documents the exposure.',
    source: 'src-003'
  },
  {
    questionId: 'q-m02l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K8', 'K9'],
    bloom: 'analyse',
    lessonId: 'm02l06',
    prompt: 'An ESD wrist-strap log shows a gap for one shift while boards were being handled. What is the containment range?',
    options: opts(
      'All boards handled in the protected area during the breach window, plus the carriers used.',
      'Only the boards that later fail electrical test, since ESD damage either shows or does not.',
      'The wrist strap and its cord, which are the only items proven to have been uncontrolled.',
      'All boards of that work order, because the operator was assigned to the whole order.'
    ),
    correct: 'a',
    explanation: 'The lesson defines the ESD containment range by the breach window: everything handled in the EPA during it, plus feeders, magazines and carriers that moved through it. Limiting it to electrical failures fails because ESD damage can be latent, and neither the strap alone nor the whole work order matches the window in which control was lost.',
    source: 'src-012'
  },
  {
    questionId: 'q-m02l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K1', 'K8'],
    bloom: 'apply',
    lessonId: 'm02l06',
    prompt: 'A batch cannot be baked because its carrier will not tolerate the temperature and cannot be de-reeled in time. What follows?',
    options: opts(
      'Scrap is the remaining outcome, because the exposure cannot be removed or qualified.',
      'Run the batch and rely on the humidity indicator card as the release criterion.',
      'The batch may run if the reflow peak is reduced, since lower temperature needs less moisture.',
      'Store the batch in the cabinet indefinitely until a bake recipe is qualified later.'
    ),
    correct: 'a',
    explanation: 'The lesson names scrap as the outcome when baking is not allowed or the package is damaged — the exposure has to be removed or made defensible, and if neither is possible the material cannot be released. An indicator card is not a release criterion for an expired budget, a lower peak still leaves moisture in the interface, and indefinite storage does not qualify the batch.',
    source: 'src-003'
  }

];

/* =========================================================================
 * phase1-m10.js — question bank content for module m10
 * (Selective Soldering), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 51 s cycle of m10l01, the
 * nozzle footprints and dwell bands of m10l02, the 21 K rise and 121 °C
 * capacitor estimate of m10l03, the 238.3 s solder time and 20.0 joints per
 * minute of m10l04, and the 178 °C against 150 °C screening target of m10l05.
 *
 * Deliberately not asked: the nozzle dwell bands themselves. They differ by
 * joint family and are given as starting ranges, so the questions ask which
 * family needs the longer contact and why, not the band values.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m10l01 — where selective wins ================== */

  {
    questionId: 'q-m10l01-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l01',
    prompt: 'What usually decides that a joint should be soldered selectively rather than by a full wave?',
    options: opts(
      'Heat-sensitive surface-mount parts close to the through-hole joints',
      'The number of through-hole pins on the connector, once it passes forty',
      'The board thickness, since a full wave cannot heat boards over 1.6 mm',
      'The solder alloy, because a wave bath cannot run lead-free solder'
    ),
    correct: 'a',
    explanation: 'The lesson gives the thermal budget of nearby SMT parts as the main reason selective exists, with throughput as the secondary consideration. Pin count correlates with cycle time rather than with the decision, and neither board thickness nor alloy rules a wave out.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l01-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l01',
    prompt: 'What is a joint group in a selective program?',
    options: opts(
      'Joints served by one nozzle path, one flux application and one profile',
      'All the pins of a single connector, counted as one thermal unit',
      'The set of joints that failed inspection on the previous panel',
      'The joints that share the same reference designator prefix'
    ),
    correct: 'a',
    explanation: 'The lesson groups joints by access, thermal mass and flux requirement so that one pass can serve them, and lists isolated pins, connectors and power pads as typical groups. Designator prefixes and failure history do not describe access or thermal behaviour.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l01-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l01',
    prompt: 'A selective cycle is 3 s flux, 20 s preheat, 3 s dwell, 10 s cooling and 15 s path. What is the cycle time?',
    options: opts(
      '51 s',
      '36 s',
      '48 s',
      '66 s'
    ),
    correct: 'a',
    explanation: 'The five elements sum to 51 s per board, which is the lesson\'s own estimate. The 36 s answer drops the path time, 48 s drops the dwell, and 66 s double-counts one of the stages.',
    source: 'src-021'
  },

  /* exam */
  {
    questionId: 'q-m10l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l01',
    prompt: 'What does a mini-wave nozzle suit?',
    options: opts(
      'Isolated through-hole pins that need local heat and limited spread',
      'A dense array of pins on a fine-pitch connector, all at once',
      'Bottom-side chip components that must be reflowed a second time',
      'Large ground pads that no nozzle can cover in one pass'
    ),
    correct: 'a',
    explanation: 'The lesson describes the mini-wave as a small wave for accessible, isolated joints where local heat is enough. Dense arrays usually need a different path or several passes, chip parts are not wave joints, and a large ground pad needs a slot nozzle or a multi-pass strategy.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm10l01',
    prompt: 'An electrolytic capacitor sits 12 mm from the connector pins. What does the lesson require?',
    options: opts(
      'Its body temperature measured in the profile, against its own limit',
      'Its removal before soldering, since no profile can protect it',
      'A higher preheat, so that the capacitor is already warm when the jet arrives',
      'A longer dwell, so that less heat is needed at a lower jet temperature'
    ),
    correct: 'a',
    explanation: 'The thermal budget has to be proven at the neighbour, which is why the lesson profiles the capacitor body and compares the result with the component limit. Removing it, warming it up or extending the dwell all increase exposure rather than manage it.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l01',
    prompt: 'The capacitor limit is 105 °C and the profiled body temperature is 85-95 °C. What does that give?',
    options: opts(
      '10-20 °C of margin, which is what the choice has to prove',
      'No margin at all, since the limit is close to the measured value',
      'A margin of 10-20 °C below the solder pot temperature',
      'A margin that only matters if the capacitor is electrically tested'
    ),
    correct: 'a',
    explanation: 'The lesson takes 105 minus the measured band as the margin, 10-20 °C, and accepts the nozzle and flux choice on that basis. Comparing with the pot temperature or making the margin conditional on a later test misstates what was measured.',
    source: 'src-021'
  },

  /* ===================== m10l02 — nozzle strategy ======================= */

  {
    questionId: 'q-m10l02-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l02',
    prompt: 'What does flux-on-the-fly change compared with fluxing the whole board?',
    options: opts(
      'The flux is active at wetting temperature because it is applied just before contact',
      'The flux is applied only to the top side, so less residue reaches the bottom',
      'The flux is cured by the preheat, which removes the need for cleaning',
      'The flux is measured per board area, exactly as on a wave line'
    ),
    correct: 'a',
    explanation: 'The point of applying flux immediately before the nozzle is that it is still active when the joint reaches wetting temperature, so the amount is metered per joint area. It is applied where the joint is, it is not cured by design, and the per-board-area basis belongs to wave soldering.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l02-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l02',
    prompt: 'Why does the lesson split a program into passes instead of doing everything in one?',
    options: opts(
      'Separate passes stop preheat, flux and solder functions from competing',
      'Each pass needs its own nozzle, so the passes follow the nozzle list',
      'The machine cannot repeat the same coordinate twice in one program',
      'Passes are needed only when the board carries more than fifty joints'
    ),
    correct: 'a',
    explanation: 'A pass isolates one function so that heat, flux and solder do not fight each other, with a preheat pass, a flux pass and a solder pass as the common pattern. Nozzle count, a coordinate limit and a joint threshold are not the reason the lesson gives.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l02-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l02',
    prompt: 'A joint area of 12 mm² gets flux at 0.15 mg/mm². What mass of flux does that deposit?',
    options: opts(
      '1.8 mg',
      '0.18 mg',
      '18 mg',
      '180 mg'
    ),
    correct: 'a',
    explanation: '12 x 0.15 = 1.8 mg on a per-joint-area basis, which is the unit the lesson insists on for selective work. The other options move the decimal by one place in each direction or by two.',
    source: 'src-021'
  },

  /* exam */
  {
    questionId: 'q-m10l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l02',
    prompt: 'What does a conical nozzle do well?',
    options: opts(
      'It concentrates heat on an isolated pin without flooding its neighbours',
      'It spreads heat evenly across a large ground pad in one pass',
      'It covers all the pins of a connector at a single temperature',
      'It applies flux and solder together, so one pass is enough'
    ),
    correct: 'a',
    explanation: 'The lesson ties nozzle shape to thermal and wetting behaviour, and a cone concentrates heat on a small joint — hence its use for isolated through-hole pins. Large pads need a footprint nozzle, a connector array needs a path rather than one shape, and flux is a separate function.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm10l02',
    prompt: 'An 8 by 8 mm ground pad cannot be covered without risking a neighbour. What does the lesson do?',
    options: opts(
      'Uses a slot nozzle or splits the pad across two passes',
      'Uses the conical nozzle already fitted, since shape barely matters',
      'Raises the jet temperature until the pad fills in a single contact',
      'Skips the pad and repairs it by hand after the machine run'
    ),
    correct: 'a',
    explanation: 'The lesson matches the footprint to the pad and, where a single contact is not safe, uses a two-pass strategy. Reusing a small cone, pushing the temperature up and moving the work to hand repair all trade risk for convenience.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l02',
    prompt: 'Which joint family needs the longest dwell in the lesson\'s example?',
    options: opts(
      'The 8 by 8 mm ground pad, because its thermal mass is the largest',
      'The through-hole connector pins, because they have the smallest pads',
      'The 4 by 4 mm power pads, because they are closer to the nozzle',
      'All three families need the same dwell, since dwell follows the alloy'
    ),
    correct: 'a',
    explanation: 'Dwell is set from each joint\'s thermal mass, and the large ground pad with its plane connection needs the longest contact, which the lesson places at the top of its range. Small pins and power pads need less, and a single dwell for every family contradicts the per-joint logic.',
    source: 'src-021'
  },

  /* ===================== m10l03 — neighbour thermal budget ============== */

  {
    questionId: 'q-m10l03-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l03',
    prompt: 'Why is the thermal budget described as a shared resource?',
    options: opts(
      'Heat reaches neighbours by conduction, convection and radiation, not just the joint',
      'The machine can only heat a fixed number of joints per minute',
      'Each nozzle has a rated thermal output that must be divided between joints',
      'The solder pot cools as more joints draw heat out of the wave'
    ),
    correct: 'a',
    explanation: 'The lesson defines the budget as the cumulative heat arriving at nearby parts through three paths, which is why a joint that passes can still damage its neighbour. Machine throughput, nozzle ratings and pot cooling are separate constraints.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l03-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l03',
    prompt: 'Which heat path dominates close to the soldering source?',
    options: opts(
      'Conduction through copper planes and component leads',
      'Convection from the air moving through the machine',
      'Radiation from the solder pot surface to the package body',
      'Evaporation of flux solvent on the board surface'
    ),
    correct: 'a',
    explanation: 'The lesson states that conduction through planes and leads dominates near the source, with convection from the air and flux vapour second. Radiation and evaporating solvent are not the dominant paths it names.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l03-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l03',
    prompt: 'A 250 °C pot sits under a board top at 100 °C, and the capacitor is 8 mm away with a 4 mm attenuation length. What body temperature does the estimate give?',
    options: opts(
      'About 121 °C',
      'About 115 °C',
      'About 137 °C',
      'About 175 °C'
    ),
    correct: 'a',
    explanation: 'The step is 150 °C, attenuated by exp(-2) ≈ 0.14, which gives about 21 °C above the board top at 100 °C, so 121 °C — above the 105 °C limit in the case. The other options come from attenuating by one step instead of two, halving the exponent, or applying no attenuation at all.',
    source: 'src-021'
  },

  /* exam */
  {
    questionId: 'q-m10l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l03',
    prompt: 'Which neighbours does the lesson name as needing attention?',
    options: opts(
      'Electrolytics, plastic connectors, LEDs, MEMS and adhesive-bonded parts',
      'Any part smaller than 0402, because of its small thermal mass',
      'Bare laminate, because it delaminates before parts are damaged',
      'Only parts that have already failed a functional test'
    ),
    correct: 'a',
    explanation: 'The lesson lists electrolytic capacitors, plastic connectors, LEDs, MEMS devices, sensors and adhesive-bonded components as sensitive neighbours. Small chip size, bare laminate and previous failures are not the criteria it gives.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm10l03',
    prompt: 'The estimate puts a capacitor over its limit. Which mitigation does the lesson offer at layout level?',
    options: opts(
      'More spacing, thermal relief, or less copper connecting it to the joint',
      'A shorter dwell, which the layout cannot influence in any way',
      'A higher preheat, so the capacitor starts closer to its limit',
      'A heavier fixture, so that heat is carried away from the board'
    ),
    correct: 'a',
    explanation: 'Layout-level mitigation is about reducing heat arriving: distance, thermal relief and less copper path. Dwell, preheat and fixtures are process or fixture levers, and raising the preheat moves the part towards its limit rather than away from it.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l03',
    prompt: 'Which verification does the lesson require for a neighbour at risk?',
    options: opts(
      'A profile with thermocouples on the target joint and the exposed neighbour',
      'A single thermocouple on the solder pot, recorded once per shift',
      'A thermal camera image taken after the board has cooled down',
      'An electrical test of the neighbour alone, repeated after reflow'
    ),
    correct: 'a',
    explanation: 'The measurement has to be made where the risk is, so the lesson profiles both the joint and the most exposed neighbour, then adds functional testing after the run. Pot temperature, a cooled board image and an electrical test alone cannot show the peak the part actually saw.',
    source: 'src-021'
  },

  /* ===================== m10l04 — programming a run ===================== */

  {
    questionId: 'q-m10l04-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l04',
    prompt: 'Why is the fixture part of the selective program?',
    options: opts(
      'It sets board height, exposure, support and the thermal path into the board',
      'It carries the barcode that identifies the program to the machine',
      'It holds the flux syringe, so the flux volume depends on the fixture',
      'It is only a transport aid and has no effect on the soldering result'
    ),
    correct: 'a',
    explanation: 'The lesson treats the fixture as part of the recipe because it fixes how the board sits, how much of it is exposed and how heat spreads. Identification, flux supply and transport do not capture why the fixture changes the result.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l04-04',
    type: 'single',
    competencies: ['K3', 'K9'],
    bloom: 'understand',
    lessonId: 'm10l04',
    prompt: 'How does the lesson want the joint order chosen?',
    options: opts(
      'Group by access and thermal mass, then work from low mass to high mass',
      'By reference designator, so the program matches the assembly drawing',
      'From the highest mass joint down, so the hardest work is finished first',
      'In the shortest possible path, since path length is the only cycle factor'
    ),
    correct: 'a',
    explanation: 'Ordering is a thermal decision: group by access and mass, then run low mass first so heat does not build up before the sensitive joints are made. Drawing order, hardest-first and pure path length ignore that logic.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l04-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l04',
    prompt: 'A board has 72 low-mass pins at 1.55 s, 26 SMT joints at 2.15 s and 12 high-mass pins over two passes at 2.95 s each. What is the solder time?',
    options: opts(
      'About 238 s',
      'About 167 s',
      'About 91 s',
      'About 329 s'
    ),
    correct: 'a',
    explanation: '111.6 + 55.9 + 70.8 = 238.3 s of solder time, which the lesson then adds to 91 s of non-solder elements. The 167 s answer omits the second pass on the high-mass pins, 91 s is the non-solder total, and 329 s is the whole cycle.',
    source: 'src-021'
  },

  /* exam */
  {
    questionId: 'q-m10l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l04',
    prompt: 'What does the air knife do in a selective program?',
    options: opts(
      'It clears excess flux from the surface and limits flux carry-over',
      'It cools the joint after soldering so the grain structure is fine',
      'It blows solder into the barrel to complete the fill',
      'It dries the preheat zone before the nozzle arrives'
    ),
    correct: 'a',
    explanation: 'The lesson describes a programmed air or nitrogen curtain that removes excess flux and limits carry-over, sometimes with additional machine functions. Cooling, filling and drying the preheat are not its role.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm10l04',
    prompt: 'Which elements does the lesson add to solder time to get the cycle time?',
    options: opts(
      'Handling, fluxing, preheat, air knife, cooling and fixture exchange',
      'Solder time alone, because the machine works on one board at a time',
      'Only the preheat and dwell, since the other steps overlap',
      'The nozzle travel time and the pot recovery time only'
    ),
    correct: 'a',
    explanation: 'The cycle is the sum of every step the board sees, which is why the lesson lists handling, flux, preheat, air knife, movement, dwell, cooling and any fixture exchange. Solder time alone, a partial sum or a two-item list all understate it.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l04-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l04',
    prompt: 'A cycle is 329.3 s and the board carries 110 joints. What is the effective rate?',
    options: opts(
      'About 20 joints per minute',
      'About 33 joints per minute',
      'About 3 joints per minute',
      'About 110 joints per minute'
    ),
    correct: 'a',
    explanation: '329.3 s is 5.49 min, and 110 / 5.49 = 20.0 joints per minute, the figure the lesson reports. The 33 figure divides by 3.3 min by mistake, 3 comes from misplacing a decimal, and 110 ignores the cycle time entirely.',
    source: 'src-021'
  },

  /* ===================== m10l05 — validation =========================== */

  {
    questionId: 'q-m10l05-03',
    type: 'single',
    competencies: ['K3', 'K6'],
    bloom: 'understand',
    lessonId: 'm10l05',
    prompt: 'When does the lesson call for a cross-section?',
    options: opts(
      'When hole fill, intermetallic formation or crack risk cannot be seen',
      'On every joint of the first panel, as a routine acceptance step',
      'Only when a pull test has already failed on a sample lead',
      'Whenever the operator cannot decide from the solder-side image'
    ),
    correct: 'a',
    explanation: 'A cross-section answers questions the surface cannot, so it is used where fill, intermetallics or cracks are in doubt. Routine sectioning of every joint is destructive and far beyond the lesson, and a failed pull test or an undecided operator is not the trigger it describes.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l05-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l05',
    prompt: 'How does the lesson use a pull test in selective validation?',
    options: opts(
      'Pull a lead perpendicular to the board to check mechanical strength',
      'Pull the lead sideways to reproduce the stress of cable handling',
      'Push the lead into the barrel to confirm the hole is filled',
      'Twist the lead until the joint fails, then measure the angle'
    ),
    correct: 'a',
    explanation: 'The lesson fixes the board and pulls the lead perpendicular to it, on through-hole leads and selected SMT terminations, when strength is the question. Sideways, pushing and twisting are different tests that answer different questions.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l05-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l05',
    prompt: 'A 250 °C jet runs 2.5 s over a joint and the estimate puts a nearby 0402 at about 178 °C against a 150 °C screening target. What does the calculation conclude?',
    options: opts(
      'The estimate is over target, so the dwell or the shielding must change',
      'The estimate is over target, so the target should be raised to 180 °C',
      'The estimate is acceptable, because the target is a screening figure only',
      'The estimate is acceptable, because a 0402 can take 178 °C'
    ),
    correct: 'a',
    explanation: 'The lesson compares 178 °C with its 150 °C screening target, concludes that mitigation is needed, and then shortens the dwell to 1.5 s to bring the estimate to about 147 °C. Moving the target or asserting the part can take it reverses the order of the argument, and the screening figure exists to trigger exactly this action.',
    source: 'src-021'
  },

  /* exam */
  {
    questionId: 'q-m10l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm10l05',
    prompt: 'What is selective validation meant to prove?',
    options: opts(
      'That the joints are sound and the neighbours stayed inside their limits',
      'That the machine meets its rated placement and solder-cycle speeds',
      'That the program file has been approved by the process engineer',
      'That the board passes functional test before it leaves the line'
    ),
    correct: 'a',
    explanation: 'Selective soldering exists because of nearby heat-sensitive parts, so validation covers both sides of that trade: joint quality and neighbour temperature. Speed, approval and functional test are separate questions.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm10l05',
    prompt: 'Which set of mitigations does the lesson apply when the neighbour is too hot?',
    options: opts(
      'Shorter dwell, lower preheat where paste allows, shielding, later sequence',
      'A hotter jet for a shorter time, so the total energy stays the same',
      'A larger nozzle, so the heat spreads over a wider area of copper',
      'A slower nozzle path, so the board has time to lose heat between joints'
    ),
    correct: 'a',
    explanation: 'The lesson reduces the energy that reaches the neighbour: less dwell, less preheat where the paste permits, a shield, and a later position in the sequence. A hotter jet, a bigger nozzle and a slower path all add heat or exposure.',
    source: 'src-021'
  },
  {
    questionId: 'q-m10l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm10l05',
    prompt: 'Which records does the lesson require for a released selective program?',
    options: opts(
      'Board revision, program file, nozzle, settings, profile, section and pull result',
      'The machine serial number and the date of the next preventive maintenance',
      'The operator roster and the training certificates of the shift',
      'The solder pot analysis and the flux lot number alone'
    ),
    correct: 'a',
    explanation: 'The lesson asks for board revision, component placement, program file, nozzle, paste lot, preheat and jet settings, dwell, pass strategy, and the profile, section and pull-test results. Machine maintenance, staffing and a two-item chemistry record do not let anyone rebuild the decision.',
    source: 'src-021'
  }

];

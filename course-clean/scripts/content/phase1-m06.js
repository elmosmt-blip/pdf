/* =========================================================================
 * phase1-m06.js — question bank content for module m06
 * (Reflow Soldering), plus its exam bank.
 *
 * Numbers come from the module's own text and cases: SAC305 solidus 217 °C and
 * liquidus 219 °C, the 1-3 °C/s ramp, the 30-90 s TAL of IPC-7530B, the
 * J-STD-020 classification ceilings 260/250/245 °C, the SnPb 235/220 °C pair,
 * the 19 °C margin of m06l03 and the 45 s TAL of m06l07.
 *
 * Deliberately not asked: nothing in this module conflicted with itself; the
 * TAL of 60-120 s that appears beside 30-90 s is labelled in the lesson as the
 * soak t_s, not the TAL, so there is no ambiguity to avoid.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m06l01 — heat transfer ========================= */

  {
    questionId: 'q-m06l01-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l01',
    prompt: 'Why is an oven setpoint not evidence that the solder joint reached its target?',
    options: opts(
      'The board and joint lag the air, and mass and copper pull the joint colder',
      'The oven setpoint is measured in the exhaust, which runs hotter than the board',
      'The setpoint is an average across all zones, so it cannot describe any one zone',
      'The setpoint is calibrated in the factory and never verified again after that'
    ),
    correct: 'a',
    explanation: 'The profile is the temperature history of the board and components, and board thickness, copper area, component mass and mounting all make the joint differ from the air around it — which is why thermocouples go on the board. The setpoint is a control target per zone, not an exhaust reading, not an average, and not a static factory value.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l01-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l01',
    prompt: 'What is the job of the soak zone?',
    options: opts(
      'To let the assembly even out thermally while flux activates and solvents leave',
      'To melt the solder quickly so the joint spends as little time hot as possible',
      'To cool the board gradually so that thermal stress does not build in the joints',
      'To burn off the flux residue before the solder reaches its liquidus'
    ),
    correct: 'a',
    explanation: 'The soak brings heavy planes and small pads towards a common temperature while flux works and volatiles escape, which is what prevents violent boiling in the ramp. Melting is the reflow zone, cooling follows the peak, and flux is not burned off before liquidus — its activity is what the reflow window depends on.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l01-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l01',
    prompt: 'A 1.6 mm board ramps from 25 °C to 150 °C in 60 s. What is the ramp rate, and how does it compare with the 1-3 °C/s guidance?',
    options: opts(
      '2.1 °C/s, inside the guidance band',
      '2.5 °C/s, inside the guidance band',
      '0.5 °C/s, below the guidance band',
      '2.1 °C/s, above the guidance band'
    ),
    correct: 'a',
    explanation: '(150 - 25) / 60 = 2.08 °C/s, which sits inside 1-3 °C/s. The 2.5 answer divides by 50 s for no stated reason, 0.5 inverts the division, and the last option reads the same number against the wrong side of the band.',
    source: 'src-008'
  },

  /* exam */
  {
    questionId: 'q-m06l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l01',
    prompt: 'Which quantities describe a reflow profile?',
    options: opts(
      'Ramp, soak, time above liquidus, peak temperature and cooling',
      'Zone count, belt speed, heater power and blower frequency',
      'Paste metal load, powder size, flux type and viscosity',
      'Board thickness, copper weight, panel size and fixture type'
    ),
    correct: 'a',
    explanation: 'The lesson defines a profile by those five thermal features measured at the board. Machine settings are how you produce the profile rather than the profile itself, and paste and board data are the constraints the profile has to satisfy.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm06l01',
    prompt: 'A profile logged on a thin coupon passes, but the same recipe makes cold joints on the heavy product board. What is the first explanation?',
    options: opts(
      'The coupon did not reproduce the board thermal mass, so the joints ran colder',
      'The oven lost calibration between the coupon run and the production run',
      'The paste lot changed between the two runs, raising the liquidus temperature',
      'The belt speed was recorded in the wrong units on the production recipe'
    ),
    correct: 'a',
    explanation: 'The lesson requires a test coupon that reproduces the laminate, copper distribution, components and panel position, precisely because a thinner, lighter coupon heats differently. Calibration, a paste lot and a unit error are all possible, but the systematic difference between coupon and product is the first thing the evidence points at.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l01',
    prompt: 'Cooling runs from 240 °C to 180 °C in 20 s. Which statement is correct?',
    options: opts(
      '3 °C/s, inside the 1-4 °C/s typical band',
      '3 °C/s, above the 1-4 °C/s typical band',
      '12 °C/s, far above the typical band',
      '1 °C/s, at the bottom of the typical band'
    ),
    correct: 'a',
    explanation: '(240 - 180) / 20 = 3 °C/s, inside 1-4 °C/s. The 12 °C/s answer divides the temperature span by the number of zones instead of by seconds, and 1 °C/s mis-divides by 60.',
    source: 'src-008'
  },

  /* ===================== m06l02 — profile anatomy ======================= */

  {
    questionId: 'q-m06l02-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l02',
    prompt: 'What happens when the ramp from room temperature is too steep?',
    options: opts(
      'Trapped solvent can boil violently, producing solder balls and spatter',
      'The flux is consumed too early, so the joints come out dull but sound',
      'The intermetallic layer grows too thick before the solder even melts',
      'The board cools faster afterwards, which coarsens the grain structure'
    ),
    correct: 'a',
    explanation: 'A steep ramp outgasses solvent faster than the paste can release it, which is the balling and spatter mechanism the lesson describes. Flux activity, intermetallic growth and cooling rate are all influenced by the profile, but their effects come from other segments and in other directions.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l02-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l02',
    prompt: 'From which temperature is time above liquidus measured for SAC305?',
    options: opts(
      '219 °C, the liquidus, not the 217 °C solidus',
      '217 °C, the solidus, since melting begins there',
      '183 °C, the eutectic SnPb liquidus, used as a common reference',
      '250 °C, the classification temperature for the package size'
    ),
    correct: 'a',
    explanation: 'SAC305 melts over a two-degree range, and the lesson measures TAL from the 219 °C liquidus because that is where the alloy is fully molten and free to flow. The solidus marks the start of melting, 183 °C belongs to SnPb, and the classification temperature is a ceiling rather than a reference for the clock.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l02-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l02',
    prompt: 'A profile measures 248 °C peak against a J-STD-020 classification of 245 °C for the package, and 100 s above liquidus against a 60-150 s window. What is the critical finding?',
    options: opts(
      'The peak exceeds the classification temperature by 3 °C',
      'The time above liquidus is the critical finding, since 100 s is inside 60-150 s',
      'Both values are acceptable, because 3 °C is inside measurement uncertainty',
      'Both values are unacceptable, because the window and the ceiling are both missed'
    ),
    correct: 'a',
    explanation: 'The TAL sits comfortably inside its window, so the finding that matters is the peak exceeding the component classification by 3 °C — the lesson treats the classification temperature as a ceiling, not a target. Calling the TAL critical inverts the finding, and dismissing the overshoot as uncertainty assumes a measurement error the profile does not show.',
    source: 'src-017'
  },

  /* exam */
  {
    questionId: 'q-m06l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l02',
    prompt: 'What does the reflow zone have to achieve before the joint can form?',
    options: opts(
      'Enough time above liquidus for wetting and oxide removal, without over-growing',
      'A peak high enough to melt the laminate surface so the pad is exposed',
      'A soak long enough that the paste is fully dried before it melts',
      'A cooling rate fast enough to freeze the joint before it can re-oxidise'
    ),
    correct: 'a',
    explanation: 'TAL has to be long enough for wetting and flux action and short enough to limit intermetallic growth and component exposure — a two-sided requirement. Melting laminate, drying paste before melting and relying on fast cooling to prevent oxidation all describe different processes than the one the lesson sets out.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm06l02',
    prompt: 'Joints on a heavy ground plane are cold while small pads nearby are perfect. Which segment does the lesson fix first?',
    options: opts(
      'The soak, so the plane reaches temperature before the reflow zone',
      'The peak, raised until the plane joints finally melt and wet',
      'The cooling, slowed so the plane joints have time to solidify evenly',
      'The ramp, steepened so the plane gets more heat in less time'
    ),
    correct: 'a',
    explanation: 'The lesson assigns soak problems to non-wetting and cold joints in heavy copper areas, because the soak is where the assembly is equalised. Raising the peak to force the plane up also over-heats everything else, cooling acts after the joint has formed, and a steeper ramp risks the solvent and spatter problems without equalising anything.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l02-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l02',
    prompt: 'A joint is above 219 °C from 240 s to 305 s. How long is the time above liquidus, and does it sit in the 60-150 s window?',
    options: opts(
      '65 s, inside the window',
      '305 s, inside the window',
      '65 s, outside the window',
      '55 s, below the window'
    ),
    correct: 'a',
    explanation: '305 - 240 = 65 s, which is above the 60 s floor, so it sits inside 60-150 s. Reading the end time as the duration and mis-subtracting to 55 s are the two arithmetic slips this question is designed to catch.',
    source: 'src-008'
  },

  /* ===================== m06l03 — thermal survey ======================== */

  {
    questionId: 'q-m06l03-03',
    type: 'single',
    competencies: ['K5', 'K6'],
    bloom: 'understand',
    lessonId: 'm06l03',
    prompt: 'Which measurement does a thermal survey have to report to be useful?',
    options: opts(
      'The coolest and the hottest joint, not the average of the two',
      'The average board temperature across the whole run of panels',
      'The oven air temperature in each zone and the exhaust temperature',
      'The peak reading of the logger, since that is the worst case on the board'
    ),
    correct: 'a',
    explanation: 'The decision rule is built on two ends: the coolest joint must reach liquidus with enough TAL, and the hottest must stay below the component and board limits. An average hides both ends, and zone or exhaust air temperatures are control targets rather than what the joints experience.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l03-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l03',
    prompt: 'Where does the lesson expect the coolest site on a panel to be?',
    options: opts(
      'Under a large ground plane, at a cold edge, under a heavy part or in poor airflow',
      'At the centre of the panel, where the conveyor clamps hold the board most rigidly',
      'On the smallest chip, because it has the least thermal mass to retain heat',
      'At the leading edge, because it meets the coldest air in each zone first'
    ),
    correct: 'a',
    explanation: 'The lesson names the ground plane, the cold edge, the heavy component and the poorly supplied position as candidate cold sites, and the inverse for hot sites near a heater or a small component with less mass. Panel centre, smallest chip and leading edge all point the other way.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l03-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l03',
    prompt: 'A survey records a coolest peak of 238 °C and a hottest peak of 246 °C, against a liquidus of 219 °C. What margin does the coolest joint have above liquidus?',
    options: opts(
      '19 °C',
      '27 °C',
      '21 °C',
      '8 °C'
    ),
    correct: 'a',
    explanation: '238 - 219 = 19 °C, which is the margin the lesson checks against the paste and component limits. The 27 °C answer uses the hottest peak, 21 °C measures from the 217 °C solidus, and 8 °C is the spread between the two thermocouples rather than a margin above liquidus.',
    source: 'src-008'
  },

  /* exam */
  {
    questionId: 'q-m06l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l03',
    prompt: 'Why does the lesson require the test coupon to reproduce the production board?',
    options: opts(
      'A coupon of different mass and copper heats differently and validates nothing',
      'A coupon is only a carrier for thermocouples and its material is irrelevant',
      'The coupon is required by the standard to be a bare laminate of the same size',
      'A coupon must carry the same component count but may use any laminate available'
    ),
    correct: 'a',
    explanation: 'The coupon must match laminate, copper distribution, component types, paste deposit and panel position, because thermal mass is what the survey is measuring. Treating the coupon as a mere thermocouple carrier, or allowing any laminate, defeats the purpose of running a survey in the first place.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm06l03',
    prompt: 'A thermocouple is attached with tape over the joint instead of at the joint. What does that do to the reading?',
    options: opts(
      'It lags and under-reads, because the tape insulates and adds thermal mass',
      'It over-reads, because the tape conducts heat straight from the oven air',
      'It has no effect, because the thermocouple junction is still on the board',
      'It reads the air temperature, which is the value the profile is defined by'
    ),
    correct: 'a',
    explanation: 'The lesson counts attachment thermal lag among the sources of measurement uncertainty and asks for the junction to be fixed on the pad, trace or body with high-temperature adhesive or a solder point. Tape over the joint insulates the junction, it does not turn it into an air probe, and the profile is not defined by air temperature.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l03',
    prompt: 'The coolest site is marginal but the hottest is comfortably inside its limit. What does the lesson\'s decision rule say?',
    options: opts(
      'Do not accept on the average: fix the cold site before releasing the profile',
      'Accept, because no joint has exceeded any limit on the hottest side',
      'Accept, because a marginal cold joint is corrected later by rework',
      'Recalibrate the logger, since a marginal result usually means instrument error'
    ),
    correct: 'a',
    explanation: 'The survey is accepted only when the coolest joint reaches liquidus with enough TAL and the hottest stays below its limits, so a marginal cold site blocks acceptance even with a comfortable hot site. Rework does not make the profile valid, and instrument error has to be demonstrated rather than assumed.',
    source: 'src-008'
  },

  /* ===================== m06l04 — board thermal mass ==================== */

  {
    questionId: 'q-m06l04-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l04',
    prompt: 'What is thermal relief doing for a pad connected to a heavy plane?',
    options: opts(
      'Reducing the copper feeding heat away, so the pad can reach liquidus',
      'Increasing the copper contact so the pad heats faster during the ramp',
      'Protecting the pad from mechanical stress during depanel and handling',
      'Limiting the current the joint carries once the product is in service'
    ),
    correct: 'a',
    explanation: 'The lesson calls thermal relief a heat-balance tool: fewer spokes mean less copper drawing heat out of the pad, which is what lets it cross liquidus with the rest of the board. It has to keep electrical and mechanical integrity, but neither protection from depanel stress nor current limiting is its purpose.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l04-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l04',
    prompt: 'A mixed board has heavy connectors and small chips. Which profile strategy does the lesson describe?',
    options: opts(
      'A compromise profile, because joints on the same board need different heat',
      'The profile of the largest component, because it is the limiting case',
      'Two profiles in sequence, since one oven cannot serve both families',
      'The profile of the smallest chip, because it is the most fragile part'
    ),
    correct: 'a',
    explanation: 'The lesson frames mixed population boards as a compromise: large components and planes need soak and TAL, while small parts must not be overheated, so the profile is set for the whole board. Tuning to one extreme leaves the other failing, and two sequential profiles is not the mechanism described.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l04-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l04',
    prompt: 'A pad on a plane has twice the effective copper area of an isolated pad. If heating scales with that area, what does the ratio tell you about the pair?',
    options: opts(
      'The plane pad draws twice the heat, which explains a persistent temperature gap',
      'The plane pad reaches liquidus twice as fast, so it should not be a concern',
      'The ratio has no thermal meaning, because copper area does not control heating',
      'The isolated pad is the colder one, because it has less copper to absorb heat'
    ),
    correct: 'a',
    explanation: 'The lesson uses a 0.60 mm² plane pad against a 0.30 mm² isolated pad, a ratio of 2.0, to show why pad level thermal imbalance is plausible and why the connected pad runs colder — heat flows out through the copper. More copper is more heat sink, not faster heating, so the last two options invert the mechanism.',
    source: 'src-008'
  },

  /* exam */
  {
    questionId: 'q-m06l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l04',
    prompt: 'What is board thermal mass in the lesson\'s terms?',
    options: opts(
      'The combined heat capacity and resistance of laminate, copper, holes and parts',
      'The total weight of the assembly as measured on a laboratory balance',
      'The peak temperature the laminate can survive without delaminating',
      'The heat the oven delivers to the board in a given conveyor time'
    ),
    correct: 'a',
    explanation: 'Thermal mass combines heat capacity and heat-transfer resistance of laminate, copper planes, plated holes, components and fixtures — which is why a thick board with heavy copper reaches setpoints more slowly. Weight, a laminate rating and an oven output are different quantities.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm06l04',
    prompt: 'Pad joints on a plane stay below liquidus while everything else is fine. Which change does the lesson prefer first?',
    options: opts(
      'Move more heat in: longer soak or slower conveyor, then re-check peak and TAL',
      'Raise the peak setpoint until those pads finally melt and wet',
      'Increase the conveyor speed so the board spends less time losing heat',
      'Reduce the thermal relief spokes so the plane holds less heat near the pad'
    ),
    correct: 'a',
    explanation: 'The lesson\'s guidance is to adjust the profile by moving heat rather than by chasing temperature: more soak or a slower conveyor raises the board before liquidus, then peak and TAL are re-checked against the limits. Raising the peak puts the rest of the board over its ceiling, faster conveyor removes heat, and fewer spokes increase the heat sinking the pad needs to escape.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l04',
    prompt: 'A dense board with many copper areas heats slowly and uniformly. Which adjustment fits that pattern?',
    options: opts(
      'The board needs more total energy, so extend the soak rather than the peak',
      'The board needs less energy, because dense copper distributes heat faster',
      'The board should be run at a higher conveyor speed to avoid overheating',
      'The board needs a steeper ramp, because uniform heating tolerates it'
    ),
    correct: 'a',
    explanation: 'The lesson contrasts dense boards, which heat more uniformly but need more total energy, with sparse boards that heat fast and can develop local hot spots. More total energy belongs in the soak, where gradients are equalised, rather than in the peak, which is capped by components; the other options all remove energy.',
    source: 'src-008'
  },

  /* ===================== m06l05 — alloys and nitrogen =================== */

  {
    questionId: 'q-m06l05-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l05',
    prompt: 'What does nitrogen in the oven actually change?',
    options: opts(
      'Oxide formation on paste and pads, and so wetting and the usable window',
      'The liquidus of the alloy, which drops when oxygen is excluded',
      'The thermal mass of the board, which falls as the atmosphere thins',
      'The peak temperature the components can survive in the oven'
    ),
    correct: 'a',
    explanation: 'Nitrogen reduces oxidation, which can improve wetting and may allow a lower peak or shorter TAL, but it does not change the 217/219 °C of SAC305, the board thermal mass or the component classification temperature — those are properties of the materials, not of the atmosphere.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l05-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l05',
    prompt: 'A SnPb eutectic package is thinner than 2.5 mm and smaller than 350 mm³. Which classification temperature does the lesson give?',
    options: opts(
      '235 °C',
      '220 °C',
      '245 °C',
      '260 °C'
    ),
    correct: 'a',
    explanation: 'The lesson gives 235 °C for a SnPb package under 2.5 mm with a volume below 350 mm³, and 220 °C for everything else in that family. The 245 and 260 °C values are the lead-free classification ceilings for large and small packages, and mixing the alloy families is the error these numbers invite.',
    source: 'src-017'
  },
  {
    questionId: 'q-m06l05-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l05',
    prompt: 'A board with a measured thermal mass of 90 J/K receives about 100 W during the ramp. What heating rate does that give?',
    options: opts(
      '1.1 °C/s',
      '9.0 °C/s',
      '0.9 °C/s',
      '100 °C/s'
    ),
    correct: 'a',
    explanation: 'Rate = 100 W / 90 J/K = 1.11 °C/s, at the low end of the 1-3 °C/s guidance and the base for the lesson\'s estimate of 63 s from 150 °C to 219 °C. The 9.0 answer divides the thermal mass by ten, 0.9 inverts the division, and 100 °C/s drops the thermal mass entirely.',
    source: 'src-008'
  },

  /* exam */
  {
    questionId: 'q-m06l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l05',
    prompt: 'Which temperature is the reference for time above liquidus in each alloy family?',
    options: opts(
      'The liquidus: 219 °C for SAC305 and 183 °C for SnPb eutectic',
      'The solidus: 217 °C for SAC305 and 183 °C for SnPb eutectic',
      'The classification ceiling: 260 °C for SAC305 and 235 °C for SnPb',
      'The peak of the measured profile, whichever alloy is being run'
    ),
    correct: 'a',
    explanation: 'TAL is counted from the liquidus, where the alloy is fully molten: 219 °C for SAC305 and 183 °C for SnPb eutectic, which is both solidus and liquidus. The solidus marks the start of melting, the classification temperature is a ceiling for component survival, and using the measured peak as a reference would make TAL zero by definition.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'analyse',
    lessonId: 'm06l05',
    prompt: 'A SnAgCu profile peaks at 245 °C on a large package whose classification is 250 °C. What does the lesson say?',
    options: opts(
      'Acceptable, because the measured board temperature stays below the ceiling',
      'Unacceptable, because any SnAgCu peak above 240 °C damages components',
      'Acceptable only in nitrogen, because oxidation raises the effective peak',
      'Unacceptable, because 245 °C is above the SnPb ceiling for this package'
    ),
    correct: 'a',
    explanation: 'The lesson frames the peak as a ceiling rather than a target: 245 °C is fine when the measured board temperature remains below the J-STD-020 classification for that package size. The lessons give no 240 °C universal limit, nitrogen does not change the classification temperature, and the SnPb ceiling does not govern a lead-free assembly.',
    source: 'src-017'
  },
  {
    questionId: 'q-m06l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l05',
    prompt: 'The measured profile shows a TAL of 45 s where the guidance is 30-90 s. Which conclusion follows?',
    options: opts(
      'The TAL is inside the guidance, so it is not the cause of a wetting problem',
      'The TAL is below the guidance, so it must be extended before anything else',
      'The TAL is above the guidance, so the joints are over-exposed to heat',
      'The TAL cannot be judged without knowing the peak of the profile'
    ),
    correct: 'a',
    explanation: '45 s sits inside 30-90 s, so it does not explain a wetting failure, and the lesson\'s diagnosis moves to another zone rather than lengthening this one. Calling 45 s below or above the band misreads both ends, and the peak is a separate measure rather than a precondition for judging TAL.',
    source: 'src-008'
  },

  /* ===================== m06l06 — reflow defect atlas =================== */

  {
    questionId: 'q-m06l06-03',
    type: 'single',
    competencies: ['K5', 'K6'],
    bloom: 'understand',
    lessonId: 'm06l06',
    prompt: 'What makes a change to a profile "bounded"?',
    options: opts(
      'One variable is changed, the old and new values are recorded, and the result verified',
      'The change is small enough that the operator does not need to notify engineering',
      'The change is made within the oven recipe limits, so no documentation is needed',
      'The change is reversed if any defect appears anywhere in the following shift'
    ),
    correct: 'a',
    explanation: 'The lesson defines bounded change control as a single profile variable, old and new values recorded, and verification by measurement and inspection — the change has to be attributable and provable. Small size, recipe limits and a reactive reversal do not give that traceability.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l06-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l06',
    prompt: 'A chip stands on one end after reflow. Which mechanism does the lesson give?',
    options: opts(
      'One pad wets before the other, so surface tension lifts the un-wetted end',
      'The placement force was too high, so the part was pressed into the paste',
      'The paste volume was too low, so the part had nothing to hold it down',
      'The cooling rate was too fast, so the joint froze before it could level'
    ),
    correct: 'a',
    explanation: 'A tombstone comes from unequal wetting timing: whichever pad wets first pulls its end down and lifts the other, and the lesson ties that imbalance to preheat and soak behaviour and to pad thermal asymmetry. Force, paste volume and cooling all matter to placement and joints but none of them is the wetting mechanism.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l06-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l06',
    prompt: 'An isolated pad has 0.30 mm² of effective copper and its neighbour connects through a relief with 0.60 mm². What ratio applies, and what does it imply?',
    options: opts(
      '2.0, which supports a pad-level thermal imbalance as a cause',
      '0.5, which supports a pad-level thermal imbalance as a cause',
      '2.0, which rules out a pad-level thermal imbalance as a cause',
      '0.3, which rules out a pad-level thermal imbalance as a cause'
    ),
    correct: 'a',
    explanation: '0.60 / 0.30 = 2.0, and the lesson reads a ratio of that size as support for a thermal imbalance behind a tombstone, which then guides a bounded change to ramp or soak. Inverting the ratio or claiming the same number rules the cause out confuses which direction the evidence points.',
    source: 'src-008'
  },

  /* exam */
  {
    questionId: 'q-m06l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K6'],
    bloom: 'understand',
    lessonId: 'm06l06',
    prompt: 'Which defect does the lesson put with an uneven preheat or soak rather than with the reflow zone?',
    options: opts(
      'Tombstoning and beading',
      'Voiding and distortion',
      'Dewetting and balling',
      'Insufficient wetting at the fillet'
    ),
    correct: 'a',
    explanation: 'The lesson groups tombstone and beading with preheat and soak imbalance, and balling and dewetting with the reflow zone, while voids and distortion are handled through rheology, aperture and ramp. Getting that mapping right is what tells you which zone to change.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm06l06',
    prompt: 'Voids are suspected under a large thermal pad. What verification does the lesson require before the profile is changed?',
    options: opts(
      'X-ray or cross-section evidence, not a visual impression of the joint',
      'A second profile run at a higher peak, compared by visual inspection',
      'A shear test on the pad, since voids only matter for mechanical strength',
      'A paste lot swap, because voids are always a paste formulation problem'
    ),
    correct: 'a',
    explanation: 'The lesson asks for X-ray or cross-section when voids are suspected, together with thermocouples on the suspect and reference pads. A visual comparison, a mechanical test as the first check and a paste swap all act before the defect has been confirmed to exist.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm06l06',
    prompt: 'A joint wets and then pulls back from the pad edge leaving bare metal. What is that called?',
    options: opts(
      'Dewetting',
      'Non-wetting',
      'Balling',
      'Bridging'
    ),
    correct: 'a',
    explanation: 'Dewetting is the failure the lesson describes as wetting and then withdrawing, leaving thinned or exposed areas; non-wetting is a surface that never wet at all. Balling is a discrete sphere, and bridging is a short between adjacent pads.',
    source: 'src-008'
  },

  /* ===================== m06l07 — validation and change control ========= */

  {
    questionId: 'q-m06l07-03',
    type: 'single',
    competencies: ['K5', 'K9'],
    bloom: 'understand',
    lessonId: 'm06l07',
    prompt: 'When is a measured profile not valid as evidence?',
    options: opts(
      'When the thermocouple map, board orientation or carrier is not recorded',
      'When the measurement is taken on more than one board in the same run',
      'When the profile was taken during a trial rather than a production shift',
      'When the peak is recorded in whole degrees instead of one decimal place'
    ),
    correct: 'a',
    explanation: 'The lesson says a profile is not valid if the thermocouple positions and measurement conditions are unknown, because the numbers cannot then be tied to a joint. Multi-board measurement, trial conditions and rounding are all normal or harmless by comparison.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l07-04',
    type: 'single',
    competencies: ['K5', 'K9'],
    bloom: 'understand',
    lessonId: 'm06l07',
    prompt: 'Which distinction does the lesson draw between a recipe adjustment and a qualification?',
    options: opts(
      'A small bounded adjustment is verified by measurement; a larger change is not',
      'A recipe adjustment needs no verification; a qualification needs a full survey',
      'A recipe adjustment is made by the operator; a qualification is made by the OEM',
      'A recipe adjustment changes the paste; a qualification changes only the oven'
    ),
    correct: 'a',
    explanation: 'Change control separates a small bounded adjustment, provable by profile measurement and joint inspection, from a larger change such as a different oven, board or paste that needs qualification. Both go through the same people and the same records, and neither is defined by who signs it.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l07-05',
    type: 'calc',
    competencies: ['K5', 'K9'],
    bloom: 'apply',
    lessonId: 'm06l07',
    prompt: 'A measured profile shows TAL 45 s against a datasheet range of 60-90 s, peak 242 °C against 245-250 °C, with dull grainy joints. Which finding does the lesson treat as primary?',
    options: opts(
      'The TAL is short of its range, and the signature points at the reflow zone',
      'The peak is below its range, so the soak zone should be extended first',
      'Both values are inside tolerance, so the joints must be a paste defect',
      'Neither value matters until the cooling rate has been measured'
    ),
    correct: 'a',
    explanation: 'This is the lesson case: 45 s is below the 60 s floor, and the dull, grainy, non-wetting appearance points to the reflow zone, so the reflow zone is the first candidate and the change is bounded. The peak is also below its band, but the lesson pairs the visible signature with the reflow zone rather than with the soak, and neither value is inside tolerance.',
    source: 'src-008'
  },

  /* exam */
  {
    questionId: 'q-m06l07-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm06l07',
    prompt: 'What does profile validation check?',
    options: opts(
      'That the measured thermal history at the joint matches paste, part and board limits',
      'That the oven setpoints match the recipe file stored in the machine',
      'That the conveyor speed is identical on every shift of the week',
      'That the thermocouple logger has been calibrated within the last year'
    ),
    correct: 'a',
    explanation: 'Validation compares the thermal history at representative joints with the constraints from paste, components and board, measured on the board rather than in the air. Recipe matching, shift consistency and logger calibration are supporting controls, not the validation itself.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l07-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm06l07',
    prompt: 'Wetting is poor and the board looks cold at the joints. Which is the lesson\'s first candidate zone?',
    options: opts(
      'The reflow zone, since the joint may not be reaching enough time above liquidus',
      'The cooling zone, since slow cooling leaves a dull grainy surface',
      'The preheat zone, since a slow preheat evaporates too much solvent',
      'The conveyor, since speed changes only affect the coolest joints'
    ),
    correct: 'a',
    explanation: 'The lesson pairs poor wetting with the reflow zone and a cold joint at the board with the preheat or soak side, and it asks for the smallest change that tests the hypothesis. Cooling affects appearance after the joint has formed, and reflow is where wetting happens.',
    source: 'src-008'
  },
  {
    questionId: 'q-m06l07-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'apply',
    lessonId: 'm06l07',
    prompt: 'Which record set does the lesson want kept with a validated profile?',
    options: opts(
      'Profile, thermocouple map, paste lot, stack-up, recipe, reason and verification',
      'Profile chart, operator name, shift number and the date of the next audit',
      'Oven serial number, purchase date, service history and warranty status',
      'Thermocouple supplier, logger model, calibration lab and invoice number'
    ),
    correct: 'a',
    explanation: 'The lesson lists the measured profile, thermocouple map, paste lot, board stack-up, oven recipe, change reason, verification data and disposition, which is what makes the profile traceable later. The other lists record administration or equipment identity without the conditions that make the profile valid.',
    source: 'src-008'
  }

];

/* =========================================================================
 * phase1-m11.js — question bank content for module m11
 * (Hand Soldering and Rework), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 40-60 W iron and 340-360 °C
 * tip of m11l01, the 1.0-1.5 mm tip face and 345-625 °C·s index of m11l02,
 * the 245 °C / 45 s / 2-cycle budget of m11l03, the 20 % width reduction and
 * 0.06 mm ring of m11l04, the Class 3 lifted pad of m11l05 and the 248 °C /
 * 8 s / two-cycle record of m11l06.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

/* m11l01 — the hand soldering station */
module.exports = [

  {
    questionId: 'q-m11l01-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l01',
    prompt: 'Why is a soldering station described as a closed loop rather than a hot tool?',
    options: opts(
      'Controller, heater, tip, sensor and ground path all act on the joint',
      'The iron keeps a constant power output regardless of the joint mass',
      'The setpoint is fixed at the factory and needs no operator attention',
      'The tip stores enough heat that the heater never runs during contact'
    ),
    correct: 'a',
    explanation: 'The lesson treats the station as a loop where the sensor and controller respond to the heat the tip loses, which is why the setpoint is not the joint temperature. Constant power, a fixed factory value and a heater that never runs all contradict that description.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l01-04',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'apply',
    lessonId: 'm11l01',
    prompt: 'Which control does the lesson put on the bench beside the iron?',
    options: opts(
      'Local fume extraction, because flux decomposition products reach the operator',
      'A second iron, so that two operators can share one joint',
      'A cooling fan aimed at the tip, to keep the setpoint stable',
      'A spool of leaded wire, since lead-free solder fumes less'
    ),
    correct: 'a',
    explanation: 'The lesson asks for local exhaust placed between the joint and the operator\'s breathing zone, and treats ESD grounding as the other bench control. Extra irons, a cooling fan and a leaded substitution are not the controls it names.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l01-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l01',
    prompt: 'A 350 °C tip touches a joint for 2 s. What is the thermal budget index in the lesson\'s units?',
    options: opts(
      '700 °C·s',
      '175 °C·s',
      '352 °C·s',
      '70 °C·s'
    ),
    correct: 'a',
    explanation: 'The index multiplies the tip-to-joint step by the contact time, so 350 x 2 = 700 °C·s when no preheat is subtracted. The other options divide instead of multiply or lose a factor of ten.',
    source: 'src-024'
  },

  {
    questionId: 'q-m11l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l01',
    prompt: 'What does tip geometry have to match?',
    options: opts(
      'The joint size, so heat transfers without blocking the view of the fillet',
      'The iron wattage, since a bigger tip needs a bigger heater',
      'The solder wire diameter, so that wire and tip wear together',
      'The board thickness, because thick boards need conical tips'
    ),
    correct: 'a',
    explanation: 'The lesson chooses the tip for the joint: enough contact face for heat, small enough to see and reach the joint. Wattage, wire diameter and board thickness constrain the choice but do not set the geometry.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm11l01',
    prompt: 'A pad lifts while a small chip is hand soldered on a multilayer board. Which part of the loop does the lesson examine first?',
    options: opts(
      'Tip size, setpoint and contact time against the pad thermal mass',
      'The fume extractor, since airflow cools the joint unevenly',
      'The ESD wrist strap, because a poor ground damages the laminate',
      'The solder wire alloy, because a leaded wire lifts pads'
    ),
    correct: 'a',
    explanation: 'A lifted pad is a thermal and mechanical event at the joint, so the lesson reviews the tip, the setpoint and how long the operator stays on the pad. Extraction, grounding and alloy are real controls, but none of them explains a pad lifting under a hot tip.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l01',
    prompt: 'Which iron rating and tip face does the lesson give for a small chip on a thin pad?',
    options: opts(
      'A 40-60 W iron with a 0.5-1.0 mm contact face',
      'A 15-25 W iron with a 2.0 mm contact face',
      'A 100-150 W iron with a conical 0.2 mm tip',
      'Any iron, since the setpoint alone controls the heat delivered'
    ),
    correct: 'a',
    explanation: 'The lesson pairs a 40-60 W rework iron with a 0.5-1.0 mm chisel or conical face for a small chip. A weak iron with a large face, an oversized iron with a tiny tip and a claim that setpoint alone decides the heat all misstate how the loop behaves.',
    source: 'src-024'
  },

  /* m11l02 — technique */
  {
    questionId: 'q-m11l02-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l02',
    prompt: 'What is the correct contact order in manual rework?',
    options: opts(
      'Heat the joint, feed solder to the joint, remove the solder, then remove the tip',
      'Feed solder onto the tip, then carry it to the joint and hold until it flows',
      'Place the tip on the component body first, so the part expands before the joint',
      'Feed solder to the joint first, then bring the tip in to melt what has landed'
    ),
    correct: 'a',
    explanation: 'The lesson requires heat to reach the joint before solder is added, and the removal order mirrors it so the joint freezes under the tip rather than after it. Melting on the tip, heating the body first and landing cold solder all break the thermal path the technique depends on.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l02-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l02',
    prompt: 'A joint does not wet within the planned dwell. What does the lesson say to do?',
    options: opts(
      'Stop and reassess the thermal budget instead of extending the dwell',
      'Hold the tip on the joint until it finally wets, since heat is the cure',
      'Add more solder wire, because the flux needs fresh material to work',
      'Press the tip harder into the joint so more contact area is available'
    ),
    correct: 'a',
    explanation: 'The lesson makes dwell a window with a stop rule: if the joint does not wet, the setup is wrong and longer contact adds damage rather than wetting. More solder, more dwell and more pressure all raise the risk of lifted pads and charred laminate.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l02-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l02',
    prompt: 'A 330-350 °C tip meets a board preheated to 100 °C, with 1.5-2.5 s of contact. What index does the lesson record?',
    options: opts(
      '345-625 °C·s per contact',
      '495-875 °C·s per contact',
      '230-250 °C·s per contact',
      '345-625 °C per contact'
    ),
    correct: 'a',
    explanation: 'The step is 230-250 °C, and multiplied by 1.5-2.5 s it gives 345-625 °C·s, which is the band the lesson states. The second option forgets to subtract the preheat, the third reports the step without the time, and the last drops the seconds from the unit.',
    source: 'src-024'
  },

  {
    questionId: 'q-m11l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l02',
    prompt: 'Why is solder fed to the joint rather than melted on the tip?',
    options: opts(
      'Feed controls the volume and keeps the flux working at the joint',
      'Wire melts faster on the tip, so melting there saves dwell time',
      'The tip cannot be tinned once wire has touched it directly',
      'Fed solder carries more heat into the joint than tip contact does'
    ),
    correct: 'a',
    explanation: 'Feeding to the joint lets the wire size and feed length set the volume while the flux stays where the joint is. Melting on the tip burns flux away before it can act, and the claims about tinning and heat transfer invert how the joint is heated.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm11l02',
    prompt: 'A disturbed, grainy joint appears on a hand-reworked connector pin. Which cause fits the lesson?',
    options: opts(
      'The joint was moved or the iron withdrawn before it solidified',
      'The solder alloy was lead-free, which always freezes grainy',
      'The tip was too wide, so the fillet could not form a concave shape',
      'The wire diameter was too small for the joint volume required'
    ),
    correct: 'a',
    explanation: 'A disturbed joint means movement during solidification, which in hand work usually means the tip or the part moved too early. Alloy, tip width and wire diameter affect wetting and volume, but they do not produce the crystalline fracture pattern of a joint that was disturbed.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l02',
    prompt: 'A 0.8 mm lead needs a tip. What contact face does the lesson specify, and why?',
    options: opts(
      '1.0-1.5 mm, slightly wider than the lead, so heat bridges to pad and lead',
      '0.2-0.4 mm, narrower than the lead, so the tip stays clear of the mask',
      '2.5-3.0 mm, so the whole annular ring is covered in one contact',
      'Any face, provided the tip temperature is raised to compensate'
    ),
    correct: 'a',
    explanation: 'The lesson asks for a chisel or hoof face slightly wider than the lead so that the tip touches the lead and the pad together. A narrower face cannot bridge both, an oversized face spreads heat to neighbours, and raising the temperature to cover a poor choice adds stress.',
    source: 'src-024'
  },

  /* m11l03 — rework of area arrays */
  {
    questionId: 'q-m11l03-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l03',
    prompt: 'What does the lesson count as a rework cycle?',
    options: opts(
      'Each thermal exposure of the component and its area of the board',
      'Each time the board is removed from the line and returned to it',
      'Each operator who touches the assembly during the rework',
      'Each time the program is reloaded into the rework station'
    ),
    correct: 'a',
    explanation: 'The cycle count exists to track heat, so every thermal exposure of that component and its area counts, which is why an iron touch-up adds a cycle to a hot-air pass. Moving the board, the number of operators and a program reload are not thermal events.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l03-04',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm11l03',
    prompt: 'What must be measured before a rework peak can be compared with a paste limit?',
    options: opts(
      'The temperature at the joint or body, not only the hot-air controller reading',
      'The pressure in the hot-air nozzle, converted into an equivalent temperature',
      'The time the nozzle spends moving between adjacent components',
      'The ambient humidity in the rework area at the start of the shift'
    ),
    correct: 'a',
    explanation: 'The lesson insists the peak is measured where the limit applies, because the controller setpoint is not the joint temperature. Nozzle pressure, nozzle travel and room humidity do not give a temperature to compare with a component or paste limit.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l03-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l03',
    prompt: 'A second cycle is planned with a 245 °C peak for 45 s against a 250 °C maximum and a 30-60 s range. What is the finding?',
    options: opts(
      'Both values are inside the budget, and the cycle count reaches the allowed two',
      'The dwell is outside the range, so the cycle must be re-planned',
      'The peak exceeds the maximum, so the part cannot be reworked',
      'The values pass, so the measurement point no longer matters'
    ),
    correct: 'a',
    explanation: '245 °C is below 250 °C, 45 s sits inside 30-60 s, and one previous plus one proposed cycle equals the allowed two, so the operation fits the budget. The lesson then adds that the peak must have been measured at the joint rather than read from the controller.',
    source: 'src-024'
  },

  {
    questionId: 'q-m11l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l03',
    prompt: 'How does the lesson want a BGA removed?',
    options: opts(
      'Heat until the solder collapses, then lift with minimal force',
      'Pry from one corner while the solder is still solid',
      'Twist the package once the balls soften and then pull straight up',
      'Lift immediately when the hot air reaches its setpoint'
    ),
    correct: 'a',
    explanation: 'Removal waits for collapse and then uses minimal force, which protects pads and neighbouring joints. Prying, twisting and lifting on a setpoint rather than on the solder condition all risk torn pads.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm11l03',
    prompt: 'What does paste-in-pad require before it can be used for a QFN replacement?',
    options: opts(
      'That the design and process allow it, with the deposit volume controlled',
      'Only that the operator has a stencil small enough for the land pattern',
      'That the component is a BGA rather than a QFN or MLF package',
      'Nothing beyond the rework station, since the paste is self-limiting'
    ),
    correct: 'a',
    explanation: 'The lesson allows paste-in-pad for QFN, MLF and some land-pattern replacements when design and process permit, with the deposit volume under control. Stencil size alone, a package restriction and an assumption of self-limiting paste all skip that condition.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l03',
    prompt: 'Which records does the lesson require for a completed BGA replacement?',
    options: opts(
      'Station, nozzle, preheat, measured peak, dwell, cycles, paste lot, inspection',
      'The machine serial number and the date of the next calibration',
      'The solder pot analysis and the ambient humidity of the room',
      'The operator\'s training certificate and the shift handover note'
    ),
    correct: 'a',
    explanation: 'The lesson lists operator, date, station, nozzle, preheat, measured peak, dwell, cycle count, paste and flux lots, plus the inspection method and result. Equipment identity, pot chemistry, humidity and training records do not show what the joint experienced.',
    source: 'src-024'
  },

  /* m11l04 — repair limits */
  {
    questionId: 'q-m11l04-03',
    type: 'single',
    competencies: ['K4', 'K6'],
    bloom: 'understand',
    lessonId: 'm11l04',
    prompt: 'How does the lesson evaluate a conductor that was cut and repaired?',
    options: opts(
      'As a width reduction measured against the originally designed width',
      'As an absolute width, compared with the narrowest conductor on the board',
      'As a length of missing copper, measured along the trace centreline',
      'As a resistance increase, measured from end to end of the conductor'
    ),
    correct: 'a',
    explanation: 'The lesson treats a cut as a width-reduction question relative to the design width, which is how the limit is expressed. An absolute width, a missing length and an end-to-end resistance are different measures that the class limits do not use.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l04-04',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm11l04',
    prompt: 'What makes a defect repairable rather than scrap?',
    options: opts(
      'A qualified method can reach the required class and the risk is recorded',
      'The customer has not yet complained about the same defect',
      'The area is small enough that a second operator can hide the mark',
      'The board is expensive enough to justify the attempt'
    ),
    correct: 'a',
    explanation: 'The lesson sets three conditions: damage inside the applicable limits, a qualified method for that laminate and finish, and a recorded residual risk. Complaint history, cosmetic concealment and cost are not part of the decision framework.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l04-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l04',
    prompt: 'A 0.30 mm trace is repaired to 0.24 mm. What width reduction does that represent?',
    options: opts(
      '20 %, exactly at the Class 2 limit in the case',
      '6 %, measured as the millimetre difference alone',
      '25 %, obtained by dividing the original width by the new one',
      '80 %, since 0.24 of 0.30 remains'
    ),
    correct: 'a',
    explanation: '0.06 / 0.30 = 0.20, so 20 %, which the lesson finds exactly at the Class 2 limit and therefore acceptable only if the controlled revision and customer specification allow it. The other options mistake a difference for a ratio or invert the comparison.',
    source: 'src-024'
  },

  {
    questionId: 'q-m11l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l04',
    prompt: 'What does the lesson say about a laminate scratch depth limit?',
    options: opts(
      'The repair standard sets no depth limit; prohibited conditions decide',
      'A scratch deeper than 0.05 mm is always scrap, whatever the class',
      'Depth matters only above 0.5 mm, where the laminate is structurally weak',
      'Depth is irrelevant, so only the visual appearance is assessed'
    ),
    correct: 'a',
    explanation: 'The lesson states that the repair standard sets no depth limit and instead asks whether delamination, blistering, separation or exposed conductor is present. Inventing a fixed depth threshold is exactly the kind of number the lesson refuses to supply.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm11l04',
    prompt: 'A repaired hole shows 0.06 mm of annular ring on a Class 2 assembly. How does the lesson read it?',
    options: opts(
      'It clears the 0.05 mm Class 3 minimum quoted in the case and is acceptable',
      'It fails, because Class 2 requires a ring of at least 0.10 mm',
      'It fails, because any ring below 0.075 mm is scrap for a repaired hole',
      'It cannot be judged without knowing the original pad diameter'
    ),
    correct: 'a',
    explanation: 'The case compares 0.06 mm with the 0.05 mm figure it cites for that class and finds the hole acceptable if the controlled revision confirms the minimum. The other options introduce thresholds the lesson does not have.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l04',
    prompt: 'What does the lesson want the disposition record to contain?',
    options: opts(
      'The class, the measured values, the criteria applied and the residual risk',
      'The class alone, since the measurements are stored with the product',
      'A photograph and the shift supervisor\'s signature',
      'The repair method and the cost of the operation'
    ),
    correct: 'a',
    explanation: 'The record has to let another engineer repeat the decision, so it carries the class, the measurements, the criteria and the risk accepted. A bare class, a signature and a method-plus-cost entry all leave out the reasoning.',
    source: 'src-024'
  },

  /* m11l05 — acceptance and re-inspection */
  {
    questionId: 'q-m11l05-03',
    type: 'single',
    competencies: ['K4', 'K6'],
    bloom: 'understand',
    lessonId: 'm11l05',
    prompt: 'How does the lesson separate rework from repair?',
    options: opts(
      'Rework restores the original design; repair accepts a deviation from it',
      'Rework is done by hand; repair is done with hot air on a station',
      'Rework needs no record; repair has to be documented and approved',
      'Rework applies to SMT; repair applies only to through-hole joints'
    ),
    correct: 'a',
    explanation: 'Rework brings the assembly back to the original specification, while a repair leaves it meeting a defined, accepted deviation. The tooling, the paperwork and the mounting technology do not define the difference.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l05-04',
    type: 'single',
    competencies: ['K4', 'K6'],
    bloom: 'understand',
    lessonId: 'm11l05',
    prompt: 'What does re-inspection have to cover beyond the joint that was touched?',
    options: opts(
      'Adjacent joints, the component body and leads, the pad, trace and mask',
      'Only the touched joint, since the others were already accepted',
      'The whole panel again at first-article depth, regardless of scope',
      'The stencil and the paste lot used for the original build'
    ),
    correct: 'a',
    explanation: 'The lesson extends re-inspection to the neighbours and the surrounding pad, trace and mask, because heat and handling spread. Touching only the joint misses the damage rework causes, and re-qualifying the whole panel or the print setup is out of scope.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l05-05',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'apply',
    lessonId: 'm11l05',
    prompt: 'Hot-air rework on a Class 3 assembly leaves a lifted pad and exposed copper. What follows from the lesson?',
    options: opts(
      'The condition fails Class 3, so a qualified repair or scrap decides it',
      'The condition is acceptable if the joint still conducts electrically',
      'The condition is a rework defect, so the board returns to the line as is',
      'The condition is cosmetic, since the pad is under the component body'
    ),
    correct: 'a',
    explanation: 'A lifted pad with exposed copper does not meet the construction and visual criteria the class demands, so only a qualified repair meeting Class 3, or scrap, resolves it. Continuity, a return to the line and a cosmetic reading all fail to apply the class.',
    source: 'src-024'
  },

  {
    questionId: 'q-m11l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l05',
    prompt: 'Where does the required class come from?',
    options: opts(
      'The customer, the product specification or the reliability requirement',
      'The operator, who selects the class that matches the observed condition',
      'The solder supplier, whose datasheet lists the applicable class',
      'The rework station vendor, according to the machine capability'
    ),
    correct: 'a',
    explanation: 'The lesson fixes the class before inspection, from the customer, the product specification or the reliability need. Choosing a class to fit the defect would make acceptance meaningless, and neither supplier nor vendor sets it.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm11l05',
    prompt: 'What does the record have to state besides the method and the materials?',
    options: opts(
      'The original defect, the required class, the operator and the residual risk',
      'The rework time in minutes and the station utilisation for the shift',
      'The price of the component replaced during the operation',
      'The customer\'s approval of the rework, obtained before starting'
    ),
    correct: 'a',
    explanation: 'The lesson asks for the original defect, the class, the method, the materials, the operator and the residual risk, so the decision can be defended later. Timing, cost and a blanket customer approval are not the fields it names.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l05',
    prompt: 'In what order does the lesson have the inspector work?',
    options: opts(
      'Confirm the class, inspect against the criteria, then decide repair or scrap',
      'Inspect the area, then choose the class that the result meets',
      'Decide repair or scrap, then find the criterion that supports it',
      'Check the rework record first, then inspect only what it describes'
    ),
    correct: 'a',
    explanation: 'The class is fixed first, the inspection is judged against its criteria, and only then does the repair-or-scrap question arise. The other orders let the observation choose its own standard, which is the failure the lesson is written to prevent.',
    source: 'src-024'
  },

  /* m11l06 — practice */
  {
    questionId: 'q-m11l06-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l06',
    prompt: 'What does the lesson require before heat is applied to the joint?',
    options: opts(
      'The allowed cycles, peak, dwell, preheat and cooling recorded first',
      'A photograph of the defect taken with the station camera',
      'Approval from the customer for the specific rework operation',
      'A second operator standing by to confirm the result'
    ),
    correct: 'a',
    explanation: 'The thermal budget is written down before the iron or hot air touches the joint, so the operation can be judged against something. A photograph, a customer approval and a second opinion are not what the practice asks for at that point.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l06-04',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm11l06',
    prompt: 'Why is the iron touch-up counted as a separate cycle in the lesson case?',
    options: opts(
      'It is another thermal exposure of the joint, whatever the tool',
      'It uses a different solder alloy, so the alloy change counts',
      'It happens after inspection, so the record needs a second line',
      'It is performed by a different operator, which counts as a cycle'
    ),
    correct: 'a',
    explanation: 'The count tracks heat delivered to the joint, so a hot-gas pass plus a 2 s iron touch-up is two cycles against a limit of two. Alloy, inspection order and operator identity are not what the count measures.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l06-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l06',
    prompt: 'A budget allows 250 °C for 10 s and two cycles. The hot gas measures 248 °C for 8 s, and an iron then touches for 2 s. What is the position?',
    options: opts(
      'Two cycles are used and the hot gas is inside both limits; the joint peak must still be checked',
      'The operation is over budget, because the iron adds temperature beyond 250 °C',
      'The operation is within budget, so the joint peak during the touch-up need not be known',
      'The operation is over budget, because 8 s plus 2 s exceeds the 10 s dwell limit'
    ),
    correct: 'a',
    explanation: 'The lesson counts two cycles, finds 248 °C below 250 °C and 8 s below 10 s, and then requires the joint peak during the iron touch-up to be confirmed against the same 250 °C limit. Adding the two contact times into one dwell and assuming the tip temperature is the joint temperature are the two misreadings it warns against.',
    source: 'src-024'
  },

  {
    questionId: 'q-m11l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm11l06',
    prompt: 'What does the rework record have to identify?',
    options: opts(
      'The assembly and serial, the operator and station, the defect and the action',
      'The assembly serial number alone, since the rest is traceable from it',
      'The operator and the shift, because the tool data is logged by the machine',
      'The defect and the materials, since the outcome is visible on the board'
    ),
    correct: 'a',
    explanation: 'The lesson asks for the assembly, serial, date, operator, station, original defect, action taken and the result, so the class claim can be supported. Any subset that drops the action or the result leaves the record unable to defend the decision.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm11l06',
    prompt: 'Which failure mode does the lesson put first among problems to watch in practice?',
    options: opts(
      'Insufficient wetting, then lifted pads and thermal damage',
      'Cosmetic flux staining, then discoloured solder mask',
      'Excess solder on the far side of the board, then solder balls',
      'Component marking damage from the hot-air nozzle'
    ),
    correct: 'a',
    explanation: 'The lesson lists insufficient wetting, lifted pads and thermal damage to components or laminate as the typical problems, with residue and cosmetics later. Staining, stray solder and marking damage are real observations but not the headline risks.',
    source: 'src-024'
  },
  {
    questionId: 'q-m11l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm11l06',
    prompt: 'How does the lesson classify the reworked joint?',
    options: opts(
      'Against the IPC-A-610 criteria for the required class, then the repair standard',
      'Against the visual result alone, since the class was met at first build',
      'Against the operator\'s own judgement, recorded as accepted by experience',
      'Against the reflow profile, since the thermal history sets acceptance'
    ),
    correct: 'a',
    explanation: 'The joint is judged on the workmanship criteria for the required class, and then the rework itself is confirmed against the repair standard. The first-build class, personal judgement and the profile do not replace those criteria.',
    source: 'src-024'
  }

];

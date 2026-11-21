/* =========================================================================
 * phase1-m12.js — question bank content for module m12
 * (Cleaning and Conformal Coating), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 0.82 vs 1.00 µg NaCl/cm² and
 * 8.5 x 10^7 vs 1.0 x 10^8 ohm pair of m12l01, the 70 minute cycle in a
 * 240 minute floor life of m12l02, the blank-corrected 0.31 µg and 140
 * particles/cm² of m12l03, the rework-versus-silicone logic of m12l04, the
 * 165 µm / 45 % / 74.25 µm film of m12l05 and the 20 % exceedance of m12l06.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m12l01 — residue and why it matters ============ */

  {
    questionId: 'q-m12l01-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l01',
    prompt: 'Why can an ionic residue cause a failure that only appears in service?',
    options: opts(
      'With moisture and bias it conducts and corrodes, long after the board was built',
      'It changes the solder alloy composition, so joints embrittle over months',
      'It absorbs heat during reflow, which leaves joints under the specified peak',
      'It blocks the conformal coating from curing, so protection never forms'
    ),
    correct: 'a',
    explanation: 'The lesson describes ionic contamination as a latent risk that needs moisture and voltage to bite, which is why cleanliness is verified rather than judged visually. Alloy change, a reflow heat sink and a coating cure failure are different mechanisms from the electrochemical one it names.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l01-05',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l01',
    prompt: 'What does a surface insulation resistance test measure?',
    options: opts(
      'Leakage across the board surface under a stated humidity and bias',
      'The resistance of the copper traces from end to end of the board',
      'The ionic content extracted into a solvent bath, in µg NaCl per cm²',
      'The dielectric strength of the laminate between two copper layers'
    ),
    correct: 'a',
    explanation: 'SIR measures surface leakage under specified humidity and bias, which is why the lesson insists the condition be quoted with the result. Trace resistance, extraction conductivity and laminate breakdown are the subjects of other tests.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l01-03',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l01',
    prompt: 'ROSE reads 0.82 µg NaCl/cm² against a 1.00 limit, and SIR reads 8.5 × 10⁷ Ω against a 1.0 × 10⁸ Ω requirement. What is the decision?',
    options: opts(
      'ROSE passes but SIR fails, so the cleaning decision does not pass',
      'Both pass, since the SIR reading is within 15 % of the requirement',
      'Both fail, because any ionic reading above zero is unacceptable',
      'ROSE fails, so the SIR result need not be considered'
    ),
    correct: 'a',
    explanation: 'The ionic reading is below its limit, but 8.5 × 10⁷ Ω is an order-of-magnitude short of the 1.0 × 10⁸ Ω requirement, and the lesson treats the reliability specification as the governing criterion. A near miss is a miss, a non-zero ionic reading is normal, and one failing test does not make the other irrelevant.',
    source: 'src-027'
  },

  /* exam */
  {
    questionId: 'q-m12l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l01',
    prompt: 'What does a no-clean flux leave behind?',
    options: opts(
      'An organic film plus ionic activators that can still need removal',
      'Nothing at all, since the classification means no residue is present',
      'Only pure rosin, which is electrically inert in every condition',
      'A metallic layer that bonds to the pad and lowers contact resistance'
    ),
    correct: 'a',
    explanation: 'The lesson says a no-clean flux can leave an organic film and ionic activators, so the classification describes what may remain rather than a clean board. Inert rosin under all conditions and a beneficial metallic layer are not what the module describes.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm12l01',
    prompt: 'A board carries bottom-terminated QFNs. Why does that constrain the cleaning method?',
    options: opts(
      'The chemistry has to wet, penetrate and rinse a gap that is barely open',
      'The packages are too heat-sensitive to survive any wet process',
      'The terminations dissolve in water, so only solvent cleaning can be used',
      'The packages trap air, so cleaning must be done under vacuum only'
    ),
    correct: 'a',
    explanation: 'A gap under a bottom termination is hard to reach and hard to rinse, so the lesson asks for low surface tension and a proper rinse rather than for a merely wet surface. Heat sensitivity, water solubility and a vacuum requirement are not the constraints the module states.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'apply',
    lessonId: 'm12l01',
    prompt: 'What does a measured SIR result have to state to be meaningful?',
    options: opts(
      'The humidity, the bias and the test condition it was run under',
      'The manufacturer of the instrument and its last calibration date',
      'The number of coupons tested and the name of the operator',
      'The laminate type, since SIR is a property of the material only'
    ),
    correct: 'a',
    explanation: 'Surface leakage depends on moisture and voltage, so a bare number cannot be compared with a specification — which is why the lesson ties the requirement to a stated condition. Instrument identity, sample administration and laminate type do not substitute for the condition.',
    source: 'src-027'
  },

  /* ===================== m12l02 — cleaning methods ======================= */

  {
    questionId: 'q-m12l02-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l02',
    prompt: 'What makes ultrasonic cleaning a risk as well as a benefit?',
    options: opts(
      'Cavitation lifts particles but can stress sensitive packages and bonds',
      'The bath heats the board above the laminate glass transition',
      'The sound waves ionise the water, which adds chloride to the surface',
      'It removes the solder mask along with the residue, exposing copper'
    ),
    correct: 'a',
    explanation: 'The lesson treats cavitation as mechanical action that helps with particulates while carrying a compatibility risk for delicate parts. Overheating, ionisation and mask removal are not the mechanism it describes.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l02-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm12l02',
    prompt: 'Why does the lesson check MSL and ESD before choosing a cleaning method?',
    options: opts(
      'Wet processes add moisture and charge, which the floor life and ESD rules govern',
      'Solvents dissolve the moisture sensitivity label printed on the bag',
      'ESD controls only apply to components that have already been cleaned',
      'MSL classification is set by the cleaning chemistry chosen at the line'
    ),
    correct: 'a',
    explanation: 'Cleaning adds both moisture and electrostatic risk, so the lesson lists MSL floor-life rules and ESD controls as constraints on the method. The other options either invert the direction of the rule or misstate where the classification comes from.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l02-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l02',
    prompt: 'Cleaning, rinsing, drying and handling total 70 min inside a 4 h floor life. What remains, and what does it mean?',
    options: opts(
      '170 min, which fits, but the window now covers coating and not just cleaning',
      '170 min, which is irrelevant because cleaning restarts the floor life',
      '240 min, because the floor life clock stops while the board is wet',
      '40 min, because drying consumes most of the 4 h allowance'
    ),
    correct: 'a',
    explanation: '240 - 70 = 170 min, and the lesson uses that remainder to plan the coating step before the floor life is exceeded. Cleaning does not reset the clock, the clock runs through the wet process, and 40 min is not a figure the case produces.',
    source: 'src-027'
  },

  /* exam */
  {
    questionId: 'q-m12l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l02',
    prompt: 'Which residue does aqueous cleaning suit best?',
    options: opts(
      'Water-soluble flux residue, which the water-based chemistry can dissolve',
      'Cured no-clean flux, which water removes more effectively than solvent',
      'Silicone oils, which emulsify readily in plain deionised water',
      'Conformal coating overspray, which water lifts without additives'
    ),
    correct: 'a',
    explanation: 'The lesson matches the chemistry to the residue, and water-soluble flux is the case it names for aqueous cleaning. Polymerised no-clean, silicone oils and cured coating all need other chemistry or mechanical removal.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm12l02',
    prompt: 'A board with trapped particulates in through-holes needs cleaning. What does the lesson add to the method?',
    options: opts(
      'Mechanical assistance, such as agitation or ultrasonic energy',
      'A longer rinse only, since particles dissolve given enough water',
      'A hotter bath, because particles soften above the flux melting point',
      'A second cleaning pass with the same chemistry and no agitation'
    ),
    correct: 'a',
    explanation: 'Particles have to be dislodged rather than dissolved, so the lesson brings in agitation or ultrasonic action with its compatibility caveat. A longer rinse, a hotter bath and a repeat pass all leave the particles where they are.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l02',
    prompt: 'Which checks does the lesson require before conformal coating starts?',
    options: opts(
      'Residue, cleanliness result, dry state and material compatibility',
      'The coating thickness alone, since it sets the protection level',
      'The operator certification and the shift production target',
      'The bath temperature and the number of boards already processed'
    ),
    correct: 'a',
    explanation: 'Coating over a wet or contaminated surface seals the problem in, so the lesson verifies residue, cleanliness, dryness and compatibility first. Thickness, staffing and bath history are process data rather than a gate before coating.',
    source: 'src-027'
  },

  /* ===================== m12l03 — cleanliness verification ============== */

  {
    questionId: 'q-m12l03-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l03',
    prompt: 'What does ROSE actually measure?',
    options: opts(
      'Conductivity of an extract, reported as an NaCl equivalent per area',
      'The individual concentration of chloride, sulfate and nitrate ions',
      'The number of particles above five micrometres per square centimetre',
      'The visible residue left on the surface after a solvent rinse'
    ),
    correct: 'a',
    explanation: 'ROSE extracts ionic material into a solvent and reads conductivity, then reports the result as an equivalent, which is why it cannot say which ion caused it. Individual ions are ion chromatography, particles are a count, and visible residue is visual inspection.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l03-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm12l03',
    prompt: 'Why does the lesson subtract a blank before judging a ROSE result?',
    options: opts(
      'The solvent and container carry their own ionic background onto the result',
      'The blank records the board area, which the instrument cannot measure itself',
      'Subtracting the blank converts micrograms into NaCl equivalents',
      'The blank compensates for the fact that the extract is always saturated'
    ),
    correct: 'a',
    explanation: 'The blank is the same procedure with no board, and its reading is background that would otherwise be credited to the assembly. Area, unit conversion and saturation are separate concerns from the blank correction.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l03-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l03',
    prompt: 'ROSE reads 0.34 with a 0.03 blank against a 0.25 limit; chloride 0.12 against 0.10; 1,400 particles over 10 cm² against 100/cm². What is the decision?',
    options: opts(
      'Rework: the corrected ROSE, the chloride and the particle count all fail',
      'Pass: the visual check found nothing, which controls the decision',
      'Pass: only the chloride is over its limit, and by a small margin',
      'Rework: the particle count fails, but the ROSE result is acceptable'
    ),
    correct: 'a',
    explanation: '0.31 exceeds 0.25, 0.12 exceeds 0.10 and 140/cm² exceeds 100/cm², so three criteria fail and the board is reworked. Visual inspection passing does not rescue a failed measurement, and the last option misreads the blank correction.',
    source: 'src-027'
  },

  /* exam */
  {
    questionId: 'q-m12l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l03',
    prompt: 'What does ion chromatography add to a ROSE result?',
    options: opts(
      'It identifies and quantifies individual ions, with their own limits',
      'It measures total ionic content faster and to a lower detection limit',
      'It converts the conductivity reading into a NaCl equivalent directly',
      'It replaces the need for any sampling or blank correction'
    ),
    correct: 'a',
    explanation: 'Chromatography separates the species, which is why the lesson can set a chloride limit apart from a sulfate one. Speed, unit conversion and freedom from sampling are all misdescriptions of what it does.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm12l03',
    prompt: 'Where does an acceptance limit for cleanliness come from?',
    options: opts(
      'The customer specification, the product requirement or the applicable standard',
      'The test bench, which sets a limit from the first measured result',
      'The cleaning chemistry datasheet, which states the residual limit',
      'The highest value seen on the line that did not cause a complaint'
    ),
    correct: 'a',
    explanation: 'The lesson states that a cleanliness criterion is never invented at the bench, it comes from the customer, the product requirement or the standard. Deriving limits from data, chemistry datasheets or complaints inverts that order.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l03',
    prompt: 'A particle sample of 1,400 counts is taken over 10 cm². How is it compared with a per-square-centimetre limit?',
    options: opts(
      'Normalise it to 140 per cm², which exceeds a limit of 100 per cm²',
      'Compare 1,400 directly with 100, which fails by a factor of fourteen',
      'Multiply 1,400 by 10, since the sample covers ten square centimetres',
      'Average it with the ROSE result, since both describe surface condition'
    ),
    correct: 'a',
    explanation: '1400 / 10 = 140 particles per cm², which does fail against 100 — but only after the normalisation the lesson requires. Comparing the raw count, multiplying by the area or blending two different measurements all produce a number that cannot be judged.',
    source: 'src-027'
  },

  /* ===================== m12l04 — coating types ========================= */

  {
    questionId: 'q-m12l04-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l04',
    prompt: 'Why does the lesson reject silicone next to a gold-plated edge connector?',
    options: opts(
      'Silicone can migrate and raise contact resistance on the plating',
      'Silicone dissolves the gold finish during the cure step',
      'Silicone cannot cure in the humidity the board will see in service',
      'Silicone is too hard, so it cracks the connector housing'
    ),
    correct: 'a',
    explanation: 'Migration and contact resistance are the reason the case gives for keeping silicone away from the connector. Dissolving gold, humidity cure failure and hardness are not the mechanisms the lesson describes.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l04-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm12l04',
    prompt: 'What does parylene offer that the other coatings do not?',
    options: opts(
      'A very thin, uniform, pinhole-free film deposited from vapour',
      'A coating that can be removed locally without any mechanical work',
      'The highest resistance to ultraviolet light of the coating families',
      'A cure that needs no masking, since it only lands on metal'
    ),
    correct: 'a',
    explanation: 'The lesson describes parylene as vapour-deposited, thin, uniform and free of pinholes. Local removal is its weakness rather than its strength, and neither UV resistance nor a selective landing is claimed for it.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l04-05',
    type: 'single',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l04',
    prompt: 'A dense control board must survive humidity, stay reworkable and sit beside a gold connector. What does the lesson choose?',
    options: opts(
      'Urethane, with acrylic as the backup if rework becomes difficult',
      'Silicone, because its flexibility protects the connector from stress',
      'Parylene, because its thin film keeps the connector clearance open',
      'UV cure, because shadowed areas under tall parts cure fastest'
    ),
    correct: 'a',
    explanation: 'The case selects urethane for moisture and chemical resistance with board-level rework, and keeps acrylic as the easier-to-remove fallback. Silicone is rejected at the connector, parylene loses on rework, and UV cure loses on shadowing under tall parts.',
    source: 'src-027'
  },

  /* exam */
  {
    questionId: 'q-m12l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l04',
    prompt: 'Which property makes acrylic the easiest coating for board-level rework?',
    options: opts(
      'It can be removed with common solvents and mechanical work',
      'It cures so slowly that the joint can be reworked before it sets',
      'It conducts enough current to allow in-circuit testing after coating',
      'It reflows at the soldering temperature, so the iron clears it'
    ),
    correct: 'a',
    explanation: 'Acrylic is chosen when access matters because it comes off with solvent and modest mechanical effort. Cure speed, conductivity and reflow behaviour are not the properties the lesson attributes to it.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm12l04',
    prompt: 'A UV-cure coating leaves tacky patches under tall connectors. What does the lesson explain?',
    options: opts(
      'Shadowed areas receive no UV, so the coating there does not cure',
      'The connectors absorb the UV and re-emit it at a longer wavelength',
      'The coating lot was applied too thin for the UV dose available',
      'UV coatings only cure on metal surfaces, not on laminate'
    ),
    correct: 'a',
    explanation: 'Shadowing is the limitation the lesson attaches to UV-cure systems, which is why a board with tall parts does not use one as its primary coating. Absorption by connectors, an under-thick film and a metal-only cure are not the mechanism given.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l04',
    prompt: 'What must a masking plan protect?',
    options: opts(
      'Connectors, test points, switches, heatsink interfaces, optics and antennas',
      'Every through-hole joint, since coating weakens a filled barrel',
      'Only the board edges, where the conveyor clamps make contact',
      'The component reference designators, so that they stay readable'
    ),
    correct: 'a',
    explanation: 'The lesson masks what must stay functional or accessible: connectors, test points, switches, thermal interfaces, optical parts and antennas. Coating a filled barrel, the conveyor edges and the legends are not the masking priorities it states.',
    source: 'src-027'
  },

  /* ===================== m12l05 — application =========================== */

  {
    questionId: 'q-m12l05-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l05',
    prompt: 'What does volume solids decide in a spray coating process?',
    options: opts(
      'How much of the wet film thickness survives as dry film',
      'How fast the spray nozzle has to traverse the board',
      'Whether the coating can be cured at room temperature',
      'How much masking the board needs before spraying'
    ),
    correct: 'a',
    explanation: 'Solvent leaves during cure, so the dry film is the wet film scaled by the volume solids fraction — the relationship the lesson case works through. Traverse speed, cure temperature and masking scope are set by other factors.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l05-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm12l05',
    prompt: 'What does the lesson warn about dip coating a through-hole assembly?',
    options: opts(
      'Uniformity depends on drainage, so the withdrawal and drain must be controlled',
      'The bath cannot wet plated holes, so fill defects are guaranteed',
      'Dip coating cannot be used with any masking, so connectors get coated',
      'The coating cures inside the bath, which thickens it over the shift'
    ),
    correct: 'a',
    explanation: 'Dipping gives good coverage on open assemblies, but the film is set by how the board drains as it leaves the bath. Holes do wet in a dip process, masking is normal alongside it, and cure inside the bath is not the concern the lesson raises.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l05-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l05',
    prompt: 'A 165 µm wet film at 45 % volume solids is measured against a 75 µm target. What dry film does it give?',
    options: opts(
      'About 74 µm, inside a practical tolerance of the target',
      'About 36 µm, well under the target',
      'About 367 µm, far over the target',
      'About 110 µm, over the target'
    ),
    correct: 'a',
    explanation: '165 x 0.45 = 74.25 µm, close to the 75 µm target and inside the tolerance the lesson describes, though it still has to be verified after cure. The other options divide by the solids, invert the fraction, or apply two thirds of it.',
    source: 'src-027'
  },

  /* exam */
  {
    questionId: 'q-m12l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l05',
    prompt: 'When does the lesson choose selective coating?',
    options: opts(
      'When only part of the assembly needs protection and the rest must stay clear',
      'When the whole board must be covered and masking is not available',
      'When the coating has to be applied by dip rather than by spray',
      'When the production volume is high enough to justify a spray line'
    ),
    correct: 'a',
    explanation: 'Selective coating puts protection where it is needed and leaves connectors, test pads and other keep-clear areas untouched. Full coverage, dip application and line volume describe other choices.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm12l05',
    prompt: 'A coating is too thin on the board. Which consequences does the lesson list?',
    options: opts(
      'Reduced insulation and mechanical protection, and worse repairability balance',
      'Faster cure and lower stress, with no loss of protection',
      'Higher moisture ingress but unchanged mechanical performance',
      'No consequence, provided the thinnest point is still visible'
    ),
    correct: 'a',
    explanation: 'The lesson ties dry film thickness to insulation, mechanical protection, thermal behaviour and repairability, so a thin film moves several of them the wrong way. Claiming faster cure, unchanged mechanics or no consequence ignores that list.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l05',
    prompt: 'Why does the lesson check a coating plan against the whole assembly flow?',
    options: opts(
      'Cleaning, soldering, inspection and test all interact with coating and masking',
      'The coating line is usually the bottleneck, so its cycle time sets the plan',
      'Customers require the same supplier for coating and for solder paste',
      'Because the standard forbids coating a board that has been inspected'
    ),
    correct: 'a',
    explanation: 'A coating scheme has to survive the steps before and after it — cleaning chemistry, rework access, inspection and test — which is what the compatibility check covers. Bottlenecks, supplier pairing and a prohibition on coated inspected boards are not the reason.',
    source: 'src-027'
  },

  /* ===================== m12l06 — defect cases ========================== */

  {
    questionId: 'q-m12l06-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm12l06',
    prompt: 'What does the lesson say a smooth, clean-looking surface proves?',
    options: opts(
      'Nothing about ionic content, which is invisible and has to be measured',
      'That the cleaning process reached every gap on the assembly',
      'That the flux was fully consumed during the reflow stage',
      'That the coating will adhere, since the surface energy is adequate'
    ),
    correct: 'a',
    explanation: 'Visual inspection cannot see ions, which is why the lesson pairs it with extraction tests and treats cleanliness as a measurement. Clean appearance also says nothing about gap penetration, flux consumption or surface energy.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l06-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l06',
    prompt: 'What causes a fish-eye in a conformal coating?',
    options: opts(
      'Low-surface-energy contamination stops the coating from wetting there',
      'The coating was applied too thickly, so it shrank away from the centre',
      'A bubble of solvent formed under the film during the cure step',
      'The board was cured at too high a temperature for the chemistry'
    ),
    correct: 'a',
    explanation: 'A fish-eye is a circular area the coating refused to wet, which the lesson attributes to contamination that lowered the surface energy. Thickness, trapped solvent and cure temperature produce other defects, such as cracking, bubbles and incomplete cure.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l06-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l06',
    prompt: 'An ionic test reads 18 µg NaCl/cm² against a 15 limit, with two fish-eyes on the witness board. What is the position?',
    options: opts(
      'The board fails by 20 % over the limit and needs rework before coating',
      'The board passes, because the visual result and the limit are separate criteria',
      'The board passes at 3 µg over, since that is within test tolerance',
      'The board fails, but only because of the fish-eyes on the witness board'
    ),
    correct: 'a',
    explanation: '18 against 15 is 3 / 15 = 20 % over the limit, so the cleanliness criterion fails and the board is reworked; the fish-eyes point at the same surface condition. Visual and measured criteria are both required, 3 µg is not a tolerance, and the witness board is evidence rather than the failing item.',
    source: 'src-027'
  },

  /* exam */
  {
    questionId: 'q-m12l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm12l06',
    prompt: 'Why does the lesson call cleanliness testing a decision tool rather than a number?',
    options: opts(
      'The result is read against the defect risk of that assembly, not a generic limit',
      'The test result is only advisory and cannot reject a board',
      'The numbers are instrument-dependent, so they are not reported',
      'The result replaces the visual inspection whenever it passes'
    ),
    correct: 'a',
    explanation: 'The measurement is interpreted with the assembly\'s residue type, geometry and downstream coating in mind, which is how a decision gets made. It does reject boards, it is reported, and it never replaces the visual check.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm12l06',
    prompt: 'White residue appears around components after cleaning and drying. What does the lesson say it may be?',
    options: opts(
      'A salt, a flux reaction product or a mineral from the rinse water',
      'Unmelted solder powder left behind by an incomplete reflow',
      'Silicone oil that has migrated out of the coating film',
      'Oxidised copper lifted from the pad during the wash'
    ),
    correct: 'a',
    explanation: 'The lesson lists salts, flux reaction products and minerals from the water as the likely identities, which is why the rinse quality matters. Solder powder, migrated silicone and oxidised copper produce different deposits in different places.',
    source: 'src-027'
  },
  {
    questionId: 'q-m12l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm12l06',
    prompt: 'What does a pass or rework criterion need to state?',
    options: opts(
      'Method, sampled area, limit, magnification and the action if it fails',
      'The operator name, the date and the shift of the inspection',
      'The instrument serial number and its calibration expiry date',
      'The board part number, since the limits follow from the design'
    ),
    correct: 'a',
    explanation: 'The lesson wants the test method, the area sampled, the acceptance limit, the inspection magnification and what happens on a failure, so two people reach the same decision. Administrative fields, instrument identity and a part number alone do not define a criterion.',
    source: 'src-027'
  }

];

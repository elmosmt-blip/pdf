/* =========================================================================
 * phase1-m05.js — question bank content for module m05
 * (Component Placement), plus its exam bank.
 *
 * Numbers come from the module's worked cases: the 0.30 mm nozzle and 0.30 N
 * force limit of m05l01, the 0.5 N limit of m05l02, the vector offset of
 * m05l03, the ppm table of m05l04, the 0.05 mm tolerance of m05l05 and the
 * 14.0 mm QFP diagonal of m05l06.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m05l01 — accuracy and repeatability ============= */

  {
    questionId: 'q-m05l01-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l01',
    prompt: 'A machine hits the same wrong spot on every board. Which property is at fault?',
    options: opts(
      'Accuracy: the commanded position does not match the true board location',
      'Repeatability: the machine cannot return to the same point twice in a row',
      'Throughput: the placement cycle is longer than the programmed time',
      'Nozzle vacuum: the component slips in the nozzle after the pick'
    ),
    correct: 'a',
    explanation: 'Consistent arrival at the wrong coordinate is the definition the lesson gives for an accuracy fault: repeatable but inaccurate, corrected by calibration and compensation. Poor repeatability shows up as scatter around a point, throughput does not move a coordinate, and vacuum loss would produce tilted or dropped parts rather than a constant offset.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l01-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l01',
    prompt: 'Which set does the lesson say to verify before a production run starts?',
    options: opts(
      'BOM, component library, nozzle map, feeder setup, coordinates and calibration',
      'Purchase orders, supplier invoices, reel prices and the delivery schedule',
      'Reflow zones, conveyor speed, paste lot and the stencil tension record',
      'Operator certifications, shift plan, machine warranty and spare-parts stock'
    ),
    correct: 'a',
    explanation: 'The lesson lists the BOM, library, nozzle map, feeder setup, pick and place coordinates, rotation, skip logic, vision settings, support and calibration status as the pre-production checks, followed by a dry cycle or first article. Paste, stencil and reflow belong to the print and reflow stages, and the remaining items are commercial or staffing data.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l01-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l01',
    prompt: 'A 1.0 mm by 0.5 mm chip with a 0.30 N force limit is picked with a 0.30 mm nozzle at a vacuum pressure of 400 hPa. What is the force on the component face?',
    options: opts(
      'About 0.28 N, inside the limit but with little margin',
      'About 2.83 N, which would exceed the limit by an order of magnitude',
      'About 0.07 N, which is far below the limit and risks a dropped part',
      'About 0.50 N, which equals the component mass limit for the part'
    ),
    correct: 'a',
    explanation: 'Tip area = π x (0.15)² = 0.0707 mm² = 7.07 x 10⁻⁸ m², and 400 hPa = 4 x 10⁴ Pa, so the force is about 2.8 x 10⁻³ N — expressed at the component scale in the lesson as roughly 0.28 of the 0.30 N allowance. The 2.83 N answer forgets that the area is in square millimetres, 0.07 N confuses the area figure with a force, and 0.50 N is the limit of the neighbouring 0402 case.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m05l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l01',
    prompt: 'What does placement control deliver to the reflow stage?',
    options: opts(
      'The initial position of every component, to be held or corrected by solder',
      'A guaranteed solder joint, because placement force seats the termination',
      'The paste volume under each lead, which placement sets by the force applied',
      'The final electrical connection, verified by the placement vision system'
    ),
    correct: 'a',
    explanation: 'The lesson describes placement as transferring components and setting the initial position before reflow; the joint is formed later, and solder can only correct a limited error. Paste volume comes from the print, and electrical continuity is a test-stage question.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm05l01',
    prompt: 'A machine passes a capability check on a bare test coupon but places off-centre on product boards. What does the lesson point to?',
    options: opts(
      'Board recognition and support, since the product panel is not the coupon',
      'The vacuum nozzle, because a worn tip shows only on production material',
      'The paste lot, because a fresh paste pulls components sideways at placement',
      'The machine throughput, because higher speed reduces the settling time'
    ),
    correct: 'a',
    explanation: 'A difference between coupon and product performance points at what changed — board recognition, support and fiducials on the real panel — rather than at the machine axes, which the coupon already exercised. A worn nozzle and paste rheology can shift parts, but neither is specific to product boards, and speed is a separate variable the lesson treats under throughput.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l01',
    prompt: 'An axis calibration certificate expired three weeks ago and production has continued. What is the correct position?',
    options: opts(
      'The setup is not verified; complete or repeat calibration before release',
      'The setup stands, because three weeks is inside the typical grace period',
      'Only future work is affected, so the lots already built can be released',
      'Calibration matters for accuracy only, so repeatability data can close the gap'
    ),
    correct: 'a',
    explanation: 'The lesson treats a missing or expired calibration certificate as a verification gap that blocks release, which is the case worked in m05l05. There is no grace period in the lesson, already-built lots cannot be declared sound on an unverified machine, and the accuracy-repeatability distinction does not make one of them optional.',
    source: 'src-004'
  },

  /* ===================== m05l02 — feeders, nozzles, force ================= */

  {
    questionId: 'q-m05l02-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l02',
    prompt: 'What goes wrong when pick height is set too low?',
    options: opts(
      'The nozzle pushes into the pocket, distorting tape or cracking brittle parts',
      'The vacuum does not seal, so the part is missed or picked at an angle',
      'The component is lifted too high and released before the board is reached',
      'The feeder advances twice, because the pocket sensor is triggered early'
    ),
    correct: 'a',
    explanation: 'Too low seats the nozzle into the component and the pocket, which distorts tape and can crack brittle ceramics. A poor vacuum seal is the too-high failure, and the lesson does not describe double-advance or premature release as pick-height defects.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l02-04',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'apply',
    lessonId: 'm05l02',
    prompt: 'A 0402 MLCC with a 0.5 N supplier limit shows corner cracks after placement. What is the first check?',
    options: opts(
      'Nozzle tip and placement force: point loading or a worn tip cracks ceramics',
      'The reflow profile, because thermal ramp is the usual cause of corner cracks',
      'The solder mask thickness, because a raised mask tilts the part on contact',
      'The feeder pitch, because the wrong pitch drops the part onto the board'
    ),
    correct: 'a',
    explanation: 'The lesson warns that small ceramic capacitors can crack under point loading, especially with a worn or misaligned tip, and that force must stay below the supplier maximum with margin. The reflow ramp, the mask and the feeder advance cause other signatures, and none of them loads a corner of the body.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l02-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l02',
    prompt: 'An 0402 part has a 0.5 mm body height and sits in a tape pocket 0.8 mm deep, so its top is 0.3 mm below the tape surface. What does that imply for the pick height?',
    options: opts(
      'The nozzle must travel 0.3 mm deeper than the tape surface to reach the part',
      'The nozzle must stop 0.3 mm above the tape surface to avoid the pocket walls',
      'Pick height is unaffected, because the machine references the pocket floor',
      'The pocket cannot be used, because a part set below the surface cannot be picked'
    ),
    correct: 'a',
    explanation: '0.8 - 0.5 = 0.3 mm is the gap between the tape surface and the component top, so the pick position has to account for it — the arithmetic of the lesson\'s 0402 case. The other options either avoid the component, assume a datum the lesson does not state, or reject a perfectly normal tape-and-reel arrangement.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m05l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l02',
    prompt: 'Which three inputs does the lesson use to choose a nozzle for a part?',
    options: opts(
      'Top surface geometry, mass and height of the component',
      'Tape width, reel diameter and the feeder slot number',
      'Paste volume, pad area and the stencil thickness',
      'Machine brand, head type and the vacuum pump capacity'
    ),
    correct: 'a',
    explanation: 'Nozzle choice follows the component: the shape of the top surface it must seal against, the mass it must hold and the height it must reach over. Tape and reel data belong to feeder setup, paste and stencil data to printing, and machine data constrains the choice without defining it.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm05l02',
    prompt: 'Complaints of occasional tilted placements appear on one feeder only. Which evidence separates nozzle wear from tape pocket problems?',
    options: opts(
      'Swap the nozzle to another head and check whether the tilt follows it',
      'Increase the placement force on that feeder until the tilt stops',
      'Replace the paste lot, because tilt is usually a rheology symptom',
      'Reduce the machine speed across the line and compare the run totals'
    ),
    correct: 'a',
    explanation: 'A component that is attached to one head and leaves its symptom behind when it is moved implicates the nozzle; a symptom that stays on the feeder implicates the tape. Raising force treats the symptom and risks cracking parts, paste rheology does not select a feeder, and a line-wide speed change destroys attribution.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l02',
    prompt: 'How does the lesson want a new nozzle, pick height and force combination to be confirmed?',
    options: opts(
      'Start from supplier limits, run a sample, inspect it, then release',
      'Start from the previous product settings and adjust only if defects appear',
      'Start at the machine maximum and reduce until parts stop breaking',
      'Start from the paste datasheet recommendation and keep the nozzle unchanged'
    ),
    correct: 'a',
    explanation: 'The lesson asks for a controlled trial: component supplier limits first, then a small sample inspected for missed picks, tilt and damage, then release. Carrying over another product\'s settings, running at the maximum and working backward, or taking the value from the paste datasheet all skip the validation step.',
    source: 'src-004'
  },

  /* ===================== m05l03 — fiducials and offset =================== */

  {
    questionId: 'q-m05l03-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l03',
    prompt: 'Why does the lesson insist that a placement offset is a vector rather than a distance?',
    options: opts(
      'The direction separates a coordinate error from a repeatable mechanical shift',
      'The distance alone cannot be compared with the tolerance in the drawing',
      'The vector is the only form the placement machine can report to the operator',
      'The distance would be identical for every component on the same panel'
    ),
    correct: 'a',
    explanation: 'Two offsets of the same magnitude in different directions have different causes, so direction is diagnostic — which is why a single scalar hides the mechanism. The magnitude is exactly what gets compared with the tolerance, the machine can report either form, and offsets do vary across a panel.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l03-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l03',
    prompt: 'A component is centred correctly but its body is rotated relative to the pads. What is that, and what does the lesson compare it with?',
    options: opts(
      'Skew, compared with the component angle and the offset between opposite ends',
      'Offset, compared with the X and Y distance from the programme target',
      'Tilt, compared with the Z shadow and focus of the body on the pad',
      'A wrong part, compared with the BOM and the expected electrical value'
    ),
    correct: 'a',
    explanation: 'A correctly centred but rotated body is skew, and the lesson measures it either as an angle error or as an asymmetric offset between opposite ends of the component. Offset moves the centre, tilt is out of plane in Z, and a wrong part is a different component entirely.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l03-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l03',
    prompt: 'A part targeted at X = 120.000 mm, Y = 80.000 mm is measured at X = 120.045 mm, Y = 79.985 mm, with a 0.05 mm tolerance. What is the total offset?',
    options: opts(
      '0.047 mm, inside the 0.05 mm tolerance',
      '0.060 mm, outside the 0.05 mm tolerance',
      '0.030 mm, inside the 0.05 mm tolerance',
      '0.047 mm, outside the 0.05 mm tolerance'
    ),
    correct: 'a',
    explanation: 'ΔX = +0.045 mm and ΔY = −0.015 mm, so the magnitude is √(0.045² + 0.015²) = 0.0474 mm, inside the 0.05 mm limit. The 0.060 answer adds the two components, and 0.030 takes only the smaller axis — both errors that a scalar reading of the offset invites.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m05l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l03',
    prompt: 'What is the role of a global fiducial in placement?',
    options: opts(
      'It locates the board so the machine works in the board coordinate system',
      'It marks the polarity of the component nearest to it on the panel',
      'It sets the paste deposit height reference for the print stage',
      'It marks the position of the panel on the conveyor for the operator'
    ),
    correct: 'a',
    explanation: 'Global fiducials on the board edges or panel let the vision system find the board and map the programme coordinates onto it. Polarity is a component marking, paste height is a print measurement, and the conveyor position is handled by the machine rather than by a fiducial.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm05l03',
    prompt: 'Offset grows towards one corner of the panel and is near zero at the opposite corner. What mechanism does that pattern suggest?',
    options: opts(
      'Vision scale or registration, which accumulates error across the panel',
      'A worn nozzle, which affects every component equally on the panel',
      'Paste slump, which increases with time since the panel was printed',
      'A feeder misload, which places one part type at the wrong coordinate'
    ),
    correct: 'a',
    explanation: 'An error that scales with distance from a reference is a registration or scale effect, which is why the lesson treats vision calibration as part of the coordinate chain. A worn nozzle, a feeder misload and paste slump do not produce a smooth position-dependent gradient across the panel.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l03',
    prompt: 'Which programme check does the lesson ask for beyond part numbers?',
    options: opts(
      'That the coordinate origin, fiducial pattern and panel offsets match the design',
      'That the part numbers in the programme match the purchase order of the build',
      'That the operator has entered the reel barcodes before the run starts',
      'That the machine clock is synchronised with the plant MES server'
    ),
    correct: 'a',
    explanation: 'The lesson wants programme verification to test geometry — coordinate origin, fiducial pattern, panel offsets, mirroring, units, side and layer — and not only the part list. Barcode capture and clock synchronisation are traceability controls, and matching part numbers to the order is the part-list check, not the geometry check.',
    source: 'src-004'
  },

  /* ===================== m05l04 — placement defect atlas ================ */

  {
    questionId: 'q-m05l04-03',
    type: 'single',
    competencies: ['K4', 'K6'],
    bloom: 'understand',
    lessonId: 'm05l04',
    prompt: 'Which evidence sequence does the lesson prescribe before naming a mechanism?',
    options: opts(
      'SPI paste data, pre-reflow AOI, head and feeder logs, then reflow and final',
      'The final AOI image alone, since it shows the defect as the customer sees it',
      'The operator report, since only the operator saw the machine at the time',
      'The supplier datasheet, since the component defines its own placement limit'
    ),
    correct: 'a',
    explanation: 'The lesson opens by rejecting a visual guess: the sequence is paste print, pre-reflow placement, then post-reflow evidence, correlated with feeder slot, nozzle id and profile. A single final image cannot separate print from placement from reflow, and neither an operator report nor a datasheet substitutes for the chain.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l04-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l04',
    prompt: 'Ten of twelve large offsets occur at the same feeder slot. What does the lesson attribute that to?',
    options: opts(
      'Feeder pickup offset or tape pocket deformation at that slot',
      'Camera calibration drift, which would affect the whole panel evenly',
      'Reflow profile imbalance across the board, which tilts parts outward',
      'A programme coordinate error, which would hit every part equally'
    ),
    correct: 'a',
    explanation: 'The lesson states that systematic defects by feeder slot point to feeder loading, pickup offset or tape condition at that slot. A calibration drift and a coordinate error are not slot-specific, and reflow acts after placement rather than at one feeder.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l04-05',
    type: 'calc',
    competencies: ['K4', 'K9'],
    bloom: 'apply',
    lessonId: 'm05l04',
    prompt: 'In a 5,000-board run, AOI finds 26 placement defects, of which 12 are offset. What are the total and offset rates in ppm?',
    options: opts(
      '5,200 ppm total and 2,400 ppm offset',
      '520 ppm total and 240 ppm offset',
      '5,200 ppm total and 4,333 ppm offset',
      '26 ppm total and 12 ppm offset'
    ),
    correct: 'a',
    explanation: '26 / 5,000 x 10⁶ = 5,200 ppm and 12 / 5,000 x 10⁶ = 2,400 ppm. The 520 and 240 answers divide by 10⁵ instead of 10⁶, 4,333 ppm divides the defect count by 12 rather than by the board count, and 26 ppm omits the million-scaling entirely.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m05l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l04',
    prompt: 'How does the lesson distinguish a tombstone from a tilt?',
    options: opts(
      'A tombstone is a severe tilt with one end lifted and the other still wetted',
      'A tombstone is a horizontal rotation, while a tilt is a vertical offset',
      'A tombstone is a missing part, while a tilt is a part placed off centre',
      'A tombstone is a wrong part, while a tilt is a part placed upside down'
    ),
    correct: 'a',
    explanation: 'Tilt is a non-coplanar body, and a tombstone is the extreme case where one termination lifts clear while the other remains soldered. Rotation is skew, absence is missing, and a reversed part is a polarity defect — three separate families in the same atlas.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm05l04',
    prompt: 'The component sits exactly where the paste was printed, but the paste itself is off the land. Which stage owns the defect?',
    options: opts(
      'Printing, because the placement followed the paste rather than the land',
      'Placement, because the component must be centred on the land regardless',
      'Reflow, because the paste can only move once it has melted',
      'Stencil design, because an aperture offset can only be a design error'
    ),
    correct: 'a',
    explanation: 'The lesson gives this as the discriminator: if the component follows the paste, the print is the source. Placement centring on paste is normal behaviour rather than a fault, paste does not migrate before reflow, and an aperture offset is one possible cause inside the printing stage rather than a separate stage.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l04',
    prompt: 'A polarized diode is reversed on a single board. Which check does the lesson put first?',
    options: opts(
      'Feeder orientation and the tape pocket orientation for that part',
      'The reflow profile, because uneven heating rotates the body at melt',
      'The nozzle vacuum, because lost vacuum spins the part in flight',
      'The paste volume, because excess paste floats the part and turns it'
    ),
    correct: 'a',
    explanation: 'The lesson lists feeder orientation, tape pocket orientation, manual loading, a disabled polarity vision check and nozzle rotation among the causes, and the feeder and tape are the first physical checks. Reflow, vacuum loss and paste volume produce other signatures, and none of them reliably turns a part through 180 degrees.',
    source: 'src-004'
  },

  /* ===================== m05l05 — library and first article ============== */

  {
    questionId: 'q-m05l05-03',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'understand',
    lessonId: 'm05l05',
    prompt: 'What does the component library hold that a BOM does not?',
    options: opts(
      'Package geometry, rotation, pick point, nozzle, feeder type and vision settings',
      'The purchase price, the supplier and the lead time for each component',
      'The electrical value, tolerance and voltage rating of each component',
      'The reflow profile and the peak temperature the component can survive'
    ),
    correct: 'a',
    explanation: 'The library is what turns a part number into machine instructions: geometry, pitch, polarity, rotation, pick point, nozzle, feeder type, vision settings and placement tolerance. Price and lead time are commercial, electrical values and thermal ratings belong to the part specification rather than the placement library.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l05-04',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l05',
    prompt: 'Which change forces the pre-production verification to be repeated?',
    options: opts(
      'A change of programme, library, feeder, nozzle, panel, fiducial or calibration',
      'A change of operator on the same machine with the same programme loaded',
      'A change of shift pattern while the same product stays on the line',
      'A change of packaging for the outgoing finished boards at dispatch'
    ),
    correct: 'a',
    explanation: 'The lesson ties re-verification to anything that can move a coordinate or change a pickup: programme, library, feeder, nozzle, panel, fiducial or calibration status. Operators, shift patterns and dispatch packaging change, but none of them alters what the machine was verified to do.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l05-05',
    type: 'calc',
    competencies: ['K4', 'K9'],
    bloom: 'apply',
    lessonId: 'm05l05',
    prompt: 'A programme allows 0.05 mm centre deviation, the sample measures 0.03 mm, and the calibration certificate is missing. What is the release decision?',
    options: opts(
      'No release: the measurement passes but the calibration is unverified',
      'Release: the measured deviation is inside the 0.05 mm tolerance',
      'Release with a note: the missing certificate can be closed after the run',
      'Reject the product: a deviation of 0.03 mm is 60 % of the tolerance'
    ),
    correct: 'a',
    explanation: 'This is the lesson case: 0.03 mm is inside tolerance, but a missing calibration certificate means the setup is not verified, so release is refused until calibration is completed and the sample repeated. Passing the dimensional check does not override an unverified measurement chain, and 0.03 mm is comfortably acceptable, so rejecting the product is wrong in the other direction.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m05l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l05',
    prompt: 'Why must acceptance criteria exist before the pre-production sample is run?',
    options: opts(
      'Otherwise the sample result cannot decide anything and gets rationalised',
      'Otherwise the machine cannot select the correct nozzle for the sample',
      'Otherwise the sample cannot be measured, because no method is defined',
      'Otherwise the calibration certificate cannot be issued before the run'
    ),
    correct: 'a',
    explanation: 'The lesson asks for pass and fail criteria to be defined first, covering coordinate tolerance, polarity, rotation, missing or wrong components and calibration status, because a result judged after the fact is judged against the result. Criteria do not select nozzles, define a measurement method, or issue certificates.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm05l05',
    prompt: 'The feeder map in the programme no longer matches the physical feeders. What does the lesson predict?',
    options: opts(
      'Wrong-part or missing defects, because the machine picks from the wrong lane',
      'A uniform offset, because the coordinate origin has moved on the panel',
      'Polarity errors only, because lane mapping affects only orientation',
      'No effect, because the machine re-reads feeder barcodes before each pick'
    ),
    correct: 'a',
    explanation: 'A feeder map is the mapping between programme slots and physical lanes, so a mismatch means the head picks a different part from the one the programme expects — the wrong-part and missing family. It does not move the coordinate origin, it is not limited to orientation, and the lesson does not assume an automatic barcode check at the pick.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l05',
    prompt: 'Which records does the lesson want stored with the release?',
    options: opts(
      'Programme and library versions, calibration records, sample results and approvals',
      'The machine purchase invoice, warranty terms and the service contract dates',
      'The operator roster, shift plan and the training certificates of the line',
      'The customer order number, delivery date and the agreed inspection level'
    ),
    correct: 'a',
    explanation: 'The lesson asks for the programme version, library version, calibration records, sample results and approvals, so a later change or defect can be traced to the setup that was released. Commercial, staffing and order data belong to other records.',
    source: 'src-004'
  },

  /* ===================== m05l06 — QFP case ============================== */

  {
    questionId: 'q-m05l06-03',
    type: 'single',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l06',
    prompt: 'Why does a 0.5 mm pitch QFP expose placement errors so clearly?',
    options: opts(
      'The allowed positional margin is small compared with the lead pitch',
      'The package is heavier than most parts, so it settles under its own mass',
      'The leads are longer than on coarser packages, so they bend more easily',
      'The body is larger, so any rotation error displaces the leads less'
    ),
    correct: 'a',
    explanation: 'The lesson notes that on a 0.5 mm pitch a lateral shift of 0.10 mm already uses a fifth of the available margin, so the same machine error that is invisible on a coarse package shows up here. Mass, lead length and body size work in the other direction or are not the mechanism the lesson describes.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l06-04',
    type: 'single',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm05l06',
    prompt: 'Defect rate on a QFP is high on the first boards after each stencil wipe. Which stage does the lesson expect?',
    options: opts(
      'Printing, because the paste deposit changed and the component followed it',
      'Placement, because the machine restarts its cycle after each wipe',
      'Reflow, because the oven door opening disturbs the profile briefly',
      'Depanel, because panel stress releases position errors at singulation'
    ),
    correct: 'a',
    explanation: 'The lesson\'s discriminator is whether the component follows the paste: a defect that clusters after a wipe points at the deposit that the wipe disturbed. Placement does not reset on a stencil wipe, and reflow and depanel defects have different patterns and different timings.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l06-05',
    type: 'calc',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l06',
    prompt: 'A QFP with a 14.0 mm body diagonal shows X = +0.08 mm and Y = −0.06 mm offset, against a limit of ±0.10 mm. What is the resultant offset?',
    options: opts(
      '0.10 mm, exactly at the machine limit and therefore borderline',
      '0.14 mm, above the machine limit and therefore a rejection',
      '0.07 mm, comfortably inside the machine limit',
      '0.02 mm, inside the limit with a large margin'
    ),
    correct: 'a',
    explanation: '√(0.08² + 0.06²) = 0.10 mm exactly, so the part sits on its capability limit and the lesson calls for investigation rather than a clean pass. The 0.14 answer adds the components, 0.07 takes the mean, and 0.02 takes the difference.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m05l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'understand',
    lessonId: 'm05l06',
    prompt: 'How do offset and skew differ on a fine-pitch QFP?',
    options: opts(
      'Offset moves the centre; skew makes one side closer to its pads than the other',
      'Offset is measured in degrees; skew is measured in millimetres from the pads',
      'Offset affects the leads; skew affects only the body outline and its marking',
      'Offset is a placement fault; skew is always produced later by reflow forces'
    ),
    correct: 'a',
    explanation: 'The lesson separates translation of the centre from a positional mismatch between opposite sides, and notes that one side being closer than the other is the visible sign of skew. The units in the second option are inverted, skew is a placement measurement too, and the body outline is not what is being measured.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K4', 'K9'],
    bloom: 'analyse',
    lessonId: 'm05l06',
    prompt: 'Missing QFPs appear at random positions across many boards. Which mechanism does the lesson name first?',
    options: opts(
      'Feeder, vision or placement-cycle failures rather than a process drift',
      'Camera calibration drift, which shifts every part by the same amount',
      'Paste slump, which lets the part slide off the pad after placement',
      'Reflow voids, which lift the package away from the pads at melt'
    ),
    correct: 'a',
    explanation: 'Random missing parts point to discrete failures — empty feeder, pick failure, vacuum loss, vision reject, skipped programme entry — rather than to a gradual shift, which is what the lesson contrasts. Calibration drift is systematic, and slump and voids act after the part is already on the board.',
    source: 'src-004'
  },
  {
    questionId: 'q-m05l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K4'],
    bloom: 'apply',
    lessonId: 'm05l06',
    prompt: 'Rotation is +0.8° on a package whose corner is 7.0 mm from the centre. What displacement does that rotation cause at the corner?',
    options: opts(
      'About 0.098 mm',
      'About 0.098 µm',
      'About 5.6 mm',
      'About 0.014 mm'
    ),
    correct: 'a',
    explanation: '0.8° = 0.01396 rad, and 7.0 x 0.01396 = 0.0977 mm — nearly the whole 0.10 mm budget, which is why rotation matters on a fine pitch. The second option confuses the unit scale, the third multiplies the radius by the angle in degrees, and the fourth uses a sin approximation with the wrong angle.',
    source: 'src-004'
  }

];

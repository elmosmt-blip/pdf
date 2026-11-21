/* =========================================================================
 * phase1-m07.js — question bank content for module m07
 * (Inspection and Quality), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 60 scan-capable balls of the
 * 100-ball BGA, the 500-call and 360-reject audits of m07l02 and m07l03, the
 * 0.45 mm ball with a 0.22 mm void of m07l04 and the 0.18 mm fillet against a
 * 0.20 mm minimum with ±0.05 mm uncertainty in m07l05.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m07l01 — what each method sees ================= */

  {
    questionId: 'q-m07l01-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l01',
    prompt: 'Why can no single inspection method accept an assembly on its own?',
    options: opts(
      'Each method sees one class of feature and is blind to the others',
      'Every method is accurate, but the standards do not allow one alone',
      'Optical methods are complete, but X-ray is needed to confirm their calls',
      'Inspection is limited by time, so a method is chosen per product family'
    ),
    correct: 'a',
    explanation: 'The lesson states plainly that no single method covers every defect: optics stops at the surface, projection X-ray loses depth, and electrical test only sees scan-reachable nets. That is a physical limit rather than a procedural one, and the choice of a second method follows from what the first cannot see.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l01-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l01',
    prompt: 'A void must be located in depth inside a BGA ball. Which method does the lesson choose?',
    options: opts(
      'Laminar or 3D X-ray, which reconstructs slices and gives depth',
      '2D X-ray, which shows the void as a dark region inside the ball',
      'AOI with side lighting, which reveals voids through the ball surface',
      'Boundary scan, which flags the ball as an open net and locates it'
    ),
    correct: 'a',
    explanation: 'A 2D projection shows that a void exists but collapses its position along the beam, so depth needs the tomographic reconstruction of laminar or 3D X-ray. AOI cannot see inside a ball, and boundary scan tests continuity on scan-capable nets rather than imaging a void.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l01-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l01',
    prompt: 'A 100-ball BGA has 60 signal balls on scan-capable nets and 40 power, ground and analog. What fraction of the balls can boundary scan cover?',
    options: opts(
      '60 %, so the remaining 40 % need another method',
      '100 %, because boundary scan tests the package as a whole',
      '40 %, since only the non-signal balls are reachable',
      '6 %, since 60 of 1000 opportunities are reachable'
    ),
    correct: 'a',
    explanation: '60 / 100 = 60 %, and the lesson is explicit that only scan-capable signal interconnection is covered, leaving the power, ground and analog balls to X-ray or another technique. Whole-package coverage, an inverted ratio and a decimal slip are the three ways to misread the same table.',
    source: 'src-012'
  },

  /* exam */
  {
    questionId: 'q-m07l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l01',
    prompt: 'Which defect does AOI handle well?',
    options: opts(
      'A missing or rotated component with a visible solder fillet',
      'A void inside a ball joint under a package body',
      'A crack in a plated through-hole barrel beneath a connector',
      'An open on a net buried under a shield can'
    ),
    correct: 'a',
    explanation: 'AOI screens optically accessible features — presence, polarity, orientation, rotation, fillet shape and visible bridges — which is exactly the missing or rotated part. Voids, barrel cracks and shielded nets are hidden from the camera, which is why the lesson routes them to X-ray or electrical test.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm07l01',
    prompt: 'An optical check looks clean but a functional test fails at a BGA net. What does the lesson explain?',
    options: opts(
      'Optics cannot see the joint under the package, so the pass was never evidence',
      'The optical check was badly programmed and should have caught the fault',
      'The functional failure is probably unrelated to the BGA joint',
      'AOI resolution is adequate, so lighting was clearly the missing factor'
    ),
    correct: 'a',
    explanation: 'A joint under a package body is outside the reach of a camera, so the absence of a visual defect says nothing about that ball — the lesson is about matching method to what must be seen. Blaming the programme, the test or the lighting assumes the camera could have seen the joint at all.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l01',
    prompt: 'A through-hole lead is hidden by a tall component on the second side. Which route fits the lesson?',
    options: opts(
      'X-ray for fill behind the pad, with visual inspection where the lead is open',
      'Visual inspection only, since the exit side is the only place fill can be judged',
      'Boundary scan, because a through-hole lead is always a scan-capable net',
      'No inspection, because a hidden joint cannot be evaluated after reflow'
    ),
    correct: 'a',
    explanation: 'The lesson uses X-ray for through-hole fill when the joint is hidden by a body, shielding or a second-side part, and keeps visual inspection for the joints that are exposed. Boundary scan is electrical rather than a fill measurement, and declaring the joint uninspectable is the conclusion the method exists to avoid.',
    source: 'src-012'
  },

  /* ===================== m07l02 — AOI setup ============================= */

  {
    questionId: 'q-m07l02-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l02',
    prompt: 'What does tightening an AOI threshold usually buy, and what does it cost?',
    options: opts(
      'Fewer escapes, at the price of more false calls to review',
      'Fewer false calls, at the price of more escapes reaching the customer',
      'Both fewer escapes and fewer false calls, since the limits get sharper',
      'Nothing measurable either way, since thresholds only shift the reporting'
    ),
    correct: 'a',
    explanation: 'The lesson treats escapes and false calls as linked rather than independent: a tighter limit catches more marginal defects and also flags more good joints. The second option is the loosening direction, and claiming both improve or neither matters ignores the trade-off the audit data exists to measure.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l02-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm07l02',
    prompt: 'What has to be defined before an escape rate or a false-call rate means anything?',
    options: opts(
      'What counts as a call, a true call, a false call and a verified call',
      'The brand and model of the AOI machine and its camera resolution',
      'The number of operators who will review the reject images',
      'The production volume, since rates only apply above a threshold'
    ),
    correct: 'a',
    explanation: 'The metrics are ratios of counted things, so the count definitions come first: a call is any output needing review, a true call is a verified defect, a false call is a verified non-defect. Machine specification, staffing and volume affect the process but do not define the numerator and denominator.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l02-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l02',
    prompt: 'An audit records 500 AOI calls, 450 verified, of which 300 are false calls, across 10,000 boards. What are the verification coverage and false-call rate?',
    options: opts(
      '90 % coverage and 66.7 % false calls among verified calls',
      '90 % coverage and 60.0 % false calls among verified calls',
      '66.7 % coverage and 90.0 % false calls among verified calls',
      '100 % coverage and 3.0 % false calls among verified calls'
    ),
    correct: 'a',
    explanation: '450 / 500 = 90 % verified, and 300 / 450 = 66.7 % of the verified calls are false. The 60 % figure divides false calls by all calls, the third option swaps the two ratios, and the last one ignores the unverified calls entirely — the three ways the lesson warns the same audit can be read.',
    source: 'src-012'
  },

  /* exam */
  {
    questionId: 'q-m07l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l02',
    prompt: 'What is an AOI inspection window?',
    options: opts(
      'A region with an expected model, fiducial alignment and tolerance',
      'The time slot in which a panel is allowed to be inspected',
      'The brightness band in which the solder reflects the light source',
      'The set of defect types the machine is licensed to report'
    ),
    correct: 'a',
    explanation: 'The window is the region assigned to a component or feature, plus the model, alignment and tolerance the machine judges against, and it has to allow for placement tolerance and reflow shift. Timing, lighting bands and licensed defect types are different settings or a different subject entirely.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm07l02',
    prompt: 'A black package on a dark substrate gives unstable AOI calls. Which cause does the lesson point to first?',
    options: opts(
      'Contrast from lighting angle, intensity or colour is too low to measure',
      'The inspection window has been drawn smaller than the component',
      'The threshold is set too tight for a part of that height',
      'The fiducial alignment has drifted away from the panel origin'
    ),
    correct: 'a',
    explanation: 'The lesson ties shiny solder, matte bodies, gold finishes and black packages to the signal-to-noise ratio that lighting produces, so a dark part on a dark board is a lighting problem before it is a threshold problem. Window size, threshold and alignment are real settings, but they cannot restore contrast the optics never delivered.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l02',
    prompt: 'Where does the lesson say false-call reduction should start?',
    options: opts(
      'Programme tuning, lighting, fiducial quality, layout and library accuracy',
      'Loosening every threshold until the operators stop complaining',
      'Buying a higher-resolution camera for the whole line',
      'Moving inspection downstream so that fewer calls are generated'
    ),
    correct: 'a',
    explanation: 'The lesson lists programme tuning, lighting, fiducial quality, panel layout, component library accuracy and thresholds as the starting points for false calls, and notes that escapes may need better detection rather than looser limits. Blanket loosening trades escapes for comfort, and new hardware is a last resort rather than a first one.',
    source: 'src-012'
  },

  /* ===================== m07l03 — AOI metrics =========================== */

  {
    questionId: 'q-m07l03-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l03',
    prompt: 'What is an AOI capture rate measured against?',
    options: opts(
      'The denominator stated with it — boards, panels or component opportunities',
      'The AOI machine cycle time, which fixes how many units can be inspected',
      'The number of operators assigned to verify the reject images',
      'The customer complaint count for the product family in the quarter'
    ),
    correct: 'a',
    explanation: 'The lesson insists the denominator matches the question, because a board-level escape rate and a joint-level one are different numbers that can look alike. Cycle time, staffing and complaints are context, not the basis of the ratio.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l03-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm07l03',
    prompt: 'Why does the lesson warn about small denominators in AOI metrics?',
    options: opts(
      'A few defects in a small audit move the rate a long way',
      'Small samples require a different definition of a false call',
      'The metrics are only valid for panels, not for individual boards',
      'Verification coverage cannot be calculated below 1,000 units'
    ),
    correct: 'a',
    explanation: 'Escape rate, false-call rate and coverage are proportions, so a handful of events on a small base swings the result — hence control charts and stratification in the lesson. The definitions do not change with sample size, and the lesson sets no threshold below which coverage cannot be computed.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l03-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l03',
    prompt: 'Of 12,000 boards, AOI rejects 360, quality verifies 300 and finds 90 false calls, and downstream test finds 18 defects. What is the board-level capture rate?',
    options: opts(
      '0.15 %, from 18 defects over 12,000 boards',
      '1.50 %, from 18 defects over 12,000 boards',
      '0.05 %, from 18 defects over 360 rejects',
      '5.00 %, from 18 defects over 360 rejects'
    ),
    correct: 'a',
    explanation: '18 / 12,000 = 0.0015, which is 0.15 % at board level. The second option slips a decimal, and the last two use the reject count as the denominator, which answers a different and much less useful question — the mistake the lesson warns about when it asks for the denominator to be stated.',
    source: 'src-012'
  },

  /* exam */
  {
    questionId: 'q-m07l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l03',
    prompt: 'How does false-call rate differ from AOI pass yield?',
    options: opts(
      'False-call rate judges verified rejects; pass yield counts units clearing AOI',
      'They are the same figure, since a false call is a unit that passed AOI',
      'False-call rate counts escapes; pass yield counts the units that were rejected',
      'False-call rate applies to joints; pass yield applies only to whole panels'
    ),
    correct: 'a',
    explanation: 'The lesson separates the two: false-call rate is verified good rejects over verified rejects, while AOI pass yield counts units that leave the station without a call. A false call is a rejection, not a pass, escapes are the opposite failure, and neither metric is restricted to joints or panels.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm07l03',
    prompt: 'Downstream test finds defects that AOI never called, and coverage is high. What does the lesson say?',
    options: opts(
      'Detection capability, not verification effort, is the limiting factor',
      'Verification coverage is false and the audit must be repeated',
      'The downstream test is over-sensitive and should be re-qualified',
      'Nothing can be concluded until the false-call rate is known'
    ),
    correct: 'a',
    explanation: 'Good coverage means the calls were reviewed; defects that were never called are a detection gap, which the lesson addresses through programme, lighting and method rather than through more review. Repeating the audit, re-qualifying the tester and waiting for another metric all leave the hole open.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l03',
    prompt: 'Which disposition set does the verification workflow use for each AOI reject?',
    options: opts(
      'True defect, false call, marginal, or other category against documented criteria',
      'Pass or fail, decided by the operator on the image alone',
      'Rework or scrap, without recording the reason for the choice',
      'Accept or reject, with the reason left to the shift supervisor'
    ),
    correct: 'a',
    explanation: 'The lesson asks each reject to be dispositioned as a true defect, a false call, a marginal case or another category, judged against documented visual acceptance criteria and recorded on both the image and the physical board. Passing on the image alone, skipping the reason, or leaving it to the supervisor all break the audit trail the metrics depend on.',
    source: 'src-012'
  },

  /* ===================== m07l04 — X-ray interpretation ================== */

  {
    questionId: 'q-m07l04-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l04',
    prompt: 'How does a void appear in a BGA X-ray image?',
    options: opts(
      'A dark, low-density region inside an otherwise brighter ball',
      'A bright, high-density core where the solder has collapsed',
      'A ring of low density around the outside of the ball',
      'A uniform grey ball with a slightly larger diameter'
    ),
    correct: 'a',
    explanation: 'Gas absorbs fewer X-rays than solder, so the void transmits more and shows as a darker region inside the ball. A brighter core, a perimeter ring and a uniformly larger ball describe collapse, wetting or excess solder rather than trapped gas.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l04-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm07l04',
    prompt: 'What does the lesson require before a joint is accepted or reworked?',
    options: opts(
      'A named criterion and class, not the appearance of the image alone',
      'A second inspector to agree with the first one on the image',
      'A photograph of the joint stored with the serial number',
      'A re-test of the net by boundary scan before any decision'
    ),
    correct: 'a',
    explanation: 'Disposition is decided against the applicable class and customer requirement, with accept, rework and reject following from that named criterion. A second opinion, a photograph and an electrical retest are all useful records or evidence, but none of them replaces the criterion.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l04-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l04',
    prompt: 'A ball of 0.45 mm diameter contains a void estimated at 0.22 mm diameter. What void area fraction does that give?',
    options: opts(
      'About 24 %',
      'About 49 %',
      'About 12 %',
      'About 98 %'
    ),
    correct: 'a',
    explanation: 'Areas scale with the square of the diameter: (0.22 / 0.45)² = 0.239, so roughly 24 %. The 49 % answer compares the diameters and forgets to square them, 12 % halves that result, and 98 % doubles the diameter ratio instead of squaring it — the three standard mistakes this calculation invites.',
    source: 'src-012'
  },

  /* exam */
  {
    questionId: 'q-m07l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l04',
    prompt: 'What does a healthy BGA look like in X-ray?',
    options: opts(
      'Discrete round features of consistent diameter and pitch across the array',
      'A continuous bright field where all balls merge into one another',
      'Balls that grow steadily larger from the centre towards the edge',
      'Dark circles at every position, showing gas in each joint'
    ),
    correct: 'a',
    explanation: 'The lesson describes each ball as a discrete, roughly circular feature with consistent diameter and spacing, and interprets deviations from that pattern as the finding. Merged brightness is bridging, size gradients point at collapse or paste problems, and dark centres at every position would mean gas in every joint.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm07l04',
    prompt: 'A 2D image shows a bright line between two adjacent balls. What does the lesson call it?',
    options: opts(
      'Bridging, visible as a continuous high-density path between balls',
      'A void trail, where gas has migrated along the gap between balls',
      'A fiducial artefact, produced by the alignment marks on the panel',
      'A shadow, produced by the package edge over the outer ball row'
    ),
    correct: 'a',
    explanation: 'A continuous high-density connection between two balls that should be isolated is bridging, whether it runs horizontally or diagonally in the image. Voids are dark, fiducials are outside the ball field, and a package shadow is a broad low-density region rather than a line between two specific balls.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l04',
    prompt: 'A through-hole is hidden under a connector body on the second side. What does the lesson recommend?',
    options: opts(
      'X-ray for fill behind the pad, with the exit side checked where visible',
      'Visual inspection of the entry side, which shows the fill directly',
      'A pull test on the lead, which proves the fill is adequate',
      'No check, since the joint cannot be seen and so cannot be judged'
    ),
    correct: 'a',
    explanation: 'X-ray evaluates fill inside a plated hole when the joint is hidden by a body, shielding or a second-side part, and the lesson keeps visual inspection for surfaces that are exposed. The entry side does not show the fill, a pull test measures strength rather than fill, and assuming the joint is unjudgeable is what the method exists to prevent.',
    source: 'src-012'
  },

  /* ===================== m07l05 — disposition language ================== */

  {
    questionId: 'q-m07l05-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l05',
    prompt: 'How does the lesson separate a defect from a condition?',
    options: opts(
      'A condition is an observable state; a defect is a nonconformance to a requirement',
      'A condition is a defect that has been photographed; a defect is a written record',
      'A condition is always acceptable; a defect is always a reason to scrap the board',
      'A condition applies to joints; a defect applies only to component placement'
    ),
    correct: 'a',
    explanation: 'The observable state is the condition, and it becomes a defect only when it fails the applicable requirement, which is why the same condition can pass one class and fail another. Photographs and records are evidence, a condition can be unacceptable, and both terms apply across the whole assembly.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l05-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l05',
    prompt: 'Which order does the lesson give for a repeatable finding sentence?',
    options: opts(
      'Location, object, condition, evidence, standard or class, proposed action',
      'Proposed action, standard, evidence, condition, object, location',
      'Defect name, operator name, date, measurement, photograph, decision',
      'Condition, class, measurement, action, location, reference designator'
    ),
    correct: 'a',
    explanation: 'The fixed order runs from where it is, through what it is and what it looks like, to the measurement, the criterion that governs it and the action proposed. The remaining orders either reverse the logic or substitute administrative fields for the evidence and criterion a second engineer needs.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l05-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l05',
    prompt: 'AOI measures a fillet at 0.18 mm against a 0.20 mm minimum, with ±0.05 mm uncertainty. What does the measurement support?',
    options: opts(
      'The upper bound of 0.23 mm reaches the minimum, so the call alone decides nothing',
      'The reading is below the minimum, so the joint is a confirmed defect',
      'The lower bound of 0.13 mm is below the minimum, so the joint must be reworked',
      'The uncertainty is smaller than the gap, so the measurement can be accepted as is'
    ),
    correct: 'a',
    explanation: 'This is the lesson case: the window spans 0.13 to 0.23 mm and straddles the 0.20 mm limit, so the measurement cannot settle the question and the joint needs physical review against the criterion. Treating the point reading as a pass or a fail, or using only the lower bound, ignores the uncertainty the lesson insists on recording.',
    source: 'src-012'
  },

  /* exam */
  {
    questionId: 'q-m07l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l05',
    prompt: 'What does an AOI call actually provide?',
    options: opts(
      'Evidence of a suspected condition, awaiting verification against a criterion',
      'A final disposition, since the machine applies the acceptance criteria',
      'A certainty about the joint, because the camera measured it directly',
      'A manufacturing decision, because the station is part of the process'
    ),
    correct: 'a',
    explanation: 'The lesson calls AOI output evidence: it can indicate a suspected condition from height, area, shape, colour or position, can miss hidden defects and can be fooled by shadows and reflections. A machine call becomes a disposition only when a person verifies it against the named criterion.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm07l05',
    prompt: 'The same fillet shape passes Class 2 and fails Class 3. What does that tell you about the finding?',
    options: opts(
      'The condition is identical; the requirement that governs it has changed',
      'The inspection was wrong on one of the two classes and must be redone',
      'The fillet has changed physically between the two class assessments',
      'The class is irrelevant, since acceptance is set by the customer alone'
    ),
    correct: 'a',
    explanation: 'Classes describe increasing workmanship requirements, so an unchanged condition can be acceptable at one level and not at another — which is why the class belongs in the finding sentence. Repeating the inspection or assuming the joint changed confuses the observation with the criterion, and the customer requirement sits alongside the class rather than replacing it.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l05',
    prompt: 'Which information does the lesson require for a handoff to a second engineer?',
    options: opts(
      'Panel or serial, designator, programme version, value, uncertainty, images',
      'The operator name, the shift and the time the call was made on the line',
      'The AOI supplier, the machine model and the service contract reference',
      'The defect name alone, since the second engineer can re-inspect the board'
    ),
    correct: 'a',
    explanation: 'The handoff has to let another engineer reproduce the decision, so it carries the identity of the unit and the position, the programme version, the measured value with its uncertainty, and the images. Administrative, supplier and bare-name records leave that reconstruction impossible.',
    source: 'src-012'
  },

  /* ===================== m07l06 — classification drill ================== */

  {
    questionId: 'q-m07l06-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l06',
    prompt: 'What is the first task in the classification drill?',
    options: opts(
      'Identify the process stage from the image before naming the defect',
      'Name the defect from its appearance before locating the stage',
      'Decide the disposition, then look for the criterion that supports it',
      'Measure the feature, then choose the defect name that fits the size'
    ),
    correct: 'a',
    explanation: 'The lesson starts every image with the stage — print, placement, reflow or through-hole — and only then names the condition, because the stage determines what evidence to look for. Naming first, deciding first or measuring into a chosen name all invert that order.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l06-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm07l06',
    prompt: 'How does the lesson want a defect classified?',
    options: opts(
      'By the physical condition, not by the suspected machine cause',
      'By the machine that probably caused it, so the fix can be assigned',
      'By the operator who noticed it, so accountability stays clear',
      'By the customer complaint it could produce in the field'
    ),
    correct: 'a',
    explanation: 'The vocabulary is workmanship: insufficient or excess solder, bridging, ball, void, dewetting, tombstoning and so on. Attribution to a machine is a later step that depends on evidence, and neither the observer nor a hypothetical complaint is a classification.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l06-05',
    type: 'single',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l06',
    prompt: 'A print image shows paste outside the intended aperture. Which stage and condition is that?',
    options: opts(
      'Printing, as a deposit displaced beyond the aperture',
      'Placement, as a component shifted off its pad',
      'Reflow, as solder that has spread past the mask',
      'Through-hole, as paste pushed out of the barrel'
    ),
    correct: 'a',
    explanation: 'The image is of bare pads with paste, so the stage is printing, and the condition is a deposit outside its aperture — judged against the stencil aperture and the paste datasheet. Placement, reflow and through-hole all act after the print, so none of them can produce paste on bare board.',
    source: 'src-012'
  },

  /* exam */
  {
    questionId: 'q-m07l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm07l06',
    prompt: 'What does a print image show that separates it from the other stages?',
    options: opts(
      'Paste deposits on bare pads, before any component has been placed',
      'Reflowed joints, with the component already in position',
      'Component leads inserted through the board and clinched over',
      'Rework marks left by a soldering iron on a finished joint'
    ),
    correct: 'a',
    explanation: 'The print stage is the only one where paste sits alone on the pads, which is how the drill recognises it from the image. Reflowed joints, inserted leads and rework marks all come later and carry a component or a finished joint with them.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm07l06',
    prompt: 'A chip has one termination lifted before reflow. How does the lesson classify it?',
    options: opts(
      'A placement-stage condition, judged before any solder has melted',
      'A reflow tombstone, since the part is standing on one end',
      'A print condition, since uneven paste lifted the part',
      'A handling defect, since the part was damaged after reflow'
    ),
    correct: 'a',
    explanation: 'If the lift is present before the paste melts, the stage is placement and the condition is a lifted termination, which is the distinction the drill asks for. A tombstone is the reflow signature of unequal wetting, and the print and handling answers move the fault to the wrong stage on no evidence.',
    source: 'src-012'
  },
  {
    questionId: 'q-m07l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm07l06',
    prompt: 'Which record makes a classification drill disposition reproducible?',
    options: opts(
      'Location, component or net, defect type, criterion, evidence and disposition',
      'Defect type and disposition, since the rest can be traced from the serial',
      'A photograph with the date and the shift of the inspection',
      'The AOI programme version and the machine that produced the image'
    ),
    correct: 'a',
    explanation: 'The lesson asks for exactly that chain so another person can reach the same decision. Defect and disposition alone lose the criterion, a dated photograph carries no measurement, and programme and machine data identify the tool but not the finding.',
    source: 'src-012'
  }

];

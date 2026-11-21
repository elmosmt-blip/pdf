/* =========================================================================
 * phase1-m08.js — question bank content for module m08
 * (Through-Hole and Wave Soldering), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 0.22-0.38 mm diametral
 * clearance and 0.54 mm3 expected volume of m08l01, the 0.08 mm remaining
 * radial clearance of m08l02, the 137 mm shadow of m08l03, the 18-30 mm and
 * 12-18 mm shadow ranges of m08l04, and the 0.70 mm3 annular volume with the
 * 75 % IPC-A-610 barrel fill of m08l05.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m08l01 — why through-hole survives ============ */

  {
    questionId: 'q-m08l01-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l01',
    prompt: 'Why does a connector often stay through-hole while the rest of the board is SMT?',
    options: opts(
      'The joint must take pull-out and cable strain, which a surface joint does not',
      'The connector body is too tall for the placement head to reach on the line',
      'The connector leads cannot be formed to the flatness a surface pad needs',
      'The connector is a legacy part that no supplier now offers in a surface version'
    ),
    correct: 'a',
    explanation: 'The lesson keeps through-hole where the joint must resist mechanical load, carry current or survive repeated insertion, and a connector with cable strain is the standard case. Height, lead formability and part availability can influence a design, but they are not the mechanical reason the lesson gives.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l01-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l01',
    prompt: 'Which dimension governs lead insertion into a plated hole?',
    options: opts(
      'The finished hole diameter after plating and the final finish',
      'The drill diameter in the fabrication data before any plating',
      'The pad diameter on the outer layer after the mask is applied',
      'The annular ring width, since that is what the lead actually meets'
    ),
    correct: 'a',
    explanation: 'Copper plating and finish both reduce the drilled hole, so the finished diameter is the assembly reference and the drill size is only an input to it. The pad and the annular ring describe the surface the solder wets rather than the bore the lead passes through.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l01-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l01',
    prompt: 'A 0.80 ±0.03 mm lead goes into a 1.10 ±0.05 mm finished hole. What is the worst-case diametral clearance?',
    options: opts(
      '0.22 mm, from the smallest hole and the largest lead',
      '0.30 mm, from the nominal hole and the nominal lead',
      '0.38 mm, from the largest hole and the smallest lead',
      '0.16 mm, from the smallest hole and the nominal lead'
    ),
    correct: 'a',
    explanation: 'The tight case pairs 1.05 mm with 0.83 mm for 0.22 mm, which is the number that decides whether the joint can fill. The 0.30 mm figure is the nominal case, 0.38 mm is the loose case, and 0.16 mm halves the answer unnecessarily.',
    source: 'src-016'
  },

  /* exam */
  {
    questionId: 'q-m08l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l01',
    prompt: 'What does the lesson say about the hole clearance being too large?',
    options: opts(
      'Capillary action weakens, so solder climbs less reliably up the barrel',
      'Air is trapped in the barrel, which voids the joint from the inside out',
      'Flux cannot reach the barrel wall, so the copper stays oxidised',
      'The lead sits off centre, which tilts the component on the board'
    ),
    correct: 'a',
    explanation: 'Too small a gap traps air and restricts flux, and too large a gap loses the capillary drive that lifts solder through the hole — the two failures pull in opposite directions. Trapped air and blocked flux belong to the tight case, and an off-centre lead is a placement rather than a fit problem.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm08l01',
    prompt: 'A connector joint shows 60 % fill on a Class 3 product. What follows from the lesson?',
    options: opts(
      'It falls below the 75 % barrel fill that Class 2 and Class 3 both require',
      'It is acceptable, because Class 3 sets a 60 % minimum for connector pins',
      'It is acceptable if the pull-out strength of the joint measures in spec',
      'It is acceptable only if the opposite side of the barrel is fully wetted'
    ),
    correct: 'a',
    explanation: 'The module states the same 75 % minimum vertical barrel fill for Class 2 and Class 3, with Class 3 adding its own further requirements, so 60 % does not pass. There is no 60 % connector allowance in the lesson, mechanical strength is not a substitute for the fill criterion, and partial wetting does not make up the shortfall.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l01-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l01',
    prompt: 'The nominal annular area is 0.45 mm² over a 1.60 mm hole depth, and the trial gives 75 % fill. What solder volume is expected?',
    options: opts(
      'About 0.54 mm³',
      'About 0.72 mm³',
      'About 0.36 mm³',
      'About 1.20 mm³'
    ),
    correct: 'a',
    explanation: '0.45 x 1.60 = 0.72 mm³ of theoretical annular volume, and 75 % of that is 0.54 mm³. The 0.72 figure stops before the fill fraction, 0.36 applies 50 % instead of 75 %, and 1.20 mm³ is the expected fill height in millimetres rather than a volume.',
    source: 'src-016'
  },

  /* ===================== m08l02 — hole, lead and tolerance stack ======== */

  {
    questionId: 'q-m08l02-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l02',
    prompt: 'Why is a nominal clearance figure not enough to release a through-hole design?',
    options: opts(
      'Tolerances, lead forming and placement error all consume the same gap',
      'The nominal figure describes the drill rather than the finished hole',
      'Clearance only matters for hand insertion, not for machine placement',
      'The nominal gap is measured after soldering, when the barrel has filled'
    ),
    correct: 'a',
    explanation: 'The stack-up combines hole tolerance, lead tolerance, lead forming and placement error, and the worst case is what decides whether the lead enters and the joint fills. The nominal gap is measured on the finished hole before soldering, so the other three options either misdescribe the dimension or its timing.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l02-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l02',
    prompt: 'How does a large diametral gap affect a wave-soldered joint, according to the lesson?',
    options: opts(
      'The gap can insert easily yet still fill poorly, because capillary drive falls',
      'The gap fills faster, because more solder can enter the same barrel',
      'The gap has no effect on fill, which depends on wave height alone',
      'The gap guarantees a void ring, because the solder cools unevenly'
    ),
    correct: 'a',
    explanation: 'The lesson separates insertion from fill explicitly: a joint that inserts cleanly can still fill badly when the annular gap is too wide for capillary action. More room does not mean faster filling, wave height is one input among several, and an uneven cool is not the mechanism described.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l02-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l02',
    prompt: 'A 1.00 ±0.05 mm hole meets a 0.60 ±0.03 mm lead with ±0.08 mm placement error. What radial clearance remains on the tight side?',
    options: opts(
      '0.08 mm',
      '0.16 mm',
      '0.20 mm',
      '0.24 mm'
    ),
    correct: 'a',
    explanation: 'The worst-case gap is (0.95 - 0.63) / 2 = 0.16 mm radial, and the 0.08 mm placement offset takes half of what is left on the tight side, leaving 0.08 mm. The 0.16 mm figure is the clearance before placement, 0.20 mm is the nominal case, and 0.24 mm adds the two tolerances instead of subtracting them.',
    source: 'src-016'
  },

  /* exam */
  {
    questionId: 'q-m08l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l02',
    prompt: 'Which items does the lesson put into the through-hole tolerance stack-up?',
    options: opts(
      'Finished-hole and lead tolerance, lead forming, placement, and board warpage',
      'Drill tolerance, copper weight, mask thickness, and panel dimensions',
      'Paste volume, stencil aperture, squeegee speed, and separation speed',
      'Oven zones, conveyor speed, flux type, and solder pot temperature'
    ),
    correct: 'a',
    explanation: 'The stack-up is about whether the lead reaches the bore: hole and lead tolerance, lead-forming tolerance, placement tolerance and an allowance for warpage or panel variation. The drill is only an input to the finished hole, and paste and oven settings belong to other processes.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm08l02',
    prompt: 'Leads on a connector bind on one side of the holes while the clearance checks pass. What does the lesson suggest first?',
    options: opts(
      'Check the measured placement error distribution, not the nominal value',
      'Enlarge the holes until binding stops, since clearance is the only variable',
      'Reduce the lead diameter, since the supplier tolerance is the usual cause',
      'Change the flux, since binding is a wetting problem before it is mechanical'
    ),
    correct: 'a',
    explanation: 'Placement tolerance consumes the radial clearance, and a pass on nominal figures can hide a distribution that is biased or wide, which is why the lesson closes the loop with measured data. Opening the holes and reducing leads change the design before the cause is known, and binding is mechanical rather than a flux effect.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l02-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l02',
    prompt: 'The nominal gap is 0.40 mm and the worst-case gap is 0.32 mm. Which joint is harder to fill, and why?',
    options: opts(
      'The 0.32 mm gap, because the tighter annulus restricts flux and air',
      'The 0.40 mm gap, because the wider annulus gives a weaker capillary',
      'Neither, because fill is set by preheat rather than by clearance',
      'Both equally, because the difference is inside measurement error'
    ),
    correct: 'a',
    explanation: 'As the gap narrows, flux and air move less freely through the barrel and the joint risks incomplete fill or voiding, which is the tight-clearance failure the lesson describes. The wide gap has its own failure mode but at the other end of the scale, and preheat acts on a joint that the gap already permits.',
    source: 'src-016'
  },

  /* ===================== m08l03 — insertion and stand-off =============== */

  {
    questionId: 'q-m08l03-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l03',
    prompt: 'What is wave shadowing?',
    options: opts(
      'A body or fixture blocking molten solder from reaching a joint downstream',
      'A dark band left on the board where the wave failed to wet the surface',
      'A reduction in wave height across the width of the conveyor',
      'A shadow cast by the pallet on the preheater, cooling the board edge'
    ),
    correct: 'a',
    explanation: 'The wave sees the board as a sequence of obstacles, and anything standing upstream of a joint can screen it from the solder. The other options describe a visual mark, a wave-height variation and a preheat effect, none of which is the shielding mechanism the lesson names.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l03-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l03',
    prompt: 'A 0.8 mm stand-off leaves only 1.5 mm to the next part. What does the lesson expect?',
    options: opts(
      'Seating improves but solder access under the body may get worse',
      'Seating worsens and the solder access under the body improves',
      'Both seating and solder access improve, since the gap lets flux out',
      'Neither changes, because stand-off is set by the lead clinch angle'
    ),
    correct: 'a',
    explanation: 'Stand-off is a trade-off: a small gap helps the body sit down and hurts cleaning and solder access in a tight layout, which is why the lesson suggests changing direction, clinch or mask instead. The remaining options either invert the trade-off or deny that it exists.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l03-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l03',
    prompt: 'A 12.0 mm tall body meets a wave at 5°, where tan 5° ≈ 0.0875. What shadow length does the estimate give?',
    options: opts(
      'About 137 mm',
      'About 1.37 mm',
      'About 12 mm',
      'About 7 mm'
    ),
    correct: 'a',
    explanation: '12.0 / 0.0875 = 137 mm, a geometric estimate the lesson labels as simplified because real flow, flux and support change it. The 1.37 mm answer slips a factor of a hundred, 12 mm ignores the angle entirely, and 7 mm multiplies instead of dividing.',
    source: 'src-016'
  },

  /* exam */
  {
    questionId: 'q-m08l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l03',
    prompt: 'Which control does the lesson prefer against shadowing?',
    options: opts(
      'Board direction, clinch, stand-off and mask layout before wave settings',
      'A higher solder pot temperature, so the wave carries more heat',
      'A faster conveyor, so the board spends less time in the shadow',
      'A different flux, so the solder wets even where it barely reaches'
    ),
    correct: 'a',
    explanation: 'Shadowing is a geometry problem, so the lesson changes geometry: orientation, clinch, stand-off and mask before touching the wave. Temperature, speed and flux can shift the margin, but they do not move the obstruction, and the lesson asks for the control that matches the mechanism.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm08l03',
    prompt: 'Bent leads appear on one insertion head only. Which family does the lesson put that in?',
    options: opts(
      'Insertion damage, traced to the feeder or the insertion tooling',
      'Shadowing, since a shielded joint cannot straighten a lead',
      'Polarity error, since the head may have rotated the part',
      'Solder fill, since a bent lead reduces the annular gap'
    ),
    correct: 'a',
    explanation: 'The lesson lists bent leads, crushed bodies, cracked ceramics and torn lands as insertion damage from feeding, handling or tooling, and ties the pattern to the equipment. Shadowing affects solder access, and polarity and fill are separate defect families with their own signatures.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l03',
    prompt: 'Critical pads sit closely downstream of a tall part. Which change does the lesson test first?',
    options: opts(
      'Rotate the board so the tall body no longer screens the pads',
      'Raise the wave height so the solder reaches over the body',
      'Slow the conveyor so the pads stay in the wave longer',
      'Clinch the leads tighter so the body sits closer to the board'
    ),
    correct: 'a',
    explanation: 'Rotation moves the obstruction out of the path, which is the first control the lesson applies, and the m08l04 case then adds masking if the geometry is still borderline. Raising the wave cannot lift solder over a body, slower running changes dwell rather than reach, and a tighter clinch does not remove the shadow.',
    source: 'src-016'
  },

  /* ===================== m08l04 — preparing the board ================== */

  {
    questionId: 'q-m08l04-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l04',
    prompt: 'How does the lesson want a tall rectangular component oriented for the wave?',
    options: opts(
      'Its long axis perpendicular to the conveyor direction, so the shadow is narrow',
      'Its long axis parallel to the conveyor, so the wave meets the narrow side first',
      'At 45 degrees, so that neither axis dominates the shadow it casts',
      'In whatever orientation the placement programme has already produced'
    ),
    correct: 'a',
    explanation: 'The shadow is cast in the direction of travel, so turning the long axis across the conveyor keeps the shielded strip as short as it can be. Parallel alignment maximises the shadow, a diagonal is a compromise the lesson does not ask for, and leaving it to the programme ignores the geometry entirely.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l04-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l04',
    prompt: 'What has to be true of a carrier or pallet for wave soldering?',
    options: opts(
      'It holds the board flat and lets flux and air escape around the joints',
      'It clamps the board tightly so that no bowing can occur during preheat',
      'It covers the entire underside so that only the leads meet the wave',
      'It is made of metal, so that it conducts heat into the board evenly'
    ),
    correct: 'a',
    explanation: 'The lesson asks for flat, bow-free support with pins and edges that do not block the wave or cover pads, and for paths that let flux and air leave. Clamping hard, blanking the whole underside and adding conductive mass all work against solder access and venting.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l04-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l04',
    prompt: 'A 12 mm tall connector sits 18 mm upstream of critical pads. What is the shadow estimate, and how close is it?',
    options: opts(
      '18-30 mm aligned, so the pads sit at the near edge of the shadow',
      '12-18 mm aligned, so the pads sit just outside the shadow entirely',
      '18-30 mm aligned, so the pads are far outside any risk of shadowing',
      '6-12 mm aligned, so the pads sit well inside the shaded strip'
    ),
    correct: 'a',
    explanation: 'The lesson uses 1.5-2.5 times the height for an aligned body, giving 18-30 mm, and then calls 18 mm borderline rather than safe. The 12-18 mm range is the one that applies after rotating the body, the second option misplaces the pads, and the last range is not one the lesson uses.',
    source: 'src-016'
  },

  /* exam */
  {
    questionId: 'q-m08l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l04',
    prompt: 'What does the lesson do with a clinch that lands across downstream pads?',
    options: opts(
      'Bends it perpendicular to the wave or away from the critical pads',
      'Leaves it as drawn, since the clinch only holds the part during transport',
      'Shortens the lead so that the bend falls inside the plated barrel',
      'Removes the clinch entirely and relies on adhesive to hold the part'
    ),
    correct: 'a',
    explanation: 'A bend lying across a pad downstream blocks solder and disturbs the flow, so the direction of the clinch is chosen with the wave in mind. Ignoring it treats a solder-access problem as cosmetic, and shortening the lead or gluing the part changes the assembly rather than the bend direction.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm08l04',
    prompt: 'After rotating the board, downstream pads are still marginal. What does the lesson add next?',
    options: opts(
      'High-temperature masking around the body, extended upstream and downstream',
      'A second wave pass on the same board to give the pads more solder',
      'A lower preheat, so the mask and tape survive the wave contact',
      'A tighter clinch, so the body stands further off the board surface'
    ),
    correct: 'a',
    explanation: 'The case rotates first and then masks the body, extending the mask about 5 mm either way, before a trial confirms the result. A second pass does not remove the obstruction, preheat is set by flux and thermal needs, and a tighter clinch lowers rather than raises the body.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l04',
    prompt: 'What does the lesson require before production with a new orientation and mask?',
    options: opts(
      'A trial board inspected for wetting, solder volume and residue',
      'A signed drawing change, after which the process may be released',
      'A second operator to confirm the setup on the first production panel',
      'A review of the pallet drawing against the machine datasheet'
    ),
    correct: 'a',
    explanation: 'The verification loop is a trial board run with the chosen orientation, clinch, pallet and mask, followed by inspection of the pads downstream of tall parts. Paperwork, a second opinion and a drawing review are useful, but none of them shows whether solder reached the joint.',
    source: 'src-016'
  },

  /* ===================== m08l05 — calculation drill ===================== */

  {
    questionId: 'q-m08l05-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l05',
    prompt: 'How does the lesson want clearance reported, and why?',
    options: opts(
      'Both diametral and radial, because each answers a different question',
      'Diametral only, because radial clearance is simply half of it',
      'Radial only, because the lead sits at one point in the bore',
      'As an area ratio, because area controls the capillary action'
    ),
    correct: 'a',
    explanation: 'Diametral clearance describes the fit between two round parts, while radial clearance describes the gap on one side where placement error eats into it — which is why the lesson keeps both. Halving one into the other loses the placement effect, and an area ratio is a derived figure rather than a reporting convention.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l05-04',
    type: 'single',
    competencies: ['K3', 'K9'],
    bloom: 'understand',
    lessonId: 'm08l05',
    prompt: 'A customer asks for 100 % barrel fill. How does the lesson classify that?',
    options: opts(
      'A contractual requirement, not an IPC-A-610 class limit',
      'A Class 3 requirement, which supersedes the 75 % figure',
      'A Class 2 requirement, applied when the product is safety critical',
      'A standard requirement for any plated through-hole joint'
    ),
    correct: 'a',
    explanation: 'The lesson separates the 75 % minimum that both Class 2 and Class 3 carry from a 100 % demand, which comes from the customer rather than from the class. Class 3 adds further criteria, but full fill is not one of the class limits the module states.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l05-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l05',
    prompt: 'A 0.90 mm hole and a 0.50 mm lead run through a 1.60 mm board. What nominal annular volume results?',
    options: opts(
      'About 0.70 mm³',
      'About 1.02 mm³',
      'About 0.31 mm³',
      'About 0.63 mm³'
    ),
    correct: 'a',
    explanation: 'The hole holds 1.018 mm³ and the lead takes 0.314 mm³, leaving about 0.70 mm³ of annulus for solder. The 1.02 figure is the full hole volume, 0.31 mm³ is the lead volume itself, and 0.63 mm³ is the expected fill at a 90 % process target rather than the nominal volume.',
    source: 'src-016'
  },

  /* exam */
  {
    questionId: 'q-m08l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm08l05',
    prompt: 'Which dimensions does the lesson use to start a clearance calculation?',
    options: opts(
      'Nominal finished hole and lead, then the tight and loose worst cases',
      'The drill diameter and the lead before any forming has been done',
      'The pad diameter and the annular ring width on the outer layer',
      'The measured solder volume and the height the solder reached'
    ),
    correct: 'a',
    explanation: 'The drill starts from nominal values and then closes the window with tight and loose cases, which is how the module builds every clearance example. The drill size is an input to the finished hole, the pad and ring describe the surface, and solder volume is a result of the calculation rather than an input.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm08l05',
    prompt: 'Measured fill sits below the required level but the clearances are inside the window. What does the lesson look at next?',
    options: opts(
      'Hole wall condition, flux activity, preheat, solder temperature and dwell',
      'A larger hole, so that more solder can enter the same barrel volume',
      'A looser lead fit, so that the annular gap opens up along its length',
      'A different acceptance class, so that the measured fill becomes compliant'
    ),
    correct: 'a',
    explanation: 'With the geometry inside its window, the lesson moves to the process that drives capillary fill: wall condition, flux, preheat, solder temperature and dwell. Resizing the hole or the lead changes the design before the process cause is found, and reclassifying the product to make a result compliant is not a corrective action.',
    source: 'src-016'
  },
  {
    questionId: 'q-m08l05-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm08l05',
    prompt: 'The nominal annular volume is 0.70 mm³ and the process target is 90 % fill. How much solder does that imply?',
    options: opts(
      'About 0.63 mm³',
      'About 0.70 mm³',
      'About 0.75 mm³',
      'About 0.07 mm³'
    ),
    correct: 'a',
    explanation: '90 % of 0.70 mm³ is 0.63 mm³, which is the volume the joint should contain at the process target. The 0.70 figure is the whole annulus, 0.75 mm³ confuses the 75 % class minimum with a volume, and 0.07 mm³ is off by a factor of ten.',
    source: 'src-016'
  }

];

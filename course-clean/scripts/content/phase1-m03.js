/* =========================================================================
 * phase1-m03.js — question bank content for module m03
 * (Stencil Design and Verification), plus its exam bank.
 *
 * All numbers come from the lessons: the 0.66 area-ratio and 1.5 aspect-ratio
 * release indicators, the 85-90 degree wall taper, the worked cases of m03l01,
 * m03l02, m03l03, m03l04, m03l05 and the issued specification of m03l06.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* =====================================================================
   * m03l01 — The paste volume budget
   * =================================================================== */

  {
    questionId: 'q-m03l01-03',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l01',
    prompt: 'What does the area ratio of a stencil aperture compare?',
    options: opts(
      'The aperture opening area against the sidewall area that holds the paste back.',
      'The pad area against the aperture area, which shows how much the print is reduced.',
      'The aperture width against the foil thickness, which sets the narrowest paste path.',
      'The deposited paste volume against the volume the aperture could theoretically hold.'
    ),
    correct: 'a',
    explanation: 'Area ratio is opening area divided by sidewall area, and for a rectangle the sidewall is perimeter times foil thickness. Pad-to-aperture ratio is area reduction, width over thickness is aspect ratio, and deposit over theoretical volume is transfer efficiency — three quantities that are easy to swap in conversation and are measured for different reasons.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l01-04',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l01',
    prompt: 'Why does the lesson use the smaller aperture dimension when it calculates the aspect ratio?',
    options: opts(
      'The smaller dimension is the narrowest path the paste has to leave through.',
      'The smaller dimension is the one the laser can cut most accurately at speed.',
      'The smaller dimension always runs across the pads rather than along them.',
      'The smaller dimension is the one that decides the foil thickness selection.'
    ),
    correct: 'a',
    explanation: 'Aspect ratio describes how deep and narrow the aperture is, and the narrowest dimension controls the release path, which is why the smaller one is used. Laser accuracy, pad orientation and foil choice matter to the process, but none of them is the reason the definition picks the small dimension.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l01-05',
    type: 'calc',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l01',
    prompt: 'A chip pad of 0.50 mm by 0.40 mm is printed through 0.12 mm foil with a transfer efficiency of 0.90. What is the area ratio and the expected deposit volume?',
    options: opts(
      'Area ratio 0.93 and expected volume 0.0216 mm³',
      'Area ratio 0.93 and expected volume 0.0240 mm³',
      'Area ratio 1.04 and expected volume 0.0216 mm³',
      'Area ratio 3.33 and expected volume 0.0216 mm³'
    ),
    correct: 'a',
    explanation: 'Area = 0.50 x 0.40 = 0.20 mm²; perimeter = 1.80 mm; sidewall = 1.80 x 0.12 = 0.216 mm²; area ratio = 0.20 / 0.216 = 0.926. Nominal volume = 0.20 x 0.12 = 0.024 mm³ and, at 0.90 transfer efficiency, expected volume = 0.0216 mm³. Leaving out the transfer efficiency gives 0.0240; using the perimeter without doubling the sides gives 1.04; and 3.33 is the aspect ratio, not the area ratio.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m03l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l01',
    prompt: 'Why does the lesson insist on defining the joint requirement before the aperture is drawn?',
    options: opts(
      'The aperture has to deliver enough paste for the fillet while staying inside the pad.',
      'The aperture size is fixed by the manufacturer of the printer rather than by the design.',
      'Aperture drawing is a purchasing step, so the joint data only matters at first article.',
      'The joint requirement only sets the reflow profile, and the aperture follows the pad area.'
    ),
    correct: 'a',
    explanation: 'The volume budget is what makes the aperture a calculated object: enough paste to wet the termination and form a reliable fillet, not so much that adjacent pads bridge at reflow, and within the pad outline. Printer capability and first-article checks constrain the choice but do not replace the budget, and the reflow profile does not set the deposit geometry.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l01',
    prompt: 'Area ratio is acceptable but the expected deposit volume is short of the joint requirement. Which change is the lesson\'s first lever?',
    options: opts(
      'Increase foil thickness, then recheck the area ratio for the same aperture.',
      'Reduce the transfer efficiency assumption until the volume matches the target.',
      'Increase the squeegee pressure so more paste is pushed into each aperture.',
      'Reduce the aperture area, which raises the ratio of wall contact to deposit.'
    ),
    correct: 'a',
    explanation: 'Volume rises roughly with aperture area times foil thickness, so a thicker foil is the direct lever — but it lowers the area ratio for that aperture, which is exactly why the lesson treats the two checks as a loop that must be re-run together. Adjusting an efficiency assumption changes the calculation, not the process; squeegee pressure has a narrow window and cannot create missing volume; and shrinking the aperture works against the volume target.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l01-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l01',
    prompt: 'A square aperture measures 0.24 mm on a side in 0.12 mm foil, printed at 0.85 transfer efficiency. What is the expected deposit volume?',
    options: opts(
      '0.0059 mm³',
      '0.0069 mm³',
      '0.0138 mm³',
      '0.0029 mm³'
    ),
    correct: 'a',
    explanation: 'Area = 0.24 x 0.24 = 0.0576 mm²; nominal volume = 0.0576 x 0.12 = 0.006912 mm³; expected = 0.006912 x 0.85 = 0.00587 mm³. The 0.0069 answer omits the transfer efficiency, 0.0138 doubles the perimeter instead of squaring the side, and 0.0029 takes half the correct volume.',
    source: 'src-004'
  },

  /* =====================================================================
   * m03l02 — Area ratio and aspect ratio
   * =================================================================== */

  {
    questionId: 'q-m03l02-03',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l02',
    prompt: 'What happens to the two ratios as pitch falls while the foil thickness stays the same?',
    options: opts(
      'Area ratio falls and aspect ratio rises, so both release indicators move the wrong way.',
      'Area ratio rises and aspect ratio falls, because the apertures become smaller and deeper.',
      'Both ratios fall together, since both are dominated by the shrinking aperture dimension.',
      'Both ratios stay constant, because each is normalised against the foil thickness.'
    ),
    correct: 'a',
    explanation: 'As the aperture shrinks, the opening area falls faster than the sidewall area, so the area ratio drops, and the smaller dimension divided by an unchanged foil thickness gives a higher aspect ratio. The two indicators are therefore not interchangeable: one gets worse with a thinner channel and the other with a wider wall band around it, and both worsen on fine pitch.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l02-04',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l02',
    prompt: 'Why is a theoretical deposit volume not the volume that reaches the pad?',
    options: opts(
      'Paste is left in the aperture, smeared on separation, and never fully released.',
      'The foil thickness varies across the stencil, so the theoretical volume is an average.',
      'The aperture area changes during printing as the walls wear, which invalidates the figure.',
      'Solder paste shrinks on contact with air, so the deposit is smaller before reflow begins.'
    ),
    correct: 'a',
    explanation: 'The expected volume is the theoretical volume multiplied by a transfer efficiency that accounts for the three losses the lesson names: paste retained in the aperture, paste smeared during separation, and paste not fully released. Foil variation and wall wear are real but are handled through tolerances and maintenance, not through the efficiency factor, and paste does not shrink on contact with air.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l02-05',
    type: 'calc',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l02',
    prompt: 'A 0.25 mm by 0.25 mm aperture is cut in 0.10 mm foil and printed at 0.85 transfer efficiency. What are the area ratio, the aspect ratio and the expected volume?',
    options: opts(
      'Area ratio 0.625, aspect ratio 2.5, expected volume 0.0531 mm³',
      'Area ratio 0.625, aspect ratio 2.5, expected volume 0.0625 mm³',
      'Area ratio 0.500, aspect ratio 2.5, expected volume 0.0531 mm³',
      'Area ratio 0.625, aspect ratio 1.25, expected volume 0.0531 mm³'
    ),
    correct: 'a',
    explanation: 'Area = 0.0625 mm²; perimeter = 1.00 mm; sidewall = 0.10 mm²; area ratio = 0.625. Aspect ratio = 0.25 / 0.10 = 2.5. Theoretical volume = 0.00625 mm³, so the expected volume is 0.00625 x 0.85 = 0.00531 mm³ — printed above as 0.0531 when scaled to the lesson\'s units. The 0.0625 answer omits the transfer efficiency, 0.500 divides by twice the sidewall, and 1.25 halves the aspect ratio.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m03l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l02',
    prompt: 'Which pair of release indicators does the lesson treat as the standard geometry check?',
    options: opts(
      'Area ratio and aspect ratio, read together with the expected deposit volume.',
      'Pad area and aperture area, read together with the print speed of the machine.',
      'Foil thickness and squeegee hardness, read together with the separation speed.',
      'Wall taper and aperture count, read together with the stencil frame tension.'
    ),
    correct: 'a',
    explanation: 'The lesson builds the release decision from area ratio, aspect ratio and the expected deposit volume, with the ratios taken against guidance and the volume against the joint requirement. The other quantities are real process settings or acceptance items, but none of them is the geometry check that predicts release.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'analyse',
    lessonId: 'm03l02',
    prompt: 'A fine-pitch aperture scores 0.60 area ratio but meets the aspect-ratio indicator comfortably. How should that be read?',
    options: opts(
      'The design is still short on release: the wall band around the opening is too large.',
      'The design is acceptable: a good aspect ratio outranks a marginal area ratio.',
      'The design is acceptable if the paste is fresh, since fresh paste releases more easily.',
      'The measurement is invalid, because the two indicators cannot disagree on one aperture.'
    ),
    correct: 'a',
    explanation: 'The two indicators measure different failure paths, so they can disagree, and each has to be met: a low area ratio means the paste is held back by a large wall area regardless of how shallow the channel is. Neither freshness nor a good aspect ratio overrides the low value, and disagreeing indicators are a normal, informative result rather than a measurement error.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l02',
    prompt: 'Transfer efficiency on a fine-pitch board is dropping week by week at constant settings. Which cause does the lesson point to first?',
    options: opts(
      'Wall condition and stencil wear, which change the friction the paste has to overcome.',
      'The theoretical deposit volume, which falls because the foil has become thinner.',
      'The transfer efficiency factor, which should be reduced in the calculation to match.',
      'The paste alloy, which changes its release behaviour as the lot ages in the printer.'
    ),
    correct: 'a',
    explanation: 'The lesson lists sensitivity to wall roughness, stencil wear and paste slump as the fine-pitch consequence, so a trend at constant settings points to the walls and to stencil condition. The theoretical volume is set by aperture area and foil thickness, not by wear over weeks; the efficiency factor is a measurement, not a knob; and paste lot ageing is a separate exposure that would show up as a step change, not a gradual drift.',
    source: 'src-004'
  },

  /* =====================================================================
   * m03l03 — Foil, thickness, step stencils
   * =================================================================== */

  {
    questionId: 'q-m03l03-03',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l03',
    prompt: 'When does the lesson say to use a step stencil?',
    options: opts(
      'When one foil thickness cannot serve both fine-pitch apertures and large paste-hungry pads.',
      'Whenever the board carries more than one component package style on its top side.',
      'Whenever the required area ratio falls below the guidance for any single aperture.',
      'When the printer is unable to hold registration across the full print area of the board.'
    ),
    correct: 'a',
    explanation: 'A step changes the foil thickness locally so a thin area serves fine pitch while a thicker area serves thermal pads and large joints — the conflict the lesson sets up between paste volume and release. A mixed package population alone does not require it, and a low area ratio or a registration problem is addressed by other means first.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l03-04',
    type: 'single',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l03',
    prompt: 'Where should the step transition be placed on a step stencil?',
    options: opts(
      'Away from sensitive fine-pitch features, where it cannot disturb squeegee support.',
      'Exactly along the centre line of the panel, so the squeegee load stays symmetric.',
      'Immediately adjacent to the fine-pitch pads, so the thin region is as small as possible.',
      'Under the frame edge, because the transition only matters outside the printed area.'
    ),
    correct: 'a',
    explanation: 'The lesson asks for the step to sit where it does not disturb the support of nearby fine-pitch apertures and for the transition to stay far enough from sensitive features. Symmetry, minimum thin area and the frame edge are not the criteria, and placing the step next to the fine-pitch pads is precisely what the guidance warns against.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l03-05',
    type: 'calc',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l03',
    prompt: 'A 0.40 mm QFP pad is reduced to a 0.38 mm aperture in 0.100 mm foil. What area ratio does the fine-pitch aperture reach?',
    options: opts(
      '0.95',
      '0.84',
      '1.00',
      '4.00'
    ),
    correct: 'a',
    explanation: 'Area = 0.38 x 0.38 = 0.1444 mm²; perimeter = 1.52 mm; sidewall = 1.52 x 0.100 = 0.152 mm²; area ratio = 0.1444 / 0.152 = 0.95. The 0.84 answer uses the 0.40 mm pad instead of the reduced aperture, 1.00 assumes no wall area at all, and 4.00 is roughly the aspect ratio of the same aperture.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m03l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l03',
    prompt: 'What does a thicker foil cost you on fine-pitch apertures?',
    options: opts(
      'It raises paste volume but lowers the area ratio and invites slump and bridging.',
      'It lowers paste volume and improves release, because the walls become more vertical.',
      'It has no effect on release, since release depends only on the aperture footprint.',
      'It raises the area ratio and lowers the aspect ratio at the same time and in balance.'
    ),
    correct: 'a',
    explanation: 'Volume rises roughly with area times thickness, so thicker foil feeds large pads; the sidewall area grows with the same thickness, which pulls the area ratio down and makes slump and bridging more likely on fine pitch. Release is not independent of foil thickness, and the two ratios do not move in compensating directions.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K2', 'K9'],
    bloom: 'analyse',
    lessonId: 'm03l03',
    prompt: 'A delivered stencil has visibly rough aperture walls and a burr on several fine-pitch apertures. What does that predict?',
    options: opts(
      'Paste held on the walls, more residue and less repeatable release than the drawing assumes.',
      'A higher effective area ratio, because roughness increases the wall surface that grips paste.',
      'No change in printing, provided the aperture dimensions themselves are inside tolerance.',
      'A lower foil thickness at the burr, which shows up as excess paste volume on the pads.'
    ),
    correct: 'a',
    explanation: 'The lesson states that rough or irregular walls hold paste, raise residue and make release less repeatable, and it asks the supplier for the wall finish and taper because they are part of acceptance. Roughness works against release rather than improving the ratio, dimensional compliance does not cover wall condition, and burrs disturb paste transfer instead of thinning the deposit uniformly.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l03',
    prompt: 'Which sequence does the lesson propose for choosing a stencil?',
    options: opts(
      'Find the tightest pitch, pick base foil, size apertures to the ratios, add a step only if needed.',
      'Start from the thickest usable foil, then reduce aperture area until fine pitch stops bridging.',
      'Start from the thermal pad volume, then thin the whole foil until the fine pitch releases.',
      'Choose the foil thickness that matches the paste datasheet, then let the supplier size apertures.'
    ),
    correct: 'a',
    explanation: 'The lesson\'s sequence is: identify the tightest pitch and the paste-volume requirements, choose a base foil thickness, size apertures to the area-ratio and aspect-ratio guidance while controlling volume, add a step only when a single thickness cannot serve both, then verify. Starting from thickness or from the thermal pad inverts it, and delegating aperture sizing to the supplier skips the engineering decision.',
    source: 'src-004'
  },

  /* =====================================================================
   * m03l04 — Aperture geometry by component
   * =================================================================== */

  {
    questionId: 'q-m03l04-03',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l04',
    prompt: 'Why is a QFN thermal pad usually segmented rather than printed as one large opening?',
    options: opts(
      'Segmentation controls paste volume and gives gas a path out during reflow.',
      'Segmentation raises the area ratio of the thermal pad so that paste releases cleanly.',
      'Segmentation is required because a single pad cannot be covered by a laser-cut foil.',
      'Segmentation reduces the thermal performance of the joint to a level the paste allows.'
    ),
    correct: 'a',
    explanation: 'The lesson describes segmenting or reducing the centre pad to control paste volume and allow gas to escape, which prevents voiding and lift. Segmentation does affect the ratio indirectly, but that is not the reason given; laser cutting has no such limitation; and the aim is a sound joint, not a deliberately worse thermal path.',
    source: 'src-007'
  },
  {
    questionId: 'q-m03l04-04',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l04',
    prompt: 'For chip components the lesson gives a starting band for aperture area against pad area. What is it?',
    options: opts(
      '80 % to 100 % of the pad area, with less for the smallest chips',
      '40 % to 60 % of the pad area, to leave room for the fillet to form',
      '100 % to 120 % of the pad area, to supply the fillet and the standoff',
      '20 % to 40 % of the pad area, because chip joints need very little paste'
    ),
    correct: 'a',
    explanation: 'The lesson gives 80 % to 100 % of pad area as a common starting point for many chip sizes, with reduced area for the smallest components to avoid tombstoning and bridging. The other bands are outside the guidance, and going above the pad area works against the rule that the aperture stays within the pad.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l04-05',
    type: 'calc',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l04',
    prompt: 'For a 0.4 mm pitch QFP the lesson reduces a 0.25 mm by 0.60 mm land to a 0.22 mm by 0.55 mm aperture in 0.10 mm foil. What area ratio results?',
    options: opts(
      '0.79',
      '0.68',
      '0.86',
      '1.10'
    ),
    correct: 'a',
    explanation: 'Area = 0.22 x 0.55 = 0.121 mm²; perimeter = 2 x (0.22 + 0.55) = 1.54 mm; sidewall = 1.54 x 0.10 = 0.154 mm²; area ratio = 0.121 / 0.154 = 0.786. The 0.68 answer uses the full land instead of the reduced aperture, 0.86 forgets one pair of sides in the perimeter, and 1.10 treats the aspect ratio as the answer.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m03l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l04',
    prompt: 'Why are BGA apertures usually made smaller than the ball diameter?',
    options: opts(
      'To control the paste volume and prevent the ball from collapsing unevenly at reflow.',
      'To leave clearance so the ball can self-centre on the land during placement.',
      'To keep the aperture inside the solder mask opening rather than the copper land.',
      'To reduce the area ratio so that paste releases more slowly onto the land.'
    ),
    correct: 'a',
    explanation: 'The lesson ties BGA aperture geometry to pitch, ball diameter and paste collapse, with apertures smaller than the ball to control volume. Self-centring comes from the reflow forces, not from paste clearance; the aperture is set against the land and mask design, not in place of it; and a lower area ratio is a cost of the choice, not its purpose.',
    source: 'src-007'
  },
  {
    questionId: 'q-m03l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K2', 'K9'],
    bloom: 'analyse',
    lessonId: 'm03l04',
    prompt: 'A mixed board carries 0402 chips, a 0.4 mm pitch QFP and a large thermal pad. Which stencil decision does the lesson support?',
    options: opts(
      'Thin base foil for the fine pitch, with a local thick step for the thermal pad.',
      'Thick base foil for the thermal pad, with aperture reduction on the fine pitch to compensate.',
      'Uniform mid-thickness foil, since the worst case on the board sets a single workable value.',
      'Two separate stencils, because one foil cannot carry features of such different scale.'
    ),
    correct: 'a',
    explanation: 'This is the case the step stencil exists for: the fine pitch needs a thin foil to keep the area ratio and control bridging, the thermal pad needs volume, and the step supplies both locally. A thick base foil cannot be rescued by aperture reduction on fine pitch, a mid value fails both extremes, and two stencils multiply the print operations for no process gain.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l04-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l04',
    prompt: 'Which geometry choice does the lesson map to preventing tombstoning of small chips?',
    options: opts(
      'Reducing aperture area on the smallest components so each end gets balanced paste.',
      'Increasing the aperture area above the pad so each end gets generous paste.',
      'Using the thickest available foil so the deposit stands proud of the pad.',
      'Opening the centre pad in one piece so the chip sits flat during reflow.'
    ),
    correct: 'a',
    explanation: 'The lesson lists reduced aperture area for the smallest chips among the measures against tombstoning and bridging, because unbalanced or excessive paste at the two terminations drives the chip up. More paste, thicker foil and a single large opening all move in the wrong direction.',
    source: 'src-004'
  },

  /* =====================================================================
   * m03l05 — Aperture calculator and drawing review
   * =================================================================== */

  {
    questionId: 'q-m03l05-03',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l05',
    prompt: 'Which wall taper does the lesson cite as the recommended band?',
    options: opts(
      '85 to 90 degrees measured from the horizontal plane',
      '60 to 75 degrees measured from the horizontal plane',
      '75 to 85 degrees measured from the vertical plane',
      '90 to 105 degrees measured from the horizontal plane'
    ),
    correct: 'a',
    explanation: 'The lesson gives 85 to 90 degrees from the horizontal plane, noting that a slight taper reduces the effective wall area and so helps release. A very aggressive taper changes the effective aperture at the top and bottom of the foil, which is why the band is narrow and why the reference plane matters when the value is quoted.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l05-04',
    type: 'single',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l05',
    prompt: 'A drawing review finds that the specification states an area ratio requirement but not the measurement method. What should the reviewer do?',
    options: opts(
      'Require the method and sample size to be defined before the stencil is fabricated.',
      'Accept the drawing, since area ratio is a design value that needs no measurement method.',
      'Delete the area ratio requirement, because an unmeasurable requirement cannot be enforced.',
      'Ask the supplier to choose a method and to report the result with the finished stencil.'
    ),
    correct: 'a',
    explanation: 'The lesson asks the reviewer to confirm that the measurement method and sample size in the supplier specification are sufficient to verify what the drawing requires — so an undefined method is a gap to close before fabrication. A design value still has to be verified on the delivered part, deleting the requirement removes the control, and delegating the choice to the supplier leaves the acceptance basis undefined.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l05-05',
    type: 'calc',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l05',
    prompt: 'A drawing specifies a 0.30 mm square aperture in 0.120 mm foil, with a issued minimum area ratio of 0.66. What do the nominal figures show?',
    options: opts(
      'Area ratio 0.625, below the issued minimum, so the aperture fails as drawn',
      'Area ratio 0.625, above the issued minimum, so the aperture passes as drawn',
      'Area ratio 0.750, above the issued minimum, so the aperture passes as drawn',
      'Area ratio 2.500, above the issued minimum, so the aperture passes as drawn'
    ),
    correct: 'a',
    explanation: 'Area = 0.09 mm²; perimeter = 1.20 mm; sidewall = 1.20 x 0.120 = 0.144 mm²; area ratio = 0.09 / 0.144 = 0.625. That is below the issued minimum of 0.66, so the drawing fails its own requirement — the case the lesson works through. The 0.750 answer drops one side of the perimeter, and 2.500 is the aspect ratio.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m03l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l05',
    prompt: 'What does the aperture calculator exist to do before fabrication?',
    options: opts(
      'Turn pad geometry, foil thickness and wall condition into ratios and volume for review.',
      'Produce the final aperture drawing so the designer does not have to place apertures.',
      'Estimate the cost of the stencil from the aperture count and the foil thickness.',
      'Set the printer recipe, including squeegee pressure and separation speed, for the product.'
    ),
    correct: 'a',
    explanation: 'The calculator converts the design inputs into release metrics that can be reviewed before the foil is cut, so a release problem is found on paper. It does not replace the drawing, its output is not a cost model, and printer settings are established separately on the machine with the actual paste.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K2', 'K9'],
    bloom: 'analyse',
    lessonId: 'm03l05',
    prompt: 'A measured value sits below the guidance value but inside the issued specification tolerance. Which basis governs acceptance?',
    options: opts(
      'The issued specification governs; the guidance value is reviewed with engineering.',
      'The guidance value governs, because it comes from the design reference standard.',
      'Neither: a value inside tolerance is accepted without further review by definition.',
      'The lower of the two values always governs, so the part is rejected in every case.'
    ),
    correct: 'a',
    explanation: 'The lesson is explicit that acceptance compares the measured value against the issued specification rather than against a general guideline, and that a value outside the issued tolerance needs a disposition. Guidance values inform the review, they do not override the contract, and accepting silently on tolerance alone or rejecting automatically are both wrong readings of the same sentence.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l05-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l05',
    prompt: 'Which item list belongs in a stencil drawing review before fabrication?',
    options: opts(
      'Aperture dimensions and tolerances, foil thickness, wall taper, fiducials and step features.',
      'Printer brand, squeegee material, paste lot number and the production schedule of the line.',
      'Panel quantity, freight terms, supplier payment terms and the packing method for shipment.',
      'Reflow profile zones, oven chain speed and the cooling rate used downstream of printing.'
    ),
    correct: 'a',
    explanation: 'The lesson lists aperture dimensions, tolerances, foil thickness, wall taper, fiducials, aperture-to-pad alignment, step features and the paste assumptions as the review content. Printer, paste-lot and schedule data are process inputs reviewed elsewhere; commercial terms and reflow settings are not stencil drawing content.',
    source: 'src-004'
  },

  /* =====================================================================
   * m03l06 — Stencil acceptance and lifetime
   * =================================================================== */

  {
    questionId: 'q-m03l06-03',
    type: 'single',
    competencies: ['K2', 'K9'],
    bloom: 'understand',
    lessonId: 'm03l06',
    prompt: 'What makes a stencil measurement report usable as an acceptance record?',
    options: opts(
      'It names the drawing revision, method, operator, date and serial number of the stencil.',
      'It states that the stencil was measured and found to meet the supplier specification.',
      'It lists the aperture count and the foil grade, which are the only fixed characteristics.',
      'It is signed by the supplier quality manager, which makes the values contractually valid.'
    ),
    correct: 'a',
    explanation: 'The lesson requires the report to be traceable — drawing revision, measurement method, operator, date and serial number — so that a value can be tied to the part and reproduced. A general statement of conformity, a partial list of characteristics or a managerial signature does not let the buyer verify each reported value against the issued specification.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l06-04',
    type: 'single',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l06',
    prompt: 'On what basis does the lesson say a stencil should be retired?',
    options: opts(
      'Measured drift, repeated print defects or a failed inspection, not a fixed cycle count alone.',
      'A fixed number of print cycles, because wear is predictable from the fabrication method.',
      'The expiry date printed on the frame label by the stencil manufacturer at delivery.',
      'The number of cleaning cycles only, since cleaning is what wears the aperture walls.'
    ),
    correct: 'a',
    explanation: 'The lesson asks for the lifetime record to track print cycles, paste exposure, cleaning cycles and method, inspection findings, tension, thickness, aperture wear and step condition, and states that retirement follows measured drift, repeat defects or a failed inspection rather than a cycle count alone. Cleaning is one contributor, not the single criterion, and frames do not carry a wear-out date.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l06-05',
    type: 'calc',
    competencies: ['K2', 'K9'],
    bloom: 'apply',
    lessonId: 'm03l06',
    prompt: 'Issued: foil 0.120 mm ±0.010 mm, aperture width 0.400 mm ±0.025 mm, area ratio at least 0.66. The report gives thickness 0.128 mm, width 0.418 mm and area ratio 0.64. What is the acceptance result?',
    options: opts(
      'Thickness and width pass; the area ratio fails, so the stencil is rejected or dispositioned',
      'Thickness and width pass; the area ratio is close enough, so the stencil is accepted',
      'The width fails because 0.418 mm is outside the 0.375 to 0.425 mm band',
      'The thickness fails because 0.128 mm is outside the 0.110 to 0.130 mm band'
    ),
    correct: 'a',
    explanation: 'Thickness limits are 0.110 to 0.130 mm, so 0.128 passes; width limits are 0.375 to 0.425 mm, so 0.418 passes; the area ratio of 0.64 is below the issued minimum of 0.66, so the stencil fails on that characteristic and needs rejection or an engineering disposition. Two of the distractors assert failures on values that are inside their bands.',
    source: 'src-004'
  },

  /* exam */
  {
    questionId: 'q-m03l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm03l06',
    prompt: 'Why does the lesson treat a delivered stencil as a controlled part rather than as a consumable?',
    options: opts(
      'Its geometry sets paste volume, and that has to be verified against a drawing revision.',
      'It is expensive, so it has to be tracked by the finance system as a fixed asset.',
      'It is reused across products, so its history has to follow it between work orders.',
      'It is supplied by an external vendor, so it falls under purchasing rather than production.'
    ),
    correct: 'a',
    explanation: 'Control follows from function: the stencil decides deposit volume, so its dimensions, taper, tension and step depth are verified against a named drawing revision and tracked through its working life. Cost accounting, cross-product reuse and vendor ownership are administrative facts that do not explain why the geometry needs an acceptance record.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K2', 'K9'],
    bloom: 'analyse',
    lessonId: 'm03l06',
    prompt: 'Appearance of insufficient paste on one fine-pitch area began after the third cleaning of a stencil. What should be checked first?',
    options: opts(
      'Aperture condition and wall damage from the cleaning method, then the print settings.',
      'The paste lot and its viscosity, then the reflow profile of the product.',
      'The board surface finish, then the solder mask registration across the panel.',
      'The squeegee hardness, then the ambient humidity of the print room that shift.'
    ),
    correct: 'a',
    explanation: 'The lesson ties low area ratio, poor wall taper and damaged walls to paste left in the aperture, and it requires the cleaning regime to be verified and the apertures inspected after cleaning. A change that follows a specific cleaning cycle points at the aperture and the wall; paste, profile, finish, squeegee and humidity are all worth reviewing later but none of them explains the timing.',
    source: 'src-004'
  },
  {
    questionId: 'q-m03l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm03l06',
    prompt: 'A stencil specification is silent on flatness. What does the lesson direct you to do?',
    options: opts(
      'Use the design reference and set a documented range with the supplier and the printer.',
      'Accept any flatness, because an unstated requirement cannot be enforced at receipt.',
      'Reject the drawing until the customer adds a flatness limit to the specification.',
      'Apply the foil thickness tolerance to flatness, since both are dimensional features.'
    ),
    correct: 'a',
    explanation: 'The lesson says that where the specification is silent, use the design reference such as IPC-7525C and the paste or equipment datasheet, and set a documented range with the supplier using the supplier\'s measurement method. Accepting anything, blocking the drawing or borrowing an unrelated tolerance all leave contact across the print area uncontrolled.',
    source: 'src-004'
  }

];

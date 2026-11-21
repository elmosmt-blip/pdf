/* =========================================================================
 * phase1-m04.js — question bank content for module m04
 * (Solder Paste Printing and SPI), plus its exam bank.
 *
 * Numbers come from the module's own worked cases: the 10 % area reduction of
 * m04l01, the 80-120 % limits of m04l02, the 0.8-1.2 N/mm pressure range of
 * m04l03, the 64.2 % measured volume of m04l04, the Cp/Cpk of m04l05, the
 * 82 % volume pattern of m04l06 and the fill factors of m04l07.
 *
 * Deliberately not asked: the squeegee pressure band. m04l07 states 5-15 N and
 * m04l03 states 0.8-1.2 N/mm for a 250 mm blade (200-300 N), and the two cannot
 * both describe the same quantity. That is a data conflict for the author, not
 * a quiz topic.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m04l01 — aperture to deposit ===================== */

  {
    questionId: 'q-m04l01-03',
    type: 'single',
    competencies: ['K2', 'K3'],
    bloom: 'understand',
    lessonId: 'm04l01',
    prompt: 'What does an area reduction against the pad actually buy on a fine-pitch print?',
    options: opts(
      'Less paste per pad and more room between deposits, so bridging risk falls',
      'A higher area ratio, because a smaller opening always releases paste better',
      'A thicker deposit, because the same paste volume is pushed into less area',
      'A stronger stencil wall, since the aperture becomes narrower at the top'
    ),
    correct: 'a',
    explanation: 'Reduction trades paste volume for separation: each deposit is smaller and the gap to the neighbouring aperture grows, which is why it is used where slump or smear could bridge. A smaller opening lowers the area ratio rather than raising it, the deposit follows the foil thickness rather than growing taller, and wall strength is a fabrication property, not a consequence of reducing the opening.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l01-04',
    type: 'single',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm04l01',
    prompt: 'A 0.30 mm square pad gets a 10 % area reduction and is printed through 0.12 mm foil. The area ratio falls short of the release target. What is the right correction?',
    options: opts(
      'Reduce the foil thickness so the wall area shrinks and the ratio rises again',
      'Reduce the aperture further, since a smaller opening releases paste faster',
      'Raise the squeegee pressure until the aperture fills despite the geometry',
      'Increase the paste metal load so the deposit holds its shape after release'
    ),
    correct: 'a',
    explanation: 'The lesson\'s remedy for a low area ratio is to specify a thinner foil that meets the release target while keeping the paste volume practical: sidewall area is perimeter times thickness, so thinning the foil raises the ratio. Shrinking the aperture further lowers it, pressure cannot repair a wall-dominated release, and metal load affects slump rather than the geometry ratio.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l01-05',
    type: 'calc',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm04l01',
    prompt: 'A 0.30 mm square pad is reduced by 10 % in area and printed through 0.12 mm foil. What area ratio results, and what does it mean?',
    options: opts(
      '0.59, below the 0.66 release guideline, so the foil must be reconsidered',
      '0.59, above the 0.66 release guideline, so the aperture releases cleanly',
      '0.74, below the 0.66 release guideline, so the aperture must be enlarged',
      '1.19, above the 0.66 release guideline, so the print is comfortable'
    ),
    correct: 'a',
    explanation: 'Aperture area = 0.081 mm², side = 0.285 mm, perimeter = 1.14 mm, sidewall = 1.14 x 0.12 = 0.1368 mm², so area ratio = 0.081 / 0.1368 = 0.592. That is under the 0.66 guideline, which is exactly the situation the lesson resolves with a thinner foil. The 0.74 answer forgets the perimeter of the reduced square, and 1.19 uses the pad area rather than the reduced aperture.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'understand',
    lessonId: 'm04l01',
    prompt: 'Which quantity does a stencil\'s area ratio tell you about the paste?',
    options: opts(
      'How strongly the wall holds the deposit back as it leaves the aperture',
      'How much solder the joint needs once the paste has reflowed',
      'How far the paste spreads sideways after the stencil lifts',
      'How accurately the aperture is registered to the pad centre'
    ),
    correct: 'a',
    explanation: 'Area ratio compares the opening to the wall area the paste must slide past, so it predicts release. The joint requirement comes from the volume budget, lateral spreading is slump, and aperture-to-pad alignment is registration — three different checks the lesson keeps separate from the ratio.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K2', 'K3'],
    bloom: 'analyse',
    lessonId: 'm04l01',
    prompt: 'The same aperture prints well at 0.10 mm foil and poorly at 0.15 mm foil. What explains it?',
    options: opts(
      'The sidewall area grew with the foil, so the area ratio dropped',
      'The paste volume grew with the foil, so the joint became over-filled',
      'The aperture area shrank as the foil thickened, so less paste was released',
      'The paste had less time to fill a deeper aperture at the same print speed'
    ),
    correct: 'a',
    explanation: 'The aperture footprint is unchanged, but the sidewall band around it grows with thickness, so the area ratio falls and release suffers — the trade the lesson describes between volume and release. The joint being over-filled is a consequence at reflow rather than the printing mechanism, the aperture area does not shrink with foil thickness, and fill time is a separate effect that would not by itself explain the change.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l01-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K2'],
    bloom: 'apply',
    lessonId: 'm04l01',
    prompt: 'A 0.25 mm square aperture is cut in 0.12 mm foil. What are the area ratio and the aspect ratio?',
    options: opts(
      'Area ratio 0.52, aspect ratio 2.1',
      'Area ratio 0.52, aspect ratio 1.5',
      'Area ratio 0.65, aspect ratio 2.1',
      'Area ratio 2.10, aspect ratio 0.52'
    ),
    correct: 'a',
    explanation: 'Area = 0.0625 mm²; perimeter = 1.0 mm; sidewall = 0.12 mm²; area ratio = 0.52. Aspect ratio = 0.25 / 0.12 = 2.08. The 0.65 answer divides by twice the sidewall, the 1.5 answer copies the guidance figure instead of computing, and the last option swaps the two results.',
    source: 'src-004'
  },

  /* ===================== m04l02 — reading SPI data ======================= */

  {
    questionId: 'q-m04l02-03',
    type: 'single',
    competencies: ['K3', 'K6'],
    bloom: 'understand',
    lessonId: 'm04l02',
    prompt: 'Why does the lesson treat volume as the primary SPI metric rather than height or area alone?',
    options: opts(
      'Volume combines area and height, so it tracks the solder available to the joint',
      'Volume is the only metric the machine can measure without a calibration step',
      'Volume is insensitive to stencil thickness, so it compares across all products',
      'Volume is the only metric that correlates with how cleanly the paste released'
    ),
    correct: 'a',
    explanation: 'Volume is the product of the printed area and the printed height, which is why it maps most directly onto the solder available after reflow. Height and area are still needed, because they explain why the volume moved; the machine calibrates all of them; and the volume depends directly on stencil thickness rather than being independent of it.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l02-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l02',
    prompt: 'Which pattern points to a clogged aperture rather than to poor release?',
    options: opts(
      'Low height together with a low area, on one aperture class only',
      'Low height together with a normal area, spread across the whole panel',
      'Normal height with a high area, concentrated at the panel edges',
      'High volume with a small offset, appearing after a stencil wipe'
    ),
    correct: 'a',
    explanation: 'A clog reduces the open area as well as the deposit, so both height and area fall. Low height with normal area is the incomplete-fill or release signature, and the lesson gives high volume with a small offset as a different combination. Concentration on a single aperture class is the clue that the geometry, not the printer, is at fault.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l02-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l02',
    prompt: 'An aperture of 0.080 mm² is printed through 0.120 mm foil, and the volume window is set at 80 % to 120 % of nominal. What are the limits?',
    options: opts(
      '0.00768 to 0.01152 mm³ around a nominal of 0.0096 mm³',
      '0.00640 to 0.00960 mm³ around a nominal of 0.0096 mm³',
      '0.00768 to 0.00960 mm³ around a nominal of 0.0080 mm³',
      '0.00800 to 0.01200 mm³ around a nominal of 0.0100 mm³'
    ),
    correct: 'a',
    explanation: 'Nominal = 0.080 x 0.120 = 0.0096 mm³, so the window is 0.8 x 0.0096 = 0.00768 and 1.2 x 0.0096 = 0.01152 mm³. The second option applies the 80 % limit twice, the third takes the aperture area as the nominal volume, and the fourth invents a nominal of 0.0100 mm³ instead of deriving it.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l02',
    prompt: 'How does a process window differ from a set of control limits?',
    options: opts(
      'The window is what makes a good joint; the limits describe your process spread',
      'The window comes from the customer; the limits come from the standard',
      'The window is fixed per product; the limits are the same for every line',
      'The window is the machine specification; the limits are the SPI threshold'
    ),
    correct: 'a',
    explanation: 'The process window is the range of SPI values that yields acceptable joints for that product and process, while control limits describe stable variation calculated from your own data once special causes are removed. Limits are therefore line-specific, and neither is a customer document, a machine specification or an SPI threshold.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm04l02',
    prompt: 'Volume dips by 15 % for one board and recovers on the next. What is the sound first reading?',
    options: opts(
      'A special cause such as a wipe or a manual intervention, not a drift',
      'Common-cause variation, so the process should be left alone and monitored',
      'A paste lot change, because only a lot change moves volume that far',
      'A calibration error, because SPI cannot measure a single board reliably'
    ),
    correct: 'a',
    explanation: 'The lesson separates isolated spikes and short runs, which usually follow a change such as a stencil wipe, from the stable band of common-cause spread and from step changes after a lot change. A single board that recovers is the spike case, so neither monitoring nor blaming calibration is the first move.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l02-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l02',
    prompt: 'An SPI report gives a printed area of 0.120 mm² and a printed height of 0.100 mm, against a nominal of 0.0096 mm³. What is the printed volume as a percentage of nominal?',
    options: opts(
      '125 %',
      '80 %',
      '12.5 %',
      '105 %'
    ),
    correct: 'a',
    explanation: 'Printed volume = 0.120 x 0.100 = 0.0120 mm³; as a percentage of 0.0096 that is 125 %. The 80 % answer takes the height alone as a fraction of the stencil thickness, 12.5 % misplaces a decimal, and 105 % adds the two ratios instead of multiplying the measurements.',
    source: 'src-004'
  },

  /* ===================== m04l03 — printer setup ========================== */

  {
    questionId: 'q-m04l03-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l03',
    prompt: 'What does the lesson say about treating squeegee pressure, speed, snap-off, separation and wipe as separate knobs?',
    options: opts(
      'They are coupled, so one is changed at a time and the deposit inspected after each',
      'They are independent, so they can be optimised in parallel to save setup time',
      'They are ranked, so pressure is tuned first and the rest are left at default',
      'They are machine constants, so only the paste supplier may propose new values'
    ),
    correct: 'a',
    explanation: 'The lesson opens by calling printer setup a coupled process: the settings control paste roll, aperture fill, release and residue together, so the method is one variable at a time with the deposit inspected and the direction of the change predicted beforehand. Treating them as independent or as fixed machine constants removes the ability to attribute any effect.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l03-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l03',
    prompt: 'Prints show paste bleed under the stencil and bridging between adjacent pads. Which direction of change does the lesson predict?',
    options: opts(
      'Reduce squeegee pressure and address speed, separation and underside residue',
      'Increase squeegee pressure and reduce the wipe frequency to keep the roll wet',
      'Increase snap-off speed so the stencil lifts clear before the paste can spread',
      'Increase separation so the paste roll has more room to move ahead of the blade'
    ),
    correct: 'a',
    explanation: 'The lesson maps bleed and bridging to excessive pressure, and it lists reducing pressure, adjusting speed, checking separation and cleaning the stencil underside as the coupled response. More pressure drives paste under the foil, faster snap-off pulls tails rather than preventing bleed, and excess separation pushes the roll ahead of the blade instead of settling it.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l03-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l03',
    prompt: 'A 250 mm blade is loaded with 125 N against a recommended 0.8 to 1.2 N/mm. What force range does that recommend for this blade?',
    options: opts(
      '200 N to 300 N, against a current 0.5 N/mm',
      '100 N to 150 N, against a current 0.5 N/mm',
      '125 N to 188 N, against a current 0.5 N/mm',
      '800 N to 1200 N, against a current 5.0 N/mm'
    ),
    correct: 'a',
    explanation: '0.8 x 250 = 200 N and 1.2 x 250 = 300 N, so the current 125 N is 0.5 N/mm and sits below the band. The 100-150 N answer applies the band to the force rather than to the per-length value, 125-188 N divides instead of multiplying, and 800-1200 N treats the blade length as 1000 mm.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l03',
    prompt: 'What is snap-off, in the lesson\'s terms?',
    options: opts(
      'The controlled lift-off after the stroke that lets paste release from the walls',
      'The gap between the stencil and the board before the squeegee starts moving',
      'The frequency with which the underside of the stencil is wiped during a run',
      'The angle of the squeegee blade relative to the direction of the print stroke'
    ),
    correct: 'a',
    explanation: 'Snap-off is the controlled lift-off after the print stroke, and both too fast and too slow versions cause faults: tails and pulled paste at one extreme, smearing at the other. The pre-stroke gap is separation, wipe frequency is the wipe cycle, and blade angle is a different setup parameter.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm04l03',
    prompt: 'Apertures are underfilled on small openings only, while large pads print well. Which setting is the lesson\'s first suspect?',
    options: opts(
      'Squeegee pressure at the low end, which leaves small apertures short of fill',
      'Wipe frequency at the high end, which removes paste from the aperture walls',
      'Separation at the low end, which keeps the roll from reaching the small pads',
      'Snap-off speed at the low end, which lets the stencil drag across the board'
    ),
    correct: 'a',
    explanation: 'The lesson states that low pressure leaves apertures underfilled, especially on small apertures and high aspect-ratio stencils, which matches a size-dependent pattern. Excessive wiping would show as drying and clogging across classes, a small separation leaves the roll pushed ahead rather than short of fill on small openings, and a slow snap-off smears instead of starving small apertures.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l03',
    prompt: 'Insufficient paste persists after pressure is corrected. What is the next single change the lesson lists?',
    options: opts(
      'Reduce print speed so the apertures have more time to fill',
      'Increase print speed so the paste is sheared harder at the aperture mouth',
      'Increase separation so the paste roll is pushed further ahead of the blade',
      'Reduce wipe frequency so more paste remains on the stencil underside'
    ),
    correct: 'a',
    explanation: 'The lesson\'s sequence for insufficient paste is pressure within range first, then reducing speed when fill time is the limiting factor, then separation and wipe frequency. Raising speed reduces fill time, a larger separation pushes the roll away from the apertures, and leaving residue on the underside adds bleed rather than fill.',
    source: 'src-004'
  },

  /* ===================== m04l04 — paste behaviour ======================== */

  {
    questionId: 'q-m04l04-03',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l04',
    prompt: 'What is thixotropy, in the lesson\'s description of paste behaviour?',
    options: opts(
      'The recovery of viscosity after shear, which lets the deposit hold its shape',
      'The fall in viscosity with temperature, which lets paste flow into apertures',
      'The metal fraction of the paste by weight, which sets the deposit volume',
      'The resistance of the flux to oxidation while the paste sits on the stencil'
    ),
    correct: 'a',
    explanation: 'Thixotropy is shear thinning followed by recovery: the paste must flow while the squeegee works it and then stiffen again so the deposit keeps its shape, and slow recovery is one cause of slump. Temperature dependence, metal load and flux oxidation are separate properties with their own effects on the print.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l04-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l04',
    prompt: 'Volume falls steadily through a shift while the printer settings never change. Which explanation fits the lesson?',
    options: opts(
      'Paste on the stencil is drying and thickening, so it releases less readily',
      'The stencil is wearing thinner, so each aperture now holds less volume',
      'The squeegee is softening with use, so it pushes paste less effectively',
      'The SPI is drifting out of calibration, so the readings fall without cause'
    ),
    correct: 'a',
    explanation: 'The lesson names solvent evaporation, temperature rise and repeated rolling as the changes that make paste on the stencil print lower volume later in a shift — the paste-life effect. Stencil wear over a shift is not a thickness change of that size, squeegee softening is a wear trend over many cycles, and a calibration drift would have to be demonstrated before it displaces the process explanation.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l04-05',
    type: 'calc',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l04',
    prompt: 'A 0.40 mm square aperture in 0.12 mm foil prints with a mean height of 0.085 mm and a mean area of 0.145 mm². What volume percentage does that give?',
    options: opts(
      '64 %, which matches a low-height, low-area release pattern',
      '88 %, which matches a low-height, normal-area release pattern',
      '71 %, which matches a normal-height, high-area pattern',
      '118 %, which matches an excess-paste pattern'
    ),
    correct: 'a',
    explanation: 'Nominal volume = 0.16 mm² x 0.12 = 0.0192 mm³; printed volume = 0.145 x 0.085 = 0.012325 mm³; percentage = 64.2 %. The 88 % answer uses the mean area as a percentage of nominal area, 71 % mixes height and area ratios, and 118 % inverts the division.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l04',
    prompt: 'What does slump look like on an SPI report?',
    options: opts(
      'A larger area with a lower height, as the deposit flows out after release',
      'A smaller area with a higher height, as the deposit pulls back together',
      'Normal area and height with a large offset from the pad centre',
      'High volume on a single pad that appears immediately after a wipe'
    ),
    correct: 'a',
    explanation: 'Slump is lateral flow after release, which spreads the footprint while the height falls. Pulling back into a taller smaller deposit is the opposite change, a large offset with normal dimensions is a placement or registration symptom, and a single high-volume pad after a wipe is a special cause rather than slump.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm04l04',
    prompt: 'Volume is low while the printed area is high. Which pair of causes does the lesson put together?',
    options: opts(
      'Slump or bleed, where the paste spreads instead of standing up',
      'Incomplete fill or poor release, where the aperture never filled',
      'Stencil-to-board misregistration, where deposits land off centre',
      'Excess paste, where too much material was pushed through the opening'
    ),
    correct: 'a',
    explanation: 'Low volume with high area is the spreading signature: the paste covers more of the pad while standing lower, which is slump or bleed. Incomplete fill and poor release give low area as well, misregistration shows up as offset, and excess paste raises the volume rather than lowering it.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l04-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l04',
    prompt: 'A paste with a nominal density of 1.0 prints a deposit of 0.0144 mm³ into an aperture whose nominal volume is 0.0192 mm³. Which statement is correct?',
    options: opts(
      'The printed volume is 75 % of nominal, below the target band',
      'The printed volume is 133 % of nominal, above the target band',
      'The printed volume is 75 % of nominal, inside the target band',
      'The printed volume cannot be compared without the metal load figure'
    ),
    correct: 'a',
    explanation: '0.0144 / 0.0192 = 0.75, so the deposit is 75 % of nominal — below the 80-120 % band the module uses as a working window. The 133 % answer inverts the division, the second 75 % answer mis-states where the band lies, and the comparison needs the geometric nominal volume, which is given; density cancels in the ratio.',
    source: 'src-004'
  },

  /* ===================== m04l05 — SPI as evidence ======================= */

  {
    questionId: 'q-m04l05-03',
    type: 'single',
    competencies: ['K3', 'K5'],
    bloom: 'understand',
    lessonId: 'm04l05',
    prompt: 'What does Cp measure that Cpk does not?',
    options: opts(
      'Whether the spread would fit if centred, ignoring where the mean sits',
      'Whether the mean is off centre, taking the specification limits into account',
      'Whether the process is stable over time, before any capability is calculated',
      'Whether the specification limits themselves are set at a realistic width'
    ),
    correct: 'a',
    explanation: 'Cp compares the specification width with the process spread and assumes the process is centred; Cpk adds the distance from the mean to the nearer limit. Stability is a precondition for either figure rather than a component of them, and neither says anything about whether the limits were set correctly.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l05-04',
    type: 'single',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l05',
    prompt: 'What does the lesson conclude when the trend is stable but the process is off centre?',
    options: opts(
      'Adjust the print parameters that control transfer, then re-measure',
      'Stop the line, because a centred process cannot be recovered by tuning',
      'Widen the specification limits so the existing mean becomes acceptable',
      'Recalculate the capability figure using the run mean instead of the target'
    ),
    correct: 'a',
    explanation: 'A stable but off-centre process is the case the lesson treats with parameter adjustment: paste temperature, pressure, speed, snap-off and separation, followed by measurement. Stopping is for instability, widening the limits changes the requirement rather than the process, and substituting the run mean hides the offset that Cpk exists to expose.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l05-05',
    type: 'calc',
    competencies: ['K3', 'K5'],
    bloom: 'apply',
    lessonId: 'm04l05',
    prompt: 'Paste volume has a mean of 92 %, a standard deviation of 6 %, and specification limits of 85 % and 115 %. What are Cp and Cpk?',
    options: opts(
      'Cp 0.83 and Cpk 0.39, so the spread is too wide and the process is low',
      'Cp 0.83 and Cpk 1.28, so the spread is too wide but the process is centred',
      'Cp 1.43 and Cpk 0.39, so the spread is acceptable but the process is low',
      'Cp 2.50 and Cpk 1.28, so both the spread and the centring are acceptable'
    ),
    correct: 'a',
    explanation: 'Process spread = 6 x 6 = 36 points, so Cp = 30 / 36 = 0.83. The nearer limit is the lower one, 92 - 85 = 7 points, and 7 / 18 = 0.39 for Cpk. The 1.28 figure is the distance to the upper limit, the 1.43 comes from dividing by two standard deviations, and 2.50 uses a single standard deviation as the spread.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l05',
    prompt: 'What does a wide histogram on an SPI report tell you before any limit is set?',
    options: opts(
      'The print is inconsistent, so the distribution matters more than the mean',
      'The print is centred, because a wide histogram must straddle the target',
      'The print is acceptable, because the mean is the only quantity that counts',
      'The SPI is misconfigured, because a healthy process gives a single bar'
    ),
    correct: 'a',
    explanation: 'A narrow peak near target is the healthy shape; a wide distribution signals inconsistency from paste temperature, cleaning variation, squeegee wear or board support. Width says nothing about centring, a good mean can hide a bad spread, and a real process never reports a single-valued bar.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm04l05',
    prompt: 'Volume steps down and stays down from one board onward. Before touching the printer, what does the lesson have you check?',
    options: opts(
      'What changed at that point: paste lot, stencil, blade, tension or calibration',
      'The long-term trend, because a step is the same thing as a slow drift',
      'The specification limits, because a step means the window was too tight',
      'The operator, because a step can only come from a manual intervention'
    ),
    correct: 'a',
    explanation: 'The lesson separates step changes, which point at a discrete event such as a lot, stencil, blade, tension or calibration change, from gradual drift, which points at something wearing or drying. A step is not a drift, the limits did not move, and a manual intervention is only one of the candidate events rather than the only one.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l05-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l05',
    prompt: 'A process has a mean of 100 %, a standard deviation of 8 % and limits of 85 % and 115 %. What is its Cpk?',
    options: opts(
      '0.63',
      '1.88',
      '0.42',
      '3.75'
    ),
    correct: 'a',
    explanation: 'The nearer limit is 15 points away, and three standard deviations is 24 points, so Cpk = 15 / 24 = 0.63. The 1.88 answer divides the specification width by the standard deviation, 0.42 uses five standard deviations, and 3.75 takes the half-width over a single standard deviation.',
    source: 'src-004'
  },

  /* ===================== m04l06 — print defect atlas ==================== */

  {
    questionId: 'q-m04l06-03',
    type: 'single',
    competencies: ['K3', 'K6'],
    bloom: 'understand',
    lessonId: 'm04l06',
    prompt: 'Which combination of SPI readings argues for under-fill rather than smearing?',
    options: opts(
      'Low volume, low height and low area on the affected deposits',
      'Low volume, low height but a high area on the affected deposits',
      'Low volume with a normal height and a large offset from centre',
      'High volume with a high area across the whole panel'
    ),
    correct: 'a',
    explanation: 'Under-fill means less paste went in, so all three dimensions fall together. Low height with a high area is the spreading pattern of smear or slump, an offset with normal dimensions is a registration problem, and high volume with high area is excess.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l06-04',
    type: 'single',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm04l06',
    prompt: 'Offset appears on a few pads at the same panel location, board after board. What does the lesson point to?',
    options: opts(
      'Board support, conveyor handling or vision registration at that location',
      'Paste rheology, because slump would show up as a consistent offset',
      'Aperture geometry, because a small aperture shifts the deposit sideways',
      'Stencil thickness, because a thicker foil moves paste away from the pad'
    ),
    correct: 'a',
    explanation: 'The lesson links a repeating offset at one location to support, conveyor handling or vision registration rather than to the paste, because a positional pattern needs a positional cause. Rheology changes the deposit shape, aperture geometry changes its size, and foil thickness changes its volume — none of them moves deposits in one direction at one place.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l06-05',
    type: 'calc',
    competencies: ['K3', 'K5'],
    bloom: 'apply',
    lessonId: 'm04l06',
    prompt: 'Mean volume is 82 % of nominal, mean height is 0.11 mm against a 0.12 mm nominal, and mean area is 95 % of nominal. Which dominant defect mode does that pattern name?',
    options: opts(
      'Under-fill, because volume and height are down with the area nearly intact',
      'Smearing, because the area is slightly below nominal and the height is low',
      'Excess paste, because the volume percentage is well inside the window',
      'A registration error, because offset is the only metric that explains this'
    ),
    correct: 'a',
    explanation: 'The lesson reads this triple as insufficient transfer: volume at 82 % and height below the foil thickness, with the area close to nominal, which rules out the spreading pattern where area rises. Smearing would raise the area, excess would raise the volume, and the offset in the case is small enough not to explain a volume loss of that size.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l06',
    prompt: 'Why is an SPI report more than a pass/fail screen?',
    options: opts(
      'It measures how much, where and how consistently paste was deposited',
      'It certifies that the joints will meet the workmanship standard',
      'It replaces the first-article inspection of the printed board',
      'It records the operator, the shift and the paste lot for traceability'
    ),
    correct: 'a',
    explanation: 'The lesson frames SPI as a measurement of quantity, position and consistency, whose value is the diagnostic pattern across metrics, histograms and trends. SPI measures paste, not reflowed joints; it does not replace first-article inspection; and traceability data is recorded elsewhere.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K9'],
    bloom: 'analyse',
    lessonId: 'm04l06',
    prompt: 'Volume is low on every board of the run, never recovering. What does the lesson distinguish this from?',
    options: opts(
      'A drifting process, where the loss grows board by board over time',
      'A false SPI call, where the machine misreads a sound deposit',
      'A special cause, where one board falls outside the stable band',
      'A design change, where the aperture was revised between runs'
    ),
    correct: 'a',
    explanation: 'A stable low-volume trend from the first board is a design or setup issue — aperture, thickness, paste rheology — while a gradual downward drift is a wearing or drying process. Both are real defects, the distinction decides where you look first; a false call and a single outlier are different cases again, and a design change would show as a step.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l06',
    prompt: 'Bridging appears between adjacent fine-pitch pads with high area between them. Which geometry change does the lesson map to it?',
    options: opts(
      'Aperture too large for the pitch, with the paste not held back by the wall',
      'Aperture too small for the pitch, so the paste spreads to reach the joint',
      'Foil too thin for the pitch, so the paste cannot stand on the pad',
      'Wall taper too steep, so the deposit lands off the centre of the pad'
    ),
    correct: 'a',
    explanation: 'The lesson maps adjoining pads joined by paste to an aperture that is too large for the pitch, which is why area reduction and thinner foil are the countermeasures on fine pitch. A smaller aperture starves the joint instead of spreading, foil thickness affects volume and release rather than lateral reach, and wall taper affects release, not deposit position.',
    source: 'src-004'
  },

  /* ===================== m04l07 — troubleshooting ======================= */

  {
    questionId: 'q-m04l07-03',
    type: 'single',
    competencies: ['K3', 'K9'],
    bloom: 'understand',
    lessonId: 'm04l07',
    prompt: 'What does the lesson require before any printer setting is changed?',
    options: opts(
      'Confirm the defect is repeatable and not an SPI artifact',
      'Confirm the paste lot is fresh and the stencil below its cycle limit',
      'Confirm the specification limits were agreed with the customer',
      'Confirm the operator has completed the printer training record'
    ),
    correct: 'a',
    explanation: 'Triage comes first: establish that the defect repeats and that it is real rather than a threshold, lighting, focus, fiducial or residue artefact, then record the baseline conditions. Freshness, cycle counts, agreed limits and training are legitimate controls, but none of them substitutes for proving the defect exists.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l07-04',
    type: 'single',
    competencies: ['K3', 'K5'],
    bloom: 'apply',
    lessonId: 'm04l07',
    prompt: 'A single-variable experiment shows no response to any printer setting. What does the lesson say to do next?',
    options: opts(
      'Look at the stencil and paste interaction: area ratio, walls, thickness, rheology',
      'Widen the specification limits so the current output becomes acceptable',
      'Change several settings at once to move the process further in one step',
      'Replace the printer, because a no-response result proves the machine is at fault'
    ),
    correct: 'a',
    explanation: 'The lesson says that when a single-variable experiment shows no response, the stencil and paste interaction is the next place to look, because small apertures with a low area ratio or rough sidewalls release poorly even at reasonable settings. Widening limits changes the requirement, changing several variables destroys attribution, and a no-response result is evidence about the geometry rather than a verdict on the machine.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l07-05',
    type: 'calc',
    competencies: ['K3', 'K5'],
    bloom: 'apply',
    lessonId: 'm04l07',
    prompt: 'A 1.0 mm by 0.5 mm aperture in 0.10 mm foil prints 0.035 mm³ against a theoretical 0.050 mm³. What fill factor is reached, and what does the target require?',
    options: opts(
      '70 % now against a 90 % target, so transfer must improve by a fifth',
      '70 % now against an 80 % target, so the process already meets the window',
      '143 % now, because the theoretical volume is smaller than the measured one',
      '35 % now against a 90 % target, so the aperture must double in area'
    ),
    correct: 'a',
    explanation: 'Aperture area = 0.50 mm², theoretical volume = 0.050 mm³, so the current fill is 0.035 / 0.050 = 70 % and the 0.045 mm³ target needs 90 %. The 80 % answer uses the wrong band, 143 % inverts the ratio, and 35 % divides by the wrong nominal.',
    source: 'src-004'
  },

  {
    questionId: 'q-m04l07-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'understand',
    lessonId: 'm04l07',
    prompt: 'What makes an SPI reading an artifact rather than a real print defect?',
    options: opts(
      'It comes from a threshold, lighting, focus, fiducial or residue effect',
      'It repeats on every board and on every aperture class in the panel',
      'It persists after the stencil has been cleaned and the paste replaced',
      'It appears in the trend chart as a steady band around the target'
    ),
    correct: 'a',
    explanation: 'The lesson lists threshold settings, lighting, focus, fiducial errors, board warp, paste colour, solder mask variation and stencil residue as artefact sources, and asks for confirmation by manual inspection, paste weight, cross-section or repeatability. Repeating after cleaning and appearing as a stable band are properties of real process behaviour, not of artefacts.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l07-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K3', 'K5'],
    bloom: 'analyse',
    lessonId: 'm04l07',
    prompt: 'Which experiment plan does the lesson describe for a print problem?',
    options: opts(
      'Fix the metric and baseline, change one variable, run enough boards to see it',
      'Change the three most likely settings together and compare the mean volume',
      'Run one board per setting, since SPI measures every pad on the panel',
      'Run the experiment on a scrap panel with the production paste lot replaced'
    ),
    correct: 'a',
    explanation: 'The lesson asks for a defined defect, baseline settings and acceptance metric, a stable lot and clean stencil, then one variable changed at a time, with roughly 10 boards and 30 measured deposits per condition. Changing several together loses attribution, a single board cannot separate effect from noise, and substituting the paste lot adds a second change.',
    source: 'src-004'
  },
  {
    questionId: 'q-m04l07-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K3'],
    bloom: 'apply',
    lessonId: 'm04l07',
    prompt: 'Small apertures print low volume although pressure and speed are in range. Which starter change does the lesson list?',
    options: opts(
      'Increase snap-off distance to improve release from the small openings',
      'Increase wipe frequency to keep the small apertures free of residue',
      'Reduce paste metal load so the paste flows into the smaller openings',
      'Reduce separation so the stencil sits closer to the board during printing'
    ),
    correct: 'a',
    explanation: 'The lesson says that increasing snap-off distance often improves release for small apertures and warns that too little separation drags paste and leaves it in the stencil. Wiping more helps residue rather than release, metal load is a paste formulation decision, and reducing separation works against release.',
    source: 'src-004'
  }

];

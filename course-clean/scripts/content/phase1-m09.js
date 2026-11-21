/* =========================================================================
 * phase1-m09.js — question bank content for module m09
 * (Wave Soldering), plus its exam bank.
 *
 * Numbers come from the module's own cases: 250 mm / 4 s giving 3.75 m/min and
 * the 53.3 °C/min preheat ramp of m09l01, the 20 cm2 board and 0.08-0.23
 * mg/cm2 solids range of m09l02, the 150 cm2 board of m09l03, the 180 mm /
 * 10.8 s dwell of m09l04, the 3.6 mm shadow of m09l05 and the 68.75 % fill of
 * m09l06.
 *
 * Deliberately not asked: the dwell window. m09l04 quotes a datasheet window of
 * 6-12 s with a typical single-wave dwell of 4-10 s, while m09l06 treats 2.5 s
 * as short of a 3-6 s range. The questions use the direction of the disagreement
 * (2.5 s is short) without asking the reader which band is right.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m09l01 — wave architecture ===================== */

  {
    questionId: 'q-m09l01-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l01',
    prompt: 'What does nitrogen actually do for a wave solder process?',
    options: opts(
      'It cuts oxidation and dross, which can improve wetting and reduce bridging',
      'It replaces part of the preheat, because the atmosphere carries the heat',
      'It raises the soldering temperature, so a lower pot setting becomes possible',
      'It removes the need for flux, since the solder cannot oxidise in nitrogen'
    ),
    correct: 'a',
    explanation: 'The lesson credits nitrogen with less oxide, less dross, better wetting and sometimes fewer bridges, and then says plainly that it does not replace proper preheat or flux control. The other options hand nitrogen a job the process still needs from heat and chemistry.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l01-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l01',
    prompt: 'What does the lesson say makes the lead-free wave window narrower?',
    options: opts(
      'Higher temperatures and tighter flux and preheat margins on lead-free alloys',
      'The lower density of lead-free solder, which drains more slowly from pads',
      'The wider melting range of SnPb paste used on mixed boards',
      'The fact that lead-free boards cannot use nitrogen in most machines'
    ),
    correct: 'a',
    explanation: 'The lesson ties the narrower window to the lead-free thermal demand: higher solder temperature and less forgiving flux and preheat behaviour. Density and drainage are not the stated cause, the mixed-board sentence refers to SnPb paste rather than the lead-free window, and nitrogen is a standard lead-free option rather than an exclusion.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l01-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l01',
    prompt: 'A 250 mm wave gives 4 s of contact. What conveyor speed does that require?',
    options: opts(
      '3.75 m/min',
      '62.5 m/min',
      '0.375 m/min',
      '1.00 m/min'
    ),
    correct: 'a',
    explanation: '0.250 m / 4 s = 0.0625 m/s, and x 60 gives 3.75 m/min. The 62.5 answer forgets that the length is in millimetres, 0.375 m/min drops a factor of ten, and 1.00 m/min would give about 15 s of contact on the same wave.',
    source: 'src-019'
  },

  /* exam */
  {
    questionId: 'q-m09l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l01',
    prompt: 'Which elements make up the wave soldering window?',
    options: opts(
      'Flux application, preheat, wave contact and cooling',
      'Stencil thickness, squeegee speed, separation and paste lot',
      'Nozzle size, dwell per joint, passes and fixture height',
      'Zone count, belt speed, heater power and exhaust rate'
    ),
    correct: 'a',
    explanation: 'The lesson defines the window as the interaction of flux, preheat, wave contact and cooling. Stencil and squeegee belong to printing, nozzle and dwell to selective soldering, and oven zones to reflow.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm09l01',
    prompt: 'What does too short a contact time produce?',
    options: opts(
      'Insufficient fill and cold joints, because the joint never reaches wetting heat',
      'Excess solder and bridging, because the wave cannot drain away in time',
      'Icicles on the exit side, because the solder freezes before it falls back',
      'Blowholes, because moisture cannot escape through the shorter path'
    ),
    correct: 'a',
    explanation: 'The lesson puts short dwell with insufficient fill and cold joints, and long dwell with excess solder, bridging and icicles. Blowholes relate to trapped moisture and volatiles rather than to the length of the contact.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l01-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l01',
    prompt: 'The top surface must rise from 25 °C to 105 °C in 90 s. What average ramp is that?',
    options: opts(
      'About 0.89 °C/s, or about 53 °C/min',
      'About 0.89 °C/s, or about 8.9 °C/min',
      'About 1.13 °C/s, or about 68 °C/min',
      'About 0.53 °C/s, or about 32 °C/min'
    ),
    correct: 'a',
    explanation: '80 °C over 90 s is 0.889 °C/s, and multiplying by 60 gives about 53 °C/min. The second option multiplies by 10 instead of 60, the third inverts the division, and the last halves the result for no stated reason.',
    source: 'src-019'
  },

  /* ===================== m09l02 — flux selection ======================== */

  {
    questionId: 'q-m09l02-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l02',
    prompt: 'Why does the lesson state the basis before comparing flux figures?',
    options: opts(
      'Ranges quoted per unit of liquid are several times larger than solids figures',
      'Different suppliers report the same deposition in incompatible currencies',
      'Flux weight changes while the board passes through the preheat zone',
      'The figures are only valid for lead-free alloys and not for SnPb'
    ),
    correct: 'a',
    explanation: 'The lesson warns that a per-liquid figure such as 0.5-1.0 g/ft² is several times larger than a solids-based 0.08-0.23 mg/cm², so mixing the bases makes a correct process look wrong. Currency, in-process evaporation and alloy family are not the reason the basis matters.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l02-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l02',
    prompt: 'What happens when too much flux is applied before the wave?',
    options: opts(
      'It can boil, lift components or leave residue that has to be cleaned',
      'It floods the through-holes and pushes solder onto the top side',
      'It slows the wave, so the contact time has to be extended',
      'It raises the solder temperature in the pot beyond its setpoint'
    ),
    correct: 'a',
    explanation: 'The lesson puts too much flux with boiling, component lifting and residue, and too little with non-wetting and shading. Flooding the top side and disturbing contact time are wave-height and dwell effects, and flux does not drive the pot temperature.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l02-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l02',
    prompt: 'A 50 by 40 mm board is fluxed at 0.15 mg/cm² of solids from a 2.0 % solids flux. What mass of flux solution is that?',
    options: opts(
      'About 150 mg',
      'About 3 mg',
      'About 75 mg',
      'About 1,500 mg'
    ),
    correct: 'a',
    explanation: 'The board is 20 cm², so 0.15 x 20 = 3.0 mg of solids, and at 2.0 % solids that is 150 mg of solution — the mid-range case the lesson works through. The 3 mg figure stops at the solids, 75 mg halves the answer, and 1,500 mg puts the decimal in the wrong place.',
    source: 'src-019'
  },

  /* exam */
  {
    questionId: 'q-m09l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l02',
    prompt: 'What do the flux solids control?',
    options: opts(
      'Residue, bridging and the resulting cleanliness of the assembly',
      'The pot temperature needed to keep the solder molten at the nozzle',
      'The preheat ramp, since solids set how fast the board can be heated',
      'The wave height, because solids thicken the solder as it leaves the pot'
    ),
    correct: 'a',
    explanation: 'Solids govern how much material is left behind, which drives residue, bridging and cleanliness — and low-solids no-clean fluxes then demand tighter application control. Pot temperature, preheat and wave height are separate settings.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm09l02',
    prompt: 'A board with a fresh finish shows non-wetting on a few joints after the wave. Which flux question comes first?',
    options: opts(
      'Whether the deposition actually reached those pads, checked by weight or witness',
      'Whether the flux activity should be raised for every board on the line',
      'Whether the pot needs a top-up of solder to restore the wetting balance',
      'Whether the preheat should be lowered to leave more flux unreacted'
    ),
    correct: 'a',
    explanation: 'The lesson asks for the deposition to be verified by fluxometer or witness card before the chemistry is changed, because patchy wetting usually means patchy coverage. Raising activity across the line, adding solder and lowering preheat all change the process before the distribution is known.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l02',
    prompt: 'Which verification set does the lesson require for a new wave recipe?',
    options: opts(
      'First-article wetting, hole fill, residue, cleanliness and reliability',
      'A signed recipe sheet and a second operator confirming the settings',
      'A pot analysis for copper and a fresh flux lot before the trial',
      'A measurement of the wave height alone, since the rest is covered by flux'
    ),
    correct: 'a',
    explanation: 'The lesson verifies with first-article wetting, hole fill, residue, cleanliness and reliability, and cites the J-STD-001 and IPC-A-610 acceptance basis. Paperwork, pot analysis and a wave-height reading are supporting checks rather than the whole verification.',
    source: 'src-019'
  },

  /* ===================== m09l03 — preheat =============================== */

  {
    questionId: 'q-m09l03-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l03',
    prompt: 'Why does the lesson track top-surface temperature separately on a wave line?',
    options: opts(
      'Heat enters from the bottom, so the top lags and can stay far cooler',
      'The top side cools the solder faster, so it is the one that sets the wave',
      'The top side is the only place a thermocouple can be attached safely',
      'The top side is heated by the exhaust, so it runs ahead of the board'
    ),
    correct: 'a',
    explanation: 'The lesson describes heat entering mainly from below, which is why the bottom surface can rise while the top lags, and both are tracked against limits. Attachment, cooling by the top side and exhaust heating all describe a different thermal path than the module states.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l03-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l03',
    prompt: 'A 1.6 mm board gets a 1.0 mm wave height. What does the lesson say about top-side clearance?',
    options: opts(
      'About 0.6 mm remains, so the wave wets the bottom without flooding the top',
      'No clearance remains, so the wave will reach the top-side SMT parts',
      'About 1.0 mm remains, because the board thickness is the only constraint',
      'Clearance is not a meaningful figure, since wave height varies along the line'
    ),
    correct: 'a',
    explanation: 'The lesson sets 1.0 mm inside the 0.5-1.5 mm starting range and leaves 0.6 mm to the top side, which is why the choice is defensible for a 1.6 mm board. Claiming no clearance, reusing the wave height as the answer, or dismissing the figure all misread the geometry.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l03-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l03',
    prompt: 'A 100 by 150 mm board is fluxed at 0.15 mg/cm² of solids. How much solid flux does that deposit?',
    options: opts(
      'About 22.5 mg',
      'About 2.25 mg',
      'About 150 mg',
      'About 225 mg'
    ),
    correct: 'a',
    explanation: '150 cm² x 0.15 mg/cm² = 22.5 mg, and the lesson then adds 10-20 % for hole walls, reaching 25-27 mg. The 2.25 mg answer slips a decimal, 150 mg is the board area in square centimetres, and 225 mg multiplies by ten.',
    source: 'src-019'
  },

  /* exam */
  {
    questionId: 'q-m09l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l03',
    prompt: 'What two jobs does preheat do before the wave?',
    options: opts(
      'Activates flux and removes volatiles, while reducing thermal shock',
      'Melts the solder and holds the board flat over the nozzle',
      'Cures the mask and shrinks the through-holes for a tighter fit',
      'Cools the board after wave contact to set the solder quickly'
    ),
    correct: 'a',
    explanation: 'Preheat activates the flux, drives solvent off and softens the thermal step the board meets at the wave. Melting happens in the pot, the mask is cured before assembly, and cooling is the stage after contact.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm09l03',
    prompt: 'A thin board with light copper and small leads is being set up. What does the lesson start from?',
    options: opts(
      'Lower flux density, lower preheat and lower wave height, then adjust upward',
      'The highest settings on the machine, then reduce until defects stop',
      'The thick-board recipe, since the same window covers every stack-up',
      'The dual-wave recipe, since two waves suit every lead-free board'
    ),
    correct: 'a',
    explanation: 'The lesson gives thin, lightly coppered boards a lower starting point on all three settings and reserves the higher values for thick boards with heavy copper. Starting high, copying a thicker stack-up or defaulting to a two-wave recipe all ignore the board this recipe is for.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l03-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l03',
    prompt: 'Which measurements does the lesson use to verify a wave setup?',
    options: opts(
      'Thermocouple data, flux weight gain and solder joint inspection',
      'A visual check of the top side and a reading of the pot thermometer',
      'The conveyor speed printed by the machine and the flux lot number',
      'An X-ray of every joint and a pull test on one lead per panel'
    ),
    correct: 'a',
    explanation: 'The verification is thermal, chemical and visual at once: thermocouples for the preheat, weight gain for the flux deposition, and inspection for fill, wetting, residue and balls. The other sets either record settings without their effect or sample far past what the lesson asks.',
    source: 'src-019'
  },

  /* ===================== m09l04 — contact time ========================== */

  {
    questionId: 'q-m09l04-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l04',
    prompt: 'Why does the lesson use an effective contact length rather than the nozzle length?',
    options: opts(
      'Turbulence, wave height and board contact widen the wetted zone',
      'The nozzle shortens as it wears, so its nominal length is unreliable',
      'The board shrinks in the preheat zone, which shortens the path',
      'The conveyor slips under load, so the travelled distance is shorter'
    ),
    correct: 'a',
    explanation: 'The wetted zone can extend beyond the nozzle, which is why a witness board measures the real contact length. Nozzle wear and thermal shrinkage are second-order beside that effect, and conveyor slip is not the reason the lesson gives.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l04-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l04',
    prompt: 'Insufficient fill appears and the flux, preheat and dwell are already inside their windows. What does the lesson check first?',
    options: opts(
      'Wave height and board clearance, before increasing dwell further',
      'A longer dwell, because fill always follows contact time',
      'A new flux lot, because fill is a chemistry problem',
      'A faster conveyor, so the joints are not over-heated'
    ),
    correct: 'a',
    explanation: 'The lesson\'s order is explicit: if fill is poor, check wave height and clearance before extending dwell, because contact time cannot wet a joint the wave is not reaching. More dwell, a new flux lot and a faster conveyor all miss that step.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l04-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l04',
    prompt: 'A witness board measures 180 mm of contact at 1.0 m/min. What dwell does that give?',
    options: opts(
      'About 10.8 s',
      'About 1.8 s',
      'About 18 s',
      'About 3.0 s'
    ),
    correct: 'a',
    explanation: '1.0 m/min is 16.7 mm/s, and 180 / 16.7 = 10.8 s — inside the datasheet window but near its top. The 1.8 s answer slips a decimal, 18 s divides by 10 instead of by 16.7, and 3.0 s corresponds to a much faster line.',
    source: 'src-019'
  },

  /* exam */
  {
    questionId: 'q-m09l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l04',
    prompt: 'How is dwell calculated?',
    options: opts(
      'Effective contact length divided by conveyor speed',
      'Conveyor speed multiplied by the nozzle length',
      'Nozzle length divided by the number of waves in the machine',
      'Pot temperature divided by the wave height at the crest'
    ),
    correct: 'a',
    explanation: 'Dwell is a length over a speed: t = L / v, with L measured rather than assumed. The other forms mix in the nozzle count, the pot temperature or the crest height, none of which gives a time.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm09l04',
    prompt: 'The measured dwell is near the top of its window and icicles appear. What does the lesson try first?',
    options: opts(
      'Check wave height and board clearance before shortening the dwell',
      'Cut the dwell to the minimum, since icicles come from too much contact',
      'Raise the pot temperature, so the solder drains before it freezes',
      'Lower the preheat, so the board leaves the wave cooler and drains faster'
    ),
    correct: 'a',
    explanation: 'Icicles come from solder that cannot drain back, which is a wave-height and clearance question before it is a dwell question — the same order the lesson uses for poor fill. Blindly cutting dwell trades one defect for another, and both remaining options change the thermal balance.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l04-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l04',
    prompt: 'The same 180 mm contact length should give 8 s of dwell. What speed does that need?',
    options: opts(
      'About 1.35 m/min',
      'About 2.25 m/min',
      'About 0.68 m/min',
      'About 22.5 m/min'
    ),
    correct: 'a',
    explanation: '180 / 8 = 22.5 mm/s, which is 1.35 m/min — the lesson\'s own target-setting example. The 2.25 m/min answer slips a decimal, 0.68 m/min inverts the calculation, and 22.5 m/min leaves the seconds-to-minutes step out.',
    source: 'src-019'
  },

  /* ===================== m09l05 — shadowing ============================= */

  {
    questionId: 'q-m09l05-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l05',
    prompt: 'What is shadowing in wave soldering?',
    options: opts(
      'A part, pallet or fixture blocking the wave, flux or preheat from a joint',
      'A dull band where the wave leaves the board on the exit side',
      'The loss of wave height across the width of a wide panel',
      'A dark mark left by flux residue after it has burned in the oven'
    ),
    correct: 'a',
    explanation: 'Shadowing covers three blocked paths — solder, flux and preheat — and the lesson treats it as a layout and handling problem first. A dull band, a height variation and a residue mark are observations that may follow from it but are not its definition.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l05-04',
    type: 'single',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l05',
    prompt: 'Which pallet change does the lesson propose for a shadowed row of pads?',
    options: opts(
      'Open the pallet hole around the pads and clear the body by about 1 mm',
      'Close the pallet wall closer to the pads so the wave is funnelled in',
      'Raise the board on taller support pins so the wave passes underneath',
      'Remove the pallet entirely and run the panel on the conveyor rails'
    ),
    correct: 'a',
    explanation: 'The lesson opens the hole and adds about 1 mm of clearance around the body so the wall stops covering pads and trapping flux. A tighter wall, taller pins and an unheld panel all change other things while the obstruction stays in the wave path.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l05-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l05',
    prompt: 'A 10 mm tall body meets the wave at 20° from vertical, with pads 2 mm downstream. What do the line-of-sight numbers say?',
    options: opts(
      'A 3.6 mm shadow, so the pads at 2 mm are inside it',
      'A 3.6 mm shadow, so the pads at 2 mm are outside it',
      'A 0.36 mm shadow, so the pads at 2 mm are safely clear',
      'A 2.0 mm shadow, so the pads sit exactly at its edge'
    ),
    correct: 'a',
    explanation: '10 x tan 20° = 10 x 0.364 = 3.6 mm, and 2 mm is less than that, so the lesson predicts shadowing and then adds a 0.5-1.0 mm turbulence margin. The second option gets the number right and the comparison wrong, and the last two misplace the decimal or invent a value.',
    source: 'src-019'
  },

  /* exam */
  {
    questionId: 'q-m09l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l05',
    prompt: 'How does board direction change the shadow?',
    options: opts(
      'The same body presents a different projected height to the wave',
      'The wave temperature falls as the board turns across the conveyor',
      'The flux deposition doubles when the board runs the other way',
      'Board direction has no effect once a pallet is used to hold the panel'
    ),
    correct: 'a',
    explanation: 'Turning a body changes the dimension facing the wave and with it the projected height and the shadow behind it — which is why orientation is the first control. Temperature and flux do not follow from the direction, and a pallet does not remove the geometry.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm09l05',
    prompt: 'The shadowed row cannot be moved in layout and the pallet is already open. What does the lesson fall back to?',
    options: opts(
      'Masking or a selective wave to expose only the joints that need solder',
      'A slower conveyor so the wave has longer to reach behind the body',
      'A higher pot temperature so the solder flows further into the shadow',
      'Accepting the row and repairing the joints by hand after the wave'
    ),
    correct: 'a',
    explanation: 'When geometry is fixed, the lesson moves to masking or a selective process that puts solder exactly where it is needed. More time, more heat and a repair step all work around the obstruction rather than past it, and hand repair adds risk the lesson is trying to avoid.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l05-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l05',
    prompt: 'The same body is rotated so that a 2 mm end faces the wave at 20°. What shadow does it cast?',
    options: opts(
      'About 0.7 mm, well inside the 2 mm gap',
      'About 3.6 mm, unchanged by the rotation',
      'About 0.07 mm, well inside the 2 mm gap',
      'About 2.0 mm, exactly equal to the gap'
    ),
    correct: 'a',
    explanation: '2 x tan 20° = 0.73 mm, which is comfortably less than the 2 mm gap — the point of the rotation. Reusing 3.6 mm ignores the change of dimension, 0.07 mm misplaces the decimal, and 2.0 mm simply repeats the gap.',
    source: 'src-019'
  },

  /* ===================== m09l06 — defect atlas ========================== */

  {
    questionId: 'q-m09l06-03',
    type: 'single',
    competencies: ['K5', 'K6'],
    bloom: 'understand',
    lessonId: 'm09l06',
    prompt: 'Why does the lesson start a wave defect atlas on the solder side?',
    options: opts(
      'The defect shape there records the last thermal and wetting events',
      'The solder side is the only side a camera can reach on a pallet',
      'The top side always shows the same pattern, so it adds nothing',
      'The solder side is where the operator writes the defect record'
    ),
    correct: 'a',
    explanation: 'Fill height, meniscus, drainage marks and wetting angle on the solder side are the direct record of what happened at the wave. Camera access, uniformity of the top side and record-keeping are not the reason the lesson gives.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l06-04',
    type: 'single',
    competencies: ['K5', 'K6'],
    bloom: 'apply',
    lessonId: 'm09l06',
    prompt: 'A joint looks dry with almost no solder and the pad beside it is clean. Which family does the lesson put that in?',
    options: opts(
      'Bypass, where the wave never made contact with that joint',
      'Balling, where solder gathered into separate spheres and ran off',
      'Bridging, where solder drained from the pad to its neighbour',
      'Blowholes, where voids emptied the barrel after it filled'
    ),
    correct: 'a',
    explanation: 'A joint the wave did not wet, with the neighbouring pad untouched, is bypass, and the lesson points at wave height, warpage and contact as the causes. Balling and bridging leave solder where it should not be, and blowholes leave a filled joint with voids.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l06-05',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l06',
    prompt: 'A 1.6 mm board shows 1.1 mm of fill in a 0.8 mm hole. What fill fraction and aspect ratio are those?',
    options: opts(
      '69 % fill and an aspect ratio of 2.0',
      '69 % fill and an aspect ratio of 0.5',
      '110 % fill and an aspect ratio of 2.0',
      '31 % fill and an aspect ratio of 2.0'
    ),
    correct: 'a',
    explanation: '1.1 / 1.6 = 0.6875, so about 69 %, and 1.6 / 0.8 = 2.0 for the aspect ratio — the arithmetic of the lesson case, where 69 % sits below the class minimum. Inverting the aspect ratio, reporting the fill height as a percentage and subtracting instead of dividing are the three slips.',
    source: 'src-019'
  },

  /* exam */
  {
    questionId: 'q-m09l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K6'],
    bloom: 'understand',
    lessonId: 'm09l06',
    prompt: 'Which pair of causes does the lesson give for bridging?',
    options: opts(
      'Too much solder volume and poor drainage as the board leaves the wave',
      'Too little flux and a preheat that is too cool at the wave entry',
      'Trapped moisture in the board and volatiles from the mask',
      'Lead diameter too small and hole diameter too large'
    ),
    correct: 'a',
    explanation: 'Bridging is an excess-and-drainage problem: more solder than the gap can clear, and a wave that does not let it fall away. Low flux and cool preheat lead to non-wetting rather than to bridges, and moisture and voids produce blowholes.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'analyse',
    lessonId: 'm09l06',
    prompt: 'A lead has separated from its pad and barrel after the wave, leaving a solder remnant. What is it?',
    options: opts(
      'A lifted lead, which the lesson treats as a thermal-mechanical separation',
      'A bypass, since the wave clearly did not wet that joint at all',
      'A blowhole, since a crater in the joint can look like a gap',
      'A bridge that broke when the lead was trimmed after soldering'
    ),
    correct: 'a',
    explanation: 'The lesson names a lead separated from pad or barrel, sometimes with a small remnant, as a lifted lead and links it to thermal-mechanical stress. Bypass leaves a dry unwetted joint, a blowhole is a void inside the solder, and a trimmed bridge is a different history.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'apply',
    lessonId: 'm09l06',
    prompt: 'The lesson case shows 69 % fill with a preheat ramp of 0.8 °C/s and a 2.5 s dwell. Which conclusion follows?',
    options: opts(
      'Fill is short, and both the preheat ramp and the dwell sit below usual ranges',
      'Fill is short, and the cause is the solder temperature rather than the profile',
      'Fill is acceptable, since 69 % sits above the 60 % floor for the class',
      'Fill is acceptable, because a short dwell always reduces bridging first'
    ),
    correct: 'a',
    explanation: 'The case finds 69 % below the class minimum and notes that a 0.8 °C/s ramp and 2.5 s dwell are both under the ranges the lesson quotes, so the fix addresses heat input. Blaming temperature alone ignores the profile, and there is no 60 % floor; a short dwell buys bridging at the cost of fill rather than making the joint compliant.',
    source: 'src-019'
  }

];

/* =========================================================================
 * phase1-m09l07.js — top-up for the wave process-control lesson, which was
 * missed when module m09 was authored: 2 lesson questions and 2 exam
 * questions, so the lesson reaches 4 and the exam bank stays at 2-3 per
 * lesson.
 *
 * Numbers come from the lesson case: 0.20 mg/cm2 of flux solids over 150 cm2
 * giving 30 mg, about 1,500 mg of solution at 2 % solids, 80 mm / 25 mm/s
 * giving 3.2 s of contact, and a 255 °C pot against a 219 °C SAC305 liquidus.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  {
    questionId: 'q-m09l07-03',
    type: 'single',
    competencies: ['K5'],
    bloom: 'understand',
    lessonId: 'm09l07',
    prompt: 'What does the lesson want recorded for a first article on a wave line?',
    options: opts(
      'Flux type and density, preheat, wave and fog height, speed and pot temperature',
      'The operator name, the shift number and the panel serial only',
      'The pot analysis for copper and the date of the last filter change',
      'The reflow profile, since the wave shares the same thermal window'
    ),
    correct: 'a',
    explanation: 'A first article is evidence that the window was actually set, so the lesson records the flux type and deposited density, the preheat, both heights, the speed and the pot temperature, plus any deviation. Names and serials identify the run, pot chemistry is a maintenance figure, and reflow belongs to a different process.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l07-04',
    type: 'calc',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l07',
    prompt: 'An 80 mm wave runs at 25 mm/s. What contact time does that give, against a 2-4 s practical range?',
    options: opts(
      '3.2 s, inside the range',
      '0.32 s, well below the range',
      '32 s, far above the range',
      '3.2 s, just above the range'
    ),
    correct: 'a',
    explanation: '80 / 25 = 3.2 s, comfortably inside 2-4 s. The 0.32 s answer slips a decimal, 32 s divides the wrong way for the units, and the last option gets the number right but misreads the band.',
    source: 'src-019'
  },

  {
    questionId: 'q-m09l07-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K5', 'K9'],
    bloom: 'understand',
    lessonId: 'm09l07',
    prompt: 'Why does the lesson treat a contaminated solder bath as a process issue rather than a maintenance one?',
    options: opts(
      'Dissolved metals and residues change wetting and the defect rate at the wave',
      'Contamination raises the pot temperature, which the heater cannot hold',
      'It changes the alloy liquidus, so the profile reference moves with it',
      'It thickens the flux, so the spray head has to be recalibrated'
    ),
    correct: 'a',
    explanation: 'Copper, nickel, iron and flux residues enter the bath from boards, fixtures and nozzles and show up as a change in wetting and defects. The pot heater, the alloy liquidus and the flux spray are separate systems with their own controls.',
    source: 'src-019'
  },
  {
    questionId: 'q-m09l07-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K5'],
    bloom: 'apply',
    lessonId: 'm09l07',
    prompt: 'A 150 cm² board is fluxed at 0.20 mg/cm² of solids from a 2 % solids flux. What mass of solution is that?',
    options: opts(
      'About 1,500 mg',
      'About 30 mg',
      'About 150 mg',
      'About 3,000 mg'
    ),
    correct: 'a',
    explanation: '0.20 x 150 = 30 mg of solids, and at 2 % solids that is 1,500 mg of solution — the lesson\'s own figure for this board. The 30 mg answer stops at the solids, 150 mg applies 1 % instead of 2 %, and 3,000 mg doubles the result.',
    source: 'src-019'
  }

];

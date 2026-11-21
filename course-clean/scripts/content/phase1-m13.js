/* =========================================================================
 * phase1-m13.js — question bank content for module m13
 * (Test Strategy), plus its exam bank.
 *
 * Numbers come from the module's own cases: the 82/12/6 % access split and
 * 1.2 mm pad of m13l02, the 2.8 s serial and 1.077 s effective point time of
 * m13l03, the 60 % and 50 % coverages of m13l04, the 91.7 % node and 75.6 %
 * weighted coverage with 610 ppm escape of m13l05, and the 85/75/80 % mix of
 * m13l06.
 * ========================================================================= */

'use strict';

function opts(a, b, c, d, e) {
  const texts = [a, b, c, d, e].filter(function (t) { return t !== undefined; });
  return texts.map(function (t, i) { return { id: 'abcdef'[i], text: t }; });
}

module.exports = [

  /* ===================== m13l01 — test levels =========================== */

  {
    questionId: 'q-m13l01-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l01',
    prompt: 'What does functional test prove that structural test does not?',
    options: opts(
      'That the assembly works as a system, within its electrical behaviour',
      'That every net is connected to the pad it belongs to',
      'That each component value is inside its tolerance band',
      'That the solder joints meet the visual acceptance criteria'
    ),
    correct: 'a',
    explanation: 'Functional test exercises the board as a system — power, timing and thermal behaviour — which the lesson separates from structural methods. Nets, values and joints are what in-circuit test, flying probe and inspection cover.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l01-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm13l01',
    prompt: 'When does the lesson prefer flying probe over in-circuit test?',
    options: opts(
      'At low volume or in a prototype phase, where a fixture cannot be justified',
      'At high volume, where the probe can keep up with the line rate',
      'When every net has a test point and the fixture is already paid for',
      'When the assembly carries no scan-capable devices at all'
    ),
    correct: 'a',
    explanation: 'A fixture is a large fixed cost that only amortises with volume, which is why the lesson sends prototypes and low volumes to flying probe. Full access and a paid-off fixture argue the other way, and the absence of scan devices only shifts coverage between the remaining methods.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l01-05',
    type: 'single',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l01',
    prompt: 'A 1,200-component board has 18 % BGA, 40 % boundary-scan coverage and 30 % of nets without test points. What does that combination push you towards?',
    options: opts(
      'Structural test plus boundary scan plus functional, because access alone is short',
      'In-circuit test alone, since a fixture would reach the BGA network directly',
      'Visual inspection alone, since the BGA joints are the only hidden risk',
      'Functional test alone, because it covers every defect class on the board'
    ),
    correct: 'a',
    explanation: 'Hidden BGA joints need structural coverage, but 30 % of nets have no probe access, so boundary scan carries the digital part and functional test closes the system behaviour. A fixture cannot reach pads that do not exist, inspection cannot see under a BGA, and functional test is not a complete defect screen.',
    source: 'src-030'
  },

  /* exam */
  {
    questionId: 'q-m13l01-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l01',
    prompt: 'What does in-circuit test measure?',
    options: opts(
      'Individual components and connections through probed nodes on a fixture',
      'The system behaviour of the whole assembly under power',
      'The digital interconnect through cells inside scan-capable devices',
      'The solder fillet geometry at each joint, from an optical image'
    ),
    correct: 'a',
    explanation: 'ICT probes nodes and checks components and connections one at a time. System behaviour is functional test, scan cells are boundary scan, and fillet geometry belongs to optical inspection.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l01-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm13l01',
    prompt: 'A design review reports 30 % of nets with no test points. What follows?',
    options: opts(
      'Those nets have no ICT or probe access, so their coverage must come elsewhere',
      'The fixture can still reach them by probing the component bodies directly',
      'The nets are automatically covered by functional test at full coverage',
      'The percentage is an error, since every net carries a pad by definition'
    ),
    correct: 'a',
    explanation: 'No test point means no probe, which is why the lesson routes that coverage to boundary scan or functional test. Probing bodies is not a thing, functional coverage is not automatic, and a net can reach an inner layer or a via without an accessible pad.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l01-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l01',
    prompt: 'At 2,000 units a month with good access, what does the lesson weigh when choosing a fixture?',
    options: opts(
      'Whether the fixture cost is justified against the cycle time it saves',
      'Whether the fixture can be built before the design is frozen',
      'Whether the programme can be run without any test points',
      'Whether the customer will accept flying probe as an equivalent'
    ),
    correct: 'a',
    explanation: 'The volume decision is a cost-against-time trade, which the lesson states as fixture cost versus the cycle time gained. Freeze date, test-point count and customer acceptance are constraints, not the comparison the lesson asks for.',
    source: 'src-030'
  },

  /* ===================== m13l02 — in-circuit test ======================= */

  {
    questionId: 'q-m13l02-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l02',
    prompt: 'Why does the lesson derive a minimum test-pad diameter?',
    options: opts(
      'The probe tip plus its required clearance sets the smallest pad that still lands',
      'A larger pad improves the electrical measurement of the component value',
      'The pad diameter controls how many probes the fixture can hold',
      'A smaller pad reduces the fixture cost by shortening the probe travel'
    ),
    correct: 'a',
    explanation: 'The probe has a physical diameter and needs an annular clearance around it, which is why the pad size is calculated rather than assumed. Electrical accuracy, probe count and travel distance are not what the pad diameter is derived from.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l02-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm13l02',
    prompt: 'What decides whether a node needs a paired test point?',
    options: opts(
      'Whether it is a guarded analog node that needs a second reference',
      'Whether the node carries a digital signal faster than one megahertz',
      'Whether the component on the node is larger than an 0402 body',
      'Whether the net is longer than fifty millimetres across the board'
    ),
    correct: 'a',
    explanation: 'The case sets 12 % of nets as guarded analog nodes requiring a pair, because guarding needs a second contact to work. Signal speed, component size and net length are not the criteria the lesson applies.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l02-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l02',
    prompt: 'Of 1,200 nets, 82 % take one test point and 12 % are guarded pairs. How many test points does that need?',
    options: opts(
      '1,272',
      '1,128',
      '984',
      '1,344'
    ),
    correct: 'a',
    explanation: '984 single plus 288 paired (144 nets doubled) gives 1,272, which the lesson then compares with a 1,500 probe limit. The 1,128 answer forgets to double the guarded nets, 984 counts only the single-point nets, and 1,344 also converts the inaccessible 6 % into points.',
    source: 'src-030'
  },

  /* exam */
  {
    questionId: 'q-m13l02-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l02',
    prompt: 'What sets the probe limit of a fixture?',
    options: opts(
      'The mechanical capacity of the fixture and its wiring, not the net count',
      'The number of components on the board, since each needs one probe',
      'The test programme, which can only address a fixed number of nodes',
      'The board area, divided by the pad pitch of the smallest package'
    ),
    correct: 'a',
    explanation: 'A fixture holds a finite number of probes and has finite wiring, which is why the lesson compares the calculated test points with a probe limit. Component count and board area are approximations at best, and the programme follows the fixture rather than capping it.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l02-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm13l02',
    prompt: 'A 1.2 mm planned pad meets a 0.9 mm probe tip with 0.15 mm clearance required. What does the calculation say?',
    options: opts(
      'It is exactly at the minimum, 0.9 + 0.15 + 0.15 mm',
      'It is above the minimum by 0.30 mm, so the pad could shrink',
      'It is below the minimum, so the pad must be enlarged to 1.35 mm',
      'The clearance applies only once, so the minimum is 1.05 mm'
    ),
    correct: 'a',
    explanation: 'The lesson adds a clearance on each side, so 0.9 + 0.15 + 0.15 = 1.2 mm and the planned pad sits exactly on the minimum. Reading the clearance as a single allowance or as a margin already included would allow a smaller pad than the probe needs.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l02-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l02',
    prompt: 'The calculation exceeds the available probe count. What does the lesson do?',
    options: opts(
      'Moves the overflow nets to another method such as scan or functional',
      'Removes the inaccessible nets from the calculation and proceeds',
      'Doubles up probes on the guarded nodes to save positions',
      'Accepts a lower pad clearance so that probes can be spaced closer'
    ),
    correct: 'a',
    explanation: 'Coverage is allocated across methods, so nets the fixture cannot reach go to another test. Dropping nets removes evidence, pairing more probes on the same nodes adds positions rather than saving them, and shrinking clearance below the probe requirement creates a mechanical failure.',
    source: 'src-030'
  },

  /* ===================== m13l03 — flying probe ========================== */

  {
    questionId: 'q-m13l03-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l03',
    prompt: 'What limits a flying probe station?',
    options: opts(
      'It moves and measures one point at a time, so time per point sets the ceiling',
      'It cannot reach nets smaller than one millimetre of pad diameter',
      'It measures resistance but not component value or polarity',
      'It needs a dedicated fixture for each board revision produced'
    ),
    correct: 'a',
    explanation: 'The lesson builds the whole throughput estimate from move, dwell and overhead per point, which is why 1,200 points take roughly twenty minutes. Access, measurement scope and fixture independence are the advantages of the method, not its limit.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l03-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm13l03',
    prompt: 'Why does the lesson apply a parallel efficiency below 100 %?',
    options: opts(
      'Probes cannot all work independently, so some time is spent waiting',
      'The measurement instrument is slower than the probe motors',
      'The board handling time is counted again inside each point',
      'Availability already includes the waiting, so the figure is a safety net'
    ),
    correct: 'a',
    explanation: 'Four probes do not deliver four times the throughput because their paths and measurements interfere, which is what the efficiency factor captures. Instrument speed, double-counted handling and a redundant safety margin are not the reason the lesson gives.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l03-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l03',
    prompt: 'A 250 mm move at 100 mm/s plus 0.30 s of electrical time, across 4 probes at 0.65 efficiency. What is the effective time per point?',
    options: opts(
      'About 1.08 s',
      'About 0.70 s',
      'About 2.80 s',
      'About 4.31 s'
    ),
    correct: 'a',
    explanation: '2.8 s serial becomes 0.70 s across four probes, and dividing by 0.65 gives 1.077 s per point. The 0.70 figure skips the efficiency loss, 2.80 s is the serial time with one probe, and 4.31 s multiplies by the efficiency instead of dividing.',
    source: 'src-030'
  },

  /* exam */
  {
    questionId: 'q-m13l03-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l03',
    prompt: 'What has to be built before a flying probe can test a board?',
    options: opts(
      'A measurement programme, which needs no mechanical fixture',
      'A probe fixture with one pin per accessible net',
      'A boundary-scan chain programmed into the devices',
      'A functional harness that powers the whole assembly'
    ),
    correct: 'a',
    explanation: 'That is the trade the lesson draws: no fixture, but a programme whose effort grows with the point list. Fixture pins and scan chains belong to the other methods, and a functional harness addresses system behaviour rather than nodes.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l03-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm13l03',
    prompt: 'The estimate gives 2.34 boards per hour. How does the lesson describe that figure?',
    options: opts(
      'An upper bound, because real boards add retries and probing problems',
      'A guaranteed rate, since availability has already been applied',
      'A lower bound, because parallel efficiency usually improves in practice',
      'The exact capacity, provided the programme is written without errors'
    ),
    correct: 'a',
    explanation: 'The lesson labels the result an upper bound: it assumes one move and one dwell per point, and real probing adds retries and access problems. Availability and efficiency are already in the number, so calling it guaranteed or exact overstates it, and efficiency rarely rises above the model.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l03-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l03',
    prompt: '1,200 points at 1.077 s each, plus 15 s of handling. What is the cycle time?',
    options: opts(
      'About 21.8 min',
      'About 21.5 min',
      'About 30.0 min',
      'About 2.2 min'
    ),
    correct: 'a',
    explanation: '1,292 s of test plus 15 s of handling is 1,307 s, or 21.8 min. The 21.5 min answer drops the handling, 30.0 min over-estimates the point time, and 2.2 min loses a factor of ten.',
    source: 'src-030'
  },

  /* ===================== m13l04 — boundary scan ========================= */

  {
    questionId: 'q-m13l04-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l04',
    prompt: 'What can boundary scan not find?',
    options: opts(
      'Faults on nets without scan-capable pins, and analog or power problems',
      'Opens on the digital nets that connect two scan-capable devices',
      'Shorts between adjacent pins inside a scan-capable package',
      'Interconnect faults on a BGA that has no test-point access'
    ),
    correct: 'a',
    explanation: 'Scan works through cells inside scan-capable devices, so anything outside that boundary — including the lesson\'s power, ground and analog nets — is invisible to it. The other three are exactly the faults it is chosen to find, BGA access being its main advantage.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l04-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm13l04',
    prompt: 'Why does the lesson put a boundary-scan run in the first boards of a build?',
    options: opts(
      'It debugs access and the chain while changes are still cheap',
      'It is the only method allowed before the fixture is calibrated',
      'The chain only works while the boards are still on the panel',
      'Scan results expire, so they must be taken within one shift'
    ),
    correct: 'a',
    explanation: 'The lesson uses scan together with flying probe and functional test on the first boards to iron out access and chain problems early. There is no calibration rule, no panel restriction and no time limit on a scan result.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l04-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l04',
    prompt: 'Boundary scan reaches 720 of 1,200 nets, flying probe 600 of 1,200. What coverage do the two give, and what does it mean?',
    options: opts(
      '60 % and 50 %, so neither alone is enough for this board',
      '60 % and 50 %, so together they cover all 1,200 nets',
      '50 % and 60 %, since probe coverage is counted first',
      '120 % and 100 %, because the nets overlap completely'
    ),
    correct: 'a',
    explanation: 'The two coverages are 60 % and 50 %, and the lesson combines them by reasoning about overlap rather than by adding them, which is why it keeps functional test in the strategy. Adding the percentages to 110 % or swapping them misreads the arithmetic.',
    source: 'src-030'
  },

  /* exam */
  {
    questionId: 'q-m13l04-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l04',
    prompt: 'What does a boundary-scan vector consist of?',
    options: opts(
      'A bit pattern shifted through the scan chain and captured back',
      'A voltage step applied to one probe while another measures current',
      'An optical image compared against a stored model of the joint',
      'A functional stimulus applied to the assembly input connector'
    ),
    correct: 'a',
    explanation: 'The vector is shifted through the chain of cells, applied at the pins and read back, which is why the chain length and clock rate set the time. Voltage stepping, optical comparison and functional stimulus describe the other methods.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l04-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm13l04',
    prompt: 'Functional test catches 480 defects but misses 240 latent opens. What does the lesson do with that?',
    options: opts(
      'Keeps a structural method, since functional test cannot be the only screen',
      'Accepts the miss rate, because latent opens fail in the field anyway',
      'Adds a second functional pass with a different stimulus pattern',
      'Reduces the functional coverage, since it is already catching the most'
    ),
    correct: 'a',
    explanation: 'The 240 misses are the argument for keeping structural coverage alongside functional test. Accepting the gap, repeating the same method and cutting coverage all leave those opens undetected.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l04-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l04',
    prompt: 'A 1,000-cell chain at 10 MHz shifts 1,000 vectors. How long does the shifting take?',
    options: opts(
      'About 0.1 s of pure shift time',
      'About 1.0 s of pure shift time',
      'About 10 s of pure shift time',
      'About 0.1 ms of pure shift time'
    ),
    correct: 'a',
    explanation: 'One vector is 1,000 bits / 10 MHz = 100 µs, and a thousand of them make 100 ms, with overhead taking the practical figure to about 0.2 s. The other options misplace the decimal by one or three places.',
    source: 'src-030'
  },

  /* ===================== m13l05 — coverage math ======================== */

  {
    questionId: 'q-m13l05-03',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l05',
    prompt: 'How does node coverage differ from defect coverage?',
    options: opts(
      'Node coverage counts nets reached; defect coverage weights by occurrence',
      'Node coverage counts defects found; defect coverage counts nets exercised',
      'The two are identical once the overlap between methods is subtracted',
      'Node coverage applies to digital nets only, defect coverage to analog'
    ),
    correct: 'a',
    explanation: 'The lesson computes node coverage as the union of nodes exercised and defect coverage as the detection rate weighted by how often each defect class occurs. The other options swap the terms, claim identity, or split the board by signal type.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l05-04',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm13l05',
    prompt: 'Why does the lesson subtract the overlap between ICT and functional nodes?',
    options: opts(
      'Counting a shared node twice would overstate the coverage achieved',
      'The overlap marks nodes that neither method can actually test',
      'Functional test invalidates the ICT result on any node it touches',
      'The overlap is subtracted to convert nodes into defect opportunities'
    ),
    correct: 'a',
    explanation: 'Coverage is the union of what the methods reach, so a node counted once per method inflates the figure. Overlap does not mean untestable, one method does not invalidate another, and the subtraction happens before any conversion to defect terms.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l05-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l05',
    prompt: 'Occurrence is 1,500 ppm visible, 800 electrical and 200 parametric, detected at 70 %, 90 % and 60 %. What is the weighted defect coverage?',
    options: opts(
      '75.6 %, leaving about 610 ppm of escapes',
      '73.3 %, leaving about 610 ppm of escapes',
      '75.6 %, leaving about 390 ppm of escapes',
      '100 %, because every class has some detection'
    ),
    correct: 'a',
    explanation: 'Detected totals 1,050 + 720 + 120 = 1,890 ppm of 2,500, so 75.6 % and 610 ppm escape. The 73.3 % figure averages the three percentages without weighting, and 390 ppm subtracts the wrong number from the total.',
    source: 'src-030'
  },

  /* exam */
  {
    questionId: 'q-m13l05-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l05',
    prompt: 'What is a residual escape in the lesson\'s terms?',
    options: opts(
      'Occurrence not detected by the combined test, from a weighted model',
      'Any defect found after the board has left the factory',
      'The number of boards that fail test and need rework',
      'The share of nets that no method can physically reach'
    ),
    correct: 'a',
    explanation: 'The escape estimate comes from occurrence multiplied by the undetected share for each class, which is what makes it a planning number. Field returns, first-pass failures and inaccessible nets are different measures.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l05-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm13l05',
    prompt: 'Which defect classes does the lesson name as left uncovered?',
    options: opts(
      'Under-component opens and shorts, and intermittent joints',
      'Wrong component value and reversed polarity on diodes',
      'Bridging between adjacent fine-pitch leads',
      'Missing components on the top side of the assembly'
    ),
    correct: 'a',
    explanation: 'The lesson lists under-component opens and shorts that no method exercises, plus intermittent joints that may not fail during the test. The other classes are the ones optical and electrical methods do catch, which is why they are not the gap.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l05-e3',
    type: 'calc',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l05',
    prompt: 'ICT reaches 980 nodes, functional 150, with 30 shared. What is the node coverage of 1,200 nodes?',
    options: opts(
      '91.7 %',
      '94.2 %',
      '81.7 %',
      '97.5 %'
    ),
    correct: 'a',
    explanation: 'The union is 980 + 150 - 30 = 1,100 nodes, so 1,100 / 1,200 = 91.7 %. The 94.2 % figure forgets the overlap, 81.7 % counts only ICT, and 97.5 % invents a larger union.',
    source: 'src-030'
  },

  /* ===================== m13l06 — strategy for a product mix ============ */

  {
    questionId: 'q-m13l06-03',
    type: 'single',
    competencies: ['K6', 'K9'],
    bloom: 'understand',
    lessonId: 'm13l06',
    prompt: 'Why does the lesson combine coverages conservatively instead of adding them?',
    options: opts(
      'Different methods overlap, so the sum would overstate what is tested',
      'Conservative combination is required by the test-equipment standard',
      'Each method tests the same nets, so only the strongest one counts',
      'Coverage percentages cannot be added because they have different units'
    ),
    correct: 'a',
    explanation: 'Scan and ICT reach many of the same nets, so the lesson adds only a proven increment rather than the full second figure. There is no standard demanding it, the methods do not test identical sets, and percentages of the same total do share a unit.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l06-04',
    type: 'single',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l06',
    prompt: 'How does cycle time enter the strategy decision?',
    options: opts(
      'It sets how much line capacity the test step consumes at the chosen volume',
      'It decides the coverage, since faster tests reach more nets per board',
      'It replaces the fixture cost, because time and money are interchangeable',
      'It does not enter, because test time is set by the programme alone'
    ),
    correct: 'a',
    explanation: 'The lesson puts cycle times beside the volume so that throughput, not just capability, decides the method. Coverage does not improve with speed, time is not a substitute for capital cost, and the programme does not fix the time on its own.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l06-05',
    type: 'calc',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l06',
    prompt: 'With 1,400 nets and a 75 % scan-capable share, where 80 % of scan-capable interconnects are testable, what is the scan coverage?',
    options: opts(
      'About 840 nets',
      'About 1,050 nets',
      'About 1,120 nets',
      'About 672 nets'
    ),
    correct: 'a',
    explanation: '1,400 x 0.75 x 0.80 = 840 nets, which the lesson then combines with ICT coverage rather than adding. The 1,050 answer stops after the scan-capable share, 1,120 applies 0.80 to the full net count, and 672 applies only 0.60.',
    source: 'src-030'
  },

  /* exam */
  {
    questionId: 'q-m13l06-e1',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'understand',
    lessonId: 'm13l06',
    prompt: 'Which factors does the lesson weigh for a product mix?',
    options: opts(
      'Volume, complexity, cost and the rework loop',
      'Board size, laminate type, coating and panel format',
      'Operator count, shift pattern, floor space and lighting',
      'Solder alloy, flux type, stencil thickness and paste lot'
    ),
    correct: 'a',
    explanation: 'A strategy is chosen on volume, complexity, cost and how defects flow back into rework. Board construction, staffing and process materials shape the build but are not the four factors the lesson sets out.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l06-e2',
    type: 'single',
    pool: 'exam',
    competencies: ['K6', 'K9'],
    bloom: 'analyse',
    lessonId: 'm13l06',
    prompt: 'What does the rework loop do to a test strategy?',
    options: opts(
      'It turns detection into feedback, so the failing class must be diagnosable',
      'It adds coverage, since reworked boards are tested twice',
      'It removes the need for functional test on the repaired unit',
      'It makes cycle time irrelevant, since repairs dominate the cost'
    ),
    correct: 'a',
    explanation: 'A test that finds a defect but cannot say where it is sends the board into a slow loop, which is why the lesson weighs diagnosability alongside detection. Rework does not add structural coverage, does not waive functional test, and does not make cycle time irrelevant.',
    source: 'src-030'
  },
  {
    questionId: 'q-m13l06-e3',
    type: 'single',
    pool: 'exam',
    competencies: ['K6'],
    bloom: 'apply',
    lessonId: 'm13l06',
    prompt: 'ICT takes 25 s, scan 8 s and functional 45 s, giving roughly 78 s per board. What does that mean against a 180 s probe cycle?',
    options: opts(
      'The fixture route is about twice as fast, so volume favours it',
      'The probe route is faster, because it needs no fixture handling',
      'Both routes take the same time once handling is included',
      'Time cannot be compared without knowing the board dimensions'
    ),
    correct: 'a',
    explanation: '78 s against 180 s is a little over a factor of two above the probe route, which is the kind of comparison the lesson uses to justify fixture capital at volume. Handling is already part of the fixture times, and board size does not change the arithmetic.',
    source: 'src-030'
  }

];

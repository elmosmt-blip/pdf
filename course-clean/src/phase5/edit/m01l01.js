/* m01l01 — What incoming inspection protects: defect cost by stage
 *
 * Editorial pass: the lesson opened with a 198-word paragraph whose second half
 * repeated its first. It is now three paragraphs that each make one point, the
 * "X proves Y" chain in the document paragraphs is gone, and the closing
 * "verify against your datasheet" no longer appears after every list.
 *
 * Every number and standard name in the original survives (checked by
 * src/phase5/apply.js); nothing was added, removed or re-derived.
 */
module.exports = {
  paragraphs: {
    0: { p: [
      'Incoming inspection protects the line by confirming three things before a lot is released: that it matches the purchase order, that it is in the condition the process requires, and that the supplier controlled the characteristics that affect yield. It is a gate, not a visual check. Material that is wrong, wet, expired or counterfeit has to be stopped here, because every later stage — placement, reflow, wave, cleaning, ICT, functional test, field service — is a more expensive place to find it.',
      'The cost of the same defect rises as it moves downstream. At incoming it costs inspection time, quarantine space and a supplier conversation. After reflow it costs rework, scrap and a stopped line. In the field it costs a complaint, a warranty claim and the credibility of the plant. The exact figures come from your own accounts; the shape does not change.',
      'A working plan also protects process stability. Released without evidence, marginal paste or a marginal bare board makes operators compensate with printer, placement or reflow changes — and those changes hide the material problem, move the defect to another stage, and make root cause analysis harder than it needs to be. That is why the record has to say what was checked, what was found and what was released: so a yield problem three weeks later can be traced back to a material condition.'
    ] },
    1: { p: [
      'A component lot should arrive with a packing list, a certificate of conformance, a material declaration, a restricted-substances declaration, a lot or date code, a traceability label, and any test report the purchase order calls for. Each document answers a different question. The packing list fixes quantity and shipment identity. The certificate of conformance is the supplier\'s declaration that the part, revision and acceptance criteria are as specified; the material declaration names the base material and the plating or termination finish. The restricted-substances declaration shows the lot was screened against the customer and regulatory requirements that apply, and the lot or date code, together with the traceability label, ties the reels on the floor to the supplier batch.',
      'Moisture-sensitive parts add packaging to that list: a moisture barrier bag, desiccant, a humidity indicator card, and a label carrying the floor life or storage condition from the applicable JEDEC moisture sensitivity standard. Compare the label, the packing list and the purchase order before the bag is opened. Where they disagree, the lot waits in quarantine until the supplier explains the difference — a mismatch is not a typo to be resolved by the person holding the box.'
    ] },
    2: { p: [
      'Solder paste is a process material, so its paperwork has to prove identity and condition, not only composition. Expect a certificate of analysis, a safety data sheet, the lot code, the expiration date, a storage temperature record in °C, alloy composition, metal content, flux chemistry, halogen content, and rheology or printability data where the purchase order requires it. The certificate of analysis ties the lot to the specified formulation; the safety data sheet covers hazard communication. Expiration date and storage record together answer the only question that matters at the printer: was this paste kept the way the supplier says it must be kept.',
      'Paste also arrives with handling history that the documents do not capture. Note the carton condition, any temperature excursion indicator, and whether the lot shipped under the supplier\'s stated temperature control. If it is outside the stated storage or shelf-life condition, quarantine it and ask the supplier for a disposition before anyone prints with it. Operator experience is not a release criterion for aged paste: a lot that looks and smells right can still be out of its window.'
    ] },
    3: { p: [
      'A bare PCB lot should carry a certificate of conformance, a material declaration, a copper thickness report in µm, a surface finish report, and — where the purchase order requires them — an impedance report and a cleanliness or solderability report. Together they cover the four things a fabricator can get wrong silently: the laminate system and flame rating, the copper that the current and impedance calculations assume, the finish type and thickness range, and the assembly readiness of the surface.',
      'The physical package is part of the evidence too. Boards with moisture sensitivity or fine pitch should arrive in a barrier bag with desiccant, a humidity indicator and sound edges. Check those before opening, then check the boards. Warping, scratches, oxidation, delamination or exposed copper beyond the drawing limit all mean quarantine, with the location and extent recorded precisely enough that the supplier can inspect the same area and decide whether the cause is fabrication, packaging or transport.'
    ] },
    4: { p: [
      'Three dispositions, and the line between them is evidence rather than schedule pressure. Accept when the documents are complete, the packaging is intact, the environmental indicators are inside the supplier\'s stated limits, and the sampled material conforms to the purchase order and the applicable IPC acceptance standard. Quarantine when the evidence is incomplete or uncertain — a missing certificate, damaged packaging, a suspect humidity indicator, an unclear lot code, or a measurement sitting right at the limit in mm or °C — and when a supplier review, retest or approved rework could still disposition the lot.',
      'Reject when the defect cannot be dispositioned safely: wrong part, counterfeit suspicion, a prohibited substance, expired paste, a wet or delaminated board, severe mechanical damage, or any safety hazard. Sample size and acceptance criteria come from your sampling plan and your process qualification, not from what is convenient today.',
      'A deviation is a fourth path, and it has to be limited, time-bound and approved by the engineering and quality owners who carry the risk. Write down the affected quantity, the exposure of each downstream process, the extra checks the deviation requires and the date it expires. An open deviation is not an acceptance: if it is not closed on time, the lot is quarantined or rejected.'
    ] },
    5: { p: [
      'A finding record the supplier can act on names the part, the supplier lot and the internal lot, the quantities received, inspected and affected, the requirement, the observed result, the method, the location, the date, the inspector, the disposition and the action requested. Quote the purchase order, drawing or standard by reference rather than copying its text, and state what was seen or measured — not what you think of it. Photographs, label images, document copies and test data make the difference between a finding the supplier can reproduce and one it can only dispute.',
      'Ask for a corrective action that addresses the cause and for evidence that it worked. To make that possible, give the internal part identifier, the customer part identifier, the revision, the package type, the quantity affected, and the stage at which the defect would have been caught had it escaped. A document gap needs the missing document named and the requirement that makes it mandatory. A physical defect needs the criterion, the sample size, the number of affected units and the disposition. Keep the tone factual: the supplier needs facts to change a process, and blame gives it something else to argue about.'
    ] },
    6: { p: [
      'Incoming inspection earns its cost on the defects that are hard to see later: oxidised pads, wet PCB, expired paste, the wrong alloy, the wrong plating, damaged terminations, counterfeit parts, and moisture-sensitive devices packed incorrectly. Each of them can pass a visual check and still produce poor wetting, voids, insufficient solder, tombstoning, opens, shorts, thermal stress, ICT or functional failures, and field escapes.',
      'The cost drivers are inspection labour, quarantine space, rework labour, scrap, line stoppage, expedited replacement, complaint handling and warranty. Build the plan against your own stage costs, aim it at the characteristics with the highest downstream cost and the lowest chance of detection later, and link every finding to the stage where it would have surfaced. A wrong surface finish on a bare PCB passes visual inspection and fails at reflow. The wrong metal content in a paste prints normally and shows up as voids. A compromised barrier bag survives placement and cracks in the oven. Naming that stage is what lets you compare the cost of prevention with the cost of escape in the same units.'
    ] }
  },
  takeaways: [
    'Incoming inspection is the cheapest place to stop a material defect; every stage after it adds rework, scrap or field exposure.',
    'A document package proves identity, condition and traceability, and each certificate answers a different question rather than repeating the others.',
    'Dispositions follow evidence: accept, quarantine or reject on what the documents and measurements show, and time-bound any deviation.'
  ],
  mistakes: [
    { mistake: 'A certificate of conformance is treated as proof that the lot was physically inspected and is good.',
      instead: 'Treat it as the supplier\'s declaration of conformity and verify the lot physically against the purchase order and the applicable acceptance standard.' },
    { mistake: 'A lot is released because the line needs it, with the missing certificate promised for later.',
      instead: 'Quarantine until the document arrives; a release without evidence is a deviation and needs a time-bound approval, not a promise.' },
    { mistake: 'The incoming record says "damaged packaging" and nothing else, so the supplier cannot investigate.',
      instead: 'Record lot, quantity, location, photographs and the requirement breached, and ask for a cause-level corrective action with evidence.' }
  ],
  terms: [
    { term: 'Certificate of conformance (CoC)', def: 'Supplier declaration that a lot meets the purchase order and the referenced acceptance criteria; it is evidence of declared conformity, not of inspection by the buyer.' },
    { term: 'Certificate of analysis (CoA)', def: 'Supplier report of measured or tested values for named characteristics of a specific lot — alloy, metal content, flux chemistry, plating thickness and similar.' },
    { term: 'Quarantine', def: 'Controlled hold on a lot whose conformity is uncertain, preserved until evidence, retest, supplier review or an approved disposition closes it.' },
    { term: 'Deviation', def: 'A limited, time-bound and approved acceptance of a lot outside a requirement, with the exposure and the additional checks recorded.' }
  ]
};

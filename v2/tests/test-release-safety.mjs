import assert from 'node:assert/strict';
import { parseEarningsLines, summarizeRows, identifyRetroGross } from '../js/retro-parser.mjs';
import { WAGE_SCALES, validateRetroWagePair } from '../js/wage-scale.mjs';
import { expectedOtRateDelta } from '../js/audit-engine.mjs';
import { auditFullRetro, detectMainWageRetro } from '../js/full-audit.mjs';
import { decideAuditResult } from '../js/decision-engine.mjs';

// Every Step 1-17 rate pair in both retro raise periods must match the verified table.
for (let step=1; step<=17; step++) {
  assert.equal(
    validateRetroWagePair(WAGE_SCALES.prior[step], WAGE_SCALES.y2025[step], '04/06/2025').matches,
    true,
    `2025 Step ${step}`
  );
  assert.equal(
    validateRetroWagePair(WAGE_SCALES.prior[step], WAGE_SCALES.y2026[step], '04/05/2026').matches,
    true,
    `2026 Step ${step}`
  );
}
assert.equal(validateRetroWagePair(67.43, 71.55, '04/05/2026').matches, false);

// Main wage retro is recognized from historical old-rate/corrected-rate pairs.
const mainSummary = summarizeRows(parseEarningsLines([
  'Regular Pay 04/06/2025 - 04/12/2025 -36 64.2 -2,311.20',
  'Regular Pay 04/06/2025 - 04/12/2025 36 66.29 2,386.44',
]));
const laterMetadata = { payPeriodBegin:'08/23/2026', payPeriodEnd:'08/29/2026', completeForGrossAudit:true };
assert.equal(detectMainWageRetro(mainSummary, laterMetadata).detected, true);

// Differential-only historical activity is not mistaken for the main wage retro.
const diffOnly = summarizeRows(parseEarningsLines([
  'Night Shift Differential 04/06/2025 - 04/12/2025 -24 5 -120.00',
  'Night Shift Differential 04/06/2025 - 04/12/2025 24 5 120.00',
]));
assert.equal(detectMainWageRetro(diffOnly, laterMetadata).detected, false);

// Wrong corrected base rate is caught even when Workday's arithmetic is internally tidy.
const wrongSummary = summarizeRows(parseEarningsLines([
  'Regular Pay 04/06/2025 - 04/12/2025 -36 64.2 -2,311.20',
  'Regular Pay 04/06/2025 - 04/12/2025 36 66.00 2,376.00',
]));
const wrongAudit = auditFullRetro(wrongSummary, { retroGross:64.80 }, laterMetadata);
assert.equal(wrongAudit.mainWageRetro.detected, true);
assert.equal(wrongAudit.wageScale.failures.length, 1);
const wrongDecision = decideAuditResult({
  metadata: laterMetadata,
  gross: { grossParseDifference:0 },
  fullAudit: wrongAudit,
});
assert.equal(wrongDecision.status, 'potential-discrepancy');

// A non-main-retro statement fails closed when evaluated by the decision layer.
const ordinaryDecision = decideAuditResult({
  metadata: laterMetadata,
  gross: { grossParseDifference:0 },
  fullAudit: {
    payrollRetro:0,
    reconstructedRetro:0,
    accountedActualRetro:0,
    mainWageRetro:{detected:false},
    wageScale:{checked:[],failures:[],unresolved:[]},
    unknown:[],
    limited:[],
    materialUnknowns:[],
    materialLimitedCodes:[],
    componentFailures:[],
  },
});
assert.equal(ordinaryDecision.status, 'cannot-determine');

// Certification Bonus is a flat non-retro award even if Workday associates it with an older date.
const certSummary = summarizeRows(parseEarningsLines([
  'Regular Pay 08/23/2026 - 08/29/2026 10 68.28 682.80',
  'Certification Bonus 07/05/2026 - 07/11/2026 36 500 500.00',
]));
const certGross = identifyRetroGross(certSummary, {
  payPeriodBegin:'08/23/2026',
  payPeriodEnd:'08/29/2026',
  currentGross:1182.80,
});
assert.equal(certGross.certificationBonusNonRetro, 500);
assert.equal(certGross.retroGross, 0);

// Certification Bonus has no effect on the weekly OT calculation.
const otBase = parseEarningsLines([
  'Regular Pay 04/06/2025 - 04/12/2025 -36 64.2 -2,311.20',
  'Regular Pay 04/06/2025 - 04/12/2025 36 66.29 2,386.44',
  'Overtime Pay 04/06/2025 - 04/12/2025 4 99.44 397.76',
]);
const otWithCert = [
  ...otBase,
  ...parseEarningsLines([
    'Certification Bonus 04/06/2025 - 04/12/2025 36 500 500.00',
  ]),
];
const withoutCert = expectedOtRateDelta(otBase);
const withCert = expectedOtRateDelta(otWithCert);
assert.equal(withCert.divisorHours, withoutCert.divisorHours);
assert.equal(withCert.premiumDelta, withoutCert.premiumDelta);
assert.equal(withCert.rateDelta, withoutCert.rateDelta);

console.log(JSON.stringify({
  ok:true,
  verifiedRatePairs:34,
  checks:[
    'main-retro content detection',
    'differential-only rejection',
    'wrong wage-rate detection',
    'ordinary-statement fail-closed behavior',
    'certification bonus excluded from wage retro',
    'certification bonus excluded from OT'
  ]
}, null, 2));

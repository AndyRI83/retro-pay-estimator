import { PAY_RULES } from './pay-rules.mjs';

export const VALIDATION_PROFILE = Object.freeze({
  version: '0.4-multi-case-validation',
  deeplyValidatedAgainst: 2,
  note: 'RetroCalc has been checked line by line against two very different University Campus retro statements. Those examples include Baylor and non-Baylor OT, holidays, differentials, leave, and a step change. More pay situations are still being tested.',
  seekingExamples: [
    'On-call / callback',
    'Step increase during the retro period',
    'Unfamiliar or department-specific pay',
    'Statements that seem to be missing older pay',
  ],
});

export function buildCoverage({ metadata, summary, gross, fullAudit }) {
  const recognizedCount = summary.byPayCode.filter((item) => !item.unknown).length;
  const unknownCount = summary.unknownCodes.length;
  return {
    statementGrossReconciled: gross.grossParseDifference != null && Math.abs(gross.grossParseDifference) <= 0.01,
    statementMetadataComplete: Boolean(metadata.completeForGrossAudit),
    recognizedPayCodeCount: recognizedCount,
    unknownPayCodeCount: unknownCount,
    limitedKnowledgePayCodeCount: (summary.limitedCodes || []).length,
    materialUnknownCount: fullAudit.materialUnknowns.length,
    calculationComponentCount: fullAudit.components.length,
    failedComponentCount: fullAudit.componentFailures.length,
    payRuleCount: PAY_RULES.length,
    profile: VALIDATION_PROFILE,
  };
}

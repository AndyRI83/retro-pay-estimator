import { decideAuditResult } from './decision-engine.mjs';
import { assessPaymentCompleteness } from './completeness-engine.mjs';
import { buildCoverage } from './coverage-engine.mjs';

export function buildAuditResult({ metadata, summary, gross, fullAudit, parseWarnings = [] }) {
  const calculation = decideAuditResult({ metadata, gross, fullAudit, parseWarnings });
  const completeness = assessPaymentCompleteness({ summary, fullAudit });
  const coverage = buildCoverage({ metadata, summary, gross, fullAudit });

  return {
    calculation,
    completeness,
    coverage,
    scope: {
      grossEarnings: 'included',
      underlyingTimekeeping: 'not-independently-verified',
      taxWithholding: 'not-audited-in-beta',
      benefitDeductions: 'not-audited-in-beta',
    },
  };
}

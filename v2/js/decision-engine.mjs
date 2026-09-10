import { ruleCanSupportDiscrepancy } from './rule-ledger.mjs';

const money = (value) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Math.abs(Number(value)||0));

export function decideAuditResult({ metadata, gross, fullAudit, parseWarnings = [] }) {
  const grossMismatch = gross.grossParseDifference;
  const criticalParseProblem = parseWarnings.some((warning) => warning.severity === 'critical');

  if (!metadata?.completeForGrossAudit) {
    return {
      status: 'cannot-determine',
      title: "I couldn't safely check this statement",
      explanation: "I couldn't reliably find the pay period and total gross pay, so I stopped instead of guessing.",
    };
  }

  if (criticalParseProblem || grossMismatch == null || Math.abs(grossMismatch) > 0.01) {
    return {
      status: 'cannot-determine',
      title: "I couldn't safely finish this check",
      explanation: `The pay lines I could read do not add back to the gross pay shown on the statement${grossMismatch == null ? '.' : ` (difference: $${Math.abs(grossMismatch).toFixed(2)}).`} That may be a PDF-reading problem, so I am not calling it a payroll error.`,
    };
  }

  // A second coverage guard: every retro dollar must either be represented by
  // an audited component or explicitly belong to an unknown/limited pay code.
  // This catches a known pay line that parsed successfully but could not be
  // reconstructed, which is safer than silently calling the statement a match.
  if (fullAudit?.accountedActualRetro != null && fullAudit?.payrollRetro != null) {
    const unresolvedKnownAmounts = [
      ...(fullAudit.unknown || []),
      ...(fullAudit.limited || []),
    ].reduce((sum, item) => sum + (Number(item.netRetroAmount) || 0), 0);
    const coverageGap = fullAudit.payrollRetro - fullAudit.accountedActualRetro - unresolvedKnownAmounts;
    if (Math.abs(coverageGap) > 0.01) {
      return {
        status: 'cannot-determine',
        title: "I couldn't safely account for every retro dollar",
        explanation: `I could read the statement, but $${Math.abs(coverageGap).toFixed(2)} of the retro amount was not tied to a calculation I can safely reconstruct. I stopped instead of treating that as an underpayment.`,
      };
    }
  }

  if ((fullAudit.materialLimitedCodes || []).length) {
    return {
      status: 'partially-verified',
      title: "I can't fully check this one",
      explanation: `${fullAudit.materialLimitedCodes.length} pay type${fullAudit.materialLimitedCodes.length === 1 ? '' : 's'} could change the answer, and I do not have enough validated information about that rule yet. I will show you exactly which part needs a closer look.`,
    };
  }

  if (fullAudit.materialUnknowns.length) {
    return {
      status: 'partially-verified',
      title: "I can't fully check this one",
      explanation: `${fullAudit.materialUnknowns.length} unfamiliar pay type${fullAudit.materialUnknowns.length === 1 ? '' : 's'} could change the result. I kept those lines in the audit instead of ignoring them.`,
    };
  }

  if (fullAudit.componentFailures.length) {
    const unsupportedFailures = fullAudit.componentFailures.filter((item) => !ruleCanSupportDiscrepancy(item.rule));
    if (unsupportedFailures.length) {
      return {
        status: 'partially-verified',
        title: "I can't fully check this one",
        explanation: `${unsupportedFailures.length} part${unsupportedFailures.length === 1 ? '' : 's'} of the calculation differ from my current model, but the pay rule behind at least one of them is still being validated. I will not call this a payroll error without stronger evidence.`,
      };
    }

    const unexplained = fullAudit.componentFailures.reduce((sum, item) => sum + item.difference, 0);
    return {
      status: 'potential-discrepancy',
      title: 'This needs a closer look',
      explanation: `${fullAudit.componentFailures.length} part${fullAudit.componentFailures.length === 1 ? '' : 's'} of the calculation fall outside normal payroll rounding under rules that are well supported. The total unexplained difference is ${unexplained < 0 ? '-' : ''}$${Math.abs(unexplained).toFixed(2)}. This does not by itself prove that you were underpaid.`,
    };
  }

  if ((fullAudit.limited || []).length || fullAudit.unknown.length) {
    return {
      status: 'reconciled-minor-unresolved',
      title: 'The math on this statement looks right',
      explanation: 'One small part still has limited validation, but it does not change the amount calculated for this statement.',
    };
  }

  return {
    status: 'reconciled',
    title: 'The math on this statement looks right',
    explanation: `Workday shows ${money(fullAudit.payrollRetro)} in retro pay. The independent check gives ${money(fullAudit.reconstructedRetro)}. The small difference is within normal payroll rounding.`,
  };
}

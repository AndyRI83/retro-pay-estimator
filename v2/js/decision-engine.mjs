import { ruleCanSupportDiscrepancy } from './rule-ledger.mjs';

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

  if ((fullAudit.materialLimitedCodes || []).length) {
    return {
      status: 'partially-verified',
      title: 'Most of your retro pay checks out, but I need more information about one pay type',
      explanation: `${fullAudit.materialLimitedCodes.length} pay type${fullAudit.materialLimitedCodes.length === 1 ? '' : 's'} could change the answer, and I do not have enough validated information about that rule yet. I will show you exactly which part needs a closer look.`,
    };
  }

  if (fullAudit.materialUnknowns.length) {
    return {
      status: 'partially-verified',
      title: 'Most of your retro pay checks out, but I found a pay type I do not understand well enough yet',
      explanation: `${fullAudit.materialUnknowns.length} unfamiliar pay type${fullAudit.materialUnknowns.length === 1 ? '' : 's'} could change the result. I kept those lines in the audit instead of ignoring them.`,
    };
  }

  if (fullAudit.componentFailures.length) {
    const unsupportedFailures = fullAudit.componentFailures.filter((item) => !ruleCanSupportDiscrepancy(item.rule));
    if (unsupportedFailures.length) {
      return {
        status: 'partially-verified',
        title: "I found a difference, but I can't tell yet whether it is wrong",
        explanation: `${unsupportedFailures.length} part${unsupportedFailures.length === 1 ? '' : 's'} of the calculation differ from my current model, but the pay rule behind at least one of them is still being validated. I will not call this a payroll error without stronger evidence.`,
      };
    }

    const unexplained = fullAudit.componentFailures.reduce((sum, item) => sum + item.difference, 0);
    return {
      status: 'potential-discrepancy',
      title: 'Something may be wrong and needs a closer look',
      explanation: `${fullAudit.componentFailures.length} part${fullAudit.componentFailures.length === 1 ? '' : 's'} of the calculation fall outside normal payroll rounding under rules that are well supported. The total unexplained difference is ${unexplained < 0 ? '-' : ''}$${Math.abs(unexplained).toFixed(2)}.`,
    };
  }

  if ((fullAudit.limited || []).length || fullAudit.unknown.length) {
    return {
      status: 'reconciled-minor-unresolved',
      title: 'Your retro pay matches our calculation',
      explanation: 'One small part still has limited validation, but it does not change the amount calculated for this statement.',
    };
  }

  return {
    status: 'reconciled',
    title: 'Your retro pay matches our calculation',
    explanation: `Workday shows $${fullAudit.payrollRetro.toFixed(2)} in retro pay on this statement. RetroCalc calculates $${fullAudit.reconstructedRetro.toFixed(2)}. The small difference is within normal payroll rounding.`,
  };
}

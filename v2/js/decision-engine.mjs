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

  if (fullAudit?.mainWageRetro && !fullAudit.mainWageRetro.detected) {
    return {
      status: 'cannot-determine',
      title: "I don't see the main wage retro payment on this pay stub",
      explanation: "For most University Campus nurses, the main wage retro is on the 9/3/2026 pay stub. If yours was paid differently, choose the pay stub that contains the main wage retro payment. Night / Resource retro is separate.",
    };
  }

  // Every retro dollar must either be represented by an audited component or
  // explicitly belong to an unknown/limited pay code.
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

  if ((fullAudit.materialUnknowns || []).length) {
    return {
      status: 'partially-verified',
      title: "I can't fully check this one",
      explanation: `${fullAudit.materialUnknowns.length} unfamiliar pay type${fullAudit.materialUnknowns.length === 1 ? '' : 's'} could change the result. I kept those lines in the audit instead of ignoring them.`,
    };
  }

  const unsupportedFailures = (fullAudit.componentFailures || [])
    .filter((item) => !ruleCanSupportDiscrepancy(item.rule));

  if (unsupportedFailures.length) {
    return {
      status: 'partially-verified',
      title: "I can't fully check this one",
      explanation: `${unsupportedFailures.length} part${unsupportedFailures.length === 1 ? '' : 's'} of the calculation differ from my current model, but the pay rule behind at least one of them is still being validated. I will not call this a payroll error without stronger evidence.`,
    };
  }

  if ((fullAudit?.wageScale?.unresolved || []).length) {
    const first = fullAudit.wageScale.unresolved[0];
    return {
      status: 'partially-verified',
      title: "I can't safely identify one of the wage rates",
      explanation: `I found wage-retro lines for the week of ${first.weekStart}, but the old hourly rate does not match a wage step I can safely identify. I stopped instead of guessing.`,
    };
  }

  if ((fullAudit?.wageScale?.failures || []).length) {
    const first = fullAudit.wageScale.failures[0];
    const count = fullAudit.wageScale.failures.length;
    const prefix = count === 1 ? 'For' : `In ${count} weeks, including`;

    return {
      status: 'potential-discrepancy',
      title: 'An hourly rate needs a closer look',
      explanation: `${prefix} the week of ${first.weekStart}, the old rate matches Step ${first.step}, but Workday's corrected hourly rate is $${Number(first.correctedRate).toFixed(2)}. The wage scale says $${Number(first.expectedCorrectedRate).toFixed(2)} for that step and time period.`,
    };
  }

  if ((fullAudit.componentFailures || []).length) {
    const unexplained = fullAudit.componentFailures.reduce((sum, item) => sum + item.difference, 0);
    return {
      status: 'potential-discrepancy',
      title: 'This needs a closer look',
      explanation: `${fullAudit.componentFailures.length} part${fullAudit.componentFailures.length === 1 ? '' : 's'} of the calculation fall outside normal payroll rounding under rules that are well supported. The total unexplained difference is ${unexplained < 0 ? '-' : ''}$${Math.abs(unexplained).toFixed(2)}. This does not by itself prove that you were underpaid.`,
    };
  }

  if ((fullAudit.limited || []).length || (fullAudit.unknown || []).length) {
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

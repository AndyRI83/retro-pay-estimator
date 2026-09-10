import {
  inferCorrectedBaseRate,
  inferPriorBaseRate,
  auditAllOt,
} from './audit-engine.mjs';
import { validateRetroWagePair } from './wage-scale.mjs';

export const DIRECT_1X_CODES = new Set([
  'Regular Pay', 'Baylor Time', 'Holiday', 'Holiday Worked', 'Cash Out Holiday',
  'Scheduled Holiday', 'Scheduled Personal', 'Bereavement', 'Sick Pay', 'MA Sick', 'Vacation Pay',
  'Unscheduled Personal', 'Meeting', 'Paid Training',
]);

export const FIXED_UNCHANGED_RETRO_CODES = new Set([
  'Charge Pay', 'Evening Shift', 'Night Shift Differential',
  'Weekend Differential', 'Preceptor',
]);

// These pay types have validated direct-dollar behavior, but their exact
// treatment inside every possible weekly OT-rate calculation is not yet
// strong enough to support an underpayment claim by itself. If one appears
// in an OT week that fails our model, the result is deliberately downgraded
// rather than labeled a potential payroll discrepancy.
export const OT_TREATMENT_LIMITED_CODES = new Set([
  'Unscheduled Personal',
  'Scheduled Personal',
  'Bereavement',
]);

function approx(a, b, epsilon = 0.001) {
  return Math.abs(a - b) <= epsilon;
}

function netAmount(rows, code) {
  return rows.filter((row) => row.payCode === code).reduce((sum, row) => sum + row.amount, 0);
}

function hoursAtRate(rows, code, rate) {
  return rows
    .filter((row) => row.payCode === code && approx(row.displayedRate, rate))
    .reduce((sum, row) => sum + row.hours, 0);
}

function roundingTolerance(rows) {
  // Each posted amount is rounded to cents. This is a conservative theoretical
  // line-item rounding envelope, not permission to ignore unexplained dollars.
  return Math.max(0.015, rows.length * 0.005 + 0.005);
}

function component({ week, code, actual, expected, sourceRows, rule }) {
  const difference = actual - expected;
  const tolerance = roundingTolerance(sourceRows);
  return {
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    payCode: code,
    actual: Number(actual.toFixed(6)),
    expected: Number(expected.toFixed(6)),
    difference: Number(difference.toFixed(6)),
    roundingTolerance: Number(tolerance.toFixed(6)),
    reconciled: Math.abs(difference) <= tolerance,
    lineCount: sourceRows.length,
    rule,
  };
}

export function auditDirectWeek(week) {
  const corrected = inferCorrectedBaseRate(week.rows);
  const prior = inferPriorBaseRate(week.rows);
  const results = [];

  if (corrected == null || prior == null) {
    return { correctedBaseRate: corrected, priorBaseRate: prior, components: results };
  }

  const delta = corrected - prior;

  for (const code of DIRECT_1X_CODES) {
    const codeRows = week.rows.filter((row) => row.payCode === code);
    if (!codeRows.length) continue;
    const correctedHours = hoursAtRate(codeRows, code, corrected);
    results.push(component({
      week,
      code,
      actual: netAmount(codeRows, code),
      expected: correctedHours * delta,
      sourceRows: codeRows,
      rule: 'base-linked-1x',
    }));
  }

  for (const [code, multiplier] of [['Holiday Worked OT', 1.5], ['Holiday Worked 0.5', 0.5]]) {
    const codeRows = week.rows.filter((row) => row.payCode === code);
    if (!codeRows.length) continue;
    const correctedHours = hoursAtRate(codeRows, code, corrected * multiplier);
    results.push(component({
      week,
      code,
      actual: netAmount(codeRows, code),
      expected: correctedHours * delta * multiplier,
      sourceRows: codeRows,
      rule: multiplier === 1.5 ? 'major-holiday-1.5x' : 'major-holiday-extra-0.5x',
    }));
  }

  for (const code of FIXED_UNCHANGED_RETRO_CODES) {
    const codeRows = week.rows.filter((row) => row.payCode === code);
    if (!codeRows.length) continue;
    results.push(component({
      week,
      code,
      actual: netAmount(codeRows, code),
      expected: 0,
      sourceRows: codeRows,
      rule: 'fixed-dollar-rate-repost-current-retro-statement',
    }));
  }

  return { correctedBaseRate: corrected, priorBaseRate: prior, components: results };
}

function otComponent(week, item, kind) {
  const isHoliday = kind === 'holiday';
  const code = isHoliday ? 'Holiday Overtime' : 'Overtime Pay';
  const sourceRows = week.rows.filter((row) => row.payCode === code);
  const actual = isHoliday ? item.actualHolidayOtRetro : item.actualOrdinaryRetro;
  const expected = isHoliday ? item.expectedHolidayOtRetro : item.expectedOrdinaryRetro;

  // Dynamic OT includes more intermediate rounded inputs than direct base-linked
  // earnings. Add a small calculation allowance on top of posted-line rounding.
  const tolerance = roundingTolerance(sourceRows) + 0.05;
  const difference = actual - expected;

  return {
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    payCode: code,
    actual: Number(actual.toFixed(6)),
    expected: Number(expected.toFixed(6)),
    difference: Number(difference.toFixed(6)),
    roundingTolerance: Number(tolerance.toFixed(6)),
    reconciled: Math.abs(difference) <= tolerance,
    lineCount: sourceRows.length,
    rule: week.rows.some((row) => OT_TREATMENT_LIMITED_CODES.has(row.payCode))
      ? 'weekly-ot-limited-context'
      : 'weekly-weighted-regular-rate-ot',
  };
}

export function analyzeUnknownCodes(summary, currentPeriod = null) {
  return summary.unknownCodes.map((unknown) => {
    const affectedWeeks = summary.weeks.filter((week) =>
      week.rows.some((row) => row.payCode === unknown.payCode) &&
      !(currentPeriod && week.weekStart === currentPeriod.payPeriodBegin && week.weekEnd === currentPeriod.payPeriodEnd)
    );
    const overtimeWeeks = affectedWeeks.filter((week) =>
      week.rows.some((row) => row.payCode === 'Overtime Pay' || row.payCode === 'Holiday Overtime')
    );
    const retroRows = affectedWeeks.flatMap((week) => week.rows.filter((row) => row.payCode === unknown.payCode));
    const netRetroAmount = retroRows.reduce((sum, row) => sum + row.amount, 0);

    return {
      payCode: unknown.payCode,
      rowCount: retroRows.length,
      affectedWeekCount: affectedWeeks.length,
      overtimeWeekCount: overtimeWeeks.length,
      netRetroAmount: Number(netRetroAmount.toFixed(2)),
      couldAffectConclusion: Math.abs(netRetroAmount) >= 0.01 || overtimeWeeks.length > 0,
      reason: overtimeWeeks.length
        ? 'This unresolved code appears in one or more weeks with overtime, so its regular-rate treatment could affect OT.'
        : Math.abs(netRetroAmount) >= 0.01
          ? 'This unresolved code has a non-zero retro correction that cannot yet be independently reconstructed.'
          : 'This unresolved code nets to $0 and does not appear in an overtime week on this statement.',
    };
  });
}

export function analyzeLimitedCodes(summary, currentPeriod = null) {
  return (summary.limitedCodes || []).map((limited) => {
    const affectedWeeks = summary.weeks.filter((week) =>
      week.rows.some((row) => row.payCode === limited.payCode) &&
      !(currentPeriod && week.weekStart === currentPeriod.payPeriodBegin && week.weekEnd === currentPeriod.payPeriodEnd)
    );
    const overtimeWeeks = affectedWeeks.filter((week) =>
      week.rows.some((row) => row.payCode === 'Overtime Pay' || row.payCode === 'Holiday Overtime')
    );
    const rows = affectedWeeks.flatMap((week) => week.rows.filter((row) => row.payCode === limited.payCode));
    const netRetroAmount = rows.reduce((sum, row) => sum + row.amount, 0);

    return {
      payCode: limited.payCode,
      rowCount: rows.length,
      affectedWeekCount: affectedWeeks.length,
      overtimeWeekCount: overtimeWeeks.length,
      netRetroAmount: Number(netRetroAmount.toFixed(2)),
      couldAffectConclusion: Math.abs(netRetroAmount) >= 0.01 || overtimeWeeks.length > 0,
      reason: overtimeWeeks.length
        ? 'The checker recognizes this code, but its weighted-overtime treatment has not yet been independently validated.'
        : 'The checker recognizes this code and its direct dollars, but some downstream payroll treatment is still being validated.',
    };
  });
}

function retroWeeksFor(summary, metadata = null) {
  return summary.weeks.filter((week) => !(
    metadata?.payPeriodBegin && metadata?.payPeriodEnd &&
    week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd
  ));
}

/**
 * Identifies the main wage-retro payment from the historical wage-repricing
 * pattern itself, rather than requiring a specific check date.
 */
export function detectMainWageRetro(summary, metadata = null) {
  const candidateWeeks = retroWeeksFor(summary, metadata)
    .map((week) => {
      const priorRate = inferPriorBaseRate(week.rows);
      const correctedRate = inferCorrectedBaseRate(week.rows);
      if (priorRate == null || correctedRate == null) return null;
      return {
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        ...validateRetroWagePair(priorRate, correctedRate, week.weekStart),
      };
    })
    .filter(Boolean);

  const recognizedWeeks = candidateWeeks.filter((item) => item.recognized);
  return {
    detected: recognizedWeeks.length > 0,
    candidateWeekCount: candidateWeeks.length,
    recognizedWeekCount: recognizedWeeks.length,
  };
}

function auditWageScaleWeeks(retroWeeks) {
  const checked = [];
  const failures = [];
  const unresolved = [];

  for (const week of retroWeeks) {
    const priorRate = inferPriorBaseRate(week.rows);
    const correctedRate = inferCorrectedBaseRate(week.rows);
    if (priorRate == null || correctedRate == null) continue;

    const item = {
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      ...validateRetroWagePair(priorRate, correctedRate, week.weekStart),
    };

    if (!item.recognized) {
      unresolved.push(item);
      continue;
    }

    checked.push(item);
    if (!item.matches) failures.push(item);
  }

  return { checked, failures, unresolved };
}

export function auditFullRetro(summary, gross, metadata = null) {
  const retroWeeks = retroWeeksFor(summary, metadata);

  const direct = retroWeeks.flatMap((week) => auditDirectWeek(week).components);
  const otAudit = auditAllOt(retroWeeks);
  const otByWeek = new Map(otAudit.weekly.map((item) => [`${item.weekStart}|${item.weekEnd}`, item]));
  const overtime = [];

  for (const week of retroWeeks) {
    const item = otByWeek.get(`${week.weekStart}|${week.weekEnd}`);
    if (!item) continue;
    if (item.ordinaryOtHours > 0) overtime.push(otComponent(week, item, 'ordinary'));
    if (item.holidayOtHours > 0) overtime.push(otComponent(week, item, 'holiday'));
  }

  const components = [...direct, ...overtime];
  const reconstructed = components.reduce((sum, item) => sum + item.expected, 0);
  const accountedActual = components.reduce((sum, item) => sum + item.actual, 0);
  const unknown = analyzeUnknownCodes(summary, metadata);
  const limited = analyzeLimitedCodes(summary, metadata);
  const wageScale = auditWageScaleWeeks(retroWeeks);
  const mainWageRetro = detectMainWageRetro(summary, metadata);

  return {
    components,
    directComponents: direct,
    overtimeComponents: overtime,
    unknown,
    limited,
    wageScale,
    mainWageRetro,
    reconstructedRetro: Number(reconstructed.toFixed(6)),
    accountedActualRetro: Number(accountedActual.toFixed(6)),
    payrollRetro: gross.retroGross,
    difference: Number((gross.retroGross - reconstructed).toFixed(6)),
    componentFailures: components.filter((item) => !item.reconciled),
    allKnownComponentsReconciled: components.every((item) => item.reconciled),
    materialUnknowns: unknown.filter((item) => item.couldAffectConclusion),
    materialLimitedCodes: limited.filter((item) => item.couldAffectConclusion),
  };
}

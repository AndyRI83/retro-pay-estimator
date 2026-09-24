import { inferCorrectedBaseRate, qualifyingDivisorHours } from './audit-engine.mjs';

export const DIFFERENTIAL_CONFIG = {
  'Night Shift Differential': { oldRate: 5.00, newRate: 5.50, label: 'Night differential' },
  'Charge Pay': { oldRate: 3.50, newRate: 3.75, label: 'Resource / Flow differential' },
};

const approx = (a, b, epsilon = 0.0005) => Math.abs(Number(a) - Number(b)) <= epsilon;
const round2 = (value) => Number(Number(value || 0).toFixed(2));
const round6 = (value) => Number(Number(value || 0).toFixed(6));

function sameStatementWeek(week, metadata) {
  return Boolean(metadata?.payPeriodBegin && metadata?.payPeriodEnd &&
    week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd);
}

function netAmount(rows, payCode) {
  return rows.filter((row) => row.payCode === payCode).reduce((sum, row) => sum + row.amount, 0);
}

function positiveHours(rows, payCode) {
  return rows
    .filter((row) => row.payCode === payCode && row.amount > 0 && row.hours > 0)
    .reduce((sum, row) => sum + row.hours, 0);
}

function expectedDirectForRows(rows, payCode, config) {
  let expected = 0;
  let actual = 0;
  let unrecognizedRateRows = 0;
  let oldRateRows = 0;
  let newRateRows = 0;

  for (const row of rows.filter((item) => item.payCode === payCode)) {
    actual += row.amount;
    if (approx(row.displayedRate, config.oldRate)) {
      expected += round2(row.hours * config.oldRate);
      oldRateRows += 1;
    } else if (approx(row.displayedRate, config.newRate)) {
      expected += round2(row.hours * config.newRate);
      newRateRows += 1;
    } else {
      unrecognizedRateRows += 1;
    }
  }

  return {
    actual: round2(actual),
    expected: round2(expected),
    difference: round2(actual - expected),
    oldRateRows,
    newRateRows,
    unrecognizedRateRows,
    hasExpectedPair: oldRateRows > 0 && newRateRows > 0,
  };
}

function pairingIssuesForCode(weeks, payCode, config) {
  const issues = [];
  for (const week of weeks) {
    const rows = week.rows.filter((row) => row.payCode === payCode);
    if (!rows.length) continue;
    const oldHours = rows.filter((row) => approx(row.displayedRate, config.oldRate)).reduce((sum, row) => sum + row.hours, 0);
    const newHours = rows.filter((row) => approx(row.displayedRate, config.newRate)).reduce((sum, row) => sum + row.hours, 0);
    const otherRateRows = rows.filter((row) => !approx(row.displayedRate, config.oldRate) && !approx(row.displayedRate, config.newRate)).length;
    // Normal correction weeks reverse the old-rate hours and repost the same
    // hours at the new rate. Zero-net cleanup rows at either rate also pass.
    if (Math.abs(oldHours + newHours) > 0.011 || otherRateRows) {
      issues.push({
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        oldHours: round6(oldHours),
        newHours: round6(newHours),
        otherRateRows,
      });
    }
  }
  return issues;
}

export function detectDifferentialRetro(summary, metadata = null) {
  let pairCount = 0;
  const detectedCodes = [];

  for (const [payCode, config] of Object.entries(DIFFERENTIAL_CONFIG)) {
    let hasOld = false;
    let hasNew = false;
    for (const week of summary.weeks || []) {
      if (sameStatementWeek(week, metadata)) continue;
      for (const row of week.rows) {
        if (row.payCode !== payCode) continue;
        if (approx(row.displayedRate, config.oldRate)) hasOld = true;
        if (approx(row.displayedRate, config.newRate)) hasNew = true;
      }
    }
    if (hasOld && hasNew) {
      pairCount += 1;
      detectedCodes.push(payCode);
    }
  }

  return { detected: pairCount > 0, pairCount, detectedCodes };
}


function prospectiveRateStatus(summary, metadata) {
  const currentWeek = (summary.weeks || []).find((week) => sameStatementWeek(week, metadata));
  const items = [];
  let hasAnyCurrentDifferentialHours = false;
  let anyOldRateStillPaid = false;

  for (const [payCode, config] of Object.entries(DIFFERENTIAL_CONFIG)) {
    const rows = (currentWeek?.rows || []).filter((row) => row.payCode === payCode && row.amount > 0 && row.hours > 0);
    if (!rows.length) {
      items.push({ payCode, label: config.label, oldRate: config.oldRate, newRate: config.newRate, status: 'no-current-hours', hours: 0, rates: [] });
      continue;
    }
    hasAnyCurrentDifferentialHours = true;
    const rates = [...new Set(rows.map((row) => Number(row.displayedRate)))];
    const allNew = rates.every((rate) => approx(rate, config.newRate));
    const allOld = rates.every((rate) => approx(rate, config.oldRate));
    const status = allNew ? 'new-rate' : allOld ? 'old-rate' : 'mixed-or-unfamiliar';
    if (status === 'old-rate') anyOldRateStillPaid = true;
    items.push({
      payCode,
      label: config.label,
      oldRate: config.oldRate,
      newRate: config.newRate,
      status,
      hours: round6(rows.reduce((sum, row) => sum + row.hours, 0)),
      rates,
    });
  }

  return { items, hasAnyCurrentDifferentialHours, anyOldRateStillPaid };
}

function buildPart1WeekMap(part1Summary) {
  const map = new Map();
  for (const week of part1Summary?.weeks || []) map.set(`${week.weekStart}|${week.weekEnd}`, week);
  return map;
}

function directPremiumDeltaForWeek(rows) {
  // OT uses remuneration before statement-line cent rounding. Keep the raw
  // hours × rate values here even though direct-pay reconciliation below mirrors
  // Workday's line-by-line cent rounding.
  let total = 0;
  for (const [payCode, config] of Object.entries(DIFFERENTIAL_CONFIG)) {
    for (const row of rows.filter((item) => item.payCode === payCode)) {
      if (approx(row.displayedRate, config.oldRate)) total += row.hours * config.oldRate;
      else if (approx(row.displayedRate, config.newRate)) total += row.hours * config.newRate;
    }
  }
  return round6(total);
}

/**
 * Audit the separate Night / Resource differential-retro statement.
 *
 * Standalone Part 2 can fully verify the direct differential repricing and
 * identify the OT/holiday-OT adjustment dollars. Exact independent OT-ripple
 * reconstruction requires Part 1 because Part 2 does not contain the full
 * qualifying-hour divisor for each historical week.
 */
export function auditDifferentialRetro(summary, gross, metadata = null, { part1Summary = null } = {}) {
  const detection = detectDifferentialRetro(summary, metadata);
  const historicalWeeks = (summary.weeks || []).filter((week) => !sameStatementWeek(week, metadata));
  const historicalRows = historicalWeeks.flatMap((week) => week.rows);
  const statementIntegrityOk = Boolean(
    metadata?.completeForGrossAudit &&
    gross?.grossParseDifference != null &&
    Math.abs(gross.grossParseDifference) <= 0.01
  );
  const historicalUnknownCodes = [...new Set(
    historicalRows
      .filter((row) => row.recognition === 'unknown')
      .map((row) => row.payCode)
      .filter(Boolean)
  )];

  const directComponents = [];
  let directActual = 0;
  let directExpected = 0;
  let directUnresolvedRateRows = 0;
  const pairingIssues = [];

  for (const [payCode, config] of Object.entries(DIFFERENTIAL_CONFIG)) {
    const result = expectedDirectForRows(historicalRows, payCode, config);
    if (!result.oldRateRows && !result.newRateRows) continue;
    const codePairingIssues = pairingIssuesForCode(historicalWeeks, payCode, config);
    pairingIssues.push(...codePairingIssues.map((issue) => ({ payCode, label: config.label, ...issue })));
    directActual += result.actual;
    directExpected += result.expected;
    directUnresolvedRateRows += result.unrecognizedRateRows;
    directComponents.push({
      payCode,
      label: config.label,
      oldRate: config.oldRate,
      newRate: config.newRate,
      pairingIssueCount: codePairingIssues.length,
      ...result,
      reconciled: result.unrecognizedRateRows === 0 && codePairingIssues.length === 0 && Math.abs(result.difference) <= 0.02,
    });
  }

  directActual = round2(directActual);
  directExpected = round2(directExpected);

  const ordinaryOtActual = round2(netAmount(historicalRows, 'Overtime Pay'));
  const holidayOtActual = round2(netAmount(historicalRows, 'Holiday Overtime'));
  const observedOtRipple = round2(ordinaryOtActual + holidayOtActual);

  let ordinaryOtExpected = null;
  let holidayOtExpected = null;
  let otWeeksChecked = 0;
  let otWeeksUnresolved = 0;

  if (part1Summary) {
    const part1Weeks = buildPart1WeekMap(part1Summary);
    let ordinary = 0;
    let holiday = 0;

    for (const week of historicalWeeks) {
      const addedPremium = directPremiumDeltaForWeek(week.rows);
      if (Math.abs(addedPremium) <= 0.000001) continue;

      const sourceWeek = part1Weeks.get(`${week.weekStart}|${week.weekEnd}`);
      if (!sourceWeek) {
        if (Math.abs(netAmount(week.rows, 'Overtime Pay')) > 0.001 || Math.abs(netAmount(week.rows, 'Holiday Overtime')) > 0.001) {
          otWeeksUnresolved += 1;
        }
        continue;
      }

      const correctedBase = inferCorrectedBaseRate(sourceWeek.rows);
      if (correctedBase == null) {
        if (Math.abs(netAmount(week.rows, 'Overtime Pay')) > 0.001 || Math.abs(netAmount(week.rows, 'Holiday Overtime')) > 0.001) {
          otWeeksUnresolved += 1;
        }
        continue;
      }

      const divisor = qualifyingDivisorHours(sourceWeek.rows, correctedBase);
      if (!(divisor > 0)) {
        if (Math.abs(netAmount(week.rows, 'Overtime Pay')) > 0.001 || Math.abs(netAmount(week.rows, 'Holiday Overtime')) > 0.001) {
          otWeeksUnresolved += 1;
        }
        continue;
      }

      const ordinaryHours = positiveHours(sourceWeek.rows, 'Overtime Pay');
      const holidayHours = positiveHours(sourceWeek.rows, 'Holiday Overtime');
      if (!(ordinaryHours > 0 || holidayHours > 0)) continue;

      const rateDelta = 0.5 * (addedPremium / divisor);
      ordinary += rateDelta * ordinaryHours;
      holiday += rateDelta * holidayHours;
      otWeeksChecked += 1;
    }

    ordinaryOtExpected = round2(ordinary);
    holidayOtExpected = round2(holiday);
  }

  const expectedOtRipple = ordinaryOtExpected == null || holidayOtExpected == null
    ? null
    : round2(ordinaryOtExpected + holidayOtExpected);

  const payrollRetro = gross?.retroGross == null ? null : round2(gross.retroGross);
  const accountedRetro = round2(directActual + observedOtRipple);
  const coverageGap = payrollRetro == null ? null : round2(payrollRetro - accountedRetro);

  const reconstructedRetro = expectedOtRipple == null
    ? null
    : round2(directExpected + expectedOtRipple);
  const difference = reconstructedRetro == null || payrollRetro == null
    ? null
    : round2(payrollRetro - reconstructedRetro);

  let status = 'cannot-determine';
  let title = "I couldn't safely identify the separate differential retro";
  let explanation = 'This statement does not contain the expected Night / Resource repricing pattern.';

  if (!metadata?.completeForGrossAudit) {
    status = 'cannot-determine';
    title = "I couldn't safely read the statement totals";
    explanation = 'The pay period or printed gross pay could not be read reliably, so the checker stopped instead of guessing.';
  } else if (gross?.grossParseDifference == null || Math.abs(gross.grossParseDifference) > 0.01) {
    status = 'cannot-determine';
    title = "I couldn't safely account for the statement total";
    explanation = `The pay lines I could read do not add back to the gross pay printed by Workday${gross?.grossParseDifference == null ? '.' : ` (difference: $${Math.abs(gross.grossParseDifference).toFixed(2)}).`} That may be a PDF-reading problem, so this is not being called a payroll error.`;
  } else if (detection.detected) {
    if (historicalUnknownCodes.length) {
      status = 'partially-verified';
      title = "I found a pay type I don't know well enough yet";
      explanation = `${historicalUnknownCodes.length} unfamiliar historical pay type${historicalUnknownCodes.length === 1 ? '' : 's'} could affect the Night / Resource retro calculation, so the checker is not treating this as fully verified.`;
    } else if (directUnresolvedRateRows > 0 || pairingIssues.length || directComponents.some((item) => !item.reconciled)) {
      status = 'partially-verified';
      title = 'Part of the differential adjustment needs a closer look';
      explanation = pairingIssues.length
        ? `${pairingIssues.length} differential week${pairingIssues.length === 1 ? '' : 's'} does not have the usual matched old-rate/new-rate hour pattern.`
        : 'The Night / Resource adjustment is present, but at least one direct differential row uses a rate or amount outside the validated pattern.';
    } else if (coverageGap != null && Math.abs(coverageGap) > 0.02) {
      status = 'partially-verified';
      title = "I couldn't account for every retro dollar";
      explanation = `The differential and OT adjustment lines account for ${Math.abs(accountedRetro).toFixed(2)} of retro, leaving ${Math.abs(coverageGap).toFixed(2)} unexplained.`;
    } else if (part1Summary && difference != null) {
      if (otWeeksUnresolved === 0 && Math.abs(difference) <= 0.75) {
        status = 'reconciled';
        title = 'The separate differential retro looks right';
        explanation = 'The direct Night / Resource repricing and the related overtime recalculation reconcile within payroll-rounding tolerance.';
      } else {
        status = 'partially-verified';
        title = 'Most of the separate differential retro checks out';
        explanation = otWeeksUnresolved
          ? `${otWeeksUnresolved} overtime week${otWeeksUnresolved === 1 ? '' : 's'} could not be reconstructed from the Part 1 statement.`
          : 'The direct differentials reconcile, but the reconstructed overtime ripple is outside the conservative combined tolerance.';
      }
    } else {
      status = 'direct-verified';
      title = 'The direct Night / Resource adjustment looks right';
      explanation = 'The differential rates and arithmetic reconcile. This statement also contains OT adjustments, but Part 1 is needed to independently reconstruct the historical OT divisor week by week.';
    }
  }

  const prospective = prospectiveRateStatus(summary, metadata);
  const safeReconstructedRetro = statementIntegrityOk ? reconstructedRetro : null;
  const safeDifference = statementIntegrityOk ? difference : null;

  return {
    status,
    title,
    explanation,
    detection,
    statementIntegrityOk,
    historicalUnknownCodes,
    pairingIssues,
    directComponents,
    directActual,
    directExpected,
    directDifference: round2(directActual - directExpected),
    ordinaryOtActual,
    holidayOtActual,
    observedOtRipple,
    ordinaryOtExpected,
    holidayOtExpected,
    expectedOtRipple,
    otWeeksChecked,
    otWeeksUnresolved,
    payrollRetro,
    accountedRetro,
    coverageGap,
    reconstructedRetro: safeReconstructedRetro,
    difference: safeDifference,
    hasPart1Context: Boolean(part1Summary),
    prospective,
  };
}

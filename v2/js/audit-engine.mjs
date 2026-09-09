const BASE_LINKED_1X_CODES = new Set([
  'Regular Pay', 'Baylor Time', 'Holiday', 'Holiday Worked', 'Cash Out Holiday',
  'Scheduled Holiday', 'Scheduled Personal', 'Bereavement', 'Sick Pay', 'MA Sick', 'Vacation Pay',
  'Unscheduled Personal', 'Meeting', 'Paid Training',
]);

// Empirically supported on Test Case 001 for the weighted-rate divisor.
// Notably, Vacation Pay behaves as included while Unscheduled Personal and sick pay do not.
const QUALIFYING_DIVISOR_1X_CODES = new Set([
  'Regular Pay', 'Holiday', 'Holiday Worked', 'Vacation Pay',
  'Meeting', 'Paid Training', 'Scheduled Holiday',
]);

function approx(a, b, epsilon = 0.0005) {
  return Math.abs(a - b) <= epsilon;
}

function modePreferHigher(values) {
  if (!values.length) return null;
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]))[0][0];
}

export function inferCorrectedBaseRate(rows) {
  const candidates = rows
    .filter((row) => BASE_LINKED_1X_CODES.has(row.payCode) && row.amount > 0 && row.displayedRate >= 30)
    .map((row) => row.displayedRate);

  if (candidates.length) return modePreferHigher(candidates);

  const majorHoliday = rows.find((row) => row.payCode === 'Holiday Worked OT' && row.amount > 0);
  if (majorHoliday) return Number((majorHoliday.displayedRate / 1.5).toFixed(3));

  const halfHoliday = rows.find((row) => row.payCode === 'Holiday Worked 0.5' && row.amount > 0);
  if (halfHoliday) return Number((halfHoliday.displayedRate / 0.5).toFixed(3));

  return null;
}

export function inferPriorBaseRate(rows) {
  const candidates = rows
    .filter((row) => BASE_LINKED_1X_CODES.has(row.payCode) && row.amount < 0 && row.displayedRate >= 30)
    .map((row) => row.displayedRate);
  return modePreferHigher(candidates);
}

function hoursAtRate(rows, payCode, rate) {
  return rows
    .filter((row) => row.payCode === payCode && approx(row.displayedRate, rate))
    .reduce((sum, row) => sum + row.hours, 0);
}

function positiveHours(rows, payCode) {
  return rows
    .filter((row) => row.payCode === payCode && row.amount > 0 && row.hours > 0)
    .reduce((sum, row) => sum + row.hours, 0);
}

function netAmount(rows, payCode) {
  return rows
    .filter((row) => row.payCode === payCode)
    .reduce((sum, row) => sum + row.amount, 0);
}

export function qualifyingDivisorHours(rows, correctedBaseRate) {
  let hours = 0;

  for (const payCode of QUALIFYING_DIVISOR_1X_CODES) {
    hours += hoursAtRate(rows, payCode, correctedBaseRate);
  }

  hours += positiveHours(rows, 'Overtime Pay');
  hours += positiveHours(rows, 'Holiday Overtime');
  hours += positiveHours(rows, 'Holiday Worked OT');

  return Number(hours.toFixed(6));
}

/**
 * Change in eligible premium remuneration caused by the retro wage correction.
 * Fixed-dollar differentials cancel when their historical rates did not change.
 */
export function deltaEligiblePremium(rows, correctedBaseRate, priorBaseRate) {
  const baseDelta = correctedBaseRate - priorBaseRate;

  const baylorDelta = netAmount(rows, 'Baylor Time');

  const majorHolidayHours = positiveHours(rows, 'Holiday Worked OT');
  const majorHolidayExtraHalfDelta = 0.5 * baseDelta * majorHolidayHours;

  // This code is itself the extra half-base holiday premium on holiday OT hours.
  const holidayOtExtraHalfDelta = netAmount(rows, 'Holiday Worked 0.5');

  return Number((baylorDelta + majorHolidayExtraHalfDelta + holidayOtExtraHalfDelta).toFixed(6));
}

export function expectedOtRateDelta(rows) {
  const correctedBaseRate = inferCorrectedBaseRate(rows);
  const priorBaseRate = inferPriorBaseRate(rows);
  if (correctedBaseRate == null || priorBaseRate == null) return null;

  const divisorHours = qualifyingDivisorHours(rows, correctedBaseRate);
  if (!(divisorHours > 0)) return null;

  const baseDelta = correctedBaseRate - priorBaseRate;
  const premiumDelta = deltaEligiblePremium(rows, correctedBaseRate, priorBaseRate);

  // ΔOT = 1.5ΔB + 0.5(Δeligible premium / divisor hours)
  const rateDelta = 1.5 * baseDelta + 0.5 * (premiumDelta / divisorHours);

  return {
    correctedBaseRate,
    priorBaseRate,
    baseDelta,
    divisorHours,
    premiumDelta,
    rateDelta,
  };
}

function actualNetByCode(rows, payCode) {
  return Number(netAmount(rows, payCode).toFixed(2));
}

export function auditWeeklyOt(week) {
  const calc = expectedOtRateDelta(week.rows);
  if (!calc) return null;

  const ordinaryHours = positiveHours(week.rows, 'Overtime Pay');
  const holidayOtHours = positiveHours(week.rows, 'Holiday Overtime');

  if (ordinaryHours === 0 && holidayOtHours === 0) return null;

  const expectedOrdinaryRetro = calc.rateDelta * ordinaryHours;
  const expectedHolidayOtRetro = calc.rateDelta * holidayOtHours;

  return {
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    ...calc,
    ordinaryOtHours: ordinaryHours,
    holidayOtHours,
    expectedOrdinaryRetro,
    actualOrdinaryRetro: actualNetByCode(week.rows, 'Overtime Pay'),
    expectedHolidayOtRetro,
    actualHolidayOtRetro: actualNetByCode(week.rows, 'Holiday Overtime'),
  };
}

export function auditAllOt(weeks) {
  const weekly = weeks.map(auditWeeklyOt).filter(Boolean);
  const totals = weekly.reduce((acc, item) => {
    acc.expectedOrdinaryRetro += item.expectedOrdinaryRetro;
    acc.actualOrdinaryRetro += item.actualOrdinaryRetro;
    acc.expectedHolidayOtRetro += item.expectedHolidayOtRetro;
    acc.actualHolidayOtRetro += item.actualHolidayOtRetro;
    acc.ordinaryOtHours += item.ordinaryOtHours;
    acc.holidayOtHours += item.holidayOtHours;
    return acc;
  }, {
    expectedOrdinaryRetro: 0,
    actualOrdinaryRetro: 0,
    expectedHolidayOtRetro: 0,
    actualHolidayOtRetro: 0,
    ordinaryOtHours: 0,
    holidayOtHours: 0,
  });

  for (const key of ['expectedOrdinaryRetro','actualOrdinaryRetro','expectedHolidayOtRetro','actualHolidayOtRetro','ordinaryOtHours','holidayOtHours']) {
    totals[key] = Number(totals[key].toFixed(6));
  }

  totals.ordinaryDifference = Number((totals.actualOrdinaryRetro - totals.expectedOrdinaryRetro).toFixed(6));
  totals.holidayOtDifference = Number((totals.actualHolidayOtRetro - totals.expectedHolidayOtRetro).toFixed(6));

  return { weekly, totals };
}

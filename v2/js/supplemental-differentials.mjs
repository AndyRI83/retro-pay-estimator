import { inferCorrectedBaseRate, qualifyingDivisorHours } from './audit-engine.mjs';

const CONFIG = {
  'Night Shift Differential': { oldRate: 5.00, newRate: 5.50, increase: 0.50, label: 'Night differential' },
  'Charge Pay': { oldRate: 3.50, newRate: 3.75, increase: 0.25, label: 'Resource / Flow differential' },
};

function positiveHours(rows, code) {
  return rows
    .filter((row) => row.payCode === code && row.amount > 0 && row.hours > 0)
    .reduce((sum, row) => sum + row.hours, 0);
}

function ytdRecord(summary, code) {
  return summary.byPayCode.find((item) => item.payCode === code) || null;
}

function rateLooksUniformAtOld(item, config) {
  if (item?.ytdHours == null || item?.ytdAmount == null) return false;
  return Math.abs(item.ytdAmount - item.ytdHours * config.oldRate) <= 0.02;
}

/**
 * Computes the portion of the announced Night / Resource supplemental that can
 * be supported from the current statement alone.
 *
 * Important limitation: Workday YTD fields are calendar-year totals. They do not
 * expose April-December 2025 totals on a 2026 statement. Therefore this module
 * never describes the YTD amount as the complete April-2025-forward entitlement.
 */
export function analyzePendingDifferentials(summary, metadata = null, clarifications = {}) {
  const items = [];
  let direct2026Ytd = 0;

  for (const [code, config] of Object.entries(CONFIG)) {
    const item = ytdRecord(summary, code);
    if (!item || item.ytdHours == null || item.ytdAmount == null) continue;

    const uniformOld = rateLooksUniformAtOld(item, config);
    const direct = uniformOld ? item.ytdHours * config.increase : null;
    if (direct != null) direct2026Ytd += direct;

    const parsedPositive = item.positiveHours || 0;
    const currentPeriodPositive = summary.weeks
      .filter((week) => metadata?.payPeriodBegin && metadata?.payPeriodEnd && week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd)
      .flatMap((week) => week.rows)
      .filter((row) => row.payCode === code && row.amount > 0 && row.hours > 0)
      .reduce((sum, row) => sum + row.hours, 0);

    items.push({
      payCode: code,
      label: config.label,
      oldRate: config.oldRate,
      newRate: config.newRate,
      increase: config.increase,
      ytdHours: item.ytdHours,
      ytdAmount: item.ytdAmount,
      currentPeriodHours: Number(currentPeriodPositive.toFixed(4)),
      direct2026Ytd: direct == null ? null : Number(direct.toFixed(2)),
      ytdAppearsEntirelyAtOldRate: uniformOld,
      parsedPositiveHours: Number(parsedPositive.toFixed(4)),
      unitemizedYtdHours: Number(Math.max(0, item.ytdHours - parsedPositive).toFixed(4)),
    });
  }

  // Secondary OT effect from weeks where both OT and the differential hours are
  // visible in this statement. The final supplemental can be higher because some
  // YTD differential hours may not be itemized week-by-week on this retro PDF.
  let visibleOtRipple = 0;
  let visibleOtWeeks = 0;

  for (const week of summary.weeks) {
    if (metadata?.payPeriodBegin && metadata?.payPeriodEnd && week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd) continue;

    const correctedBase = inferCorrectedBaseRate(week.rows);
    if (correctedBase == null) continue;
    const divisor = qualifyingDivisorHours(week.rows, correctedBase);
    if (!(divisor > 0)) continue;

    const ordinaryOt = positiveHours(week.rows, 'Overtime Pay');
    const holidayOt = positiveHours(week.rows, 'Holiday Overtime');
    const otHours = ordinaryOt + holidayOt;
    if (!(otHours > 0)) continue;

    let addedPremium = 0;
    for (const [code, config] of Object.entries(CONFIG)) {
      addedPremium += positiveHours(week.rows, code) * config.increase;
    }
    if (!(addedPremium > 0)) continue;

    visibleOtRipple += 0.5 * (addedPremium / divisor) * otHours;
    visibleOtWeeks += 1;
  }

  direct2026Ytd = Number(direct2026Ytd.toFixed(2));
  visibleOtRipple = Number(visibleOtRipple.toFixed(6));

  const allYtdDirectKnown = items.length > 0 && items.every((item) => item.direct2026Ytd != null);
  const visible2026Subtotal = allYtdDirectKnown
    ? Number((direct2026Ytd + visibleOtRipple).toFixed(2))
    : null;

  const pre2026Answers = {
    'Night Shift Differential': clarifications['pre2026-night-history'] ?? null,
    'Charge Pay': clarifications['pre2026-resource-history'] ?? null,
  };
  const relevantCodes = items.map((item)=>item.payCode);
  const allPre2026ConfirmedNone = relevantCodes.length > 0 && relevantCodes.every((code)=>pre2026Answers[code] === 'no');
  const anyPre2026ConfirmedYes = relevantCodes.some((code)=>pre2026Answers[code] === 'yes');
  const directApril2025Forward = allYtdDirectKnown && allPre2026ConfirmedNone ? direct2026Ytd : null;
  const hasUnitemizedYtdHours = items.some((item)=>item.unitemizedYtdHours > 0.01);

  return {
    status: items.length ? 'pending-confirmed' : 'not-applicable-from-statement',
    effectiveFrom: 'April 2025',
    expectedTiming: 'not confirmed',
    items,
    direct2026Ytd: allYtdDirectKnown ? direct2026Ytd : null,
    visibleOtRipple: Number(visibleOtRipple.toFixed(2)),
    visibleOtRippleRaw: visibleOtRipple,
    visibleOtWeeks,
    visible2026Subtotal,
    hasUnitemizedYtdHours,
    directApril2025Forward,
    pre2026HistoryResolution: allPre2026ConfirmedNone ? 'confirmed-none' : anyPre2026ConfirmedYes ? 'confirmed-older-hours-not-itemized' : 'unresolved',
    clarifications: pre2026Answers,
    caveats: [
      allPre2026ConfirmedNone
        ? 'The user confirmed no qualifying Night / Resource hours occurred in April-December 2025, so the 2026 YTD direct differential total can be treated as complete for the direct premium increase.'
        : anyPre2026ConfirmedYes
          ? 'The user confirmed qualifying Night / Resource hours occurred in 2025. Those 2025 hours are not itemized on this statement, so this PDF cannot predict the full supplemental amount. The separate payment should be checked when it posts instead of requiring older pay stubs in the normal workflow.'
          : 'The YTD fields on a 2026 statement do not show April-December 2025 differential hours. The checker does not assume those missing 2025 hours are zero.',
      hasUnitemizedYtdHours ? 'The year-to-date totals are larger than the hours itemized week by week on this statement. The YTD totals can support the direct 2026 rate increase, but the missing weekly detail prevents an exact calculation of the full related OT adjustment.' : 'The statement itemizes the 2026 differential hours needed for the related OT calculation.',
      'The separate payment should be checked when it posts; that later statement can establish the final total.',
    ],
  };
}

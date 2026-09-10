export const LIMITED_KNOWN_PAY_CODES = new Set([]);

export const KNOWN_PAY_CODES = new Set([
  'Bereavement',
  'Certification Bonus',
  'Industrial Accident',
  'Workers Compensation',
  'Baylor Time',
  'Cash Out Holiday',
  'Charge Pay',
  'Evening Shift',
  'Holiday',
  'Holiday Overtime',
  'Holiday Worked',
  'Holiday Worked 0.5',
  'Holiday Worked OT',
  'MA Sick',
  'Meeting',
  'Night Shift Differential',
  'Overtime Pay',
  'Paid Training',
  'Preceptor',
  'Regular Pay',
  'Scheduled Holiday',
  'Scheduled Personal',
  'Sick Pay',
  'Unscheduled Personal',
  'Vacation Pay',
  'Weekend Differential',
]);

const DATE_RANGE_RE = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/;
const EARNINGS_ROW_RE = /^\s*(.*?)\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?[\d,]+\.\d{2})(?:\s+(-?\d+(?:\.\d+)?)\s+(-?[\d,]+\.\d{2}))?(?:\s|$)/;

const HEADER_PREFIXES = [
  'Earnings', 'Description', 'Pre Tax', 'Post Tax', 'Employee Taxes',
  'Employer Paid', 'Taxable Wages', 'Federal State', 'Payment Information',
  'Name ', 'Current ', 'YTD ', 'Gross Pay', 'UMass Memorial',
];

function moneyNumber(raw) {
  return Number(raw.replaceAll(',', ''));
}

function plausibleDescriptionOnlyLine(text) {
  if (!text || text.length >= 70) return false;
  if (DATE_RANGE_RE.test(text)) return false;
  if (HEADER_PREFIXES.some((prefix) => text.startsWith(prefix))) return false;
  return /^[A-Za-z][A-Za-z0-9 &./()\-]+$/.test(text);
}

/**
 * Parse Workday earnings rows from line-oriented text.
 *
 * The parser deliberately requires Date range + Hours + Rate + Amount.
 * That guards against accidentally interpreting historical deduction rows,
 * which also contain date ranges but do not have the earnings-column shape.
 */
export function parseEarningsLines(lines) {
  const rows = [];
  let pendingDescription = null;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (plausibleDescriptionOnlyLine(trimmed)) {
      pendingDescription = trimmed;
    }

    const match = line.match(EARNINGS_ROW_RE);
    if (!match) return;

    const inlineDescription = match[1].trim();
    const payCode = inlineDescription || pendingDescription || '';

    rows.push({
      id: `row-${index + 1}`,
      sourceLine: index + 1,
      rawText: line,
      payCode,
      normalizedPayCode: payCode.replace(/\s+/g, ' ').trim(),
      weekStart: match[2],
      weekEnd: match[3],
      hours: Number(match[4]),
      displayedRate: Number(match[5]),
      amount: moneyNumber(match[6]),
      ytdHours: match[7] == null ? null : Number(match[7]),
      ytdAmount: match[8] == null ? null : moneyNumber(match[8]),
      isNegative: Number(match[6].replaceAll(',', '')) < 0,
      recognition: KNOWN_PAY_CODES.has(payCode) ? 'known' : 'unknown',
      knowledgeLevel: LIMITED_KNOWN_PAY_CODES.has(payCode) ? 'limited' : (KNOWN_PAY_CODES.has(payCode) ? 'validated' : 'unknown'),
    });

    pendingDescription = null;
  });

  return rows;
}

export function summarizeRows(rows) {
  const byPayCode = new Map();
  const byWeek = new Map();

  for (const row of rows) {
    if (!byPayCode.has(row.payCode)) {
      byPayCode.set(row.payCode, {
        payCode: row.payCode,
        rowCount: 0,
        netAmount: 0,
        positiveHours: 0,
        negativeHours: 0,
        unknown: row.recognition === 'unknown',
        limited: row.knowledgeLevel === 'limited',
        ytdHours: null,
        ytdAmount: null,
      });
    }
    const code = byPayCode.get(row.payCode);
    code.rowCount += 1;
    code.netAmount += row.amount;
    if (row.hours > 0) code.positiveHours += row.hours;
    if (row.hours < 0) code.negativeHours += row.hours;
    if (row.ytdHours != null) code.ytdHours = row.ytdHours;
    if (row.ytdAmount != null) code.ytdAmount = row.ytdAmount;

    const weekKey = `${row.weekStart}|${row.weekEnd}`;
    if (!byWeek.has(weekKey)) {
      byWeek.set(weekKey, {
        weekStart: row.weekStart,
        weekEnd: row.weekEnd,
        rows: [],
      });
    }
    byWeek.get(weekKey).rows.push(row);
  }

  for (const item of byPayCode.values()) {
    item.netAmount = Number(item.netAmount.toFixed(2));
    item.positiveHours = Number(item.positiveHours.toFixed(4));
    item.negativeHours = Number(item.negativeHours.toFixed(4));
  }

  const grossParsed = Number(rows.reduce((sum, row) => sum + row.amount, 0).toFixed(2));
  const unknownCodes = [...byPayCode.values()].filter((x) => x.unknown);
  const limitedCodes = [...byPayCode.values()].filter((x) => x.limited);

  return {
    rowCount: rows.length,
    grossParsed,
    byPayCode: [...byPayCode.values()].sort((a, b) => a.payCode.localeCompare(b.payCode)),
    weeks: [...byWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    unknownCodes,
    limitedCodes,
  };
}

export function identifyRetroGross(summary, metadata = null, fallbackCurrentPeriodCodes = ['Industrial Accident', 'Workers Compensation']) {
  let currentPeriodAmount = 0;
  let method = 'fallback-pay-codes';

  if (metadata?.payPeriodBegin && metadata?.payPeriodEnd) {
    method = 'statement-pay-period';
    currentPeriodAmount = summary.weeks
      .filter((week) => week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd)
      .flatMap((week) => week.rows)
      .reduce((sum, row) => sum + row.amount, 0);
  } else {
    currentPeriodAmount = summary.byPayCode
      .filter((x) => fallbackCurrentPeriodCodes.includes(x.payCode))
      .reduce((sum, x) => sum + x.netAmount, 0);
  }

  // Certification Bonus is a separate flat award, not wage retro. Workday may
  // associate it with an older date even when it is paid on the current check.
  // Keep any net certification award outside the wage-retro total.
  const certificationBonusNonRetro = metadata?.payPeriodBegin && metadata?.payPeriodEnd
    ? summary.weeks
        .filter((week) => !(week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd))
        .flatMap((week) => week.rows)
        .filter((row) => row.payCode === 'Certification Bonus')
        .reduce((sum, row) => sum + row.amount, 0)
    : (summary.byPayCode.find((x) => x.payCode === 'Certification Bonus')?.netAmount || 0);

  currentPeriodAmount += certificationBonusNonRetro;

  return {
    parsedGross: summary.grossParsed,
    printedGross: metadata?.currentGross ?? null,
    grossParseDifference: metadata?.currentGross == null
      ? null
      : Number((summary.grossParsed - metadata.currentGross).toFixed(2)),
    currentPeriodNonRetro: Number(currentPeriodAmount.toFixed(2)),
    certificationBonusNonRetro: Number(certificationBonusNonRetro.toFixed(2)),
    retroGross: Number((summary.grossParsed - currentPeriodAmount).toFixed(2)),
    method,
  };
}

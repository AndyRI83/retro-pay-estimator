const MONEY = '-?[\\d,]+\\.\\d{2}';
const DATE = '\\d{2}\\/\\d{2}\\/\\d{4}';
const round2 = (value) => Number(Number(value || 0).toFixed(2));
const num = (raw) => Number(String(raw).replaceAll(',', ''));
const textOf = (line) => typeof line === 'string' ? line.trim() : String(line?.text || '').trim();

const TAX_LABELS = [
  'Federal Withholding',
  'State Tax - MA',
  'OASDI',
  'Medicare',
  'MAPFL - MAPFL',
  'MAPML - MAPML',
];

const POST_TAX_LABELS = [
  'Long Term Disability',
  'Supplemental Life',
  'Short Term Disability',
  'Dependent Life',
  'Spousal Life',
  'Legal Plan',
  'AD&D',
];

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function findTrailingRow(line, labels, withYtd = true) {
  for (const label of labels) {
    const re = withYtd
      ? new RegExp(`(?:^|\\s+)(${escRe(label)})\\s+(${MONEY})\\s+(${MONEY})\\s*$`)
      : new RegExp(`(?:^|\\s+)(${escRe(label)})\\s+(${MONEY})\\s*$`);
    const m = line.match(re);
    if (m) return withYtd
      ? { description: m[1], amount: num(m[2]), ytdAmount: num(m[3]) }
      : { description: m[1], amount: num(m[2]) };
  }
  return null;
}

function findHistoricalPostTax(line) {
  for (const label of POST_TAX_LABELS) {
    const re = new RegExp(`(?:^|\\s+)(${escRe(label)})\\s+-?\\s*(${DATE})\\s*-\\s*(${DATE})\\s+(${MONEY})\\s*$`);
    const m = line.match(re);
    if (m) return { description: m[1], weekStart: m[2], weekEnd: m[3], amount: num(m[4]) };
  }
  return null;
}

function groupHistorical(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.description)) map.set(row.description,{description:row.description,total:0,count:0,rows:[]});
    const item=map.get(row.description);item.total+=row.amount;item.count+=1;item.rows.push(row);
  }
  return [...map.values()].map((x)=>({...x,total:round2(x.total)})).sort((a,b)=>Math.abs(b.total)-Math.abs(a.total));
}

/**
 * Parse tax withholding and dated post-tax benefit adjustments from Workday.
 *
 * Workday renders some sections side-by-side. PDF.js therefore may return a
 * single visual line containing an earnings row on the left and a tax/deduction
 * row on the right. These parsers deliberately look for known rows anchored at
 * the end of each visual line instead of assuming each table occupies its own line.
 *
 * Informational only: this does not determine final tax liability or validate the
 * underlying insurance-plan premium formula.
 */
export function parseStatementExtras(lines, metadata = null) {
  const employeeTaxes = [];
  const postTaxCurrent = [];
  const postTaxHistorical = [];
  const seenTax = new Set();
  const seenCurrent = new Set();

  for (const raw of lines) {
    const line = textOf(raw);
    if (!line) continue;

    const hist = findHistoricalPostTax(line);
    if (hist) {
      // Preserve repeated identical dated rows. Workday can legitimately post the
      // same benefit adjustment more than once for the same earning week.
      postTaxHistorical.push(hist);
      continue;
    }

    const tax = findTrailingRow(line,TAX_LABELS,true);
    if (tax) {
      const key = `${tax.description}|${tax.amount}|${tax.ytdAmount}`;
      if (!seenTax.has(key)) { seenTax.add(key); employeeTaxes.push(tax); }
      continue;
    }

    const current = findTrailingRow(line,POST_TAX_LABELS,true);
    if (current) {
      const key = `${current.description}|${current.amount}|${current.ytdAmount}`;
      if (!seenCurrent.has(key)) { seenCurrent.add(key); postTaxCurrent.push(current); }
    }
  }

  const postTaxHistoricalGrouped = groupHistorical(postTaxHistorical);
  const postTaxHistoricalTotal = round2(postTaxHistorical.reduce((sum,row)=>sum+row.amount,0));
  const postTaxCurrentTotal = round2(postTaxCurrent.reduce((sum,row)=>sum+row.amount,0));

  return {
    employeeTaxes,
    postTaxCurrent,
    postTaxHistorical,
    postTaxHistoricalGrouped,
    postTaxHistoricalTotal,
    postTaxCurrentTotal,
    printedPostTaxTotal: metadata?.currentPostTaxDeductions ?? null,
    postTaxReconciliationDifference: metadata?.currentPostTaxDeductions == null
      ? null
      : round2(metadata.currentPostTaxDeductions - postTaxHistoricalTotal - postTaxCurrentTotal),
  };
}

export function findTax(extras, description) {
  return extras?.employeeTaxes?.find((row)=>row.description===description) || null;
}

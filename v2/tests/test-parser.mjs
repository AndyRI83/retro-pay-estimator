import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseEarningsLines, summarizeRows, identifyRetroGross } from '../js/retro-parser.mjs';
import { parseStatementMetadata } from '../js/statement-meta.mjs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node test-parser.mjs <pdftotext-layout-output>');

const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const metadata = parseStatementMetadata(lines);
const rows = parseEarningsLines(lines);
const summary = summarizeRows(rows);
const gross = identifyRetroGross(summary, metadata);

const expected = {
  rowCount: 924,
  parsedGross: 15213.48,
  currentPeriodNonRetro: 2951.24,
  retroGross: 12262.24,
  categories: {
    'Baylor Time': 1548.08,
    'Cash Out Holiday': 38.58,
    'Charge Pay': 0,
    'Evening Shift': 0,
    'Holiday': 470.35,
    'Holiday Overtime': 78.38,
    'Holiday Worked': 222.00,
    'Holiday Worked 0.5': 20.25,
    'Holiday Worked OT': 298.92,
    'MA Sick': 106.40,
    'Meeting': 33.10,
    'Night Shift Differential': 0,
    'Overtime Pay': 1201.28,
    'Paid Training': 20.61,
    'Preceptor': 0,
    'Regular Pay': 7185.11,
    'Scheduled Holiday': 19.29,
    'Sick Pay': 625.28,
    'Unscheduled Personal': 158.54,
    'Vacation Pay': 236.07,
    'Weekend Differential': 0,
  },
};

assert.equal(metadata.payPeriodBegin, '08/23/2026');
assert.equal(metadata.payPeriodEnd, '08/29/2026');
assert.equal(metadata.checkDate, '09/03/2026');
assert.equal(metadata.currentGross, 15213.48);
assert.equal(metadata.currentNetPay, 9141.03);
assert.equal(summary.rowCount, expected.rowCount);
assert.equal(summary.grossParsed, expected.parsedGross);
assert.equal(gross.parsedGross, expected.parsedGross);
assert.equal(gross.printedGross, expected.parsedGross);
assert.equal(gross.grossParseDifference, 0);
assert.equal(gross.currentPeriodNonRetro, expected.currentPeriodNonRetro);
assert.equal(gross.retroGross, expected.retroGross);
assert.equal(gross.method, 'statement-pay-period');

for (const [code, expectedAmount] of Object.entries(expected.categories)) {
  const actual = summary.byPayCode.find((x) => x.payCode === code)?.netAmount;
  assert.equal(actual, expectedAmount, `${code}: expected ${expectedAmount}, got ${actual}`);
}

assert.equal(summary.unknownCodes.length, 0, `Unexpected unknown pay codes: ${summary.unknownCodes.map(x => x.payCode).join(', ')}`);

console.log(JSON.stringify({
  ok: true,
  payPeriod: `${metadata.payPeriodBegin} - ${metadata.payPeriodEnd}`,
  checkDate: metadata.checkDate,
  rows: summary.rowCount,
  parsedGross: summary.grossParsed,
  printedGross: metadata.currentGross,
  grossParseDifference: gross.grossParseDifference,
  currentPeriodNonRetro: gross.currentPeriodNonRetro,
  retroGross: gross.retroGross,
  payCodes: summary.byPayCode.length,
  payrollWeeks: summary.weeks.length,
  unknownCodes: summary.unknownCodes.map((x) => x.payCode),
}, null, 2));

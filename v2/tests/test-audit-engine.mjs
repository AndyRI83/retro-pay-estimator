import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseEarningsLines, summarizeRows } from '../js/retro-parser.mjs';
import { auditAllOt } from '../js/audit-engine.mjs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node test-audit-engine.mjs <pdftotext-layout-output>');

const rows = parseEarningsLines(fs.readFileSync(path, 'utf8').split(/\r?\n/));
const summary = summarizeRows(rows);
const audit = auditAllOt(summary.weeks);

// Test Case 001 actual payroll totals.
assert.equal(Number(audit.totals.actualOrdinaryRetro.toFixed(2)), 1201.28);
assert.equal(Number(audit.totals.actualHolidayOtRetro.toFixed(2)), 78.38);

// Independent PDF-only reconstruction should land within pennies across the entire period.
assert.ok(Math.abs(audit.totals.ordinaryDifference) < 0.10,
  `ordinary OT reconstruction differs by ${audit.totals.ordinaryDifference}`);
assert.ok(Math.abs(audit.totals.holidayOtDifference) < 0.10,
  `holiday OT reconstruction differs by ${audit.totals.holidayOtDifference}`);

const july20 = audit.weekly.find((x) => x.weekStart === '07/20/2026');
assert.ok(july20);
assert.equal(july20.correctedBaseRate, 87.15);
assert.equal(july20.priorBaseRate, 81.95);
assert.equal(july20.divisorHours, 25.5); // 12 personal hours correctly excluded

const presidents = audit.weekly.find((x) => x.weekStart === '02/15/2026');
assert.ok(presidents);
assert.equal(presidents.divisorHours, 37.75);

console.log(JSON.stringify({
  ok: true,
  auditedWeeks: audit.weekly.length,
  ordinaryOtHours: audit.totals.ordinaryOtHours,
  ordinaryActualRetro: Number(audit.totals.actualOrdinaryRetro.toFixed(2)),
  ordinaryExpectedRetro: Number(audit.totals.expectedOrdinaryRetro.toFixed(2)),
  ordinaryDifference: Number(audit.totals.ordinaryDifference.toFixed(2)),
  holidayOtHours: audit.totals.holidayOtHours,
  holidayOtActualRetro: Number(audit.totals.actualHolidayOtRetro.toFixed(2)),
  holidayOtExpectedRetro: Number(audit.totals.expectedHolidayOtRetro.toFixed(2)),
  holidayOtDifference: Number(audit.totals.holidayOtDifference.toFixed(2)),
  july20DivisorHours: july20.divisorHours,
  presidentsDayDivisorHours: presidents.divisorHours,
}, null, 2));

import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseEarningsLines, summarizeRows } from '../js/retro-parser.mjs';
import { parseStatementMetadata } from '../js/statement-meta.mjs';
import { analyzePendingDifferentials } from '../js/supplemental-differentials.mjs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node test-supplemental-differentials.mjs <Test Case 002 pdftotext-layout-output>');
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const metadata = parseStatementMetadata(lines);
const rows = parseEarningsLines(lines);
const summary = summarizeRows(rows);
const result = analyzePendingDifferentials(summary, metadata);

assert.equal(summary.byPayCode.find(x => x.payCode === 'Night Shift Differential').ytdHours, 928.5);
assert.equal(summary.byPayCode.find(x => x.payCode === 'Night Shift Differential').ytdAmount, 4642.50);
assert.equal(summary.byPayCode.find(x => x.payCode === 'Charge Pay').ytdHours, 192);
assert.equal(summary.byPayCode.find(x => x.payCode === 'Charge Pay').ytdAmount, 672.00);
assert.equal(result.direct2026Ytd, 512.25);
assert.ok(Math.abs(result.visibleOtRippleRaw - 6.7633169823) < 0.00001);
assert.equal(result.visible2026Subtotal, 519.01);
assert.equal(result.hasUnitemizedYtdHours, true);
const night=result.items.find(x=>x.payCode==='Night Shift Differential');
const charge=result.items.find(x=>x.payCode==='Charge Pay');
assert.equal(night.unitemizedYtdHours,236);
assert.equal(charge.unitemizedYtdHours,84);
console.log(JSON.stringify({ok:true,...result},null,2));

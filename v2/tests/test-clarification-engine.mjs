import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseEarningsLines, summarizeRows } from '../js/retro-parser.mjs';
import { parseStatementMetadata } from '../js/statement-meta.mjs';
import { buildClarificationQuestions, detectBaseRateTransitions } from '../js/clarification-engine.mjs';
import { analyzePendingDifferentials } from '../js/supplemental-differentials.mjs';

const path=process.argv[2];
if(!path) throw new Error('Usage: node test-clarification-engine.mjs <Test Case 002 text>');
const lines=fs.readFileSync(path,'utf8').split(/\r?\n/);
const metadata=parseStatementMetadata(lines);
const summary=summarizeRows(parseEarningsLines(lines));
const qs=buildClarificationQuestions(summary,metadata);
assert.ok(qs.some(q=>q.id==='pre2026-night-history'));
assert.ok(qs.some(q=>q.id==='pre2026-resource-history'));
assert.ok(!qs.some(q=>q.id==='rn-step-anniversary'));
const transitions=detectBaseRateTransitions(summary,metadata);
assert.ok(transitions.some(t=>t.weekStart==='08/24/2025' && Math.abs(t.fromPrior-64.2)<.001 && Math.abs(t.toPrior-67.43)<.001));
const unresolved=analyzePendingDifferentials(summary,metadata,{});
assert.equal(unresolved.directApril2025Forward,null);
assert.equal(unresolved.pre2026HistoryResolution,'unresolved');
const confirmedNone=analyzePendingDifferentials(summary,metadata,{
  'pre2026-night-history':'no',
  'pre2026-resource-history':'no',
});
assert.equal(confirmedNone.directApril2025Forward,512.25);
assert.equal(confirmedNone.pre2026HistoryResolution,'confirmed-none');
const yes=analyzePendingDifferentials(summary,metadata,{
  'pre2026-night-history':'yes',
  'pre2026-resource-history':'no',
});
assert.equal(yes.directApril2025Forward,null);
assert.equal(yes.pre2026HistoryResolution,'confirmed-older-hours-not-itemized');
console.log(JSON.stringify({ok:true,questions:qs,transition:transitions[0],confirmedNone},null,2));

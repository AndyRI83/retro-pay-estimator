import fs from 'node:fs';import assert from 'node:assert/strict';
import {parseEarningsLines,summarizeRows,identifyRetroGross} from '../js/retro-parser.mjs';
import {parseStatementMetadata} from '../js/statement-meta.mjs';
import {classifyRetroStatement} from '../js/statement-classifier.mjs';
import {auditDifferentialRetro} from '../js/differential-audit.mjs';
function parsed(path){const lines=fs.readFileSync(path,'utf8').split(/\r?\n/),metadata=parseStatementMetadata(lines),summary=summarizeRows(parseEarningsLines(lines)),gross=identifyRetroGross(summary,metadata);return{metadata,summary,gross}}
const p1=parsed(process.argv[2]||'/mnt/data/andy_part1.txt'),p2=parsed(process.argv[3]||'/mnt/data/part2.txt');
assert.equal(classifyRetroStatement(p1.summary,p1.metadata).type,'main-wage-retro');
assert.equal(classifyRetroStatement(p2.summary,p2.metadata).type,'differential-retro');
// Ordinary current statement: no historical repricing pattern.
const ordinary=summarizeRows(parseEarningsLines(['Regular Pay 09/13/2026 - 09/19/2026 36 87.15 3,137.40','Night Shift Differential 09/13/2026 - 09/19/2026 30 5.5 165.00']));
const ordinaryMeta={payPeriodBegin:'09/13/2026',payPeriodEnd:'09/19/2026',completeForGrossAudit:true};
assert.equal(classifyRetroStatement(ordinary,ordinaryMeta).type,'ordinary-or-unknown');
// A single old-rate differential row is not enough to call Part 2.
const oldOnly=summarizeRows(parseEarningsLines(['Night Shift Differential 04/06/2025 - 04/12/2025 -24 5 -120.00']));
assert.equal(classifyRetroStatement(oldOnly,ordinaryMeta).type,'ordinary-or-unknown');
// Direct differential mismatch is downgraded, not declared correct.
const bad=summarizeRows(parseEarningsLines(['Night Shift Differential 04/06/2025 - 04/12/2025 -24 5 -120.00','Night Shift Differential 04/06/2025 - 04/12/2025 24 5.5 131.00']));
const badAudit=auditDifferentialRetro(bad,{retroGross:11,grossParseDifference:0},ordinaryMeta);
assert.equal(badAudit.status,'partially-verified');
// Prospective current-rate checks.
const currentOld=summarizeRows(parseEarningsLines(['Night Shift Differential 04/06/2025 - 04/12/2025 -24 5 -120.00','Night Shift Differential 04/06/2025 - 04/12/2025 24 5.5 132.00','Night Shift Differential 09/13/2026 - 09/19/2026 20 5 100.00']));
const oldStatus=auditDifferentialRetro(currentOld,{retroGross:12,grossParseDifference:0},ordinaryMeta).prospective.items.find(x=>x.payCode==='Night Shift Differential').status;
assert.equal(oldStatus,'old-rate');
const currentNew=summarizeRows(parseEarningsLines(['Night Shift Differential 04/06/2025 - 04/12/2025 -24 5 -120.00','Night Shift Differential 04/06/2025 - 04/12/2025 24 5.5 132.00','Night Shift Differential 09/13/2026 - 09/19/2026 20 5.5 110.00']));
const newStatus=auditDifferentialRetro(currentNew,{retroGross:12,grossParseDifference:0},ordinaryMeta).prospective.items.find(x=>x.payCode==='Night Shift Differential').status;
assert.equal(newStatus,'new-rate');
// Combined pairing rule can distinguish order; duplicate types remain same classifier type and are therefore rejectable by UI pairing logic.
assert.notEqual(classifyRetroStatement(p1.summary,p1.metadata).type,classifyRetroStatement(p2.summary,p2.metadata).type);
// Truncated/corrupt Part 2 must fail closed when parsed earnings do not match printed gross.
const truncatedAudit=auditDifferentialRetro(p2.summary,{...p2.gross,grossParseDifference:-5.38},p2.metadata,{part1Summary:p1.summary});
assert.equal(truncatedAudit.status,'cannot-determine');
// Unknown call/callback lines remain fail-closed for a full verification.
const callRows=parseEarningsLines([
  'Night Shift Differential 04/06/2025 - 04/12/2025 -24 5 -120.00',
  'Night Shift Differential 04/06/2025 - 04/12/2025 24 5.5 132.00',
  'Call Pay 04/06/2025 - 04/12/2025 -2 4 -8.00',
  'Call Pay 04/06/2025 - 04/12/2025 2 4 8.00',
]);
const callSummary=summarizeRows(callRows);
const callAudit=auditDifferentialRetro(callSummary,{retroGross:12,grossParseDifference:0},ordinaryMeta);
assert.equal(callAudit.status,'partially-verified');
assert.deepEqual(callAudit.historicalUnknownCodes,['Call Pay']);
console.log(JSON.stringify({ok:true,checks:['Part 1 classification','Part 2 classification','ordinary statement rejection','single-rate false-positive guard','direct mismatch downgrade','old prospective rate detection','new prospective rate detection','combined type pairing','gross mismatch fail-closed','unknown call pay fail-closed']},null,2));

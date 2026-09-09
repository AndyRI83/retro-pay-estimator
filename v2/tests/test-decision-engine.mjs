import assert from 'node:assert/strict';
import { decideAuditResult } from '../js/decision-engine.mjs';

const metadata = { completeForGrossAudit: true };
const baseGross = { grossParseDifference: 0 };
const baseAudit = { materialUnknowns: [], componentFailures: [], unknown: [], payrollRetro: 1000, reconstructedRetro: 999.98 };

assert.equal(decideAuditResult({ metadata, gross: baseGross, fullAudit: baseAudit }).status, 'reconciled');
assert.equal(decideAuditResult({ metadata: { completeForGrossAudit: false }, gross: baseGross, fullAudit: baseAudit }).status, 'cannot-determine');
assert.equal(decideAuditResult({ metadata, gross: { grossParseDifference: 4.25 }, fullAudit: baseAudit }).status, 'cannot-determine');
assert.equal(decideAuditResult({ metadata, gross: baseGross, fullAudit: { ...baseAudit, materialUnknowns: [{ payCode: 'CALL PREM' }], unknown: [{ payCode: 'CALL PREM' }] } }).status, 'partially-verified');
assert.equal(decideAuditResult({ metadata, gross: baseGross, fullAudit: { ...baseAudit, componentFailures: [{ difference: 12.34, rule: 'base-linked-1x' }] } }).status, 'potential-discrepancy');
assert.equal(decideAuditResult({ metadata, gross: baseGross, fullAudit: { ...baseAudit, componentFailures: [{ difference: 12.34, rule: 'personal-ot-divisor-observed' }] } }).status, 'partially-verified');
assert.equal(decideAuditResult({ metadata, gross: baseGross, fullAudit: { ...baseAudit, unknown: [{ payCode: 'ZERO NET CODE' }] } }).status, 'reconciled-minor-unresolved');
console.log(JSON.stringify({ ok: true, scenarios: 7 }, null, 2));

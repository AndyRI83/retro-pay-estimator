import assert from 'node:assert/strict';
import { decideAuditResult } from '../js/decision-engine.mjs';
import { assessPaymentCompleteness } from '../js/completeness-engine.mjs';

const metadata={completeForGrossAudit:true};
const cleanGross={grossParseDifference:0};
const base={materialUnknowns:[],componentFailures:[],unknown:[],payrollRetro:1000,reconstructedRetro:1000};

const cases=[
  ['truncated statement / gross mismatch', decideAuditResult({metadata,gross:{grossParseDifference:-187.42},fullAudit:base}).status, 'cannot-determine'],
  ['unknown code in OT week', decideAuditResult({metadata,gross:cleanGross,fullAudit:{...base,materialUnknowns:[{payCode:'MYSTERY PREM'}],unknown:[{payCode:'MYSTERY PREM'}]}}).status, 'partially-verified'],
  ['validated-rule arithmetic failure', decideAuditResult({metadata,gross:cleanGross,fullAudit:{...base,componentFailures:[{difference:-50,rule:'base-linked-1x'}]}}).status, 'potential-discrepancy'],
  ['weak-rule arithmetic failure', decideAuditResult({metadata,gross:cleanGross,fullAudit:{...base,componentFailures:[{difference:-50,rule:'personal-ot-divisor-observed'}]}}).status, 'partially-verified'],
  ['pending later differential payment', assessPaymentCompleteness({summary:{byPayCode:[{payCode:'Night Shift Differential'}]},fullAudit:base}).status, 'known-additional-payment-pending'],
];
for(const [name,actual,expected] of cases) assert.equal(actual,expected,name);
console.log(JSON.stringify({ok:true,adversarialCases:cases.map(([name,actual])=>({name,status:actual}))},null,2));

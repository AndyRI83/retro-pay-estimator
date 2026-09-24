import assert from 'node:assert/strict';
import { assessPaymentCompleteness } from '../js/completeness-engine.mjs';

function summary(codes){ return { byPayCode: codes.map(payCode=>({payCode})) }; }
assert.equal(assessPaymentCompleteness({ summary: summary(['Regular Pay','Night Shift Differential']), fullAudit:{materialUnknowns:[]} }).status,'known-additional-payment-separate');
assert.equal(assessPaymentCompleteness({ summary: summary(['Regular Pay','Charge Pay']), fullAudit:{materialUnknowns:[]} }).status,'known-additional-payment-separate');
assert.equal(assessPaymentCompleteness({ summary: summary(['Regular Pay']), fullAudit:{materialUnknowns:[{payCode:'X'}]} }).status,'completeness-cannot-be-established');
assert.equal(assessPaymentCompleteness({ summary: summary(['Regular Pay']), fullAudit:{materialUnknowns:[]} }).status,'completeness-not-yet-established');
console.log(JSON.stringify({ok:true,scenarios:4},null,2));

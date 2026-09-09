import assert from 'node:assert/strict';
import { friendlyPayCode, concernOptions, concernResponse } from '../js/line-item-help.mjs';
assert.equal(friendlyPayCode('Charge Pay'),'Resource / Flow');
assert.ok(concernOptions('Overtime Pay').some(x=>x.id==='why-rate-changes'));
assert.match(concernResponse('Overtime Pay','why-rate-changes').body,/week to week/);
assert.match(concernResponse('Charge Pay','missing').body,/earlier pay stub|another record/);
console.log(JSON.stringify({ok:true},null,2));

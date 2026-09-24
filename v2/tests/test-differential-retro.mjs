import assert from 'node:assert/strict';
import { auditDifferentialRetro, detectDifferentialRetro } from '../js/differential-audit.mjs';

function row(payCode, weekStart, weekEnd, hours, displayedRate, amount) {
  return { payCode, weekStart, weekEnd, hours, displayedRate, amount };
}
function summary(rows) {
  const weeks = new Map();
  for (const r of rows) {
    const key = `${r.weekStart}|${r.weekEnd}`;
    if (!weeks.has(key)) weeks.set(key,{weekStart:r.weekStart,weekEnd:r.weekEnd,rows:[]});
    weeks.get(key).rows.push(r);
  }
  return { weeks:[...weeks.values()] };
}

const meta={payPeriodBegin:'09/13/2026',payPeriodEnd:'09/19/2026',completeForGrossAudit:true};
const current=[row('Workers Compensation','09/13/2026','09/19/2026',0,0,2951.24)];
const part2Rows=[
  ...current,
  row('Charge Pay','04/06/2025','04/12/2025',-20,3.5,-70.00),
  row('Charge Pay','04/06/2025','04/12/2025',20,3.75,75.00),
  row('Night Shift Differential','04/06/2025','04/12/2025',-30,5,-150.00),
  row('Night Shift Differential','04/06/2025','04/12/2025',30,5.5,165.00),
  // Cleanup rows at both rates must net to zero rather than creating fake retro.
  row('Night Shift Differential','07/26/2026','08/01/2026',12,5.5,66.00),
  row('Night Shift Differential','07/26/2026','08/01/2026',-12,5.5,-66.00),
  row('Night Shift Differential','07/26/2026','08/01/2026',12,5,60.00),
  row('Night Shift Differential','07/26/2026','08/01/2026',-12,5,-60.00),
  row('Overtime Pay','04/06/2025','04/12/2025',4,101.25,405.00),
  row('Overtime Pay','04/06/2025','04/12/2025',-4,20,-404.00),
];
const part2=summary(part2Rows);
assert.equal(detectDifferentialRetro(part2,meta).detected,true);
const standalone=auditDifferentialRetro(part2,{retroGross:21.00,grossParseDifference:0},meta);
assert.equal(standalone.status,'direct-verified');
assert.equal(standalone.directExpected,20.00);
assert.equal(standalone.directActual,20.00);
assert.equal(standalone.observedOtRipple,1.00);
assert.equal(standalone.accountedRetro,21.00);

// Part 1 supplies the historical divisor used to independently reconstruct OT ripple.
const part1=summary([
  row('Regular Pay','04/06/2025','04/12/2025',-36,64.2,-2311.20),
  row('Regular Pay','04/06/2025','04/12/2025',36,66.29,2386.44),
  row('Overtime Pay','04/06/2025','04/12/2025',4,101,404.00),
]);
// With a 40-hour qualifying divisor, $20 of added premium creates a $0.25 OT-rate
// increase, yielding exactly $1 across four OT hours.
const combined=auditDifferentialRetro(part2,{retroGross:21.00,grossParseDifference:0},meta,{part1Summary:part1});
assert.equal(combined.ordinaryOtExpected,1.00);
assert.equal(combined.reconstructedRetro,21.00);
assert.equal(combined.difference,0.00);
assert.equal(combined.status,'reconciled');


// Part 2 must fail closed if the extracted earnings do not add back to Workday's printed gross.
const grossMismatch=auditDifferentialRetro(part2,{retroGross:21.00,grossParseDifference:-5.38},meta,{part1Summary:part1});
assert.equal(grossMismatch.status,'cannot-determine');
assert.equal(grossMismatch.reconstructedRetro,null);
assert.equal(grossMismatch.difference,null);

// Old/new hours must pair within each correction week. Matching arithmetic alone is not enough.
const mismatchedHours=summary([
  ...current,
  row('Night Shift Differential','04/06/2025','04/12/2025',-30,5,-150.00),
  row('Night Shift Differential','04/06/2025','04/12/2025',29,5.5,159.50),
]);
const mismatchedHoursAudit=auditDifferentialRetro(mismatchedHours,{retroGross:9.50,grossParseDifference:0},meta);
assert.equal(mismatchedHoursAudit.status,'partially-verified');
assert.equal(mismatchedHoursAudit.pairingIssues.length,1);

// Call/callback remains intentionally unresolved. If a historical call-pay line appears,
// Part 2 must not be declared fully verified even when the statement total reconciles.
const withCall=summary(part2Rows.map((x)=>({...x,recognition:'known'})).concat([
  {...row('Call Pay','04/06/2025','04/12/2025',-2,4,-8),recognition:'unknown'},
  {...row('Call Pay','04/06/2025','04/12/2025',2,4,8),recognition:'unknown'},
]));
const callAudit=auditDifferentialRetro(withCall,{retroGross:21.00,grossParseDifference:0},meta,{part1Summary:part1});
assert.equal(callAudit.status,'partially-verified');
assert.deepEqual(callAudit.historicalUnknownCodes,['Call Pay']);
console.log(JSON.stringify({ok:true,checks:['Part 2 detection','direct differential repricing','zero-net cleanup rows','standalone OT identification','combined OT reconstruction','gross mismatch fail-closed','old/new hour pairing','unknown call pay fail-closed']},null,2));

import assert from 'node:assert/strict';
import { parseStatementExtras, findTax } from '../js/statement-extras.mjs';

const lines = [
  'Baylor Time 0 200.06 17,943.10     OASDI 249.17 10,422.40',
  'Evening Shift 0 319.75 959.25     Federal Withholding 448.38 21,215.45',
  'Dental 23.25 906.75 AD&D 1.81 72.28',
  'Medical 320.96 12,517.44 Dependent Life 0.18 7.02',
  'Vision 3.48 135.72 Long Term Disability 12.04 479.44',
  'Supplemental Life 8.59 341.90',
  'AD&D - 03/30/2025 - 04/05/2025 0.06',
  'AD&D - 03/30/2025 - 04/05/2025 0.06',
  'Long Term Disability - 03/30/2025 - 04/05/2025 0.37',
  'Supplemental Life - 03/30/2025 - 04/05/2025 0.26',
];
const x = parseStatementExtras(lines,{currentPostTaxDeductions:23.37});
assert.equal(findTax(x,'OASDI').amount,249.17);
assert.equal(findTax(x,'Federal Withholding').amount,448.38);
assert.equal(x.postTaxCurrent.find(r=>r.description==='AD&D').amount,1.81);
assert.equal(x.postTaxCurrent.find(r=>r.description==='Long Term Disability').amount,12.04);
assert.equal(x.postTaxHistoricalGrouped.find(r=>r.description==='AD&D').count,2);
assert.equal(x.postTaxHistoricalGrouped.find(r=>r.description==='AD&D').total,0.12);
assert.equal(x.postTaxHistoricalTotal,0.75);
assert.equal(x.postTaxReconciliationDifference,0);
console.log(JSON.stringify({ok:true,checks:['side-by-side tax rows','side-by-side current deductions','dated benefit adjustments','duplicate dated rows preserved']},null,2));

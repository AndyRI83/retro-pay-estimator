import assert from 'node:assert/strict';
import { parseEarningsLines, summarizeRows } from '../js/retro-parser.mjs';

const lines = [
  'Bereavement 04/06/2025 - 04/12/2025 -36 64.2 -2,311.20',
  'Bereavement 04/06/2025 - 04/12/2025 36 66.29 2,386.44',
  'Scheduled Personal 10/12/2025 - 10/18/2025 -12 67.43 -809.16',
  'Scheduled Personal 10/12/2025 - 10/18/2025 12 69.62 835.44',
  'Certification Bonus 11/16/2025 - 11/22/2025 -44 500 -500.00',
  'Certification Bonus 11/16/2025 - 11/22/2025 36 500 500.00',
];

const rows = parseEarningsLines(lines);
const summary = summarizeRows(rows);
assert.equal(rows.length, 6);
assert.deepEqual(summary.unknownCodes, []);
assert.equal(summary.limitedCodes.length, 0);
assert.equal(summary.byPayCode.find(x => x.payCode === 'Bereavement').netAmount, 75.24);
assert.equal(summary.byPayCode.find(x => x.payCode === 'Scheduled Personal').netAmount, 26.28);
assert.equal(summary.byPayCode.find(x => x.payCode === 'Certification Bonus').netAmount, 0);
console.log(JSON.stringify({ok:true, recognized:['Bereavement','Scheduled Personal','Certification Bonus'], limited:[]}, null, 2));

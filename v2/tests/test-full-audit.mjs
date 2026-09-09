import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseEarningsLines, summarizeRows, identifyRetroGross } from '../js/retro-parser.mjs';
import { parseStatementMetadata } from '../js/statement-meta.mjs';
import { auditFullRetro } from '../js/full-audit.mjs';
import { decideAuditResult } from '../js/decision-engine.mjs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node test-full-audit.mjs <pdftotext-layout-output>');

const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const metadata = parseStatementMetadata(lines);
const rows = parseEarningsLines(lines);
const summary = summarizeRows(rows);
const gross = identifyRetroGross(summary, metadata);
const audit = auditFullRetro(summary, gross, metadata);
const decision = decideAuditResult({ metadata, gross, fullAudit: audit });

assert.equal(gross.retroGross, 12262.24);
assert.ok(Math.abs(audit.reconstructedRetro - 12262.174295) < 0.0001,
  `Expected full reconstruction 12262.174295, got ${audit.reconstructedRetro}`);
assert.ok(Math.abs(audit.difference - 0.065705) < 0.0001,
  `Expected total difference 0.065705, got ${audit.difference}`);
assert.equal(audit.materialUnknowns.length, 0);
assert.equal(audit.componentFailures.length, 0,
  `Unexpected component failures: ${audit.componentFailures.map(x => `${x.weekStart} ${x.payCode} ${x.difference}`).join('; ')}`);
assert.equal(decision.status, 'reconciled');

const regular = audit.directComponents.filter((x) => x.payCode === 'Regular Pay');
const regularActual = regular.reduce((s,x)=>s+x.actual,0);
const regularExpected = regular.reduce((s,x)=>s+x.expected,0);
assert.equal(Number(regularActual.toFixed(2)), 7185.11);
assert.equal(Number(regularExpected.toFixed(2)), 7185.10);

console.log(JSON.stringify({
  ok: true,
  status: decision.status,
  title: decision.title,
  payrollRetro: audit.payrollRetro,
  independentlyReconstructed: Number(audit.reconstructedRetro.toFixed(2)),
  totalDifference: Number(audit.difference.toFixed(2)),
  calculationComponents: audit.components.length,
  componentFailures: audit.componentFailures.length,
  materialUnknowns: audit.materialUnknowns.length,
}, null, 2));

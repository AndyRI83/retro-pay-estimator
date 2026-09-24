import { friendlyPayCode } from './line-item-help.mjs';
import { esc, money, reportCss, actionBar, actionScript, heroClass, taxSection } from './report-ui.mjs';

function categoryRows(fullAudit) {
  const map = new Map();
  for (const item of fullAudit?.components || []) {
    if (!map.has(item.payCode)) map.set(item.payCode,{actual:0,expected:0,ok:true});
    const x=map.get(item.payCode);x.actual+=item.actual;x.expected+=item.expected;x.ok=x.ok&&item.reconciled;
  }
  for (const item of fullAudit?.unknown || []) {
    if (!map.has(item.payCode)) map.set(item.payCode,{actual:item.netRetroAmount,expected:null,ok:false,unknown:true});
  }
  return [...map.entries()].map(([payCode,x])=>({payCode,...x})).sort((a,b)=>Math.abs(b.actual)-Math.abs(a.actual));
}

export function buildPart1ReportHTML({ metadata, result, fullAudit, supplemental, extras, mode='summary' }) {
  const full = mode === 'full';
  const status = result?.calculation?.status || 'partially-verified';
  const rows = categoryRows(fullAudit);
  const payTable = full ? `<section class="section"><h2>Pay-by-pay results</h2><div class="tablewrap"><table><thead><tr><th>Pay type</th><th class="num">Workday</th><th class="num">Independent</th><th>Result</th></tr></thead><tbody>${rows.map((x)=>`<tr><td>${esc(friendlyPayCode(x.payCode))}</td><td class="num">${money(x.actual)}</td><td class="num">${x.expected==null?'—':money(x.expected)}</td><td>${x.expected==null||!x.ok?'<span class="status-warn">?</span>':'<span class="status-good">✓</span>'}</td></tr>`).join('')}</tbody></table></div></section>` : '';
  const weekly = full ? `<section class="section"><h2>Detailed weekly calculations</h2><div class="tablewrap"><table><thead><tr><th>Week</th><th>Pay type</th><th class="num">Workday</th><th class="num">Independent</th><th class="num">Difference</th></tr></thead><tbody>${(fullAudit?.components||[]).map((x)=>`<tr><td>${esc(x.weekStart)}</td><td>${esc(friendlyPayCode(x.payCode))}</td><td class="num">${money(x.actual)}</td><td class="num">${money(x.expected)}</td><td class="num">${money(x.difference)}</td></tr>`).join('')}</tbody></table></div></section>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#063d75"><title>Main Retro Report</title><style>${reportCss()}</style></head><body><main class="report">${actionBar()}<article class="sheet"><header><h1>Main retro payment</h1><div class="kicker">Workday check ${esc(metadata?.checkDate||'date unknown')} · ${full?'Detailed report':'Summary'}</div></header><div class="hero ${heroClass(status)}"><h2>${esc(result?.calculation?.title||'Main retro checked')}</h2><p>${esc(result?.calculation?.explanation||'')}</p></div>
  <div class="numbers"><div class="number"><span>Workday main retro</span><b>${money(fullAudit?.payrollRetro)}</b></div><div class="number"><span>Independent check</span><b>${money(fullAudit?.reconstructedRetro)}</b></div><div class="number"><span>Difference</span><b>${money(Math.abs(fullAudit?.difference||0))}</b></div></div>
  <section class="section"><h2>What changed</h2><div class="card plainsteps"><div class="plainstep"><div class="dot">1</div><div><b>The main wage increases were applied.</b><div class="small muted">The checker rebuilds pay that changes with the negotiated wage scale.</div></div></div><div class="plainstep"><div class="dot">2</div><div><b>Overtime was recalculated for the wage increase.</b><div class="small muted">Night and Resource were still at their old fixed rates on this payment. Their later increases, plus the extra overtime created by those increases, were handled on the later Night & Resource retro payment.</div></div></div></div></section>
  ${taxSection(extras)}${payTable}${weekly}
  <section class="section"><div class="callout info small"><b>Scope:</b> this report checks the amounts supported by the Workday statement. It cannot prove that every eligible hour or assignment was entered correctly before payroll ran.</div></section><footer class="reportfooter">Retro Pay Checker · Created by Andrew Raposo · Independent community tool · Not affiliated with UMass Memorial or MNA<br>Calculation model 2026.09.23</footer></article></main>${actionScript({filename:`Retro-Pay-Checker-Main-Retro-${mode}.html`,shareText:'My Retro Pay Checker main retro report',eventPrefix:`main-retro-report-${mode}`})}</body></html>`;
}

import { friendlyPayCode } from './line-item-help.mjs';

function esc(value) {
  return String(value ?? '').replace(/[&<>\"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}
function money(value) {
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value||0));
}
function categoryRows(fullAudit) {
  const map = new Map();
  for (const item of fullAudit.components || []) {
    if (!map.has(item.payCode)) map.set(item.payCode,{actual:0,expected:0,failed:false});
    const x=map.get(item.payCode); x.actual+=item.actual; x.expected+=item.expected; if(!item.reconciled)x.failed=true;
  }
  for(const item of fullAudit.unknown||[]){
    if(!map.has(item.payCode))map.set(item.payCode,{actual:item.netRetroAmount,expected:null,failed:false,unknown:true});
  }
  return [...map.entries()].map(([payCode,x])=>({payCode,...x,difference:x.expected==null?null:x.actual-x.expected})).sort((a,b)=>Math.abs(b.actual)-Math.abs(a.actual));
}
function clarificationText(c){
  const labels={yes:'Yes',no:'No',unsure:"I'm not sure"};
  return labels[c.answer]||c.answer||'';
}

export function buildPersonalReportHTML({metadata,result,fullAudit,supplemental,clarifications=[],observations=[],mode='full'}) {
  const rows=categoryRows(fullAudit);
  const pending=supplemental?.status==='pending-confirmed';
  const full=mode==='full';
  const answered=(clarifications||[]).filter(x=>x.answered);
  const direct=supplemental?.directApril2025Forward ?? supplemental?.direct2026Ytd;
  return `<!doctype html><html><head><meta charset="utf-8"><title>RetroCalc Personal Report</title><style>
  body{font-family:Arial,sans-serif;color:#17212b;max-width:900px;margin:32px auto;padding:0 22px;line-height:1.45}h1,h2,h3{color:#063d75}h1{margin-bottom:0}.sub{color:#607080}.box{border:1px solid #d7e0e7;border-radius:12px;padding:14px;margin:14px 0}.ok{border-left:5px solid #16844c}.pending{border-left:5px solid #6b4ea0}.warn{border-left:5px solid #d69200}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px;border-bottom:1px solid #d7e0e7;text-align:left}.num{text-align:right}.small{font-size:12px;color:#607080}.formula{font-family:Georgia,serif;background:#f4f7f9;padding:9px;border-radius:8px}.pagebreak{break-before:page}.match{color:#16844c;font-weight:bold}.needs{color:#8a5a00;font-weight:bold}@media print{button{display:none}body{margin:0;max-width:none}.box{break-inside:avoid}}</style></head><body>
  <h1>RetroCalc Personal Retro Report</h1><p class="sub">Statement check date: ${esc(metadata?.checkDate||'Unknown')} | Created by Andrew Raposo | Independent community resource</p>
  <div class="box ok"><h2>Bottom line</h2><p><strong>${esc(result.calculation.title)}</strong></p><p>Workday retro pay: <strong>${money(fullAudit.payrollRetro)}</strong><br>RetroCalc: <strong>${money(fullAudit.reconstructedRetro)}</strong><br>Difference: <strong>${money(fullAudit.difference)}</strong></p><p>${esc(result.calculation.explanation)}</p></div>
  ${pending?`<div class="box pending"><h2>More retro pay is still coming</h2><p><strong>Night and Resource / Flow increases are being paid separately on the next check.</strong></p>${direct!=null?`<p>Direct Night / Resource increase currently supported by this statement: <strong>${money(direct)}</strong>.</p>`:''}${supplemental.visibleOtRipple!=null?`<p>Related OT increase RetroCalc can already identify from weeks shown in detail: <strong>${money(supplemental.visibleOtRipple)}</strong>.</p>`:''}<p class="small">${supplemental.pre2026HistoryResolution==='confirmed-none'?'You confirmed that you did not work Night or Resource / Flow between April and December 2025. The direct 2026 amount above therefore covers the direct differential increase for the full retro period shown here.':supplemental.pre2026HistoryResolution==='confirmed-older-hours-not-itemized'?'You confirmed that you did work Night or Resource / Flow in 2025. Those 2025 hours are not itemized on this statement, so RetroCalc will not guess at the final supplemental amount. When the separate payment arrives, upload that statement and RetroCalc can check it directly.':'This statement first shows Night / Resource pay in 2026. If you also worked those hours in 2025, the final supplemental amount will include additional pay not visible here.'}${supplemental.hasUnitemizedYtdHours?' The 2026 year-to-date totals are also larger than the week-by-week differential rows printed on this statement, so the full related OT adjustment cannot be reconstructed yet.':''}</p></div>`:''}
  ${observations?.length?`<div class="box"><h2>Things RetroCalc noticed</h2>${observations.map(o=>`<p><strong>${esc(o.title)}</strong><br>${esc(o.body)}</p>`).join('')}</div>`:''}
  ${answered.length?`<div class="box"><h2>Answers you gave RetroCalc</h2>${answered.map(c=>`<p><strong>${esc(c.prompt)}</strong><br>${esc(clarificationText(c))}</p>`).join('')}</div>`:''}
  <h2>Pay-by-pay breakdown</h2><table><thead><tr><th>Pay type</th><th class="num">Workday paid</th><th class="num">RetroCalc</th><th class="num">Difference</th><th>Result</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(friendlyPayCode(r.payCode))}</td><td class="num">${money(r.actual)}</td><td class="num">${r.expected==null?'—':money(r.expected)}</td><td class="num">${r.difference==null?'—':money(r.difference)}</td><td class="${r.failed?'needs':'match'}">${r.expected==null?'Not enough information':r.failed?'Needs a closer look':'Matches'}</td></tr>`).join('')}</tbody></table>
  <div class="box warn"><h2>What this report does not prove</h2><p>RetroCalc checks the hours and pay shown on this Workday statement. This PDF alone cannot prove that every hour you actually worked was recorded correctly in the first place. Taxes and insurance deductions are not part of the current gross-pay check.</p></div>
  ${full?`<div class="pagebreak"></div><h2>Full audit details</h2><h3>Why your OT rate changes</h3><p>Your OT rate can change from week to week. Extra pay such as Baylor, Night, Weekend, Resource / Flow, Preceptor, or certain holiday pay can raise the OT rate for that week.</p><div class="formula">Weekly regular rate = Base pay + (extra pay included in the OT calculation / hours counted in that calculation)<br>OT rate = Base pay + 0.5 × weekly regular rate</div><p>Separate calculations checked: <strong>${result.coverage.calculationComponentCount}</strong>. Calculations needing a closer look: <strong>${result.coverage.failedComponentCount}</strong>.</p><h3>Payroll / union review</h3><p>${result.calculation.status==='potential-discrepancy'?'A supported difference remains. The detailed report should list the affected weeks and pay rules before a correction request is submitted.':'The retro pay included on this statement does not support a correction request by itself. Keep this report and check the separate Night / Resource payment when it arrives.'}</p>`:''}
  <p class="small">RetroCalc Beta. If something cannot be checked safely from the information available, the tool should say so instead of guessing.</p></body></html>`;
}

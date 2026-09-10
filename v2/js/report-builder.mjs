import { friendlyPayCode } from './line-item-help.mjs';

function esc(value){return String(value??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
function money(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value||0));}
function categoryRows(fullAudit){
  const map=new Map();
  for(const item of fullAudit.components||[]){
    if(!map.has(item.payCode))map.set(item.payCode,{actual:0,expected:0,failed:false});
    const x=map.get(item.payCode);x.actual+=item.actual;x.expected+=item.expected;if(!item.reconciled)x.failed=true;
  }
  for(const item of fullAudit.unknown||[]){if(!map.has(item.payCode))map.set(item.payCode,{actual:item.netRetroAmount,expected:null,failed:false,unknown:true});}
  return [...map.entries()].map(([payCode,x])=>({payCode,...x,difference:x.expected==null?null:x.actual-x.expected})).sort((a,b)=>Math.abs(b.actual)-Math.abs(a.actual));
}
function reportState(status){
  if(status==='reconciled'||status==='reconciled-minor-unresolved')return {symbol:'✓',title:'The amount on this statement looks right',cls:'good'};
  if(status==='potential-discrepancy')return {symbol:'!',title:'One part needs a closer look',cls:'review'};
  if(status==='cannot-determine')return {symbol:'×',title:"We couldn't safely check this statement",cls:'stop'};
  return {symbol:'?',title:"We couldn't fully check this statement",cls:'partial'};
}

export function buildPersonalReportHTML({metadata,result,fullAudit,supplemental,observations=[],mode='full'}){
  const rows=categoryRows(fullAudit),full=mode==='full',state=reportState(result.calculation.status),pending=supplemental?.status==='pending-confirmed';
  const minimum=pending&&supplemental?.direct2026Ytd!=null?supplemental.direct2026Ytd:null;
  const calcRows=(fullAudit.components||[]).map(x=>`<tr><td>${esc(x.weekStart)}</td><td>${esc(friendlyPayCode(x.payCode))}</td><td class="num">${money(x.actual)}</td><td class="num">${money(x.expected)}</td><td class="num">${money(x.difference)}</td><td>${x.reconciled?'✓':'!'}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Retro Pay Checker Report</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#17212b;max-width:900px;margin:24px auto;padding:0 20px;line-height:1.38}h1,h2{color:#063d75}.top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:2px solid #d8e1e8;padding-bottom:9px}.sub{color:#667788;font-size:11px}.hero{display:flex;gap:12px;align-items:center;border-radius:14px;padding:14px;margin:13px 0}.hero .sym{font-size:30px;font-weight:bold}.good{background:#eaf8f0;color:#0b6a3b}.partial{background:#fff6dd;color:#7b4b00}.review{background:#fff1e8;color:#8a3700}.stop{background:#fff0ef;color:#8f1f17}.hero h2{margin:0;color:inherit;font-size:20px}.hero p{margin:3px 0 0;font-size:12px}.numbers{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.n{border:1px solid #d8e1e8;border-radius:10px;padding:10px;text-align:center}.n span{display:block;color:#667788;font-size:9px;font-weight:bold;text-transform:uppercase}.n b{display:block;color:#063d75;font-size:19px;margin-top:3px}.pending{margin-top:10px;border-left:5px solid #6f4ca1;background:#f3eefb;border-radius:10px;padding:10px}.pending .min{font-size:18px;color:#50377a;font-weight:bold;margin-top:4px}.limit{margin-top:10px;background:#f7f9fb;border-radius:10px;padding:9px;font-size:11px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}th,td{padding:6px 5px;border-bottom:1px solid #dfe6eb;text-align:left}.num{text-align:right}.ok{color:#16844c;font-weight:bold}.warn{color:#a15c00;font-weight:bold}.page{break-before:page}.small{font-size:10px;color:#667788}.summary-note{margin-top:14px;font-size:11px}.section{margin-top:18px}@media print{body{max-width:none;margin:0}.hero,.pending,.n{break-inside:avoid}.summary-only{break-inside:avoid}}
  </style></head><body>
  <div class="top"><div><h1 style="margin:0;font-size:23px">Retro Pay Checker</h1><div class="sub">${full?'Detailed report':'1-page summary'} · Workday check ${esc(metadata?.checkDate||'date unknown')} · Built by Andrew Raposo</div></div><div class="sub">Independent community tool</div></div>
  <div class="hero ${state.cls}"><div class="sym">${state.symbol}</div><div><h2>${state.title}</h2><p>${esc(result.calculation.explanation)}</p></div></div>
  <div class="numbers"><div class="n"><span>Workday paid</span><b>${money(fullAudit.payrollRetro)}</b></div><div class="n"><span>Independent check</span><b>${money(fullAudit.reconstructedRetro)}</b></div><div class="n"><span>Difference</span><b>${money(Math.abs(fullAudit.difference))}</b></div></div>
  ${pending?`<div class="pending"><b>◷ Night / Resource retro is separate.</b>${minimum!=null?`<div class="min">This statement shows at least ${money(minimum)} of the separate Night / Resource increase.</div>`:''}<div class="small" style="color:#5d5570;margin-top:4px">The payment date is not confirmed. The final amount may be higher because this statement does not show all 2025 differential hours or every related OT detail.</div></div>`:''}
  <div class="limit"><b>What this report means:</b> it checks the amount calculated from the hours and pay shown on this Workday statement. It cannot prove that every hour or differential was entered correctly before payroll ran the retro.</div>
  ${full?`<div class="section"><h2>Pay-by-pay results</h2><table><thead><tr><th>Pay type</th><th class="num">Workday</th><th class="num">Independent check</th><th class="num">Difference</th><th>Result</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(friendlyPayCode(r.payCode))}</td><td class="num">${money(r.actual)}</td><td class="num">${r.expected==null?'—':money(r.expected)}</td><td class="num">${r.difference==null?'—':money(r.difference)}</td><td class="${r.expected==null||r.failed?'warn':'ok'}">${r.expected==null?'?':r.failed?'!':'✓'}</td></tr>`).join('')}</tbody></table></div>${observations?.length?`<div class="section"><h2>Things we noticed</h2>${observations.map(o=>`<p style="font-size:11px"><b>${esc(o.title)}</b><br>${esc(o.body)}</p>`).join('')}</div>`:''}<div class="page"></div><h2>Every weekly calculation</h2><p class="small">This section is intentionally detailed. It is here for anyone who wants to verify the reconstruction line by line.</p><table><thead><tr><th>Week</th><th>Pay type</th><th class="num">Workday</th><th class="num">Independent check</th><th class="num">Difference</th><th></th></tr></thead><tbody>${calcRows}</tbody></table>`:`<p class="summary-note"><b>Need the details?</b> The detailed report adds the pay-by-pay breakdown, notes about unusual items, and every weekly calculation.</p>`}
  <p class="small" style="margin-top:18px">Independent community tool. Not affiliated with UMass Memorial or MNA. A flagged difference is not, by itself, proof of underpayment.</p>
  </body></html>`;
}

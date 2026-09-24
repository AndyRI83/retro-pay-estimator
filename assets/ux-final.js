(()=>{
const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

function injectCss(){
 const css=`
 .ux-quickfacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 12px}.ux-fact{background:var(--blue-soft);border-radius:11px;padding:10px;text-align:center}.ux-fact .ux-icon{font-size:1.15rem}.ux-fact b{display:block;color:var(--navy);font-size:.82rem;margin-top:3px}.ux-fact span{display:block;color:var(--muted);font-size:.7rem;margin-top:2px}.ux-rategrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0 11px}.ux-rate{border:1px solid var(--line);background:#fff;border-radius:12px;padding:11px;text-align:center}.ux-rate span{display:block;color:var(--muted);font-size:.69rem;font-weight:800}.ux-rate strong{display:block;color:var(--navy);font-size:1.12rem;margin-top:3px}.ux-rate strong em{font-style:normal;color:var(--green)}
 .ux-crosslink{margin-top:10px;border:1px solid #c8d9e5;background:#f8fbfd;border-radius:11px;padding:10px 11px;font-size:.8rem}.ux-crosslink a{font-weight:900;text-decoration:none}.ux-compact-details{margin-top:8px}.ux-compact-details>summary{font-size:.8rem}.ux-hide{display:none!important}
 .ux-landing{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:11px}.ux-card{display:flex;flex-direction:column;gap:7px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:15px;text-decoration:none;color:var(--ink);box-shadow:0 3px 12px rgba(0,0,0,.02)}.ux-card.best{border-color:#b9d3e5;background:linear-gradient(180deg,#fff,#f5fbff)}.ux-card .ux-date{display:inline-block;align-self:flex-start;border-radius:99px;background:var(--blue-soft);color:var(--navy);font-size:.7rem;font-weight:900;padding:4px 8px}.ux-card h2{margin:0;color:var(--navy);font-size:1.04rem}.ux-card p{margin:0;color:var(--muted);font-size:.78rem}.ux-card .ux-go{margin-top:auto;color:var(--blue);font-size:.78rem;font-weight:900}.ux-best{align-self:flex-start;border-radius:99px;background:var(--green-bg);color:var(--green);font-size:.63rem;font-weight:900;padding:4px 8px}
 .ux-minimum{margin-top:9px;background:var(--purple-bg);border:1px solid #d7caea;border-left:5px solid var(--purple);border-radius:13px;padding:11px 12px;color:#503675}.ux-minimum .ux-amount{font-size:1.38rem;font-weight:950;margin:3px 0}.ux-minimum .ux-label{font-size:.7rem;font-weight:900;text-transform:uppercase}.ux-minimum .ux-explain{font-size:.77rem;line-height:1.35}.ux-checklist{display:grid;gap:6px;margin-top:8px}.ux-checkrow{display:flex;gap:8px;align-items:center;padding:7px 8px;border-radius:9px;background:#f8fbfd;font-size:.8rem}.ux-checkrow b{color:var(--navy)}
 .ux-taxcompare{width:100%;border-collapse:collapse;font-size:.78rem}.ux-taxcompare th,.ux-taxcompare td{padding:7px 6px;border-bottom:1px solid #e5ecef}.ux-taxcompare th{color:var(--muted);font-size:.65rem;text-transform:uppercase}.ux-taxcompare .num{text-align:right}.ux-deductioncopy{font-size:.77rem;color:var(--muted)}.ux-deductiontable{width:100%;border-collapse:collapse;font-size:.78rem}.ux-deductiontable th,.ux-deductiontable td{padding:8px 6px;border-bottom:1px solid #e5ecef;vertical-align:top}.ux-deductiontable th{color:var(--muted);font-size:.65rem;text-transform:uppercase}.ux-deductiontable .num{text-align:right;font-variant-numeric:tabular-nums}.ux-adjcount{display:block;color:var(--muted);font-size:.63rem;margin-top:1px}.ux-deductiontotals{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.ux-deductiontotal{background:#f7f9fb;border-radius:9px;padding:8px;text-align:center}.ux-deductiontotal span{display:block;color:var(--muted);font-size:.64rem}.ux-deductiontotal b{display:block;color:var(--navy);margin-top:2px}
 @media(max-width:680px){.ux-landing,.ux-quickfacts{grid-template-columns:1fr}.ux-rategrid{grid-template-columns:1fr 1fr}.ux-card{padding:13px}.ux-quickfacts{gap:6px}.ux-fact{display:grid;grid-template-columns:28px 1fr;text-align:left;align-items:center;padding:8px 10px}.ux-fact .ux-icon{grid-row:1/3}.ux-fact b,.ux-fact span{margin:0}.ux-fact span:empty{display:none}.ux-rate strong{font-size:1rem}}
 `;
 const style=document.createElement('style');style.id='uxFinalCss';style.textContent=css;document.head.appendChild(style);
}

function textReplace(root=document){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const replacements=[
  [/\bPart 1\b/g,'9/3 main retro'],[/\bPart 2\b/g,'9/24 Night & Resource retro'],
  [/What Workday did/g,'What changed'],[/What part 1 did/gi,'What this payment covered'],
  [/What Part 1 did/g,'What this payment covered'],[/Why Part 1(?:'|’)?s (?:earlier )?number was smaller/gi,"Why the 9/3 statement couldn't show the full later payment"]
 ];
 for(const n of nodes){if(n.parentElement?.closest('script,style'))continue;let t=n.nodeValue;for(const [re,to] of replacements)t=t.replace(re,to);if(t!==n.nodeValue)n.nodeValue=t;}
}

function compactLanding(){
 if(!['','index.html'].includes(path))return;
 const app=$('main.app');if(!app)return;const header=$('#siteHeader'),footer=$('#siteFooter');
 [...app.children].forEach(el=>{if(el!==header&&el!==footer)el.remove()});
 const hero=document.createElement('section');hero.className='card';hero.style.textAlign='center';hero.innerHTML=`<h1>Check your retro pay</h1><p class="muted small" style="margin:4px auto 0;max-width:560px">Choose the payment you want to review.</p>`;
 const choices=document.createElement('section');choices.className='ux-landing';choices.innerHTML=`
  <a class="ux-card" href="main-retro.html"><span class="ux-date">9/3/2026</span><h2>Main retro payment</h2><p>Wage increases + related overtime</p><span class="ux-go">Check this payment →</span></a>
  <a class="ux-card" href="differential-retro.html"><span class="ux-date">9/24/2026</span><h2>Night & Resource retro</h2><p>Night, Resource / Flow + related overtime</p><span class="ux-go">Check this payment →</span></a>
  <a class="ux-card best" href="complete-retro.html"><span class="ux-best">BEST CHECK</span><h2>Check both payments</h2><p>Upload both PDFs for one complete review.</p><span class="ux-go">Check both →</span></a>`;
 const details=document.createElement('details');details.className='simple ux-compact-details';details.innerHTML=`<summary>Why were there two retro payments?</summary><div class="detailbody small">The main wage increase and the Night / Resource increases were paid separately. The later payment also recalculated overtime affected by those higher differentials.</div>`;
 const lock=document.createElement('div');lock.className='tiny muted';lock.style.cssText='text-align:center;margin-top:10px';lock.innerHTML='🔒 <b>Your PDFs stay on your device.</b>';
 app.insertBefore(hero,footer);app.insertBefore(choices,footer);app.insertBefore(details,footer);app.insertBefore(lock,footer);
}

function quickFacts(kind){
 const start=$('section.card.start')||$('section.card');if(!start||start.querySelector('.ux-quickfacts'))return;
 $$('.lead',start).forEach(x=>x.classList.add('ux-hide'));
 let html='';
 if(kind==='main')html=`<div class="ux-fact"><div class="ux-icon">📄</div><b>Upload your Workday PDF</b><span></span></div><div class="ux-fact"><div class="ux-icon">📅</div><b>For most nurses</b><span>9/3/2026</span></div><div class="ux-fact"><div class="ux-icon">✓</div><b>Checks</b><span>Wages + related OT</span></div>`;
 if(kind==='diff')html=`<div class="ux-fact"><div class="ux-icon">📄</div><b>Upload your Workday PDF</b><span></span></div><div class="ux-fact"><div class="ux-icon">📅</div><b>For most nurses</b><span>9/24/2026</span></div><div class="ux-fact"><div class="ux-icon">✓</div><b>Checks</b><span>Night, Resource + OT</span></div>`;
 if(kind==='both')html=`<div class="ux-fact"><div class="ux-icon">📄</div><b>Upload both PDFs</b><span>9/3 + 9/24</span></div><div class="ux-fact"><div class="ux-icon">↕</div><b>Either order</b><span>The checker sorts them out</span></div><div class="ux-fact"><div class="ux-icon">✓</div><b>One review</b><span>Both payments together</span></div>`;
 const q=document.createElement('div');q.className='ux-quickfacts';q.innerHTML=html;
 const upload=start.querySelector('.uploadbox,.uploads');if(upload)start.insertBefore(q,upload);else start.appendChild(q);
 const find=start.querySelector('.findstub');if(find&&!find.closest('details.ux-find')){const d=document.createElement('details');d.className='simple ux-find ux-compact-details';d.innerHTML='<summary>Need help finding the PDF?</summary>';find.parentNode.insertBefore(d,find);d.appendChild(find);}
 const status=start.querySelector('#status,.statusline,.status');if(status&&/ready when you are/i.test(status.textContent)){status.textContent='';status.style.minHeight='0';}
}

function rateStrip(){
 if(path!=='differential-retro.html')return;const start=$('section.card.start')||$('section.card');if(!start||start.querySelector('.ux-rategrid'))return;
 const grid=document.createElement('div');grid.className='ux-rategrid';grid.innerHTML=`<div class="ux-rate"><span>Night</span><strong>$5.00 → <em>$5.50</em></strong></div><div class="ux-rate"><span>Resource / Flow</span><strong>$3.50 → <em>$3.75</em></strong></div>`;
 const upload=start.querySelector('.uploadbox');if(upload)start.insertBefore(grid,upload);else start.appendChild(grid);
}

function tuneMain(){
 if(path!=='main-retro.html')return;quickFacts('main');
 document.title='Main Retro Payment | Retro Pay Checker';
 const h1=$('section.card.start h1')||$('section.card h1');if(h1)h1.textContent='Main retro payment';
 const pending=$('#pending,#pendingCard,.pendingbox');if(pending&&!pending.dataset.uxDone&& !pending.classList.contains('hidden')){
  const val=pending.querySelector('#minimum,#pendingMinimumValue,strong');const amt=val?norm(val.textContent):'';
  pending.dataset.uxDone='1';pending.className=(pending.className+' ux-minimum').replace('pendingbox','');
  pending.innerHTML=`<div class="ux-label">Night & Resource retro came later</div><div id="minimum" class="ux-amount">${amt||'Amount shown after analysis'}</div><div class="ux-explain"><b>This is not the expected 9/24 payment.</b><br>The 9/3 PDF does not show all of your older Night & Resource hours.</div>`;
 }
 const headings=$$('h2,h3,summary');for(const h of headings){if(/what .*payment covered|what this payment covered/i.test(norm(h.textContent)))h.textContent='This payment covered';}
 const story=$('.story,.plainsteps');if(story&&!story.dataset.uxMain){story.dataset.uxMain='1';story.innerHTML=`<div class="ux-checklist"><div class="ux-checkrow">✓ <b>Main wage increases</b></div><div class="ux-checkrow">✓ <b>Related overtime recalculation</b></div><div class="ux-checkrow">○ <b>Night & Resource increases came later</b></div></div>`;}
 simplifyCrosslink('9/24 Night & Resource payment','Check both payments together →');
}

function tuneDiff(){
 if(path!=='differential-retro.html')return;quickFacts('diff');rateStrip();
 document.title='Night & Resource Retro | Retro Pay Checker';
 const h1=$('section.card.start h1')||$('section.card h1');if(h1)h1.textContent='Night & Resource retro payment';
 const hero=$('#title,#resultTitle');if(hero&&/direct night.*resource adjustment looks right/i.test(norm(hero.textContent)))hero.textContent='Night & Resource adjustment looks right';
 for(const h of $$('h2,h3,summary'))if(/what workday did|what changed/i.test(norm(h.textContent)))h.textContent='What changed';
 const p=$('#prospectiveBlock');if(p)p.classList.add('ux-hide');
 simplifyCrosslink('9/3 main retro payment','Check both payments together →');
}

function tuneCombined(){
 if(path!=='complete-retro.html')return;quickFacts('both');
 document.title='Check Both Retro Payments | Retro Pay Checker';
 const h1=$('section.card.start h1')||$('section.card h1');if(h1)h1.textContent='Check both retro payments';
 const prospective=$('#prospectiveBlock');if(prospective)prospective.classList.add('ux-hide');
 for(const h of $$('h2,h3,summary'))if(/what workday did|what changed/i.test(norm(h.textContent)))h.textContent='What changed';
 for(const h of $$('h2,h3')){const t=norm(h.textContent);if(/main retro/i.test(t)&&/part/i.test(t))h.textContent='Main retro · 9/3';if(/night.*resource/i.test(t)&&/part/i.test(t))h.textContent='Night & Resource retro · 9/24';}
 const pred=$('#predictionNote');if(pred)pred.classList.add('ux-hide');
 buildTaxCompare();
}

function simplifyCrosslink(label,linkText){
 const candidates=$$('.note,.callout,.ux-crosslink');for(const el of candidates){const t=norm(el.textContent);if(!/have .*payment|strongest overtime check|combined checker|check both/i.test(t))continue;if(el.dataset.uxCross)return;const a=el.querySelector('a');if(!a)continue;el.dataset.uxCross='1';el.className='ux-crosslink';el.innerHTML=`<span>Have the <b>${label}</b> too?</span> <a href="complete-retro.html">${linkText}</a>`;}
}

function extractTax(body){const out={};for(const item of $$('.taxitem',body)){const label=norm(item.querySelector('span')?.textContent);const val=norm(item.querySelector('b')?.textContent);if(label&&val)out[label]=val;}return out;}
function extractDeductions(body){
 const out={items:{},datedTotal:'',currentTotal:'',statementTotal:''};if(!body)return out;
 const note=$$('.note',body).find(n=>/dated benefit-deduction adjustments/i.test(norm(n.textContent)));if(!note)return out;
 const divs=[...note.children].filter(x=>x.tagName==='DIV');
 const entries=divs[0];if(entries){for(const chunk of entries.innerHTML.split(/<br\s*\/?\s*>/i)){const box=document.createElement('div');box.innerHTML=chunk;const txt=norm(box.textContent);const m=txt.match(/^(.+?):\s*(\$[\d,]+\.\d{2})\s*\((\d+)\s+(?:dated\s+)?adjustment/i);if(m)out.items[m[1].trim()]={amount:m[2],count:Number(m[3])};}}
 const totals=divs[1]?norm(divs[1].textContent):norm(note.textContent);
 const d=totals.match(/Dated adjustments:\s*(\$[\d,]+\.\d{2})/i),c=totals.match(/Current-period post-tax deductions:\s*(\$[\d,]+\.\d{2})/i),st=totals.match(/Statement total:\s*(\$[\d,]+\.\d{2})/i);
 if(d)out.datedTotal=d[1];if(c)out.currentTotal=c[1];if(st)out.statementTotal=st[1];return out;
}
function buildTaxCompare(){
 const a=$('#taxPart1Body'),b=$('#taxPart2Body');if(!a||!b||!norm(a.textContent)||!norm(b.textContent))return;
 const signature=norm(a.textContent)+'|'+norm(b.textContent);
 const existing=$('#uxTaxCompare');if(existing?.dataset?.uxSignature===signature)return;
 existing?.remove();$('#uxDeductionCompare')?.remove();
 const ta=extractTax(a),tb=extractTax(b);const labels=[...new Set([...Object.keys(ta),...Object.keys(tb)])];
 if(labels.length){const d=document.createElement('details');d.id='uxTaxCompare';d.className='block';d.dataset.uxSignature=signature;d.innerHTML=`<summary>Taxes withheld</summary><div class="inside"><div class="tablewrap"><table class="ux-taxcompare"><thead><tr><th></th><th class="num">9/3</th><th class="num">9/24</th></tr></thead><tbody>${labels.map(l=>`<tr><td>${l}</td><td class="num">${ta[l]||'—'}</td><td class="num">${tb[l]||'—'}</td></tr>`).join('')}</tbody></table></div><div class="note"><b>Withholding is not a special retro tax.</b> These are amounts Workday withheld, not your final tax bill or refund.</div></div>`;const first=$('#taxPart1');first?.parentNode?.insertBefore(d,first);}
 const da=extractDeductions(a),db=extractDeductions(b),deductionNames=[...new Set([...Object.keys(da.items),...Object.keys(db.items)])];
 if(deductionNames.length){const od=document.createElement('details');od.id='uxDeductionCompare';od.className='block';od.dataset.uxSignature=signature;od.innerHTML=`<summary>Other deduction adjustments</summary><div class="inside"><div class="tablewrap"><table class="ux-deductiontable"><thead><tr><th>Adjustment</th><th class="num">9/3</th><th class="num">9/24</th></tr></thead><tbody>${deductionNames.map(name=>{const x=da.items[name],y=db.items[name];return `<tr><td><b>${name}</b></td><td class="num">${x?`${x.amount}<span class="ux-adjcount">${x.count} adjustment${x.count===1?'':'s'}</span>`:'—'}</td><td class="num">${y?`${y.amount}<span class="ux-adjcount">${y.count} adjustment${y.count===1?'':'s'}</span>`:'—'}</td></tr>`}).join('')}</tbody></table></div>${da.datedTotal||db.datedTotal?`<div class="ux-deductiontotals"><div class="ux-deductiontotal"><span>9/3 dated adjustments</span><b>${da.datedTotal||'—'}</b></div><div class="ux-deductiontotal"><span>9/24 dated adjustments</span><b>${db.datedTotal||'—'}</b></div></div>`:''}<div class="note">These are benefit-deduction adjustments shown by Workday. The checker identifies and totals them, but does not verify the insurance-plan premium formula.</div></div>`;const anchor=$('#uxTaxCompare')||$('#taxPart1');anchor?.after(od);}
 $('#taxPart1')?.classList.add('ux-hide');$('#taxPart2')?.classList.add('ux-hide');
}

function tunePayCodes(){
 if(path!=='pay-codes.html')return;
 const intro=$('.card h1')?.parentElement;if(intro){const ps=$$('p',intro);if(ps[0])ps[0].innerHTML='<b>Plain-English guide to the Workday pay terms this checker understands.</b>';if(ps[1])ps[1].textContent='Search the exact words from your statement, or type what you are looking for.';}
 for(const d of $$('details.code')){
  const name=norm(d.querySelector('.name')?.textContent);if(name==='Night Shift Differential'){
   const pill=d.querySelector('.pill');if(pill){pill.className='pill good';pill.textContent='✓ Updated';}
   const body=d.querySelector('.codebody');if(body)body.innerHTML='<p><b>$5.00/hour → $5.50/hour</b></p><p>The increase was paid retroactively on the later Night & Resource retro payment. Affected overtime was recalculated too.</p>';
  }
  if(name==='Charge Pay'){
   const pill=d.querySelector('.pill');if(pill){pill.className='pill good';pill.textContent='✓ Updated';}
   const body=d.querySelector('.codebody');if(body)body.innerHTML='<p><b>Resource / Flow: $3.50/hour → $3.75/hour</b></p><p>In the Workday examples reviewed for this tool, <b>Charge Pay</b> is the label used for Resource / Flow pay. The increase appears on the later Night & Resource retro payment, with affected overtime recalculated too.</p><p><b>This is not on-call / callback pay.</b></p>';
  }
  if(name==='Overtime Pay'){
   const body=d.querySelector('.codebody');if(body&&!body.dataset.uxOt){body.dataset.uxOt='1';const p=document.createElement('p');p.innerHTML='<b>Why OT appears again on the later retro:</b> higher Night and Resource pay can raise the weekly OT rate, so those affected weeks had to be recalculated.';body.insertBefore(p,body.children[1]||null);}
  }
  if(name==='On-call / callback'){
   const pill=d.querySelector('.pill');if(pill){pill.className='pill warn';pill.textContent='? Still learning';}
   const body=d.querySelector('.codebody');if(body)body.innerHTML='<p><b>Call / callback retro is still being validated.</b></p><p>We do not yet have enough real Workday examples to safely identify every label, rate treatment, or which retro payment contains each correction.</p><p>If a call-related line could change the result, the checker should <b>flag it instead of guessing.</b></p>';
  }
 }
 const legend=$('.legend');if(legend){const pending=legend.querySelector('.pill.pending');if(pending)pending.remove();}
}

function tunePrivacy(){
 if(path!=='privacy.html')return;
 const first=$('section.card');if(first){const h=first.querySelector('h1');if(h)h.textContent='Your payroll information stays on your device';const p=first.querySelector('p');if(p)p.innerHTML='Your PDF and payroll details are processed in your browser. <b>They are not uploaded or stored by this tool.</b>';}
 let analytics=null;for(const sec of $$('section.card')){if(/anonymous usage/i.test(norm(sec.querySelector('h2')?.textContent))){analytics=sec;break;}}
 if(analytics&&!analytics.dataset.uxDone){analytics.dataset.uxDone='1';analytics.innerHTML=`<details class="simple"><summary>Anonymous site usage</summary><div class="detailbody small">The site counts page visits and feature usage so I can see which parts are useful. <b>Your PDF, name, employee ID, pay amounts, pay codes, statement dates and checker results are never included.</b><details class="simple" style="margin-top:8px"><summary>Technical details</summary><div class="detailbody tiny muted">Anonymous traffic is counted with GoatCounter. PDF text is read locally in your browser using a PDF-reading library loaded from jsDelivr; your pay stub itself is not sent there. Analytics is separate from the local PDF analysis, and the checker still works if analytics is blocked.</div></details></div></details>`;}
 for(const p of $$('section.card p')){if(/^technical detail:/i.test(norm(p.textContent)))p.remove();}
 textReplace(document);
}

function interceptReports(){
 const original=window.open;if(!original||window.__uxOpenWrapped)return;window.__uxOpenWrapped=true;
 window.open=function(...args){const w=original.apply(this,args);try{if(w?.document&&!w.__uxWriteWrapped){w.__uxWriteWrapped=true;const write=w.document.write.bind(w.document);w.document.write=(html)=>write(cleanReport(String(html)));}}catch{}return w;};
}
function cleanReport(html){
 let s=html;
 const reps=[
  [/Part 1 · Main Wage Retro/g,'Main retro payment'],[/Part 1 · Retro Summary/g,'Main retro payment · Summary'],[/Part 1 · Detailed Retro Report/g,'Main retro payment · Detailed report'],
  [/Part 2 · Retro Summary/g,'Night & Resource retro · Summary'],[/Part 2 · Detailed Retro Report/g,'Night & Resource retro · Detailed report'],[/Part 2 · Night \/ Resource retro/g,'Night & Resource retro'],
  [/What Workday did/g,'What changed'],[/Why Part 1(?:'|’)?s earlier number was smaller/g,"Why the 9/3 statement couldn't show the full later payment"],
  [/Part 1 · Main wage retro/g,'Main retro · 9/3'],[/Part 2 · Night \/ Resource retro/g,'Night & Resource retro · 9/24'],
  [/\bPart 1\b/g,'9/3 main retro'],[/\bPart 2\b/g,'9/24 Night & Resource retro']
 ];for(const [re,to] of reps)s=s.replace(re,to);
 s=s.replace(/<section class="section"><h2>Are the new rates being used now\?<\/h2>[\s\S]*?<\/section>/g,'');
 s=s.replace(/<section class="section"><h2>(?:What .*?can already tell you about .*?|Why the 9\/3 statement couldn[^<]*|Why the 9\/3 main retro[^<]*)<\/h2>[\s\S]*?<\/section>/gi,'');
 s=s.replace(/<div class="callout pending"[\s\S]*?<\/div>(?=\s*<\/section>)/gi,'');
 return s;
}

function run(){
 injectCss();interceptReports();
 if(['','index.html'].includes(path))compactLanding();
 if(path==='main-retro.html')tuneMain();
 if(path==='differential-retro.html')tuneDiff();
 if(path==='complete-retro.html')tuneCombined();
 if(path==='pay-codes.html')tunePayCodes();
 if(path==='privacy.html')tunePrivacy();
 textReplace(document);
}
run();
let timer;const mo=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{if(path==='main-retro.html')tuneMain();if(path==='differential-retro.html')tuneDiff();if(path==='complete-retro.html')tuneCombined();textReplace(document);},40)});mo.observe(document.body,{childList:true,subtree:true,characterData:true});
})();

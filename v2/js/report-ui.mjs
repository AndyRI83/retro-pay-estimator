export const esc = (value) => String(value ?? '').replace(/[&<>\"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
export const money = (value) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(Number(value || 0));

export function reportCss() {
  return `:root{--navy:#063d75;--blue:#0a67b2;--blue-soft:#edf5fb;--green:#137a45;--green-bg:#eaf8f0;--amber:#8a5a00;--amber-bg:#fff6dd;--orange:#a7440c;--orange-bg:#fff1e8;--red:#a52a21;--red-bg:#fff0ef;--purple:#69459b;--purple-bg:#f3eefb;--ink:#17212b;--muted:#657688;--line:#d7e1e8;--page:#f3f6f8;--panel:#fff}
  *{box-sizing:border-box}html{background:var(--page)}body{margin:0;color:var(--ink);background:var(--page);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.4}.report{width:min(100%,900px);margin:auto;padding:12px 12px 34px}.sheet{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 8px 26px rgba(6,61,117,.06)}h1,h2,h3{color:var(--navy)}h1{font-size:1.6rem;margin:0}h2{font-size:1.12rem;margin:0 0 7px}h3{font-size:.96rem;margin:0 0 6px}.kicker{font-size:.75rem;color:var(--muted);font-weight:750;margin-top:4px}.tiny{font-size:.7rem}.small{font-size:.81rem}.muted{color:var(--muted)}.hero{border-radius:15px;padding:14px;margin-top:14px}.hero.good{background:var(--green-bg);color:#0b673a}.hero.partial{background:var(--amber-bg);color:#714900}.hero.review{background:var(--orange-bg);color:#8a3700}.hero.stop{background:var(--red-bg);color:#8f1f17}.hero h2{color:inherit;margin:0}.hero p{margin:4px 0 0;font-size:.82rem}.numbers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.number{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}.number span{display:block;color:var(--muted);font-size:.61rem;font-weight:900;text-transform:uppercase}.number b{display:block;color:var(--navy);font-size:1.25rem;margin-top:3px;font-variant-numeric:tabular-nums}.section{margin-top:18px}.card{border:1px solid var(--line);border-radius:13px;padding:12px;margin-top:8px}.callout{border-radius:12px;padding:11px 12px;margin-top:9px}.callout.info{background:var(--blue-soft);color:#254e6e}.callout.pending{background:var(--purple-bg);color:#4d3472}.callout.warn{background:var(--amber-bg);color:#6f4800}.callout.good{background:var(--green-bg);color:#0c6238}.plainsteps{display:grid;gap:8px}.plainstep{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:flex-start}.plainstep .dot{width:28px;height:28px;border-radius:9px;background:var(--blue-soft);color:var(--navy);display:grid;place-items:center;font-weight:950}.row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid #edf1f4;font-size:.82rem}.row:last-child{border-bottom:0}.row b:last-child{font-variant-numeric:tabular-nums}.timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:8px}.timepoint{background:var(--blue-soft);border-radius:10px;padding:9px;text-align:center}.timepoint b{display:block;color:var(--navy);font-size:.84rem}.timepoint span{display:block;color:var(--muted);font-size:.68rem;margin-top:2px}.tablewrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:.76rem}th,td{border-bottom:1px solid #e4ebef;padding:7px 5px;text-align:left}th{color:var(--muted);font-size:.62rem;text-transform:uppercase}.num{text-align:right;font-variant-numeric:tabular-nums}.status-good{color:var(--green);font-weight:900}.status-warn{color:var(--amber);font-weight:900}.report-actionbar{position:sticky;top:0;z-index:20;display:flex;gap:7px;flex-wrap:wrap;align-items:center;background:rgba(243,246,248,.96);backdrop-filter:blur(10px);padding:8px 0 10px}.report-actionbar button{border:0;border-radius:10px;min-height:40px;padding:9px 12px;font:inherit;font-size:.78rem;font-weight:850;cursor:pointer}.report-actionbar .primary{background:var(--navy);color:#fff}.report-actionbar .secondary{background:#fff;color:var(--navy);border:1px solid #abc0d0}.report-actionbar .back{margin-left:auto;background:transparent;color:var(--navy)}#reportActionStatus{font-size:.7rem;color:var(--muted);flex:1 0 100%;min-height:1em}.reportfooter{border-top:1px solid var(--line);margin-top:20px;padding-top:10px;color:var(--muted);font-size:.67rem;text-align:center}.details-only{}
  @media(max-width:600px){.report{padding:7px 7px 26px}.sheet{padding:14px;border-radius:14px}.numbers{grid-template-columns:1fr}.number{display:flex;align-items:center;justify-content:space-between;text-align:left}.number b{margin:0;font-size:1.08rem}.timeline{grid-template-columns:1fr}.timepoint{text-align:left}.report-actionbar{gap:5px}.report-actionbar button{flex:1 1 44%;padding:8px 6px;font-size:.72rem}.report-actionbar .back{margin-left:0}.row{font-size:.78rem}}
  @media print{html,body{background:#fff}.report{width:100%;max-width:none;margin:0;padding:0}.sheet{border:0;border-radius:0;box-shadow:none;padding:0}.report-actionbar{display:none!important}.section,.card,.callout,.number,.timepoint{break-inside:avoid}a{color:inherit;text-decoration:none}}`;
}

export function actionBar() {
  return `<div class="report-actionbar"><button id="reportShare" class="primary" type="button">↗ Save or send</button><button id="reportDownload" class="secondary" type="button">⬇ Download</button><button id="reportPrint" class="secondary" type="button">🖨 Print / Save PDF</button><button id="reportBack" class="back" type="button">← Back</button><div id="reportActionStatus" aria-live="polite"></div></div>`;
}

export function actionScript({ filename, shareText, eventPrefix = 'report' }) {
  const safeFilename = JSON.stringify(filename);
  const safeText = JSON.stringify(shareText);
  const safePrefix = JSON.stringify(eventPrefix);
  return `<script>(()=>{const filename=${safeFilename},shareText=${safeText},eventPrefix=${safePrefix};const track=(name)=>{try{window.opener?.__retroTrackEvent?.(name)}catch{}};const cleanHtml=()=>{const clone=document.documentElement.cloneNode(true);clone.querySelector('.report-actionbar')?.remove();clone.querySelector('#reportActionStatus')?.remove();return '<!doctype html>\\n'+clone.outerHTML};const makeFile=()=>new File([cleanHtml()],filename,{type:'text/html'});const download=()=>{const blob=new Blob([cleanHtml()],{type:'text/html'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);track(eventPrefix+'-downloaded')};const setStatus=(text)=>{const el=document.querySelector('#reportActionStatus');if(el)el.textContent=text||''};document.querySelector('#reportShare')?.addEventListener('click',async()=>{const file=makeFile();try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'Retro Pay Checker',text:shareText,files:[file]});track(eventPrefix+'-shared');return}download();setStatus('This browser cannot share the report file directly, so a copy was downloaded instead.')}catch(err){if(err?.name!=='AbortError'){download();setStatus('Sharing was not available, so a copy was downloaded instead.')}}});document.querySelector('#reportDownload')?.addEventListener('click',download);document.querySelector('#reportPrint')?.addEventListener('click',()=>{track(eventPrefix+'-print-opened');window.print()});document.querySelector('#reportBack')?.addEventListener('click',()=>{try{window.close()}catch{};setTimeout(()=>{if(!window.closed)history.back()},30)})})()</script>`;
}

export function heroClass(status) {
  if (['reconciled','reconciled-minor-unresolved'].includes(status)) return 'good';
  if (status === 'potential-discrepancy') return 'review';
  if (status === 'cannot-determine') return 'stop';
  return 'partial';
}

export function taxSection(extras, title = 'Taxes and other deductions') {
  if (!extras) return '';
  const find = (name) => extras.employeeTaxes?.find((x) => x.description === name);
  const rows = [
    ['Federal income tax withheld', find('Federal Withholding')],
    ['Massachusetts income tax withheld', find('State Tax - MA')],
    ['Social Security withheld', find('OASDI')],
    ['Medicare withheld', find('Medicare')],
  ].filter(([,r]) => r);
  const taxHtml = rows.length
    ? rows.map(([label,row]) => `<div class="row"><span>${esc(label)}</span><b>${money(row.amount)}</b></div>`).join('')
    : `<div class="small muted">No tax-detail rows were available in the parsed statement.</div>`;
  const historical = extras.postTaxHistoricalGrouped?.length
    ? `<div class="card"><h3>Historical benefit deductions Workday also adjusted</h3>${extras.postTaxHistoricalGrouped.map((x)=>`<div class="row"><span>${esc(x.description)} · ${x.count} dated adjustment${x.count===1?'':'s'}</span><b>${money(x.total)}</b></div>`).join('')}<div class="row"><span>Dated historical adjustments</span><b>${money(extras.postTaxHistoricalTotal)}</b></div><div class="row"><span>Current-period post-tax deductions</span><b>${money(extras.postTaxCurrentTotal)}</b></div>${extras.printedPostTaxTotal==null?'':`<div class="row"><span>Total post-tax deductions on statement</span><b>${money(extras.printedPostTaxTotal)}</b></div>`}<div class="small muted" style="margin-top:7px">These dated rows are separate from the normal current-period deduction. The checker can identify and total them, but it does not verify the insurance plan's premium formula.</div></div>`
    : '';
  return `<section class="section"><h2>${esc(title)}</h2><div class="card"><h3>What Workday withheld on this check</h3>${taxHtml}<div class="callout info small"><b>Withholding is not a special “retro tax.”</b> Retroactive wages are wage income in the year they are paid. A large one-time payment can have withholding that looks very different from a normal weekly check. These numbers show what Workday withheld, not your final tax bill or refund.</div></div>${historical}</section>`;
}

export function prospectiveSection(prospective) {
  if (!prospective) return '';
  if (!prospective.hasAnyCurrentDifferentialHours) {
    return `<section class="section"><h2>Are the new rates being used now?</h2><div class="callout info small"><b>This statement can't answer that.</b> It does not contain current-period Night or Resource / Flow hours, so there is no current differential rate to inspect.</div></section>`;
  }
  const visible = prospective.items.filter((x) => x.status !== 'no-current-hours');
  const rows = visible.map((x) => `<div class="row"><span>${esc(x.label)}</span><b>${x.status==='new-rate'?'✓ '+money(x.newRate)+'/hr':x.status==='old-rate'?'! Still '+money(x.oldRate)+'/hr':'? Mixed or unfamiliar rates'}</b></div>`).join('');
  const note = prospective.anyOldRateStillPaid
    ? `<div class="callout warn small"><b>Additional retro may still be accumulating.</b> At least one current-period differential is still shown at the old rate.</div>`
    : `<div class="callout good small"><b>The current differential rates visible on this statement are updated.</b> This only applies to the current hours shown here.</div>`;
  return `<section class="section"><h2>Are the new rates being used now?</h2><div class="card">${rows}</div>${note}</section>`;
}

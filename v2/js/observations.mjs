import { inferCorrectedBaseRate } from './audit-engine.mjs';
import { detectBaseRateTransitions } from './clarification-engine.mjs';
import { matchStep, friendlyDate, friendlyMonthTiming } from './wage-scale.mjs';

function currentPeriodWeek(summary,metadata){
  return summary.weeks.find(w=>w.weekStart===metadata?.payPeriodBegin && w.weekEnd===metadata?.payPeriodEnd) || null;
}

function firstRow(summary,code){
  return summary.weeks.flatMap(w=>w.rows).filter(r=>r.payCode===code).sort((a,b)=>a.weekStart.localeCompare(b.weekStart))[0] || null;
}

export function buildPlainObservations(summary, metadata=null) {
  const out=[];
  const transitions=detectBaseRateTransitions(summary,metadata).filter(x=>Math.abs(x.toPrior-x.fromPrior)>.001);
  if(transitions.length){
    const t=transitions[0];
    const from=matchStep(t.fromPrior), to=matchStep(t.toPrior);
    const current=currentPeriodWeek(summary,metadata);
    const currentRate=current?inferCorrectedBaseRate(current.rows):null;
    const currentStep=matchStep(currentRate);
    let body='Your pay rate changed starting with the week of '+friendlyDate(t.weekStart)+'.';
    if(from && to) body=`Your pay appears to move from Step ${from.step} to Step ${to.step} starting with the week of ${friendlyDate(t.weekStart)}.`;
    if(currentStep && to && currentStep.step!==to.step) body+=` Your current pay is at Step ${currentStep.step}, starting with the week of ${friendlyDate(metadata.payPeriodBegin)}.`;
    body+=` That suggests your yearly step increase happens around ${friendlyMonthTiming(t.weekStart,t.weekEnd)}.`;
    out.push({
      id:'step-change',
      title:'Your pay rate changed',
      body,
      payCode:'Regular Pay',
      kind:'observation',
    });
  }

  const cert=firstRow(summary,'Certification Bonus');
  if(cert){
    const dollars=Math.max(...summary.weeks.flatMap(w=>w.rows).filter(r=>r.payCode==='Certification Bonus').map(r=>Math.abs(r.amount||0)),0);
    out.push({
      id:'certification-bonus',
      title:'Certification bonus',
      body:`It looks like you received a ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(dollars)} certification bonus in ${(()=>{const [m,,y]=cert.weekStart.split('/').map(Number);return new Date(Date.UTC(y,m-1,1)).toLocaleString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});})()}. It is a fixed lump-sum payment, so the wage raise did not change this bonus.`,
      payCode:'Certification Bonus',
      kind:'observation',
    });
  }
  return out;
}

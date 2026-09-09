import { inferCorrectedBaseRate, inferPriorBaseRate } from './audit-engine.mjs';

const RETRO_START = '04/06/2025';

function toTime(mdY) {
  if (!mdY) return NaN;
  const [m,d,y] = mdY.split('/').map(Number);
  return Date.UTC(y,m-1,d);
}

function firstWeekForCode(summary, code, metadata=null) {
  const weeks = summary.weeks
    .filter((week) => !(metadata?.payPeriodBegin && metadata?.payPeriodEnd && week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd))
    .filter((week) => week.rows.some((row) => row.payCode === code))
    .sort((a,b)=>toTime(a.weekStart)-toTime(b.weekStart));
  return weeks[0] || null;
}

export function detectBaseRateTransitions(summary, metadata=null) {
  const weeks = summary.weeks
    .filter((week) => !(metadata?.payPeriodBegin && metadata?.payPeriodEnd && week.weekStart === metadata.payPeriodBegin && week.weekEnd === metadata.payPeriodEnd))
    .map((week) => ({
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      prior: inferPriorBaseRate(week.rows),
      corrected: inferCorrectedBaseRate(week.rows),
    }))
    .filter((x)=>x.prior != null && x.corrected != null)
    .sort((a,b)=>toTime(a.weekStart)-toTime(b.weekStart));

  const transitions=[];
  let last=null;
  for (const w of weeks) {
    if (last && (Math.abs(w.prior-last.prior)>0.001 || Math.abs(w.corrected-last.corrected)>0.001)) {
      transitions.push({
        weekStart:w.weekStart,
        weekEnd:w.weekEnd,
        fromPrior:last.prior,
        toPrior:w.prior,
        fromCorrected:last.corrected,
        toCorrected:w.corrected,
      });
    }
    last=w;
  }
  return transitions;
}

/**
 * Ask only when the answer can change what RetroCalc is able to calculate.
 * Observations that do not need an answer belong in observations.mjs instead.
 */
export function buildClarificationQuestions(summary, metadata=null) {
  const questions=[];

  for (const [code,label,plainWork] of [
    ['Night Shift Differential','Night pay','nights'],
    ['Charge Pay','Resource / Flow pay','Resource / Flow'],
  ]) {
    const ytd=summary.byPayCode.find((x)=>x.payCode===code);
    if (!ytd?.ytdHours) continue;
    const first=firstWeekForCode(summary,code,metadata);
    if (!first) continue;

    if (toTime(first.weekStart) >= toTime('01/01/2026')) {
      questions.push({
        id: code==='Night Shift Differential'?'pre2026-night-history':'pre2026-resource-history',
        type:'choice',
        priority:'required-for-complete-supplemental',
        payCode:code,
        title:'One thing I need to confirm',
        prompt:`Your statement first shows ${label} in 2026. Did you also work ${plainWork} between April 6 and December 31, 2025?`,
        options:[
          {value:'no',label:'No'},
          {value:'yes',label:'Yes'},
          {value:'unsure',label:"I'm not sure"},
        ],
        why:`This helps RetroCalc explain whether the 2025 part of the separate payment can be predicted from this statement. You will not be asked to upload old pay stubs just to use the normal audit.`,
        firstVisibleWeek:first.weekStart,
      });
    }
  }

  return questions;
}

export function summarizeClarifications(questions, answers={}) {
  return questions.map((q)=>{
    const answer=answers[q.id] ?? null;
    return {
      ...q,
      answer,
      answered: answer != null && answer !== '',
      assessment: null,
    };
  });
}

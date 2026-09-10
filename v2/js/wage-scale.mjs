export const WAGE_SCALES = {
  prior: [
    null,37.51,39.38,41.35,43.42,45.61,47.89,50.28,52.81,55.44,58.22,61.14,64.20,67.43,70.80,74.34,78.05,81.95,
  ],
  y2025: [
    null,38.73,40.66,42.69,44.83,47.09,49.45,51.91,54.53,57.24,60.11,63.13,66.29,69.62,73.10,76.76,80.59,84.61,
  ],
  y2026: [
    null,39.89,41.88,43.97,46.18,48.51,50.93,53.47,56.16,58.96,61.92,65.02,68.28,71.71,75.29,79.06,83.00,87.15,
  ],
};

function approx(a,b,eps=.011){return a!=null && Math.abs(Number(a)-Number(b))<=eps;}

function dateKey(mdY) {
  if (!mdY) return null;
  const [m,d,y] = mdY.split('/').map(Number);
  if (!m || !d || !y) return null;
  return y * 10000 + m * 100 + d;
}

function priorStep(rate) {
  for (let step=1; step<WAGE_SCALES.prior.length; step++) {
    if (approx(rate,WAGE_SCALES.prior[step])) return step;
  }
  return null;
}

export function correctedScaleForWeek(weekStart) {
  const key = dateKey(weekStart);
  if (key == null) return null;
  if (key >= 20260405) return 'y2026';
  if (key >= 20250406) return 'y2025';
  return null;
}

/**
 * Independently checks an old-rate -> corrected-rate pair against the
 * negotiated University Campus wage table for that payroll week.
 */
export function validateRetroWagePair(priorRate, correctedRate, weekStart) {
  const step = priorStep(priorRate);
  const scale = correctedScaleForWeek(weekStart);

  if (step == null || scale == null) {
    return {
      recognized: false,
      matches: false,
      step,
      scale,
      priorRate,
      correctedRate,
      reason: step == null ? 'prior-rate-not-on-known-scale' : 'week-outside-supported-retro-period',
    };
  }

  const expectedCorrectedRate = WAGE_SCALES[scale][step];
  return {
    recognized: true,
    matches: approx(correctedRate, expectedCorrectedRate),
    step,
    scale,
    priorRate,
    correctedRate,
    expectedCorrectedRate,
  };
}

export function matchStep(rate) {
  for (const [scale, values] of Object.entries(WAGE_SCALES)) {
    for (let step=1; step<values.length; step++) {
      if (approx(rate,values[step])) return {step,scale,rate:values[step]};
    }
  }
  return null;
}

export function friendlyMonthTiming(weekStart, weekEnd) {
  if(!weekStart) return null;
  const [m,d]=weekStart.split('/').map(Number);
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const part=d<=10?'early':d<=20?'mid':'late';
  return `${part} ${months[m-1]}`;
}

export function friendlyDate(mdY) {
  if(!mdY) return '';
  const [m,d,y]=mdY.split('/').map(Number);
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m-1]} ${d}, ${y}`;
}

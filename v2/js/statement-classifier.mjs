import { detectMainWageRetro } from './full-audit.mjs';
import { detectDifferentialRetro } from './differential-audit.mjs';

export function classifyRetroStatement(summary, metadata = null) {
  const main = detectMainWageRetro(summary, metadata);
  const differential = detectDifferentialRetro(summary, metadata);

  if (main.detected && differential.detected) {
    return { type: 'mixed-retro', main, differential };
  }
  if (main.detected) return { type: 'main-wage-retro', main, differential };
  if (differential.detected) return { type: 'differential-retro', main, differential };
  return { type: 'ordinary-or-unknown', main, differential };
}

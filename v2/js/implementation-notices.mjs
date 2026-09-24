export const IMPLEMENTATION_NOTICES = [
  {
    id: 'night-resource-supplemental-2026-09',
    title: 'Night and Resource / Flow retro is separate from the main wage-retro payment',
    status: 'observed-in-workday',
    reportedDate: '2026-09-24',
    appliesWhenAnyPayCodePresent: ['Night Shift Differential', 'Charge Pay'],
    effectiveFromText: 'Retroactive to April 2025',
    expectedTimingText: 'A separate Part 2 payment is now appearing; individual timing may vary',
    publicExplanation: 'The Night and Resource / Flow increases are retroactive to April 2025 and are paid separately from the main wage-retro payment. A real Part 2 Workday statement confirms that the separate adjustment also recalculates overtime affected by the higher differentials.',
    caveat: 'A Part 1 statement can support a lower bound for Part 2 when enough 2026 history is visible, but it cannot safely predict the complete Part 2 total when older 2025 differential hours are not itemized.',
    ruleId: 'night-resource-supplemental-retro-apr-2025',
  },
];

export function noticesForStatement(summary) {
  const codes = new Set(summary.byPayCode.map((item) => item.payCode));
  return IMPLEMENTATION_NOTICES.filter((notice) =>
    (notice.appliesWhenAnyPayCodePresent || []).some((code) => codes.has(code))
  );
}

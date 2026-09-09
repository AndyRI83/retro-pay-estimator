export const IMPLEMENTATION_NOTICES = [
  {
    id: 'night-resource-supplemental-2026-09',
    title: 'Night and Resource / Flow retro will be paid separately',
    status: 'verified-management-guidance',
    reportedDate: '2026-09-04',
    appliesWhenAnyPayCodePresent: ['Night Shift Differential', 'Charge Pay'],
    effectiveFromText: 'Back to April 2025',
    expectedTimingText: "Expected on next week's check",
    publicExplanation: 'Management confirmed to negotiating-committee leaders that the Night and Resource / Flow increases are retroactive to April 2025 and will be paid on a separate check.',
    caveat: 'The first retro check can be correct for the pay it includes and still be incomplete. RetroCalc keeps the later Night / Resource payment separate and checks it when it arrives.',
    ruleId: 'night-resource-supplemental-retro-apr-2025',
  },
];

export function noticesForStatement(summary) {
  const codes = new Set(summary.byPayCode.map((item) => item.payCode));
  return IMPLEMENTATION_NOTICES.filter((notice) =>
    (notice.appliesWhenAnyPayCodePresent || []).some((code) => codes.has(code))
  );
}

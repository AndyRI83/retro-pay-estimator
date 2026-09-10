export const IMPLEMENTATION_NOTICES = [
  {
    id: 'night-resource-supplemental-2026-09',
    title: 'Night and Resource / Flow retro is separate from the main wage-retro payment',
    status: 'verified-management-guidance',
    reportedDate: '2026-09-04',
    appliesWhenAnyPayCodePresent: ['Night Shift Differential', 'Charge Pay'],
    effectiveFromText: 'Retroactive to April 2025',
    expectedTimingText: 'Payment date is not confirmed',
    publicExplanation: 'Negotiating-committee leadership reports that management confirmed the Night and Resource / Flow increases are retroactive to April 2025 and are separate from the main wage-retro payment. The payment date is not confirmed.',
    caveat: 'The checker does not count these increases as missing from the main wage-retro payment and does not predict a payment date.',
    ruleId: 'night-resource-supplemental-retro-apr-2025',
  },
];

export function noticesForStatement(summary) {
  const codes = new Set(summary.byPayCode.map((item) => item.payCode));
  return IMPLEMENTATION_NOTICES.filter((notice) =>
    (notice.appliesWhenAnyPayCodePresent || []).some((code) => codes.has(code))
  );
}

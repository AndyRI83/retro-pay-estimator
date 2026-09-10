/**
 * Rule Ledger
 *
 * This is the gatekeeper for claims. A mathematically tidy result is not enough:
 * The checker may call something a potential discrepancy only when the rule behind
 * that calculation is strong enough to support that conclusion.
 */

export const RULE_STATUS = Object.freeze({
  VERIFIED_AUTHORITATIVE: 'verified-authoritative',
  VERIFIED_CONTRACT_PLUS_PAYROLL: 'verified-contract-plus-payroll',
  HIGHLY_VALIDATED_EMPIRICAL: 'highly-validated-empirical',
  WELL_SUPPORTED: 'well-supported',
  VERIFIED_IMPLEMENTATION_GUIDANCE: 'verified-implementation-guidance',
  REPORTED_IMPLEMENTATION_GUIDANCE: 'reported-implementation-guidance',
  UNRESOLVED: 'unresolved',
  SCOPE_DEFINITION: 'scope-definition',
});

export const RULE_LEDGER = [
  {
    id: 'base-linked-1x',
    title: 'Base-linked straight-time retro',
    status: RULE_STATUS.VERIFIED_AUTHORITATIVE,
    maySupportDiscrepancy: true,
    publicSummary: 'Regular pay and other base-rate pay are recalculated using the correct wage rate for that time period.',
    evidence: ['ratified wage schedule', 'repeated Workday reversal/repost behavior'],
  },
  {
    id: 'major-holiday-1.5x',
    title: 'Major-holiday 1.5× pay',
    status: RULE_STATUS.VERIFIED_CONTRACT_PLUS_PAYROLL,
    maySupportDiscrepancy: true,
    publicSummary: 'Hours worked on a major holiday are paid at 1.5 times base when those hours are not already OT. Other differentials are handled separately.',
    evidence: ['CBA holiday language', 'Workday rate examples'],
  },
  {
    id: 'major-holiday-extra-0.5x',
    title: 'Major-holiday extra 0.5× premium on holiday OT',
    status: RULE_STATUS.HIGHLY_VALIDATED_EMPIRICAL,
    maySupportDiscrepancy: true,
    publicSummary: 'When major-holiday hours are already OT, Workday can show the OT payment plus a separate extra half-time holiday payment.',
    evidence: ['multiple paired Workday holiday examples'],
  },
  {
    id: 'weekly-weighted-regular-rate-ot',
    title: 'Weekly weighted regular-rate overtime',
    status: RULE_STATUS.VERIFIED_CONTRACT_PLUS_PAYROLL,
    maySupportDiscrepancy: true,
    publicSummary: 'Your OT rate can change from week to week because some extra pay can raise the OT rate for that week.',
    evidence: ['CBA overtime/remuneration language', 'dozens of reconstructed Workday weeks'],
  },
  {
    id: 'fixed-dollar-rate-repost-current-retro-statement',
    title: 'Fixed-dollar differential reversal/repost behavior on the main wage-retro statement',
    status: RULE_STATUS.HIGHLY_VALIDATED_EMPIRICAL,
    maySupportDiscrepancy: true,
    publicSummary: 'Workday can reverse and repost an old fixed differential at the same rate while it recalculates OT for that week.',
    evidence: ['complete Workday retro statement', 'weekly OT reconstruction'],
    caveat: 'This describes the arithmetic on the main wage-retro statement. Night / Resource retro is a separate payment and has no confirmed payment date.',
  },
  {
    id: 'weekly-ot-limited-context',
    title: 'Weekly overtime with a pay type whose OT treatment is still being validated',
    status: RULE_STATUS.WELL_SUPPORTED,
    maySupportDiscrepancy: false,
    publicSummary: 'The checker can check much of this week, but one pay type in the week does not yet have enough OT examples to support an underpayment claim.',
    evidence: ['validated direct-dollar behavior', 'limited or incomplete OT-treatment examples'],
    caveat: 'A mismatch in this context is shown as needing more information, not as a potential payroll discrepancy.',
  },
  {
    id: 'personal-ot-divisor-observed',
    title: 'Unscheduled Personal divisor treatment',
    status: RULE_STATUS.WELL_SUPPORTED,
    maySupportDiscrepancy: false,
    publicSummary: 'In the example checked so far, Unscheduled Personal time was not counted among the hours used to calculate the weekly OT rate.',
    evidence: ['clean Workday weekly example'],
    caveat: 'Not yet validated broadly enough to use as a universal discrepancy rule by itself.',
  },
  {
    id: 'night-resource-supplemental-retro-apr-2025',
    title: 'Night / Resource differential increases retroactive to April 2025',
    status: RULE_STATUS.VERIFIED_IMPLEMENTATION_GUIDANCE,
    maySupportDiscrepancy: true,
    publicSummary: 'Management confirmed to negotiating-committee leaders that Night and Resource / Flow increases are retroactive to April 2025 and are separate from the main wage-retro payment. The payment date is not confirmed.',
    evidence: ['management implementation guidance relayed by two MNA negotiating-committee leaders, 2026-09-04', 'successor agreement rates: Night $5.50; Resource $3.75'],
    caveat: 'Their absence from the main wage-retro payment should not be treated as an error. The separate payment should be audited when it posts.',
  },
  {
    id: 'on-call-rate-2026-06-10',
    title: 'Non-restricted on-call rate increase effective 6/10/2026',
    status: RULE_STATUS.VERIFIED_IMPLEMENTATION_GUIDANCE,
    maySupportDiscrepancy: true,
    publicSummary: 'The agreement raises the non-restricted on-call rate beginning June 10, 2026, and management confirmed that call retro is due back to June 2026.',
    evidence: ['tentative-agreement Section 6.07 language', 'management implementation guidance relayed by negotiating-committee leadership, 2026-09-04'],
    caveat: 'The checker still needs real Workday on-call examples to validate the exact payroll code, callback variants, and weighted-overtime interaction before automating a complete call-pay audit.',
  },
  {
    id: 'bereavement-base-linked-1x',
    title: 'Bereavement is base-linked paid leave',
    status: RULE_STATUS.VERIFIED_CONTRACT_PLUS_PAYROLL,
    maySupportDiscrepancy: true,
    publicSummary: 'Bereavement pay is recalculated using the correct base wage for that time period.',
    evidence: ['CBA bereavement language', 'Test Case 002 Workday reversal/repost'],
  },
  {
    id: 'scheduled-personal-base-linked-1x',
    title: 'Scheduled Personal is base-linked paid time',
    status: RULE_STATUS.VERIFIED_CONTRACT_PLUS_PAYROLL,
    maySupportDiscrepancy: true,
    publicSummary: 'Scheduled Personal pay is recalculated using the correct base wage for that time period.',
    evidence: ['CBA paid personal leave language', 'Test Case 002 Workday reversal/repost'],
    caveat: 'Its exact weighted-regular-rate divisor treatment should remain separate from the direct 1× repricing rule.',
  },
  {
    id: 'certification-bonus-flat-dollar',
    title: 'Certification Bonus is a flat-dollar earning',
    status: RULE_STATUS.VERIFIED_AUTHORITATIVE,
    maySupportDiscrepancy: false,
    publicSummary: 'The certification bonus is a separate $500 lump-sum award for an eligible certification. It is not hourly pay, is not tied to the payroll week shown beside it, is not recalculated from the wage scale, and is not included in the weekly OT-rate calculation.',
    evidence: ['CBA Section 7.05 flat $500 certification bonus', 'Test Case 002 Workday example', 'confirmed project rule for certification-award payroll treatment'],
  },
  {
    id: 'underlying-hours-not-independently-verified',
    title: 'Underlying timekeeping is outside the retro-PDF audit',
    status: RULE_STATUS.SCOPE_DEFINITION,
    maySupportDiscrepancy: false,
    publicSummary: 'The retro PDF can show whether the hours listed by Workday were recalculated correctly. It cannot prove that every hour you actually worked was recorded in the first place.',
    evidence: ['data-source limitation'],
  },
  {
    id: 'tax-withholding-outside-gross-audit',
    title: 'Tax withholding is outside the first gross-earnings audit',
    status: RULE_STATUS.SCOPE_DEFINITION,
    maySupportDiscrepancy: false,
    publicSummary: 'A large tax withholding amount, or seeing current pay and retro pay on the same check, does not by itself mean the gross pay is wrong.',
    evidence: ['MVP scope definition'],
  },
];

const BY_ID = new Map(RULE_LEDGER.map((rule) => [rule.id, rule]));

export function getRuleLedgerEntry(id) {
  return BY_ID.get(id) || null;
}

export function ruleCanSupportDiscrepancy(id) {
  return Boolean(getRuleLedgerEntry(id)?.maySupportDiscrepancy);
}

export function publicRuleStatusLabel(status) {
  switch (status) {
    case RULE_STATUS.VERIFIED_AUTHORITATIVE: return 'Verified';
    case RULE_STATUS.VERIFIED_CONTRACT_PLUS_PAYROLL: return 'Verified';
    case RULE_STATUS.HIGHLY_VALIDATED_EMPIRICAL: return 'Highly tested';
    case RULE_STATUS.WELL_SUPPORTED: return 'Looks consistent; more examples wanted';
    case RULE_STATUS.VERIFIED_IMPLEMENTATION_GUIDANCE: return 'Confirmed implementation guidance';
    case RULE_STATUS.REPORTED_IMPLEMENTATION_GUIDANCE: return 'Reported guidance';
    case RULE_STATUS.UNRESOLVED: return 'Not enough information yet';
    case RULE_STATUS.SCOPE_DEFINITION: return 'What the checker can check';
    default: return 'Unknown status';
  }
}

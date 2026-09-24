import { noticesForStatement } from './implementation-notices.mjs';

export function assessPaymentCompleteness({ summary, fullAudit }) {
  const notices = noticesForStatement(summary);

  if (notices.length) {
    return {
      status: 'known-additional-payment-separate',
      title: 'Night / Resource increases are handled in Part 2',
      explanation: 'They are not counted as missing from Part 1. The later adjustment also includes overtime changes caused by the higher differentials.',
      notices,
    };
  }

  if (fullAudit?.materialUnknowns?.length) {
    return {
      status: 'completeness-cannot-be-established',
      title: "I can't tell whether anything else is still due",
      explanation: 'An unfamiliar pay type could affect the answer.',
      notices: [],
    };
  }

  return {
    status: 'completeness-not-yet-established',
    title: 'No separate payment is identified here',
    explanation: 'This only describes what the checker can see from this statement.',
    notices: [],
  };
}

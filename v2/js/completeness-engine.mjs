import { noticesForStatement } from './implementation-notices.mjs';

export function assessPaymentCompleteness({ summary, fullAudit }) {
  const notices = noticesForStatement(summary);

  if (notices.length) {
    return {
      status: 'known-additional-payment-pending',
      title: 'More retro pay is still coming',
      explanation: 'Night and Resource / Flow increases are being paid separately on the next check. This statement is not the final retro payment.',
      notices,
    };
  }

  if (fullAudit?.materialUnknowns?.length) {
    return {
      status: 'completeness-cannot-be-established',
      title: "I can't tell yet whether this is the final retro payment",
      explanation: 'An unfamiliar pay type could affect whether everything owed is included.',
      notices: [],
    };
  }

  return {
    status: 'completeness-not-yet-established',
    title: 'No other known retro payment is showing as pending',
    explanation: 'RetroCalc can check this statement, but during Beta it cannot promise that no other retro pay could still be due.',
    notices: [],
  };
}

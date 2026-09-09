const DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/g;
const MONEY_RE = /-?[\d,]+\.\d{2}/g;

function number(raw) {
  return Number(String(raw).replaceAll(',', ''));
}

/**
 * Parse only the statement-level fields needed for audit integrity.
 * The function is intentionally conservative: missing fields remain null.
 */
export function parseStatementMetadata(lines) {
  const textLines = lines.map((line) => typeof line === 'string' ? line : line.text);
  let payPeriodBegin = null;
  let payPeriodEnd = null;
  let checkDate = null;
  let currentGross = null;
  let currentPreTaxDeductions = null;
  let currentEmployeeTaxes = null;
  let currentPostTaxDeductions = null;
  let currentNetPay = null;

  const headerWindow = textLines.slice(0, 35);

  for (const line of headerWindow) {
    const dates = line.match(DATE_RE) || [];
    if (!payPeriodBegin && dates.length >= 3) {
      [payPeriodBegin, payPeriodEnd, checkDate] = dates.slice(0, 3);
    }

    if (currentGross == null && /^\s*Current\b/i.test(line)) {
      const amounts = line.match(MONEY_RE) || [];
      if (amounts.length >= 5) {
        [
          currentGross,
          currentPreTaxDeductions,
          currentEmployeeTaxes,
          currentPostTaxDeductions,
          currentNetPay,
        ] = amounts.slice(0, 5).map(number);
      }
    }
  }

  return {
    payPeriodBegin,
    payPeriodEnd,
    checkDate,
    currentGross,
    currentPreTaxDeductions,
    currentEmployeeTaxes,
    currentPostTaxDeductions,
    currentNetPay,
    completeForGrossAudit: Boolean(payPeriodBegin && payPeriodEnd && currentGross != null),
  };
}

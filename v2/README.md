# RetroCalc v2 Audit Prototype v0.8 - Plain-language UX + Guided Pay-Type Questions

This build changes the audit from a single “correct / incorrect” verdict into a deliberately conservative evidence model.

## Test Case 001 baseline

The known complete retro statement remains the primary regression case:

- 924 structured earnings rows
- 69 payroll-week date ranges
- printed/current gross: $15,213.48
- current-period earnings separated: $2,951.24
- gross retro on statement: **$12,262.24**
- independent whole-retro reconstruction: approximately **$12,262.17**
- ordinary OT: payroll $1,201.28 vs independent reconstruction about $1,201.33
- holiday OT: payroll $78.38 vs independent reconstruction about $78.35

## New in v0.4

### Two-axis result

RetroCalc now answers two different questions:

1. **Calculation status** — do the earnings included on this statement reconcile under sufficiently validated rules?
2. **Payment completeness** — does this appear to be the final payment of every retroactive item?

A statement can therefore be mathematically reconciled while still having a known later supplemental payment pending.

### Known pending Night / Resource supplemental retro

A time-sensitive implementation notice records the 2026-09-02 report that management advised the union that Night and Resource differential retro would be paid on a later check. This is deliberately classified as **reported implementation guidance**, not an authoritative effective-date rule. The exact retroactive period is not quantified until independently verified.

### Rule Ledger

`js/rule-ledger.mjs` records the evidentiary strength of rules used by the audit. A calculation difference may be labeled a **potential discrepancy** only when the underlying rule is strong enough to support that claim. A difference based on a merely well-supported or unresolved rule becomes **partially verified**, not “payroll error.”

### Scope boundaries

The Beta explicitly separates:

- gross earnings calculation: audited;
- original timekeeping completeness: not independently verified from the retro PDF;
- tax withholding: not audited in the first Beta;
- benefit deductions: not audited in the first Beta.

### Validation coverage

The public prototype states that the engine began with deep analysis of one complete pay history and actively seeks additional validation cases, especially:

- on-call / callback;
- step changes;
- non-Baylor OT;
- unfamiliar premiums;
- statements that appear to omit a historical period.

### Adversarial tests

Synthetic scenarios now ensure that:

- a gross mismatch becomes **Cannot determine**, not an underpayment claim;
- an unknown code in an OT week becomes **Partially verified**;
- a failure under a strong rule may become **Potential discrepancy**;
- a failure under a weak rule cannot become **Potential discrepancy**;
- a known later Night/Resource payment produces **Known additional payment pending**.

## Privacy

The browser prototype still processes selected PDF bytes locally with PDF.js. It currently loads pinned PDF.js executable code from jsDelivr. Production should self-host the pinned PDF.js build before publishing the strongest supply-chain/privacy language.

## Run regression tests

With a line-oriented text extraction of the known statement:

```bash
node tests/test-parser.mjs statement.txt
node tests/test-audit-engine.mjs statement.txt
node tests/test-full-audit.mjs statement.txt
node tests/test-decision-engine.mjs
node tests/test-completeness-engine.mjs
node tests/test-adversarial.mjs
```

Real payroll PDFs or extracted payroll text must not be committed to the public repository.


## Test Case 002 expansion

A second independent University Campus retro statement was analyzed without adding the private PDF to the project. It provides:

- non-Baylor overtime across 50 weeks;
- an observed wage-step transition from Step 12 to Step 13 during the retro window;
- a subsequent current-period Step 14 rate;
- Bereavement and Scheduled Personal base-linked retro codes;
- Certification Bonus as a flat-dollar code whose Hours column must not be interpreted literally;
- historical post-tax benefit-deduction adjustment lines.

Observed Test Case 002 headline values:

- printed gross: $9,523.18;
- current-period earnings: $1,926.96;
- gross retro: $7,596.22;
- independent reconstruction after validated direct-code classification: approximately $7,596.24;
- ordinary OT: 76.25 hours across 50 weeks, payroll retro $308.88, model about $308.91;
- Holiday Overtime: payroll $0.87, model about $0.87.

The private test statement and extracted text must not be committed to the public repository.


## New in v0.5

### Confirmed Night / Resource implementation

Negotiating-committee leadership relayed management confirmation that the Night differential increase to $5.50 and Resource differential increase to $3.75 are retroactive to April 2025 and are scheduled for a separate payment on the following check. The first retro check may therefore reconcile mathematically while remaining incomplete.

### Call-pay implementation

Call / on-call retro is confirmed back to June 2026. The agreement itself gives June 10, 2026 for the non-restricted on-call rate increase. Real Workday call/callback examples are still required before the automated call-pay audit is considered fully validated.

### Supplemental-differential analysis

`js/supplemental-differentials.mjs` calculates the portion of the pending Night / Resource adjustment that can be responsibly supported from the current statement. It uses YTD hours only when the YTD amount demonstrates that those hours were all paid at the old fixed rate, and separately reconstructs the secondary OT ripple for weeks where the necessary detail is visible. It does not invent April-December 2025 hours from a 2026 YTD field.

For Test Case 002, the 2026 statement supports:

- Night YTD: 928.5 hours at $5.00 -> direct increase $464.25
- Resource / Flow YTD: 192 hours at $3.50 -> direct increase $48.00
- Direct 2026 YTD pending: $512.25
- Secondary OT effect already reconstructable from itemized weeks: about $6.76
- Minimum additional 2026 amount currently calculable: about $519.01

This is explicitly **not** labeled the final April-2025-forward supplemental total because 2025 YTD differential hours are not available on the 2026 statement and some 2026 differential hours are not itemized by week.

### Personal reports

The prototype now includes a printable personal report path with:

- summary assessment;
- category-by-category Payroll vs RetroCalc reconciliation;
- confirmed pending supplemental items kept separate from the current-check audit;
- advanced overtime formulas and validation coverage;
- payroll / union review language that only recommends a correction request when the evidence supports one.

## New in v0.6 — Targeted clarification questions

RetroCalc now asks a small number of contextual questions only when the PDF leaves a real evidentiary gap.

### Missing historical differential question

If a 2026 statement contains YTD Night or Resource / Flow hours but the itemized retro rows for that differential first appear in 2026, RetroCalc does **not** assume that April-December 2025 qualifying hours were zero. It asks separately for each affected differential:

> Your retro statement first shows this differential in 2026. Did you work qualifying hours between 4/6/2025 and 12/31/2025?

- **No**: the direct 2026 YTD differential amount may be treated as the complete direct April-2025-forward differential correction for that code.
- **Yes**: additional historical evidence is required; RetroCalc does not invent the missing hours.
- **I'm not sure**: the uncertainty remains explicit.

This question is specifically designed to prevent a missing-data situation from being mistaken for zero hours.

### Step-anniversary validation question

When the historical base rate itself changes during the retro period, RetroCalc can ask for the RN step anniversary month/day as an optional validation question. The observed payroll rates remain the source for the dollar audit. The anniversary answer is used to assess whether the observed transition is consistent with the payroll week containing the anniversary.

Test Case 002 now provides a real-world example: the employee reported an RN anniversary of 8/25 and the observed Step 12 -> Step 13 transition begins with the 8/24/2025 payroll week, which contains that anniversary.

### Why this matters

The preferred UX is now:

**PDF first -> detect ambiguity -> ask one precise question -> update conclusion**

rather than asking every user for a long list of payroll-history fields before the audit begins.

## New in v0.8 - Plain-language UX pass + pay-type questions

RetroCalc now treats plain language as a product requirement, not a cosmetic preference.

### Observe first, ask only when the answer matters

The optional step-anniversary input has been removed from the normal flow. RetroCalc now reads the rate history first and states what it sees in ordinary language, for example:

> Your pay appears to move from Step 12 to Step 13 starting with the week of Aug 24, 2025. Your current pay is at Step 14 starting with the week of Aug 23, 2026. That suggests your yearly step increase happens around late August.

The user is not asked for an anniversary date unless a future workflow actually needs that information to resolve a disagreement.

The 2025 Night / Resource questions remain automatic because the answers can materially change the supplemental amount.

### Simple observations instead of parser language

Recognized facts that do not need a response are stated directly. Example:

> It looks like you received a $500 certification bonus in November 2025.

Internal concepts such as flat-dollar code, downstream treatment, divisor, and weighted regular rate are kept out of the normal result unless the user opens the detailed math.

### Question or problem? per pay type

The pay-by-pay table now shows:

- Workday paid
- RetroCalc calculated
- Difference
- a plain result such as Matches / Needs a closer look / Not enough information
- a subtle Question or problem? action

The action opens questions that are specific to that pay type. Overtime offers choices such as "The OT rate looks wrong" and "I don't understand why the OT rate changes." Regular pay offers step/rate/hour choices. Night and Resource / Flow can guide the user toward missing historical-pay questions.

### User-facing wording pass

Public result titles, completeness messages, pending-payment notices, unknown-code notices, coverage copy, clarification prompts, OT explanations, pay-rule descriptions, and printable reports were rewritten to prefer ordinary nursing/paycheck language over payroll-programming language.

Core internal terminology and rule IDs remain unchanged so the audit engine stays precise under the hood.


## v0.8 differential-history safeguard
- Never treat missing week-by-week Night or Charge rows as proof that the employee had zero differential hours.
- Compare year-to-date differential totals with the itemized rows and flag when the statement does not show every hour week by week.
- Use YTD totals for the direct current-year differential increase when the rate is uniform.
- Do not require old pay stubs in the normal user flow. If prior-year hours are confirmed but not itemized, explain the limit and audit the separate supplemental statement when it posts.
- Do not present a partial calculation as the final expected supplemental payment.

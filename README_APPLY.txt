Retro Pay Checker — final release candidate
Prepared 2026-09-23

PURPOSE
This is the exact tree used for the final automated pre-release review.
Apply/test it on v2-audit-dev before anything is merged to main.

USER-FACING CHECKS
1. Main retro payment
   - For most nurses: 9/3/2026
   - Reconstructs the main wage retro and related overtime.
   - May identify a lower bound for the later Night & Resource correction when enough history is visible. That lower bound is not presented as a prediction of the full later payment.

2. Night & Resource retro payment
   - For most nurses: 9/24/2026
   - Night: $5.00 -> $5.50
   - Resource / Flow (Workday Charge Pay): $3.50 -> $3.75
   - Identifies and, when the main-retro PDF is also supplied, independently reconstructs the related OT correction.

3. Check both retro payments
   - Accepts the two PDFs in either order.
   - Produces one combined result and combined report.

UNRESOLVED CALL / CALLBACK PAY
Charge Pay in the validated examples means Resource / Flow. It is not Call Pay.
Call / callback retro remains unresolved because there are not yet enough real Workday examples to safely identify every label, correction pattern, payment placement, or OT interaction.
If an unfamiliar Call Pay line could affect the answer, the checker must downgrade/stop rather than guess.

IMPORTANT SAFETY FIX IN THIS RC
The Night & Resource audit now independently requires the parsed statement lines to reconcile to Workday's printed gross. A truncated/corrupt PDF therefore cannot be called reconciled simply because the surviving adjustment rows balance among themselves.
Unknown historical pay types and unmatched old/new differential hours also prevent full verification.

SAFARI
Do not replace or rewrite v2/js/pdf-text.mjs.
The current Safari/WebKit-safe path is:
  page.streamTextContent().getReader()
The previous page.getTextContent() path must not be reintroduced.

REPORTS
Reports do not launch Print automatically.
They provide:
- Save or send
- Download
- Print / Save PDF
- Back

WAGE SCALE
The Wage Scale uses the same Save / Download / Print interaction pattern.

ANALYTICS
GoatCounter endpoint:
  https://andyr83.goatcounter.com/count
Only anonymous page paths and generic named feature events are intended for analytics.
Do not add PDF contents, filenames, names, employee IDs, pay amounts, pay codes, statement/check dates, or audit results to analytics event names/payloads.

LOCAL SERVER
From repository root:
  npx.cmd --yes http-server . -p 8000 -c-1

Open:
  http://127.0.0.1:8000/

FINAL RELEASE GATE
Before merging to main:
- run the repository Node tests;
- test the Main retro checker with Andy's 9/3 PDF;
- test the Night & Resource checker with Andy's 9/24 PDF;
- test both-PDF mode in both upload orders;
- test a second upload without refreshing the page;
- test reports and Wage Scale actions on iPhone/Safari;
- confirm GoatCounter receives only expected anonymous page/event counts.

KNOWN REAL-STATEMENT TARGETS
Andy main retro:
  Workday:       $12,262.24
  Independent:  ~$12,262.17
  Difference:   ~$0.07

Tina main retro:
  Workday:       $7,596.22
  Independent:  ~$7,596.24
  Difference:   ~$0.02

Andy 9/3 lower bound for later Night & Resource retro:
  At least:      $602.72
  This is NOT the expected total later payment.

Andy Night & Resource retro:
  Workday:       $1,415.30
  Night:         $1,009.02
  Resource/Flow: $341.30
  Ordinary OT:   $61.94
  Holiday OT:    $3.04
  Independent:   ~$1,415.03
  Difference:    ~$0.27

Andy combined:
  Workday:       $13,677.54
  Independent:  ~$13,677.20
  Difference:    ~$0.34

See FINAL_VALIDATION.txt for the complete automated QA record.

SOCIAL / LINK PREVIEW
The landing page now uses updated Open Graph / Twitter metadata for the expanded checker.
New social image:
  assets/retro-pay-checker-social-2026.09.23.png

The image is exactly 1200 x 630 and shows:
- 9/3 Main retro
- 9/24 Night & Resource retro
- Check both
- independent calculation
- PDFs stay on the user's device

The metadata intentionally points to the new versioned image filename rather than overwriting the old social image URL. This reduces the chance that Facebook continues serving its cached 9/3-only card.

After the update is live, open Facebook Sharing Debugger, enter:
  https://andyri83.github.io/retro-pay-estimator/
and choose Scrape Again.

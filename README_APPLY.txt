Retro Pay Checker - final pre-release safety replacements
=========================================================

These files are complete replacements built from the clean RC7.1 branch.

What this update changes
------------------------
1. Keeps 9/3/2026 as the normal/default pay stub for the main wage retro.
2. Allows a rare later main-retro statement to be recognized by its contents rather than its check date.
3. Refuses to mistake a Night/Resource-only or ordinary pay stub for the main wage retro.
4. Independently checks Workday's old-rate -> corrected-rate pairs against the official Step 1-17 wage scale for:
   - 4/6/2025 +3.25%
   - 4/5/2026 +3.00%
5. Makes Certification Bonus explicitly a separate $500 lump-sum award:
   - not hourly pay
   - not wage retro
   - not tied to the displayed payroll week
   - not included in the weekly OT-rate calculation
6. Keeps Night / Resource retro separate from the main wage retro and does not predict a payment date.
7. Adds v2/tests/test-release-safety.mjs.

How to apply
------------
Copy the CONTENTS of this folder into the root of your GitHub Repo folder and choose Replace when Windows asks.
The folder structure must remain intact (index.html at root, v2/js/... inside v2/js, etc.).

After copying, from the GitHub Repo folder run:

& "C:\Program Files\nodejs\node.exe" --check .\v2\js\decision-engine.mjs
& "C:\Program Files\nodejs\node.exe" .\v2\tests\test-release-safety.mjs
& "C:\Program Files\nodejs\node.exe" .\v2\tests\test-decision-engine.mjs
& "C:\Program Files\nodejs\node.exe" .\v2\tests\test-new-pay-codes.mjs
& "C:\Program Files\nodejs\node.exe" .\v2\tests\test-adversarial.mjs
& "C:\Program Files\nodejs\node.exe" .\v2\tests\test-completeness-engine.mjs

Expected result: all tests exit successfully. test-release-safety reports 34 verified rate pairs.

Do NOT merge PR #1 until the local site has also been checked with the real Raposo and Tina PDFs.

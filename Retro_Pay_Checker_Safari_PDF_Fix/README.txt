Retro Pay Checker Safari/WebKit PDF fix

Replace this repository file:
  v2/js/pdf-text.mjs

with the included replacement at the same path.

No payroll calculation logic is changed. The only functional change is how PDF.js text
content is consumed: streamTextContent().getReader() is used instead of getTextContent().
This avoids a known Safari/WebKit failure in PDF.js 6.x where async iteration over a
ReadableStream throws "undefined is not a function".

After replacing, test the known-good Andy and Tina PDFs on desktop, then test the same
PDF on an affected iPhone before merging/deploying.

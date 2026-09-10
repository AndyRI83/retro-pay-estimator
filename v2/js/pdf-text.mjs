/**
 * Convert PDF.js text items into line-oriented text while preserving reading order.
 * This intentionally keeps the PDF inside the browser. No network request includes file bytes.
 */
export async function extractPdfLines(file, pdfjsLib, { yTolerance = 2.5 } = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const allLines = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const items = content.items
      .filter((item) => typeof item.str === 'string' && item.str.length)
      .map((item) => ({
        text: item.str,
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
        width: item.width ?? 0,
      }));

    // PDF coordinate system runs bottom-up. Group nearby y positions into visual lines.
    const groups = [];
    for (const item of items.sort((a, b) => (b.y - a.y) || (a.x - b.x))) {
      let group = groups.find((candidate) => Math.abs(candidate.y - item.y) <= yTolerance);
      if (!group) {
        group = { y: item.y, items: [] };
        groups.push(group);
      }
      group.items.push(item);
      // Smooth the representative y slightly so tiny glyph offsets do not fragment lines.
      group.y = group.items.reduce((sum, x) => sum + x.y, 0) / group.items.length;
    }

    groups.sort((a, b) => b.y - a.y);

    for (const group of groups) {
      const sorted = group.items.sort((a, b) => a.x - b.x);
      let line = '';
      let previousRight = null;
      let averageCharWidth = 5;

      for (const item of sorted) {
        const charWidth = item.text.length ? item.width / item.text.length : averageCharWidth;
        if (Number.isFinite(charWidth) && charWidth > 0) averageCharWidth = charWidth;

        if (previousRight != null) {
          const gap = item.x - previousRight;
          const spaces = gap > averageCharWidth * 0.8
            ? Math.max(1, Math.min(12, Math.round(gap / Math.max(averageCharWidth, 2))))
            : 1;
          line += ' '.repeat(spaces);
        }

        line += item.text;
        previousRight = item.x + item.width;
      }

      allLines.push({ page: pageNumber, text: line.trimEnd() });
    }
  }

  return { pageCount: pdf.numPages, lines: allLines };
}

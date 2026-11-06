// Builds small, valid PDF files for tests without a PDF library.
//
//   makePdf(['page one text', 'page two text'])   -> Buffer with 2 pages of Helvetica text
//   makePdf([''])                                  -> 1 page, no text layer (like a scanned page)
//   makePdf(Array(31).fill('x'))                   -> 31 pages
//
// Each page is a Letter page with one text object. Line breaks in a page string become separate lines.

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

function escapePdfString(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function contentStream(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const body = lines.map((line, i) => `${i === 0 ? '' : 'T* '}(${escapePdfString(line)}) Tj`).join('\n');
  return `BT /F1 12 Tf 14 TL 72 ${PAGE_HEIGHT - 72} Td\n${body}\nET`;
}

function makePdf(pageTexts) {
  if (!Array.isArray(pageTexts) || pageTexts.length === 0) {
    throw new Error('makePdf needs at least one page');
  }

  // Object numbering: 1 catalog, 2 pages, 3 font, then (page, content) pairs.
  const objects = [];
  const pageIds = pageTexts.map((_, i) => 4 + i * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageTexts.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pageTexts.forEach((text, i) => {
    const pageId = pageIds[i];
    const stream = contentStream(text);
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;
  });

  let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = Buffer.byteLength(out, 'latin1');
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(out, 'latin1');
  const count = objects.length;
  out += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let id = 1; id < count; id++) {
    out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(out, 'latin1');
}

module.exports = { makePdf };

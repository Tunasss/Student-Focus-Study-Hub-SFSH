// Natural chapter numbering and sorting utility.
// Identifies chapter indices from slide filenames or chapter titles
// (e.g., "Chapter 6", "Chương 1", "02_Intro.pdf", "Slide 3.pdf") to ensure
// uploaded lecture files and extracted chapters are ordered numerically,
// even when files were uploaded in arbitrary or reverse browser order.

function extractChapterNumber(str) {
  if (!str) return null;
  const s = String(str).trim();
  const m1 = s.match(/(?:chapter|chương|chuong|ch|bài|bai|lesson|unit|part|week|tuần|tuan|lecture|lec|slide)\s*[-_.:#]?\s*(\d+(?:\.\d+)?)/i);
  if (m1) return parseFloat(m1[1]);

  const m2 = s.match(/^(\d+(?:\.\d+)?)\s*[-_.:\s]/);
  if (m2) return parseFloat(m2[1]);

  const m3 = s.match(/[-_.\s](\d+(?:\.\d+)?)(?:[-_.\s]|$|\.pdf|\.pptx?)/i);
  if (m3) return parseFloat(m3[1]);

  return null;
}

function compareChapterItems(a, b) {
  const nameA = typeof a === 'string' ? a : (a?.name || a?.fileName || a?.originalname || a?.title || a?.sourceFile || a?.source_file || '');
  const nameB = typeof b === 'string' ? b : (b?.name || b?.fileName || b?.originalname || b?.title || b?.sourceFile || b?.source_file || '');

  const numA = extractChapterNumber(nameA);
  const numB = extractChapterNumber(nameB);

  if (numA !== null && numB !== null) {
    if (numA !== numB) return numA - numB;
  } else if (numA !== null) {
    return -1;
  } else if (numB !== null) {
    return 1;
  }

  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
}

function sortChaptersNaturally(chapters) {
  if (!Array.isArray(chapters)) return [];
  return [...chapters].sort((a, b) => {
    const numA = extractChapterNumber(a.title) ?? extractChapterNumber(a.sourceFile ?? a.source_file);
    const numB = extractChapterNumber(b.title) ?? extractChapterNumber(b.sourceFile ?? b.source_file);
    if (numA !== null && numB !== null) {
      if (numA !== numB) return numA - numB;
    } else if (numA !== null) {
      return -1;
    } else if (numB !== null) {
      return 1;
    }
    return (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0);
  });
}

module.exports = {
  extractChapterNumber,
  compareChapterItems,
  sortChaptersNaturally,
};


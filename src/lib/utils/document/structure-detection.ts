/**
 * Structure detection utility
 * Heuristic-based detection of document structure (headings, sections, etc.)
 */

import type { NormalizedText } from "./text-normalization";

export type StructuralElement = {
  type: "heading" | "paragraph" | "list-item";
  level: number; // 1 = top level, 2 = subsection, etc.
  text: string;
  pageNumber: number;
  confidence: number; // 0-1, how confident we are this is a heading
  numbering?: string; // e.g., "1.", "(1)", "CHAPTER 1"
};

/**
 * Detect if text is ALL CAPS
 */
function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

/**
 * Detect numbered sections (1., (1), CHAPTER 1, PART I, etc.)
 */
function detectNumbering(text: string): string | null {
  const trimmed = text.trim();

  // Chapter patterns: CHAPTER 1, Chapter 1, CHAPTER ONE
  const chapterMatch = trimmed.match(/^CHAPTER\s+([IVX\d]+|[A-Z]+)/i);
  if (chapterMatch) return `CHAPTER ${chapterMatch[1]}`;

  // Part patterns: PART I, Part 1
  const partMatch = trimmed.match(/^PART\s+([IVX\d]+|[A-Z]+)/i);
  if (partMatch) return `PART ${partMatch[1]}`;

  // Numbered sections: 1., (1), 1.1, 1.1.1
  const numberedMatch = trimmed.match(/^(\d+(?:\.\d+)*)[.)]/);
  if (numberedMatch) return numberedMatch[1];

  // Lettered sections: (a), (i), A.
  const letteredMatch = trimmed.match(/^\(([a-z]+)\)|^([A-Z])\./i);
  if (letteredMatch) return letteredMatch[1] || letteredMatch[2];

  // Roman numerals: I., II., (I)
  const romanMatch = trimmed.match(/^([IVX]+)[.)]/);
  if (romanMatch) return romanMatch[1];

  return null;
}

/**
 * Calculate font size dominance score
 * Higher score = more likely to be a heading
 */
// function calculateFontSizeScore(
//   text: string,
//   avgFontSize: number,
//   fontSize: number
// ): number {
//   if (avgFontSize === 0) return 0.5;

//   const ratio = fontSize / avgFontSize;
//   if (ratio >= 1.3) return 1.0; // Much larger
//   if (ratio >= 1.15) return 0.8; // Larger
//   if (ratio >= 1.0) return 0.6; // Same or slightly larger
//   return 0.3; // Smaller
// }

/**
 * Calculate heading confidence score
 */
function calculateHeadingConfidence(
  text: string,
  hasNumbering: boolean,
  isCaps: boolean,
  fontSizeScore: number,
  length: number
): number {
  let confidence = 0;

  // Numbering is strong indicator
  if (hasNumbering) confidence += 0.4;

  // ALL CAPS is strong indicator
  if (isCaps) confidence += 0.3;

  // Font size dominance
  confidence += fontSizeScore * 0.2;

  // Length heuristic: headings are usually short
  if (length < 100) confidence += 0.1;
  if (length > 200) confidence -= 0.2;

  // Starts with common heading words
  const headingWords =
    /^(section|chapter|part|article|subsection|sub-section)/i;
  if (headingWords.test(text)) confidence += 0.2;

  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Detect document structure from normalized text
 */
export function detectStructure(
  normalized: NormalizedText[]
): StructuralElement[] {
  const elements: StructuralElement[] = [];

  // Calculate average font size (we don't have this in normalized text, so we'll skip font-based detection)
  // In a real implementation, you'd pass font size data through normalization
  // const avgFontSize = 12; // Default assumption

  for (const item of normalized) {
    const paragraphs = item.text
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0);

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length === 0) continue;

      const numbering = detectNumbering(trimmed);
      const isCaps = isAllCaps(trimmed);
      const fontSizeScore = 0.5; // Default since we don't have font data in normalized text
      const confidence = calculateHeadingConfidence(
        trimmed,
        numbering !== null,
        isCaps,
        fontSizeScore,
        trimmed.length
      );

      // Determine level based on numbering pattern
      let level = 1;
      if (numbering) {
        const parts = numbering.split(".");
        level = parts.length;
      } else if (isCaps && trimmed.length < 100) {
        level = 1; // Top-level heading
      } else if (confidence > 0.6) {
        level = 2; // Subheading
      }

      // Classify as heading if confidence is high enough
      if (confidence > 0.5) {
        elements.push({
          type: "heading",
          level,
          text: trimmed,
          pageNumber: item.pageNumber,
          confidence,
          numbering: numbering || undefined,
        });
      } else {
        // Regular paragraph or list item
        const isListItem = /^[-•*]\s+|^\d+[.)]\s/.test(trimmed);
        elements.push({
          type: isListItem ? "list-item" : "paragraph",
          level: 0,
          text: trimmed,
          pageNumber: item.pageNumber,
          confidence: 1.0 - confidence,
          numbering: isListItem
            ? detectNumbering(trimmed) || undefined
            : undefined,
        });
      }
    }
  }

  return elements;
}

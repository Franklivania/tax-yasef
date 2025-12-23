/**
 * Text normalization utility
 * Cleans, merges, and normalizes extracted PDF text while preserving structure
 */

import type { ExtractedPage } from "./pdf-extraction";

export type NormalizedText = {
  text: string;
  pageNumber: number;
  pageRange?: { start: number; end: number };
};

/**
 * Merge broken line wraps and normalize whitespace
 */
function mergeLineWraps(text: string): string {
  // Replace multiple spaces with single space
  let normalized = text.replace(/\s+/g, " ");

  // Merge hyphenated line breaks (word- \n word -> word-word)
  normalized = normalized.replace(/(\w+)-\s+\n\s*(\w+)/g, "$1$2");

  // Merge soft line breaks (words split across lines)
  // This is heuristic: if line ends with lowercase and next starts with lowercase, likely a wrap
  normalized = normalized.replace(/([a-z])\s+\n\s+([a-z])/g, "$1 $2");

  return normalized.trim();
}

/**
 * Detect repeating headers/footers by checking for identical text at page boundaries
 */
function detectRepeatingContent(pages: ExtractedPage[]): Set<string> {
  const repeating = new Set<string>();
  const pageTexts = pages.map((page) =>
    page.items.map((item) => item.text).join(" ")
  );

  // Check first and last lines of each page
  const firstLines = new Map<string, number>();
  const lastLines = new Map<string, number>();

  for (const pageText of pageTexts) {
    const lines = pageText.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim().toLowerCase();
    const lastLine = lines[lines.length - 1].trim().toLowerCase();

    firstLines.set(firstLine, (firstLines.get(firstLine) || 0) + 1);
    lastLines.set(lastLine, (lastLines.get(lastLine) || 0) + 1);
  }

  // If a line appears in more than 50% of pages, consider it repeating
  const threshold = Math.max(2, pages.length * 0.5);

  for (const [line, count] of firstLines.entries()) {
    if (count >= threshold && line.length > 3) {
      repeating.add(line);
    }
  }

  for (const [line, count] of lastLines.entries()) {
    if (count >= threshold && line.length > 3) {
      repeating.add(line);
    }
  }

  return repeating;
}

/**
 * Remove repeating headers/footers from text
 */
function removeRepeatingContent(text: string, repeating: Set<string>): string {
  let cleaned = text;

  for (const pattern of repeating) {
    // Remove at start of line
    const regex = new RegExp(
      `^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "gmi"
    );
    cleaned = cleaned.replace(regex, "");

    // Remove at end of line
    const endRegex = new RegExp(
      `${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "gmi"
    );
    cleaned = cleaned.replace(endRegex, "");
  }

  return cleaned;
}

/**
 * Preserve paragraph boundaries
 * Detects paragraph breaks based on spacing and formatting
 */
function preserveParagraphs(text: string): string {
  // Normalize multiple newlines to double newline (paragraph break)
  let normalized = text.replace(/\n{3,}/g, "\n\n");

  // Ensure single newlines within paragraphs become spaces
  // But preserve intentional line breaks (e.g., lists, addresses)
  normalized = normalized.replace(
    /([^\n])\n([^\n])/g,
    (_match, before, after) => {
      // If line ends with punctuation and next starts with capital, likely paragraph break
      if (/[.!?]\s*$/.test(before) && /^[A-Z]/.test(after)) {
        return `${before}\n\n${after}`;
      }
      // Otherwise, merge with space
      return `${before} ${after}`;
    }
  );

  return normalized;
}

/**
 * Normalize extracted PDF text
 * Merges line wraps, removes repeating headers/footers, preserves paragraphs
 */
export function normalizeText(pages: ExtractedPage[]): NormalizedText[] {
  // First, merge items per page into text
  const pageTexts = pages.map((page) => {
    // Sort items by Y position (top to bottom), then X (left to right)
    const sortedItems = [...page.items].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 5) {
        // Different lines
        return b.y - a.y; // Top to bottom
      }
      // Same line, sort left to right
      return a.x - b.x;
    });

    return sortedItems.map((item) => item.text).join(" ");
  });

  // Detect repeating content
  const repeating = detectRepeatingContent(pages);

  // Normalize each page
  const normalized: NormalizedText[] = [];

  for (let i = 0; i < pageTexts.length; i++) {
    let text = pageTexts[i];

    // Merge line wraps
    text = mergeLineWraps(text);

    // Remove repeating headers/footers
    text = removeRepeatingContent(text, repeating);

    // Preserve paragraphs
    text = preserveParagraphs(text);

    // Final whitespace normalization
    text = text.replace(/\s+/g, " ").trim();

    if (text.length > 0) {
      normalized.push({
        text,
        pageNumber: pages[i].pageNumber,
      });
    }
  }

  return normalized;
}

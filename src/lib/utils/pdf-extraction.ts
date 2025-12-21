/**
 * PDF extraction utility
 * Extracts text with position, font size, and page information from PDFs
 */

import * as pdfjsLib from "pdfjs-dist";

// Configure worker once at module level
let workerConfigured = false;

async function configureWorker(): Promise<void> {
  if (typeof window === "undefined" || workerConfigured) return;

  try {
    const workerModule =
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    const workerUrl = workerModule.default || workerModule;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      typeof workerUrl === "string" ? workerUrl : String(workerUrl);
    workerConfigured = true;

    if (import.meta.env.DEV) {
      console.log(
        "PDF.js worker configured:",
        pdfjsLib.GlobalWorkerOptions.workerSrc
      );
    }
  } catch (error) {
    console.warn(
      "Failed to load local PDF worker, falling back to CDN:",
      error
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
}

export type TextItem = {
  text: string;
  fontSize: number;
  x: number;
  y: number;
  pageNumber: number;
  fontName?: string;
};

export type ExtractedPage = {
  pageNumber: number;
  items: TextItem[];
};

/**
 * Load PDF from File or URL
 */
async function loadPDF(source: File | string): Promise<ArrayBuffer> {
  if (source instanceof File) {
    return await source.arrayBuffer();
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(
      `Failed to load PDF: ${response.status} ${response.statusText}`
    );
  }
  return await response.arrayBuffer();
}

/**
 * Extract text items from PDF with position and formatting data
 */
export async function extractPDFText(
  source: File | string
): Promise<ExtractedPage[]> {
  await configureWorker();

  const arrayBuffer = await loadPDF(source);

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      const items: TextItem[] = [];

      for (const item of textContent.items) {
        if (!("str" in item) || !("transform" in item)) {
          continue;
        }

        if (item.str.trim().length === 0) {
          continue;
        }

        const transform = item.transform as number[];
        // transform[4] = x, transform[5] = y
        const x = transform[4];
        const y = viewport.height - transform[5]; // Flip Y coordinate

        // Extract font size from transform matrix
        // transform[0] = scaleX, transform[3] = scaleY
        const fontSize = Math.abs(transform[0]) || Math.abs(transform[3]) || 12;

        items.push({
          text: item.str,
          fontSize,
          x,
          y,
          pageNumber: pageNum,
          fontName: "fontName" in item ? String(item.fontName) : undefined,
        });
      }

      pages.push({
        pageNumber: pageNum,
        items,
      });
    } catch (pageError) {
      console.warn(`Error extracting text from page ${pageNum}:`, pageError);
      // Continue with other pages
      pages.push({
        pageNumber: pageNum,
        items: [],
      });
    }
  }

  if (pages.every((page) => page.items.length === 0)) {
    throw new Error(
      "Failed to extract text from PDF. The PDF may be corrupted or have an invalid structure."
    );
  }

  return pages;
}

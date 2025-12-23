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
    // Validate file type
    if (source.type && !source.type.includes("pdf")) {
      throw new Error(`Invalid file type: ${source.type}. Expected PDF file.`);
    }
    return await source.arrayBuffer();
  }

  // Validate URL
  try {
    const url = new URL(source);
    if (!url.pathname.toLowerCase().endsWith(".pdf")) {
      console.warn(`URL does not end with .pdf: ${source}`);
    }
  } catch {
    // If URL parsing fails, it might be a relative path - that's okay
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(
      `Failed to load PDF: ${response.status} ${response.statusText}. Please ensure the PDF file exists at: ${source}`
    );
  }

  const contentType = response.headers.get("content-type");
  if (
    contentType &&
    !contentType.includes("pdf") &&
    !contentType.includes("octet-stream")
  ) {
    console.warn(`Unexpected content type: ${contentType}. Expected PDF.`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // Validate PDF header (PDF files start with %PDF)
  const uint8Array = new Uint8Array(arrayBuffer.slice(0, 4));
  const header = String.fromCharCode(...uint8Array);
  if (header !== "%PDF") {
    throw new Error(
      `Invalid PDF file: File does not have a valid PDF header. Found: ${header}. The file may be corrupted or not a valid PDF.`
    );
  }

  return arrayBuffer;
}

/**
 * Extract text items from PDF with position and formatting data
 */
export async function extractPDFText(
  source: File | string
): Promise<ExtractedPage[]> {
  await configureWorker();

  const arrayBuffer = await loadPDF(source);

  // Validate array buffer size
  if (arrayBuffer.byteLength === 0) {
    throw new Error(
      "PDF file is empty. Please ensure the PDF file exists and is not corrupted."
    );
  }

  if (arrayBuffer.byteLength < 100) {
    throw new Error(
      "PDF file is too small to be valid. Please ensure the PDF file is not corrupted."
    );
  }

  let loadingTask;
  let pdf;

  try {
    loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      // Add error recovery options
      stopAtErrors: false,
      maxImageSize: 1024 * 1024 * 10, // 10MB max image size
    });

    pdf = await loadingTask.promise;
  } catch (error) {
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.name === "InvalidPDFException") {
        throw new Error(
          `Invalid PDF structure: The PDF file appears to be corrupted or has an invalid structure. ` +
            `Please verify that the PDF file at "${typeof source === "string" ? source : source.name}" is valid. ` +
            `Original error: ${error.message}`
        );
      }
      if (error.message.includes("Missing PDF")) {
        throw new Error(
          `Missing PDF header: The file does not appear to be a valid PDF. ` +
            `Please ensure the file exists and is a valid PDF document.`
        );
      }
    }
    throw error;
  }
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

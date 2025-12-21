/**
 * Document manager
 * Manages document ingestion and provides query interface
 */

import { ingestDocument, type IngestedDocument } from "./document-ingestion";
import {
  queryDocument,
  getChunksForAI,
  type QueryResponse,
} from "./document-query";

let currentDocument: IngestedDocument | null = null;

/**
 * Load and ingest document
 */
export async function loadDocument(
  source: File | string,
  options?: { forceReingest?: boolean }
): Promise<IngestedDocument> {
  const document = await ingestDocument(source, options);
  currentDocument = document;
  return document;
}

/**
 * Get current loaded document
 */
export function getCurrentDocument(): IngestedDocument | null {
  return currentDocument;
}

/**
 * Query current document
 */
export function queryCurrentDocument(
  query: string,
  options?: { limit?: number; minScore?: number }
): QueryResponse | null {
  if (!currentDocument) {
    return null;
  }
  return queryDocument(currentDocument, query, options);
}

/**
 * Get AI context from query
 * Always returns some context, even if query doesn't match perfectly
 */
export function getAIContextFromQuery(
  query: string,
  maxTokens: number = 4000
): string | null {
  if (!currentDocument) {
    return null;
  }

  const queryResponse = queryCurrentDocument(query, {
    limit: 15, // Get more chunks for better context
    minScore: 0.01, // Very lenient threshold
  });

  if (!queryResponse || queryResponse.results.length === 0) {
    // Fallback: return general chunks from document
    const fallbackResponse = queryDocument(
      currentDocument,
      "tax act provisions",
      {
        limit: 10,
        minScore: 0.01,
      }
    );
    if (fallbackResponse.results.length > 0) {
      return getChunksForAI(fallbackResponse, maxTokens);
    }
    return null;
  }

  return getChunksForAI(queryResponse, maxTokens);
}

/**
 * Check if document is loaded
 */
export function isDocumentLoaded(): boolean {
  return currentDocument !== null;
}

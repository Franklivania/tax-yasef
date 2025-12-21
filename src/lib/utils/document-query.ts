/**
 * Document query API
 * Exposes query interface for retrieving relevant chunks from ingested documents
 */

import { searchIndexedDocument } from "./document-indexing";
import type { IngestedDocument } from "./document-ingestion";
import type { Chunk } from "./chunking";

export type QueryResult = {
  chunk: Chunk;
  score: number;
  relevance: "high" | "medium" | "low";
};

export type QueryResponse = {
  results: QueryResult[];
  totalResults: number;
  query: string;
};

/**
 * Expand query with tax-related terms for better matching
 */
function expandQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  const taxTerms = [
    "tax",
    "taxation",
    "income",
    "chargeable",
    "assessable",
    "deduction",
    "allowance",
    "exemption",
    "relief",
  ];

  // If query doesn't contain tax terms, add them for better matching
  const hasTaxTerm = taxTerms.some((term) => lowerQuery.includes(term));
  if (!hasTaxTerm) {
    return `${query} tax income chargeable`;
  }

  return query;
}

/**
 * Query ingested document
 * Returns top-K ranked chunks with relevance scores
 * Always returns at least some chunks as fallback
 */
export function queryDocument(
  document: IngestedDocument,
  query: string,
  options?: {
    limit?: number;
    minScore?: number;
  }
): QueryResponse {
  const limit = options?.limit || 10;
  const minScore = options?.minScore || 0.01; // Lower threshold for more lenient matching

  // Expand query for better matching
  const expandedQuery = expandQuery(query);

  // Search the index with expanded query
  let searchResults = searchIndexedDocument(
    document.indexedDocument,
    expandedQuery,
    limit * 3 // Get more results
  );

  // If no results with expanded query, try original query
  if (searchResults.length === 0) {
    searchResults = searchIndexedDocument(
      document.indexedDocument,
      query,
      limit * 3
    );
  }

  // If still no results, try individual words from query
  if (searchResults.length === 0 && query.trim().length > 0) {
    const words = query
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3); // Try first 3 meaningful words

    for (const word of words) {
      const wordResults = searchIndexedDocument(
        document.indexedDocument,
        word,
        limit
      );
      if (wordResults.length > 0) {
        searchResults.push(...wordResults);
        break;
      }
    }
  }

  // If still no results, return general chunks from the document as fallback
  if (searchResults.length === 0) {
    // Return first few chunks as general context
    const fallbackChunks = document.chunks.slice(0, limit);
    searchResults = fallbackChunks.map((chunk, idx) => ({
      chunk,
      score: 0.1 / (idx + 1), // Low but non-zero score
    }));
  }

  // Filter and categorize by relevance
  const results: QueryResult[] = searchResults
    .filter((result) => result.score >= minScore)
    .slice(0, limit)
    .map((result) => {
      let relevance: "high" | "medium" | "low";
      if (result.score >= 0.5) {
        relevance = "high";
      } else if (result.score >= 0.2) {
        relevance = "medium";
      } else {
        relevance = "low";
      }

      return {
        chunk: result.chunk,
        score: result.score,
        relevance,
      };
    });

  return {
    results,
    totalResults: results.length,
    query,
  };
}

/**
 * Get chunks for AI context
 * Formats query results for AI consumption
 */
export function getChunksForAI(
  queryResponse: QueryResponse,
  maxTokens: number = 4000
): string {
  const chunks: string[] = [];
  let totalTokens = 0;

  // Sort by relevance (high first)
  const sortedResults = [...queryResponse.results].sort((a, b) => {
    const relevanceOrder = { high: 3, medium: 2, low: 1 };
    if (relevanceOrder[a.relevance] !== relevanceOrder[b.relevance]) {
      return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
    }
    return b.score - a.score;
  });

  for (const result of sortedResults) {
    const chunkTokens = result.chunk.tokenEstimate;
    if (totalTokens + chunkTokens > maxTokens) {
      break;
    }

    const sectionPath = result.chunk.sectionPath.join(" → ");
    const pageInfo =
      result.chunk.pageRange.start === result.chunk.pageRange.end
        ? `Page ${result.chunk.pageRange.start}`
        : `Pages ${result.chunk.pageRange.start}-${result.chunk.pageRange.end}`;

    chunks.push(
      `[${sectionPath || "Document"} - ${pageInfo}]\n${result.chunk.content}`
    );

    totalTokens += chunkTokens;
  }

  return chunks.join("\n\n---\n\n");
}

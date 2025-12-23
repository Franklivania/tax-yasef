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
    "section 30(1)",
    "individual income tax rates",
    "relief allowance",
    "800000",
    "2,200,000",
    "9,000,000",
    "13,000,000",
    "25,000,000",
    "50,000,000",
  ];

  // If query doesn't contain tax terms, add them for better matching
  const hasTaxTerm = taxTerms.some((term) => lowerQuery.includes(term));
  if (!hasTaxTerm) {
    return `${query} tax income chargeable section 30(1) individual income tax rates 800000 2200000 9000000 13000000 25000000 50000000`;
  }

  // Add current-year bracket anchors to bias toward the 2025 Act rates
  return `${query} section 30(1) individual income tax rates relief allowance 800000 2200000 9000000 13000000 25000000 50000000`;
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
 * Estimate tokens in text (rough approximation: ~4 characters per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Summarize/condense a chunk to reduce token usage while preserving key information
 */
function summarizeChunk(chunk: Chunk, maxLength: number = 300): string {
  const content = chunk.content.trim();

  // If content is already short enough, return as-is
  if (content.length <= maxLength) {
    return content;
  }

  // Try to extract first sentence (usually contains key info)
  const firstSentenceMatch = content.match(/^[^.!?]+[.!?]/);
  const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : "";

  // Extract key phrases (sentences with important terms)
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const importantTerms = [
    "tax",
    "rate",
    "deduction",
    "allowance",
    "exemption",
    "chargeable",
    "assessable",
    "income",
    "relief",
  ];

  const keySentences: string[] = [];
  if (firstSentence) {
    keySentences.push(firstSentence);
  }

  // Add sentences containing important terms
  for (const sentence of sentences.slice(1, 5)) {
    const lowerSentence = sentence.toLowerCase();
    if (importantTerms.some((term) => lowerSentence.includes(term))) {
      keySentences.push(sentence.trim());
      if (keySentences.join(" ").length > maxLength) break;
    }
  }

  // If we have key sentences, use them
  if (keySentences.length > 0) {
    let summary = keySentences.join(". ");
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + "...";
    }
    return summary;
  }

  // Fallback: truncate with ellipsis
  return content.substring(0, maxLength - 3) + "...";
}

/**
 * Get chunks for AI context
 * Formats query results for AI consumption with summarization and better filtering
 */
export function getChunksForAI(
  queryResponse: QueryResponse,
  maxTokens: number = 2000
): string {
  const chunks: string[] = [];
  let totalTokens = 0;

  // Filter: Only include high and medium relevance chunks (exclude low relevance)
  const filteredResults = queryResponse.results.filter(
    (result) => result.relevance === "high" || result.relevance === "medium"
  );

  // If no high/medium relevance chunks, include top low relevance as fallback
  const resultsToUse =
    filteredResults.length > 0
      ? filteredResults
      : queryResponse.results.slice(0, 3);

  // Sort by relevance (high first), then by score, with a slight boost for known bracket keywords
  const boostTerms = [
    "section 30(1)",
    "individual income tax rates",
    "relief allowance",
    "800,000",
    "800000",
    "2,200,000",
    "2200000",
    "9,000,000",
    "9000000",
    "13,000,000",
    "13000000",
    "25,000,000",
    "25000000",
    "50,000,000",
    "50000000",
  ];
  const sortedResults = [...resultsToUse].sort((a, b) => {
    const relevanceOrder = { high: 3, medium: 2, low: 1 };

    // Boost scores if content contains the key terms for the 2025 brackets
    const boostScore = (text: string) =>
      boostTerms.some((term) => text.toLowerCase().includes(term.toLowerCase()))
        ? 0.5
        : 0;

    const aScore = a.score + boostScore(a.chunk.content);
    const bScore = b.score + boostScore(b.chunk.content);

    if (relevanceOrder[a.relevance] !== relevanceOrder[b.relevance]) {
      return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
    }
    return bScore - aScore;
  });

  // Limit to top 8 most relevant chunks to avoid token bloat
  const topResults = sortedResults.slice(0, 8);

  for (const result of topResults) {
    const sectionPath = result.chunk.sectionPath.join(" → ");
    const pageInfo =
      result.chunk.pageRange.start === result.chunk.pageRange.end
        ? `Page ${result.chunk.pageRange.start}`
        : `Pages ${result.chunk.pageRange.start}-${result.chunk.pageRange.end}`;

    // Summarize chunk content to reduce tokens
    const summarizedContent = summarizeChunk(result.chunk, 400);
    const chunkText = `[${sectionPath || "Document"} - ${pageInfo}]\n${summarizedContent}`;

    // Count tokens accurately after summarization
    const chunkTokens = estimateTokens(chunkText);

    // Check if adding this chunk would exceed limit
    if (totalTokens + chunkTokens > maxTokens) {
      // Try to fit a shorter version
      const shorterSummary = summarizeChunk(result.chunk, 200);
      const shorterText = `[${sectionPath || "Document"} - ${pageInfo}]\n${shorterSummary}`;
      const shorterTokens = estimateTokens(shorterText);

      if (totalTokens + shorterTokens <= maxTokens) {
        chunks.push(shorterText);
        totalTokens += shorterTokens;
      }
      break; // Stop if we can't fit even the shorter version
    }

    chunks.push(chunkText);
    totalTokens += chunkTokens;
  }

  return chunks.join("\n\n---\n\n");
}

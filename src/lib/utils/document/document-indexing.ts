/**
 * Document indexing utility
 * Creates searchable index using FlexSearch for keyword search
 */

import { Index } from "flexsearch";
import type { Chunk } from "./chunking";

export type IndexedDocument = {
  index: Index;
  chunks: Chunk[];
  chunkMetadata: Map<string, Chunk>;
};

/**
 * Create search index for document chunks
 */
export function createDocumentIndex(chunks: Chunk[]): IndexedDocument {
  // Create FlexSearch index with keyword search configuration
  const index = new Index({
    tokenize: "forward", // Forward tokenization for better keyword matching
    cache: 100, // Cache size
    context: {
      resolution: 9, // Context resolution for better relevance
      depth: 2, // Context depth
      bidirectional: true, // Bidirectional context
    },
  });

  const chunkMetadata = new Map<string, Chunk>();

  // Index each chunk
  for (const chunk of chunks) {
    // Index content
    index.add(chunk.id, chunk.content);

    // Also index section path for better section-based search
    const sectionPathText = chunk.sectionPath.join(" ");
    if (sectionPathText) {
      index.append(chunk.id, sectionPathText);
    }

    chunkMetadata.set(chunk.id, chunk);
  }

  return {
    index,
    chunks,
    chunkMetadata,
  };
}

/**
 * Search indexed document
 */
export function searchIndexedDocument(
  indexedDoc: IndexedDocument,
  query: string,
  limit: number = 10
): Array<{ chunk: Chunk; score: number }> {
  if (!query.trim()) {
    return [];
  }

  // Search the index
  const results = indexedDoc.index.search(query, {
    limit,
    suggest: true, // Enable fuzzy matching
  });

  // Map results to chunks with scores
  const scoredChunks: Array<{ chunk: Chunk; score: number }> = [];

  for (const result of results) {
    const chunkId = typeof result === "string" ? result : String(result);
    const chunk = indexedDoc.chunkMetadata.get(chunkId);

    if (chunk) {
      // Calculate relevance score
      // FlexSearch returns results in relevance order, so we assign decreasing scores
      const score = 1.0 / (scoredChunks.length + 1);

      scoredChunks.push({
        chunk,
        score,
      });
    }
  }

  // Sort by score (highest first)
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks;
}

/**
 * Serialize index for storage
 * Note: FlexSearch indices are not easily serializable, so we store a marker
 * and rebuild from chunks on load (which is fast since chunks are cached)
 */

// eslint-disable-next-line
export function serializeIndex(_index: Index): string {
  // Return a marker - we'll rebuild from chunks on load
  return "{}";
}

/**
 * Deserialize index from storage
 * Rebuilds index from chunks (fast operation)
 */
export function deserializeIndex(
  _serialized: string,
  chunks: Chunk[]
): IndexedDocument {
  // Rebuild index from chunks - this is fast and reliable
  return createDocumentIndex(chunks);
}

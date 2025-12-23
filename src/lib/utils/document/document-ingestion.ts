/**
 * Document ingestion pipeline
 * Main entry point for ingesting PDFs into the retrieval system
 */

import { extractPDFText } from "./pdf-extraction";
import { normalizeText } from "./text-normalization";
import { detectStructure } from "./structure-detection";
import { buildHierarchicalStructure } from "./structure-builder";
import { chunkByStructure } from "./chunking";
import {
  createDocumentIndex,
  serializeIndex,
  type IndexedDocument,
} from "./document-indexing";
import { hashDocument } from "./document-hash";
import {
  storeDocumentCache,
  getDocumentCache,
  hasDocumentCache,
} from "../storage/indexeddb";
import type { StructureNode } from "./structure-builder";
import type { Chunk } from "./chunking";

export type IngestedDocument = {
  hash: string;
  structure: StructureNode[];
  chunks: Chunk[];
  indexedDocument: IndexedDocument;
  metadata: {
    url?: string;
    filename?: string;
    ingestedAt: number;
    pageCount: number;
  };
};

/**
 * Ingest PDF document
 * Processes PDF through the full pipeline: extraction → normalization → structure → chunking → indexing
 */
export async function ingestDocument(
  source: File | string,
  options?: {
    forceReingest?: boolean;
  }
): Promise<IngestedDocument> {
  // Compute document hash
  const hash = await hashDocument(source);

  // Check cache
  if (!options?.forceReingest) {
    const cached = await getDocumentCache(hash);
    if (cached) {
      // Reconstruct index from serialized data
      const { deserializeIndex } = await import("./document-indexing");
      const indexedDocument = deserializeIndex(
        cached.index as string,
        cached.chunks as Chunk[]
      );

      return {
        hash,
        structure: cached.structure as StructureNode[],
        chunks: cached.chunks as Chunk[],
        indexedDocument,
        metadata: cached.metadata,
      };
    }
  }

  // Extract PDF text
  const pages = await extractPDFText(source);

  // Normalize text
  const normalized = normalizeText(pages);

  // Detect structure
  const elements = detectStructure(normalized);

  // Build hierarchical structure
  const structure = buildHierarchicalStructure(elements);

  // Chunk content
  const chunks = chunkByStructure(structure);

  // Create index
  const indexedDocument = createDocumentIndex(chunks);

  // Prepare metadata
  const metadata = {
    url: typeof source === "string" ? source : undefined,
    filename: source instanceof File ? source.name : undefined,
    ingestedAt: Date.now(),
    pageCount: pages.length,
  };

  // Cache the results
  const serializedIndex = serializeIndex(indexedDocument.index);
  await storeDocumentCache(hash, {
    structure: structure as unknown,
    chunks: chunks as unknown[],
    index: serializedIndex,
    metadata,
  });

  return {
    hash,
    structure,
    chunks,
    indexedDocument,
    metadata,
  };
}

/**
 * Check if document is already ingested
 */
export async function isDocumentIngested(
  source: File | string
): Promise<boolean> {
  const hash = await hashDocument(source);
  return hasDocumentCache(hash);
}

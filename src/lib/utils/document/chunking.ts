/**
 * Semantic chunking utility
 * Splits content by structural units while respecting token limits
 */

import type { StructureNode } from "./structure-builder";

export type Chunk = {
  id: string;
  content: string;
  sectionPath: string[];
  pageRange: { start: number; end: number };
  nodeIds: string[]; // IDs of structure nodes included in this chunk
  tokenEstimate: number;
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text by sentences (simple heuristic)
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or newline
  return text
    .split(/([.!?]+\s+)/)
    .filter((s) => s.trim().length > 0)
    .reduce<string[]>((acc, curr, idx, arr) => {
      if (idx % 2 === 0) {
        // Text part
        const next = arr[idx + 1] || "";
        acc.push(curr + next);
      }
      return acc;
    }, [])
    .filter((s) => s.trim().length > 0);
}

/**
 * Chunk content by structural units
 * Keeps chunks within safe token size (500-800 tokens)
 */
export function chunkByStructure(
  nodes: StructureNode[],
  targetTokens: number = 600,
  minTokens: number = 500,
  maxTokens: number = 800
): Chunk[] {
  const chunks: Chunk[] = [];
  const flattened = flattenStructure(nodes);

  type ChunkBuilder = {
    content: string[];
    sectionPath: string[];
    pageRange: { start: number; end: number };
    nodeIds: string[];
    tokenCount: number;
  };

  let currentChunk: ChunkBuilder | null = null;

  function finalizeChunk(): void {
    if (!currentChunk || currentChunk.content.length === 0) return;

    const content = currentChunk.content.join("\n\n");
    const chunk: Chunk = {
      id: `chunk_${chunks.length}`,
      content,
      sectionPath: currentChunk.sectionPath,
      pageRange: currentChunk.pageRange,
      nodeIds: currentChunk.nodeIds,
      tokenEstimate: currentChunk.tokenCount,
    };

    chunks.push(chunk);
    currentChunk = null;
  }

  function startNewChunk(node: StructureNode): void {
    finalizeChunk();

    currentChunk = {
      content: [],
      sectionPath: node.sectionPath,
      pageRange: { start: node.pageNumber, end: node.pageNumber },
      nodeIds: [],
      tokenCount: 0,
    };
  }

  for (const node of flattened) {
    const nodeText = node.text;
    const nodeTokens = estimateTokens(nodeText);

    // If single node exceeds max, split it by sentences
    if (nodeTokens > maxTokens) {
      // Finalize current chunk
      finalizeChunk();

      // Split node text into sentences
      const sentences = splitIntoSentences(nodeText);
      let sentenceChunk: string[] = [];
      let sentenceTokenCount = 0;

      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);

        if (
          sentenceTokenCount + sentenceTokens > maxTokens &&
          sentenceChunk.length > 0
        ) {
          // Finalize sentence chunk
          const content = sentenceChunk.join(" ");
          chunks.push({
            id: `chunk_${chunks.length}`,
            content,
            sectionPath: node.sectionPath,
            pageRange: { start: node.pageNumber, end: node.pageNumber },
            nodeIds: [node.id],
            tokenEstimate: sentenceTokenCount,
          });

          sentenceChunk = [];
          sentenceTokenCount = 0;
        }

        sentenceChunk.push(sentence);
        sentenceTokenCount += sentenceTokens;
      }

      // Add remaining sentences
      if (sentenceChunk.length > 0) {
        const content = sentenceChunk.join(" ");
        chunks.push({
          id: `chunk_${chunks.length}`,
          content,
          sectionPath: node.sectionPath,
          pageRange: { start: node.pageNumber, end: node.pageNumber },
          nodeIds: [node.id],
          tokenEstimate: sentenceTokenCount,
        });
      }

      continue;
    }

    // Check if we need a new chunk
    if (!currentChunk) {
      startNewChunk(node);
    }

    // TypeScript guard: ensure currentChunk is set
    if (!currentChunk) {
      continue;
    }

    // Type assertion: TypeScript should narrow this, but we'll be explicit
    const chunk = currentChunk as ChunkBuilder;

    // Check if we need to start a new chunk
    if (
      chunk.tokenCount + nodeTokens > maxTokens ||
      (chunk.tokenCount >= minTokens &&
        node.type === "heading" &&
        chunk.tokenCount + nodeTokens > targetTokens)
    ) {
      // Start new chunk if:
      // 1. Adding this node would exceed max tokens, OR
      // 2. We've reached min tokens and this is a heading (natural break point)
      finalizeChunk();
      startNewChunk(node);

      // Get the new chunk after starting
      if (!currentChunk) {
        continue;
      }

      const newChunk = currentChunk as ChunkBuilder;

      // Add node to the new chunk
      newChunk.content.push(nodeText);
      newChunk.nodeIds.push(node.id);
      newChunk.tokenCount += nodeTokens;
      newChunk.pageRange.end = Math.max(
        newChunk.pageRange.end,
        node.pageRange.end
      );
      // Update section path to most specific (last added)
      if (node.sectionPath.length > newChunk.sectionPath.length) {
        newChunk.sectionPath = node.sectionPath;
      }
      continue;
    }

    // Add node to current chunk
    chunk.content.push(nodeText);
    chunk.nodeIds.push(node.id);
    chunk.tokenCount += nodeTokens;
    chunk.pageRange.end = Math.max(chunk.pageRange.end, node.pageRange.end);
    // Update section path to most specific (last added)
    if (node.sectionPath.length > chunk.sectionPath.length) {
      chunk.sectionPath = node.sectionPath;
    }
  }

  // Finalize last chunk
  finalizeChunk();

  return chunks;
}

/**
 * Flatten structure nodes (helper function)
 */
function flattenStructure(nodes: StructureNode[]): StructureNode[] {
  const result: StructureNode[] = [];

  function traverse(node: StructureNode): void {
    result.push(node);
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return result;
}

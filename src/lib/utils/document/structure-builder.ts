/**
 * Hierarchical structure builder
 * Constructs a logical tree from detected structural elements
 */

import type { StructuralElement } from "./structure-detection";

export type StructureNode = {
  id: string;
  type: "heading" | "paragraph" | "list-item";
  level: number;
  text: string;
  pageNumber: number;
  pageRange: { start: number; end: number };
  children: StructureNode[];
  parentId: string | null;
  sectionPath: string[]; // e.g., ["CHAPTER 1", "Section 1.1"]
  numbering?: string;
};

/**
 * Build hierarchical structure from detected elements
 */
export function buildHierarchicalStructure(
  elements: StructuralElement[]
): StructureNode[] {
  const nodes: StructureNode[] = [];
  const stack: StructureNode[] = []; // Stack to track parent nodes

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const id = `node_${i}`;

    // Find appropriate parent based on level
    while (stack.length > 0 && stack[stack.length - 1].level >= element.level) {
      stack.pop();
    }

    const parent = stack.length > 0 ? stack[stack.length - 1] : null;

    // Build section path
    const sectionPath = parent
      ? [...parent.sectionPath, element.text.substring(0, 50)]
      : [element.text.substring(0, 50)];

    // Determine page range (will be updated as we process children)
    const pageRange = {
      start: element.pageNumber,
      end: element.pageNumber,
    };

    const node: StructureNode = {
      id,
      type: element.type,
      level: element.level,
      text: element.text,
      pageNumber: element.pageNumber,
      pageRange,
      children: [],
      parentId: parent?.id || null,
      sectionPath,
      numbering: element.numbering,
    };

    nodes.push(node);

    // Add to parent's children
    if (parent) {
      parent.children.push(node);
    }

    // Push to stack if it's a heading (can have children)
    if (element.type === "heading") {
      stack.push(node);
    }
  }

  // Update page ranges: each node's end page should be the start of the next sibling or parent's end
  function updatePageRanges(
    node: StructureNode,
    nextSiblingStart?: number
  ): void {
    if (node.children.length > 0) {
      // Process children first
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const nextChildStart =
          i < node.children.length - 1
            ? node.children[i + 1].pageNumber
            : nextSiblingStart || node.pageNumber;

        updatePageRanges(child, nextChildStart);
      }

      // Node's end is the last child's end
      const lastChild = node.children[node.children.length - 1];
      node.pageRange.end = lastChild.pageRange.end;
    } else {
      // Leaf node: end is start of next sibling or parent's constraint
      if (nextSiblingStart) {
        node.pageRange.end = Math.min(nextSiblingStart - 1, node.pageNumber);
      }
    }
  }

  // Update page ranges for root nodes
  const rootNodes = nodes.filter((n) => n.parentId === null);
  for (let i = 0; i < rootNodes.length; i++) {
    const root = rootNodes[i];
    const nextRootStart =
      i < rootNodes.length - 1 ? rootNodes[i + 1].pageNumber : undefined;
    updatePageRanges(root, nextRootStart);
  }

  return rootNodes;
}

/**
 * Flatten structure to get all nodes in order
 */
export function flattenStructure(nodes: StructureNode[]): StructureNode[] {
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

/**
 * Get section path as string
 */
export function getSectionPathString(node: StructureNode): string {
  return node.sectionPath.join(" → ");
}

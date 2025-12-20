import React from "react";

type MarkdownNode = React.ReactElement | string | null;

interface ParseContext {
  inCodeBlock: boolean;
  codeBlockLanguage: string;
  codeBlockContent: string[];
}

export function parseMarkdown(content: string): MarkdownNode[] {
  if (!content) return [];

  // Normalize line endings
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const result: MarkdownNode[] = [];
  const lines = content.split("\n");
  const context: ParseContext = {
    inCodeBlock: false,
    codeBlockLanguage: "",
    codeBlockContent: [],
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith("```")) {
      if (context.inCodeBlock) {
        // End of code block
        const codeContent = context.codeBlockContent.join("\n");
        const language = context.codeBlockLanguage;
        result.push(
          <pre
            key={`code-${result.length}`}
            className="bg-muted rounded-lg p-4 overflow-x-auto my-4"
          >
            <code className={language ? `language-${language}` : ""}>
              {codeContent}
            </code>
          </pre>
        );
        context.inCodeBlock = false;
        context.codeBlockLanguage = "";
        context.codeBlockContent = [];
      } else {
        // Start of code block
        context.inCodeBlock = true;
        context.codeBlockLanguage = line.slice(3).trim();
      }
      i++;
      continue;
    }

    if (context.inCodeBlock) {
      context.codeBlockContent.push(line);
      i++;
      continue;
    }

    // Handle horizontal rules
    if (/^[-*_]{3,}$/.test(line.trim())) {
      result.push(
        <hr key={`hr-${result.length}`} className="my-6 border-border" />
      );
      i++;
      continue;
    }

    // Handle headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = parseInlineMarkdown(
        headingMatch[2],
        `heading-${result.length}`
      );
      const className =
        {
          1: "text-4xl font-bold my-6",
          2: "text-3xl font-bold my-5",
          3: "text-2xl font-semibold my-4",
          4: "text-xl font-semibold my-3",
          5: "text-lg font-semibold my-2",
          6: "text-base font-semibold my-2",
        }[level] || "text-base font-semibold my-2";

      const HeadingComponent = React.createElement(
        `h${level}`,
        { key: `heading-${result.length}`, className },
        text
      );
      result.push(HeadingComponent);
      i++;
      continue;
    }

    // Handle blockquotes
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].slice(1).trim());
        i++;
      }
      const quoteContent = quoteLines.join("\n");
      result.push(
        <blockquote
          key={`quote-${result.length}`}
          className="border-l-4 border-muted-foreground pl-4 my-4 italic text-muted-foreground"
        >
          {parseInlineMarkdown(quoteContent, `quote-${result.length}`)}
        </blockquote>
      );
      continue;
    }

    // Handle tables
    if (line.includes("|") && i + 1 < lines.length) {
      const tableResult = parseTable(lines, i);
      if (tableResult) {
        result.push(tableResult.element);
        i = tableResult.nextIndex;
        continue;
      }
    }

    // Handle lists
    if (/^(\s*)([-*+]|\d+\.)\s+/.test(line)) {
      const listResult = parseList(lines, i);
      if (listResult) {
        result.push(listResult.element);
        i = listResult.nextIndex;
        continue;
      }
    }

    // Handle empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Handle regular paragraphs
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith(">") &&
      !lines[i].includes("|") &&
      !/^(\s*)([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    if (paragraphLines.length > 0) {
      const paragraphText = paragraphLines.join("\n");
      result.push(
        <p key={`p-${result.length}`} className="my-3 leading-relaxed">
          {parseInlineMarkdown(paragraphText, `p-${result.length}`)}
        </p>
      );
      continue;
    }

    i++;
  }

  return result;
}

function parseInlineMarkdown(
  text: string,
  keyPrefix: string
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;

  // Pattern order matters: more specific patterns first
  const patterns: Array<{
    regex: RegExp;
    handler: (match: RegExpMatchArray) => React.ReactElement;
  }> = [
    // Code spans (backticks)
    {
      regex: /`([^`]+)`/g,
      handler: (match) => (
        <code
          key={`${keyPrefix}-code-${keyCounter++}`}
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {match[1]}
        </code>
      ),
    },
    // Links [text](url) or [text](url "title")
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/g,
      handler: (match) => (
        <a
          key={`${keyPrefix}-link-${keyCounter++}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {parseInlineMarkdown(match[1], `${keyPrefix}-link-${keyCounter}`)}
        </a>
      ),
    },
    // Images ![alt](url)
    {
      regex: /!\[([^\]]*)\]\(([^)]+)\)/g,
      handler: (match) => (
        <img
          key={`${keyPrefix}-img-${keyCounter++}`}
          src={match[2]}
          alt={match[1]}
          className="max-w-full h-auto my-4 rounded-lg"
        />
      ),
    },
    // Bold **text** or __text__
    {
      regex: /(\*\*|__)([^*_\n]+?)\1/g,
      handler: (match) => (
        <strong key={`${keyPrefix}-bold-${keyCounter++}`} className="font-bold">
          {parseInlineMarkdown(match[2], `${keyPrefix}-bold-${keyCounter}`)}
        </strong>
      ),
    },
    // Italic *text* or _text_ (but not **bold** or __bold__)
    {
      regex: /(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)|(?<!_)_(?!_)([^_\n]+?)_(?!_)/g,
      handler: (match) => (
        <em key={`${keyPrefix}-italic-${keyCounter++}`} className="italic">
          {parseInlineMarkdown(
            match[1] || match[2],
            `${keyPrefix}-italic-${keyCounter}`
          )}
        </em>
      ),
    },
    // Strikethrough ~~text~~
    {
      regex: /~~([^~]+?)~~/g,
      handler: (match) => (
        <del key={`${keyPrefix}-del-${keyCounter++}`} className="line-through">
          {match[1]}
        </del>
      ),
    },
  ];

  // Find all matches and sort by position
  const allMatches: Array<{
    index: number;
    length: number;
    handler: (match: RegExpMatchArray) => React.ReactElement;
    match: RegExpMatchArray;
  }> = [];

  patterns.forEach(({ regex, handler }) => {
    let match;
    regex.lastIndex = 0; // Reset regex
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        handler,
        match,
      });
    }
  });

  // Sort by position
  allMatches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep first)
  const nonOverlapping: typeof allMatches = [];
  for (const match of allMatches) {
    const overlaps = nonOverlapping.some(
      (existing) =>
        match.index < existing.index + existing.length &&
        match.index + match.length > existing.index
    );
    if (!overlaps) {
      nonOverlapping.push(match);
    }
  }

  // Build nodes
  for (const { index, length, handler, match } of nonOverlapping) {
    // Add text before match
    if (index > lastIndex) {
      const textBefore = text.slice(lastIndex, index);
      if (textBefore) {
        nodes.push(textBefore);
      }
    }
    // Add matched element
    nodes.push(handler(match));
    lastIndex = index + length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

interface TableResult {
  element: React.ReactElement;
  nextIndex: number;
}

function parseTable(lines: string[], startIndex: number): TableResult | null {
  const rows: string[][] = [];
  let i = startIndex;

  // Parse header row
  const headerLine = lines[i];
  if (!headerLine.includes("|")) return null;

  const headerCells = headerLine
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell !== "");

  if (headerCells.length === 0) return null;
  rows.push(headerCells);
  i++;

  // Check for separator row
  if (i >= lines.length) return null;
  const separatorLine = lines[i];
  if (!/^[\s|:-]+$/.test(separatorLine)) return null;
  i++;

  // Parse data rows
  while (i < lines.length && lines[i].includes("|")) {
    const cells = lines[i]
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell !== "");

    if (cells.length > 0) {
      rows.push(cells);
    }
    i++;
  }

  if (rows.length < 2) return null; // Need at least header + 1 data row

  return {
    element: (
      <div key={`table-${startIndex}`} className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-border">
          <thead>
            <tr>
              {rows[0].map((cell, idx) => (
                <th
                  key={`th-${idx}`}
                  className="border border-border px-4 py-2 text-left font-semibold bg-muted"
                >
                  {parseInlineMarkdown(cell, `table-${startIndex}-th-${idx}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIdx) => (
              <tr key={`tr-${rowIdx}`}>
                {row.map((cell, cellIdx) => (
                  <td
                    key={`td-${rowIdx}-${cellIdx}`}
                    className="border border-border px-4 py-2"
                  >
                    {parseInlineMarkdown(
                      cell,
                      `table-${startIndex}-td-${rowIdx}-${cellIdx}`
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    nextIndex: i,
  };
}

interface ListResult {
  element: React.ReactElement;
  nextIndex: number;
}

function parseList(lines: string[], startIndex: number): ListResult | null {
  const items: Array<{ content: string; children: typeof items }> = [];
  let i = startIndex;
  const stack: Array<{ level: number; items: typeof items }> = [
    { level: -1, items },
  ];

  while (i < lines.length) {
    const line = lines[i];
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);

    if (!listMatch) {
      // Check if it's a continuation of previous item (indented line)
      if (line.trim() && /^\s+/.test(line) && stack.length > 1) {
        const lastItem =
          stack[stack.length - 1].items[
            stack[stack.length - 1].items.length - 1
          ];
        if (lastItem) {
          lastItem.content += " " + line.trim();
        }
        i++;
        continue;
      }
      break;
    }

    const indent = listMatch[1].length;
    const content = listMatch[3];
    const level = Math.floor(indent / 2);

    // Pop stack until we find the right level
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const currentList = stack[stack.length - 1].items;
    const item = { content, children: [] };
    currentList.push(item);

    stack.push({ level, items: item.children });
    i++;
  }

  if (items.length === 0) return null;

  // Determine if first item is ordered
  const firstLine = lines[startIndex];
  const firstMatch = firstLine.match(/^(\s*)([-*+]|\d+\.)\s+/);
  const isOrdered = firstMatch ? /^\d+\.$/.test(firstMatch[2]) : false;

  const renderList = (
    listItems: typeof items,
    ordered: boolean,
    depth: number = 0
  ): React.ReactElement => {
    const ListTag = ordered ? "ol" : "ul";
    const className = ordered
      ? "list-decimal list-inside my-2 space-y-1 ml-4"
      : "list-disc list-inside my-2 space-y-1 ml-4";

    return (
      <ListTag key={`list-${depth}-${startIndex}`} className={className}>
        {listItems.map((item, idx) => (
          <li key={`li-${depth}-${idx}`} className="my-1">
            {parseInlineMarkdown(item.content, `list-${depth}-${idx}`)}
            {item.children.length > 0 && (
              <div className="ml-4 mt-1">
                {renderList(item.children, ordered, depth + 1)}
              </div>
            )}
          </li>
        ))}
      </ListTag>
    );
  };

  return {
    element: renderList(items, isOrdered),
    nextIndex: i,
  };
}

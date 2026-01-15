import type { IngestedDocument } from "@/lib/utils/document/document-ingestion";
import { ingestDocument } from "@/lib/utils/document/document-ingestion";
import {
  detectIntent,
  getChunksForAI,
  queryDocument,
  type QueryIntent,
} from "@/lib/utils/document/document-query";
import {
  APPROVED_DOCS,
  DEFAULT_APPROVED_DOC_ID,
  getApprovedDocById,
  type ApprovedDocCatalogItem,
  type ApprovedDocId,
} from "./catalog";

type LoadedDoc = {
  catalog: ApprovedDocCatalogItem;
  ingested: IngestedDocument;
};

const loadedDocs = new Map<ApprovedDocId, LoadedDoc>();
const loadPromises = new Map<ApprovedDocId, Promise<LoadedDoc>>();

let libraryInitPromise: Promise<void> | null = null;
let libraryInitialized = false;

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreDocByKeywords(query: string, doc: ApprovedDocCatalogItem): number {
  const q = normalizeForMatch(query);
  if (!q) return 0;
  let score = 0;
  for (const kw of doc.keywords) {
    const k = normalizeForMatch(kw);
    if (!k) continue;
    if (q.includes(k)) score += 4;
    else {
      // Light partial match to handle "returns" vs "return", etc.
      const parts = k.split(" ").filter(Boolean);
      if (parts.length > 0 && parts.some((p) => q.includes(p))) score += 1;
    }
  }
  return score;
}

export function routeApprovedDocIdForQuery(query: string): ApprovedDocId {
  const scores = APPROVED_DOCS.map((doc) => ({
    id: doc.id,
    score: scoreDocByKeywords(query, doc),
  }));

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  // If nothing matches confidently, fall back to the main act.
  if (!best || best.score <= 1) return DEFAULT_APPROVED_DOC_ID;
  return best.id;
}

export function isApprovedDocLoaded(docId: ApprovedDocId): boolean {
  return loadedDocs.has(docId);
}

export async function ensureApprovedDocLoaded(
  docId: ApprovedDocId,
  options?: { forceReingest?: boolean }
): Promise<LoadedDoc> {
  const existing = loadedDocs.get(docId);
  if (existing) return existing;

  const inFlight = loadPromises.get(docId);
  if (inFlight) return inFlight;

  const p = (async (): Promise<LoadedDoc> => {
    const catalog = getApprovedDocById(docId);
    const ingested = await ingestDocument(catalog.url, {
      forceReingest: options?.forceReingest,
    });
    const loaded: LoadedDoc = { catalog, ingested };
    loadedDocs.set(docId, loaded);
    return loaded;
  })().finally(() => {
    loadPromises.delete(docId);
  });

  loadPromises.set(docId, p);
  return p;
}

export function listApprovedDocs(): readonly ApprovedDocCatalogItem[] {
  return APPROVED_DOCS;
}

function buildAIContextFromLoadedDoc(
  loaded: LoadedDoc,
  query: string,
  maxTokens: number
): { context: string; intent: QueryIntent } | null {
  const intent: QueryIntent = detectIntent(query);
  const queryResponse = queryDocument(loaded.ingested, query, {
    limit: 8,
    minScore: 0.2,
  });

  if (!queryResponse.results.length) return null;

  return { context: getChunksForAI(queryResponse, maxTokens, intent), intent };
}

export type ApprovedDocsContextResult = {
  primary: ApprovedDocCatalogItem;
  mode: "auto" | "selected";
  usedDocIds: ApprovedDocId[];
  contextText: string;
};

export async function buildApprovedDocsContext(params: {
  userQuery: string;
  selectedDocId?: ApprovedDocId | null;
  maxPrimaryTokens?: number;
  maxSecondaryTokens?: number;
}): Promise<ApprovedDocsContextResult> {
  const query = params.userQuery || "tax act provisions";
  const mode: "auto" | "selected" = params.selectedDocId ? "selected" : "auto";
  const primaryDocId =
    params.selectedDocId ?? routeApprovedDocIdForQuery(query);

  const primaryLoaded = await ensureApprovedDocLoaded(primaryDocId);
  const maxPrimaryTokens = params.maxPrimaryTokens ?? 2000;
  const maxSecondaryTokens = params.maxSecondaryTokens ?? 350;

  const primaryContext =
    buildAIContextFromLoadedDoc(primaryLoaded, query, maxPrimaryTokens)
      ?.context ||
    "[Approved document retrieval is initializing. Please wait a moment and try again.]";

  const approvedDocTitles = APPROVED_DOCS.map((d) => `- ${d.shortTitle}`).join(
    "\n"
  );

  // Minor references: if any other approved docs are already loaded, include at most one small excerpt.
  const otherLoaded = APPROVED_DOCS.map((d) => d.id)
    .filter((id) => id !== primaryDocId)
    .map((id) => loadedDocs.get(id))
    .filter(Boolean) as LoadedDoc[];

  let secondarySnippet = "";
  if (otherLoaded.length) {
    // Pick the best already-loaded secondary match for this query.
    const scored = otherLoaded
      .map((d) => ({
        loaded: d,
        score: scoreDocByKeywords(query, d.catalog),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (best && best.score > 1) {
      const secondaryContext = buildAIContextFromLoadedDoc(
        best.loaded,
        query,
        maxSecondaryTokens
      )?.context;
      if (secondaryContext) {
        secondarySnippet = `\n\nSECONDARY REFERENCE (minor): ${best.loaded.catalog.title}\n${secondaryContext}`;
      }
    }
  }

  const contextText = `APPROVED DOCUMENTS AVAILABLE (you may reference, but prioritize the PRIMARY one when set):\n${approvedDocTitles}

MODE: ${mode === "selected" ? "User selected a PRIMARY document" : "Auto (route to best matching document)"}
PRIMARY DOCUMENT: ${primaryLoaded.catalog.title}

PRIMARY DOCUMENT EXCERPTS:\n${primaryContext}${secondarySnippet}`;

  const usedDocIds: ApprovedDocId[] = [primaryDocId];
  return {
    primary: primaryLoaded.catalog,
    mode,
    usedDocIds,
    contextText,
  };
}

/**
 * Initializes the library (non-blocking friendly). This warms up the default doc
 * so the first user query is faster.
 */
export async function initializeApprovedDocsLibrary(): Promise<void> {
  if (libraryInitialized) return;
  if (libraryInitPromise) return libraryInitPromise;

  libraryInitPromise = (async () => {
    await ensureApprovedDocLoaded(DEFAULT_APPROVED_DOC_ID);
    libraryInitialized = true;
  })().catch((err) => {
    // Allow retries if init fails.
    libraryInitPromise = null;
    throw err;
  });

  return libraryInitPromise;
}



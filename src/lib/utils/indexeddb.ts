/**
 * IndexedDB wrapper utility for document caching
 * Provides a simple, promise-based interface for storing and retrieving document data
 */

const DB_NAME = "tax-yasef-documents";
const DB_VERSION = 1;
const STORE_NAME = "documents";

type DocumentCache = {
  hash: string;
  structure: unknown;
  chunks: unknown[];
  index: string; // Serialized FlexSearch index
  metadata: {
    url?: string;
    filename?: string;
    ingestedAt: number;
    pageCount: number;
  };
};

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "hash" });
      }
    };
  });
}

/**
 * Store document cache in IndexedDB
 */
export async function storeDocumentCache(
  hash: string,
  data: Omit<DocumentCache, "hash">
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const cache: DocumentCache = {
      hash,
      ...data,
    };

    const request = store.put(cache);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to store document cache"));
    };
  });
}

/**
 * Retrieve document cache from IndexedDB
 */
export async function getDocumentCache(
  hash: string
): Promise<DocumentCache | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(hash);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve document cache"));
    };
  });
}

/**
 * Check if document cache exists
 */
export async function hasDocumentCache(hash: string): Promise<boolean> {
  const cache = await getDocumentCache(hash);
  return cache !== null;
}

/**
 * Delete document cache
 */
export async function deleteDocumentCache(hash: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(hash);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to delete document cache"));
    };
  });
}

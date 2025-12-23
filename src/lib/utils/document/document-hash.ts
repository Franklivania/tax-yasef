/**
 * Document hashing utility
 * Creates SHA-256 hash of document for caching
 */

/**
 * Compute SHA-256 hash of file contents or URL
 */
export async function hashDocument(source: File | string): Promise<string> {
  let arrayBuffer: ArrayBuffer;

  if (source instanceof File) {
    arrayBuffer = await source.arrayBuffer();
  } else {
    // For URLs, use the URL as a stable identifier
    // In production, you might want to fetch and hash the content
    const urlHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(source)
    );
    return Array.from(new Uint8Array(urlHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Hash the file contents
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

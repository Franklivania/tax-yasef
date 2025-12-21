/**
 * CSRF Protection Utilities
 * Generates and validates CSRF tokens for API requests
 */

const CSRF_TOKEN_KEY = "tax-yasef-csrf-token";
const CSRF_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CSRFToken {
  token: string;
  expiresAt: number;
}

/**
 * Generate a random CSRF token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Get or create CSRF token
 */
export function getCSRFToken(): string {
  if (typeof window === "undefined") return "";

  try {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (stored) {
      const tokenData = JSON.parse(stored) as CSRFToken;
      const now = Date.now();

      // If token is expired, generate new one
      if (now >= tokenData.expiresAt) {
        const newToken = generateToken();
        const newTokenData: CSRFToken = {
          token: newToken,
          expiresAt: now + CSRF_TOKEN_EXPIRY_MS,
        };
        sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(newTokenData));
        return newToken;
      }

      return tokenData.token;
    }

    // Generate new token
    const newToken = generateToken();
    const newTokenData: CSRFToken = {
      token: newToken,
      expiresAt: Date.now() + CSRF_TOKEN_EXPIRY_MS,
    };
    sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(newTokenData));
    return newToken;
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    return "";
  }
}

/**
 * Get CSRF token header for API requests
 */
export function getCSRFHeader(): Record<string, string> {
  const token = getCSRFToken();
  if (!token) return {};

  return {
    "X-CSRF-Token": token,
  };
}

/**
 * Validate CSRF token (for server-side use)
 * Note: This is a client-side utility. Actual validation should be done server-side.
 */
export function validateCSRFToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;

  const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!stored) return false;

  try {
    const tokenData = JSON.parse(stored) as CSRFToken;
    const now = Date.now();

    // Check if expired
    if (now >= tokenData.expiresAt) {
      return false;
    }

    // Validate token matches
    return tokenData.token === token;
  } catch {
    return false;
  }
}

/**
 * Clear CSRF token
 */
export function clearCSRFToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

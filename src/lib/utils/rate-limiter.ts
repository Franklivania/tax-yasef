/**
 * Frontend Rate Limiter
 * Prevents excessive API calls from the client side
 */

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Optional key for different rate limits (e.g., per model)
   */
  key?: string;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;
  /**
   * Number of requests remaining in the current window
   */
  remaining: number;
  /**
   * Time when the rate limit resets (timestamp)
   */
  resetAt: number;
  /**
   * Time until reset in milliseconds
   */
  resetIn: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const STORAGE_KEY_PREFIX = "tax-yasef-rate-limit-";

/**
 * Get storage key for rate limit
 */
function getStorageKey(key: string): string {
  return `${STORAGE_KEY_PREFIX}${key}`;
}

/**
 * Get rate limit entry from storage
 */
function getRateLimitEntry(key: string): RateLimitEntry | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(getStorageKey(key));
    if (!stored) return null;

    const entry = JSON.parse(stored) as RateLimitEntry;
    const now = Date.now();

    // If expired, return null
    if (now >= entry.resetAt) {
      localStorage.removeItem(getStorageKey(key));
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

/**
 * Set rate limit entry in storage
 */
function setRateLimitEntry(key: string, entry: RateLimitEntry): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(entry));
  } catch (error) {
    console.error("Failed to store rate limit entry:", error);
  }
}

/**
 * Check if a request is allowed under rate limit
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const key = config.key || "default";
  const now = Date.now();
  const entry = getRateLimitEntry(key);

  // If no entry or expired, create new entry
  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    setRateLimitEntry(key, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
      resetIn: config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      resetIn: entry.resetAt - now,
    };
  }

  // Increment count
  const updatedEntry: RateLimitEntry = {
    count: entry.count + 1,
    resetAt: entry.resetAt,
  };
  setRateLimitEntry(key, updatedEntry);

  return {
    allowed: true,
    remaining: config.maxRequests - updatedEntry.count,
    resetAt: entry.resetAt,
    resetIn: entry.resetAt - now,
  };
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string = "default"): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey(key));
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(config: RateLimitConfig): RateLimitResult {
  const key = config.key || "default";
  const entry = getRateLimitEntry(key);

  if (!entry) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
      resetIn: config.windowMs,
    };
  }

  const now = Date.now();
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: entry.resetAt,
    resetIn: Math.max(0, entry.resetAt - now),
  };
}

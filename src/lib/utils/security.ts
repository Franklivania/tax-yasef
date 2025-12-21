/**
 * Security Utilities
 * Functions for input sanitization, XSS prevention, and security checks
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") return "";

  // Create a temporary div element
  const temp = document.createElement("div");
  temp.textContent = html;

  // Return the sanitized text content
  return temp.innerHTML;
}

/**
 * Sanitize user input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .slice(0, 10000); // Limit length
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== "string") return "";

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Validate URL to prevent XSS through href attributes
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    // Only allow http, https protocols
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for safe use in href attributes
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== "string") return "";

  if (isValidURL(url)) {
    return url;
  }

  // If not a valid URL, return empty string or safe fallback
  return "";
}

/**
 * Check if string contains potentially dangerous content
 */
export function containsDangerousContent(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /data:text\/html/gi,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(text));
}

/**
 * Sanitize text for safe display in markdown
 */
export function sanitizeForMarkdown(text: string): string {
  if (!text || typeof text !== "string") return "";

  // Remove script tags and event handlers
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");

  // Limit length
  return sanitized.slice(0, 50000);
}

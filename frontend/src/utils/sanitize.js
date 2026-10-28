import DOMPurify from "dompurify";

/**
 * Sanitasi input user sebelum dikirim / dirender.
 * - `sanitizeInput`: membersihkan string biasa (strip semua HTML tags).
 * - `safeHTML`: untuk render via dangerouslySetInnerHTML.
 */
export const sanitizeInput = (value) =>
  DOMPurify.sanitize(String(value ?? ""), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();

export const safeHTML = (html) => DOMPurify.sanitize(html ?? "");
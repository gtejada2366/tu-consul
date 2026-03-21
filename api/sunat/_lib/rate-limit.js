/**
 * In-memory rate limiter for Vercel serverless functions.
 * State persists while the function instance is warm; resets on cold start.
 * This provides best-effort protection — sufficient for a clinic-scale app.
 *
 * Usage:
 *   import { checkRateLimit } from "./_lib/rate-limit.js";
 *   // At top of handler:
 *   if (checkRateLimit(req, res, { limit: 10 })) return;
 */

const store = new Map();
const WINDOW_MS = 60_000; // 1 minute window
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > WINDOW_MS * 2) {
      store.delete(key);
    }
  }
}

/**
 * Check rate limit for the current request.
 * @param {object} req - Vercel request object
 * @param {object} res - Vercel response object
 * @param {object} opts
 * @param {number} opts.limit - Max requests per window (default 20)
 * @returns {boolean} true if rate limited (response already sent), false if OK
 */
export function checkRateLimit(req, res, { limit = 20 } = {}) {
  const now = Date.now();

  // Cleanup stale entries every 5 min
  if (now - lastCleanup > 300_000) {
    cleanup();
    lastCleanup = now;
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const key = `${ip}:${req.url?.split("?")[0] || "unknown"}`;
  let entry = store.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    store.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, limit - entry.count);
  const resetTime = Math.ceil((entry.windowStart + WINDOW_MS) / 1000);
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(resetTime));

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      error: "Demasiadas solicitudes. Intente nuevamente en un momento.",
    });
    return true;
  }

  return false;
}

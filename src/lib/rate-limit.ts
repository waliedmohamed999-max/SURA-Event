/**
 * In-memory sliding-window rate limiter. Fine for a single Node process
 * (e.g. this admin login endpoint); a multi-instance deployment would need
 * a shared store (Redis) instead — noted as a follow-up, not built here.
 */
const attempts = new Map<string, number[]>();

export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const history = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);

  if (history.length >= maxAttempts) {
    attempts.set(key, history);
    return true;
  }

  history.push(now);
  attempts.set(key, history);
  return false;
}

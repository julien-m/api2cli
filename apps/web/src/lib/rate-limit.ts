import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Tiered rate limiters by endpoint sensitivity.
 *
 * - read:    general GET endpoints (60 req / 60s per IP)
 * - write:   POST endpoints that create/update data (10 req / 60s)
 * - vote:    voting actions (20 req / 60s)
 * - publish: heavy operations like CLI publish (5 req / 60s)
 */

export const rateLimiters = {
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    prefix: "rl:read",
  }),
  write: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:write",
  }),
  vote: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "rl:vote",
  }),
  publish: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "rl:publish",
  }),
} as const;

export type RateLimitTier = keyof typeof rateLimiters;

export function getTierForRequest(pathname: string, method: string): RateLimitTier {
  if (pathname.startsWith("/api/publish-cli")) return "publish";
  if (pathname.includes("/vote")) return "vote";
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")
    return "write";
  return "read";
}

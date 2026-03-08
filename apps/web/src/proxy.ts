import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimiters, getTierForRequest } from "@/lib/rate-limit";

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function proxy(request: NextRequest) {
  const ip = getIP(request);
  const tier = getTierForRequest(request.nextUrl.pathname, request.method);
  const limiter = rateLimiters[tier];

  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/api/:path*",
};

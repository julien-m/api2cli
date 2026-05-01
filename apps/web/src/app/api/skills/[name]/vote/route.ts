import { db } from "@/db";
import { skills } from "@/db/schema";
import { rateLimiters } from "@/lib/rate-limit";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ name: string }>;

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const ip = getIP(req);
  const { name } = await params;

  const { success, reset } = await rateLimiters.vote.limit(`${ip}:${name}`);
  if (!success) {
    return NextResponse.json(
      { ok: false, error: "Too many votes. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const body = await req.json();
  const direction = body.direction as "up" | "down";

  if (direction !== "up" && direction !== "down") {
    return NextResponse.json(
      { ok: false, error: "direction must be 'up' or 'down'" },
      { status: 400 }
    );
  }

  const column = direction === "up" ? skills.upvotes : skills.downvotes;

  const [updated] = await db
    .update(skills)
    .set({ [direction === "up" ? "upvotes" : "downvotes"]: sql`${column} + 1` })
    .where(eq(skills.name, name))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "Skill not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: updated });
}

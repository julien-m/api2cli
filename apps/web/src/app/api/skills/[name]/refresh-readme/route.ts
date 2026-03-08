import { db } from "@/db";
import { skills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

type Params = Promise<{ name: string }>;

async function fetchRawFile(owner: string, repo: string, path: string) {
  const headers: Record<string, string> = {
    "User-Agent": "api2cli-web",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  for (const branch of ["main", "master"]) {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      { headers }
    );
    if (res.ok) return res.text();
  }
  return null;
}

function parseGithubRepo(githubRepo: string): { owner: string; repo: string } | null {
  const match = githubRepo.match(
    /(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  );
  if (match) return { owner: match[1], repo: match[2] };

  const short = githubRepo.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (short) return { owner: short[1], repo: short[2] };

  return null;
}

export async function POST(_req: NextRequest, { params }: { params: Params }) {
  const { name } = await params;

  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.name, name))
    .limit(1);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  if (!skill.githubRepo) {
    return NextResponse.json({ error: "No GitHub repo linked" }, { status: 400 });
  }

  const parsed = parseGithubRepo(skill.githubRepo);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid GitHub repo URL" }, { status: 400 });
  }

  const readme = await fetchRawFile(parsed.owner, parsed.repo, "README.md");

  await db
    .update(skills)
    .set({ readme: readme || null, updatedAt: new Date() })
    .where(eq(skills.name, name));

  return NextResponse.json({
    success: true,
    hasReadme: !!readme,
  });
}

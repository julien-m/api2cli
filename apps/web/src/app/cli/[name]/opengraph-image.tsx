import { ImageResponse } from "next/og";
import { db } from "@/db";
import { skills } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";
export const alt = "api2cli CLI detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.name, name))
    .limit(1);

  const displayName = skill?.displayName ?? name;
  const description =
    skill?.description ?? `CLI wrapper for the ${name} API`;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: "#64748b",
            marginBottom: 16,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          api2cli
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            background:
              "linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)",
            backgroundClip: "text",
            color: "transparent",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {displayName}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
            marginTop: 24,
          }}
        >
          {description.length > 120
            ? description.slice(0, 117) + "..."
            : description}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "16px 32px",
            fontSize: 18,
            color: "#94a3b8",
            fontFamily: "monospace",
          }}
        >
          npx api2cli install {name}
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "api2cli - Turn any API into an agent-ready CLI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
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
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              background: "linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            api2cli
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Turn any API into an agent-ready CLI
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            fontSize: 18,
            color: "#64748b",
          }}
        >
          <span>Open Source</span>
          <span>·</span>
          <span>40+ AI Agents</span>
          <span>·</span>
          <span>Install in Seconds</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

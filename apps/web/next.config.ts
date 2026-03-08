import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["twitter-api-v2"],
  async redirects() {
    return [
      {
        source: "/registry",
        destination: "/cli",
        permanent: true,
      },
      {
        source: "/registry/:name",
        destination: "/cli/:name",
        permanent: true,
      },
      {
        source: "/skills",
        destination: "/cli",
        permanent: true,
      },
      {
        source: "/skills/:name",
        destination: "/cli/:name",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

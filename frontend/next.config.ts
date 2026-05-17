import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is dev-only; production builds use webpack
  // CORS headers for API routes (if any are added later)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

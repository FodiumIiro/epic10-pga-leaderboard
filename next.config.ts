import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/api/scores": ["./data/**/*"],
    "/embed": ["./data/**/*"],
    "/": ["./data/**/*"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/scores": ["./data/**/*"],
    "/embed": ["./data/**/*"],
    "/": ["./data/**/*"],
  },
};

export default nextConfig;

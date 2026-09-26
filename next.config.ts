import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/tts/*": [
      "scripts/edge_tts_generate.py",
      "requirements.txt",
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: { ignore: [/\/(?:api\/)?wsapi\//] },
  },
};

export default nextConfig;

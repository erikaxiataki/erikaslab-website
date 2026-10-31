import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bible Quest moved to its own app; send old links there.
  async redirects() {
    return [
      { source: "/bible", destination: "https://bible-quest-one.vercel.app/", permanent: false },
      { source: "/bible/:path*", destination: "https://bible-quest-one.vercel.app/", permanent: false },
    ];
  },
};

export default nextConfig;

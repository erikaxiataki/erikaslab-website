import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bible Quest moved to its own app; send old links there.
  async redirects() {
    return [
      { source: "/bible", destination: "https://bible-quest-one.vercel.app/", permanent: false },
      { source: "/bible/:path*", destination: "https://bible-quest-one.vercel.app/", permanent: false },
    ];
  },
  // Escape Quest is a static game in public/escape-quest.
  async rewrites() {
    return [{ source: "/escape-quest", destination: "/escape-quest/index.html" }];
  },
};

export default nextConfig;

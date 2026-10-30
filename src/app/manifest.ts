import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atlas Quest: World Geography Game",
    short_name: "Atlas Quest",
    description: "Learn the world map, flags and capitals. Play solo offline or with friends.",
    start_url: "/atlas",
    scope: "/",
    display: "standalone",
    background_color: "#070b18",
    theme_color: "#070b18",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

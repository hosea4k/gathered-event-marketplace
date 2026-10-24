import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app reads live data (bookings, availability) straight from SQLite on
  // every request, and pages opt into that with `export const dynamic =
  // "force-dynamic"`. Cache Components (the new default) would otherwise try
  // to bake those synchronous DB reads into the build-time static shell —
  // simpler to use the previous, classic rendering model here.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

/**
 * QR Studio is a fully static site. `output: "export"` emits plain HTML/CSS/JS
 * into `out/` — there is no server runtime, no API routes and no server-side
 * processing of anything a user creates.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
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

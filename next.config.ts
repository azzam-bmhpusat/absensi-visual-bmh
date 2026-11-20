import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Izinkan akses dev server dari HP di jaringan Wi-Fi yang sama
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        // Preserve CSS Module exports instead of converting them to global CSS.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

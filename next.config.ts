import type { NextConfig } from "next";

const pagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const pages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(pages
    ? {
        output: "export",
        basePath: pagesBasePath,
        images: { unoptimized: true },
      }
    : {}),
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: !pages,
  partialPrefetching: !pages,
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

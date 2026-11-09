import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Preusmjeravanje /sb/* → Supabase (samo kad je NEXT_PUBLIC_SUPABASE_PROXY=1, vidi src/lib/supabase/client.ts)
  async rewrites() {
    if (process.env.NEXT_PUBLIC_SUPABASE_PROXY !== "1" || !process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
    return [{ source: "/sb/:path*", destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;

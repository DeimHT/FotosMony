import type { NextConfig } from "next";

const r2PublicUrlRaw =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  "";

const r2Hostname = r2PublicUrlRaw
  ? (() => {
      try {
        return new URL(r2PublicUrlRaw).hostname;
      } catch {
        return null;
      }
    })()
  : null;

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/api/watermark" }],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      ...(r2Hostname ? [{ protocol: "https" as const, hostname: r2Hostname, pathname: "/**" }] : []),
    ],
  },
};

export default nextConfig;

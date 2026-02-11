import type { NextConfig } from "next";

const r2Hostname =
  typeof process.env.NEXT_PUBLIC_R2_PUBLIC_URL === "string" && process.env.NEXT_PUBLIC_R2_PUBLIC_URL
    ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
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

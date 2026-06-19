import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'http://localhost:81',
    'http://21.0.9.225:81',
    'http://21.0.9.225:3000',
  ],
};

export default nextConfig;

import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" } : { output: "standalone" }),
  images: {
    unoptimized: isStaticExport,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i-blog.csdnimg.cn",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

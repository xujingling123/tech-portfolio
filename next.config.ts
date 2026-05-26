import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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

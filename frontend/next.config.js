/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8004";
const agentUrl = process.env.AGENT_URL || "http://127.0.0.1:8005";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/agent/:path*",
        destination: `${agentUrl}/api/agent/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      encoding: false,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
      os: false,
    };
    return config;
  },
};

module.exports = nextConfig;

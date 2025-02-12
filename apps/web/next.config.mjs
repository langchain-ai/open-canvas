/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.globalObject = 'self';
    }
    return config;
  },
};

export default nextConfig;

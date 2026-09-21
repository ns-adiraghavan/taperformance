/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // xlsx uses fs — exclude on client
    config.resolve.fallback = { fs: false, path: false, stream: false };
    return config;
  },
};

export default nextConfig;

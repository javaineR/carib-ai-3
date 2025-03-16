/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle PDF.js and Tesseract.js in server components
    if (isServer) {
      // Use node polyfills for server side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        util: false,
        crypto: false,
      };
    }

    return config;
  },
  // Enable experimental server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '16mb' // Increase from the default 1mb to 16mb
    }
  }
};

module.exports = nextConfig; 
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'node-fetch': path.resolve(__dirname, 'lib/stubs/node-fetch.js')
    };
    return config;
  }
};

module.exports = nextConfig;

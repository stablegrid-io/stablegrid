/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns']
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'node-fetch': path.resolve(__dirname, 'lib/stubs/node-fetch.js')
    };

    if (!isServer) {
      const existingSplitChunks = config.optimization?.splitChunks ?? {};
      const existingCacheGroups = existingSplitChunks.cacheGroups ?? {};

      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...existingSplitChunks,
          cacheGroups: {
            ...existingCacheGroups,
            vendorReact: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'vendor-react',
              chunks: 'all',
              priority: 60,
              reuseExistingChunk: true
            },
            vendorSupabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'vendor-supabase',
              chunks: 'all',
              priority: 50,
              reuseExistingChunk: true
            },
            vendorViz: {
              test: /[\\/]node_modules[\\/](three|@react-three|recharts|d3|d3-[^\\/]+|plotly\\.js|plotly\\.js-dist-min)[\\/]/,
              name: 'vendor-viz',
              chunks: 'all',
              priority: 45,
              reuseExistingChunk: true
            },
            vendorEditor: {
              test: /[\\/]node_modules[\\/](monaco-editor|@monaco-editor)[\\/]/,
              name: 'vendor-editor',
              chunks: 'all',
              priority: 40,
              reuseExistingChunk: true
            }
          }
        }
      };
    }

    return config;
  }
};

module.exports = nextConfig;

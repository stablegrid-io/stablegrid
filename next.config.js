/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'framer-motion']
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
              test: /[\\/]node_modules[\\/](recharts|d3|d3-[^\\/]+)[\\/]/,
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
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://cdn.jsdelivr.net",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stripe.com https://*.google-analytics.com https://va.vercel-scripts.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
              "font-src 'self' data:",
              "frame-src 'self' https://*.stripe.com https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  }
};

module.exports = nextConfig;

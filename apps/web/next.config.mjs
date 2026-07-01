/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://economia.awesomeapi.com.br https://api.coingecko.com https://finnhub.io https://brapi.dev https://*.googleusercontent.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@databolsa/ui'],
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', '@tanstack/react-query'],
  },
  async redirects() {
    return [
      {
        source: '/ativos',
        destination: '/mercados',
        permanent: true,
      },
      {
        source: '/proventos/agenda',
        destination: '/dividendos',
        permanent: true,
      },
      {
        source: '/mercado/cripto',
        destination: '/cripto',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

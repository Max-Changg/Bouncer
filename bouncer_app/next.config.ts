import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
      // Fallback redirects to Vercel deployment
      {
        source: '/',
        destination: 'https://bouncer-silk.vercel.app/',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/rsvp',
        destination: 'https://bouncer-silk.vercel.app/rsvp',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/create-event',
        destination: 'https://bouncer-silk.vercel.app/create-event',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/event',
        destination: 'https://bouncer-silk.vercel.app/event',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/event/:path*',
        destination: 'https://bouncer-silk.vercel.app/event/:path*',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/my-rsvps',
        destination: 'https://bouncer-silk.vercel.app/my-rsvps',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/qr-code',
        destination: 'https://bouncer-silk.vercel.app/qr-code',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/login',
        destination: 'https://bouncer-silk.vercel.app/login',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      {
        source: '/auth/callback',
        destination: 'https://bouncer-silk.vercel.app/auth/callback',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
      // Catch-all redirect for any other routes
      {
        source: '/:path*',
        destination: 'https://bouncer-silk.vercel.app/:path*',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'bouncer-app.dev',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
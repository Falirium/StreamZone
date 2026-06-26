import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Hot Module Replacement (HMR) dev origins whitelisting (development-only)
  ...(isDev && {
    allowedDevOrigins: [
      'localhost:3000',
      'lhr.life',
      '*.lhr.life',
      'localhost.run',
      '*.localhost.run'
    ],
  }),
  
  experimental: {
    serverActions: {
      // CSRF whitelist allowed origins
      allowedOrigins: isDev
        ? [
            'localhost:3000',
            'lhr.life',
            '*.lhr.life',
            'localhost.run',
            '*.localhost.run'
          ]
        : [
            // Production whitelisted domain resolved strictly from environment configuration
            process.env.NEXT_PUBLIC_APP_URL 
              ? new URL(process.env.NEXT_PUBLIC_APP_URL).host 
              : 'streamzone.com'
          ]
    }
  }
};

export default nextConfig;

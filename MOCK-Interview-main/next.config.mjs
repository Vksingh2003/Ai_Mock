import 'dotenv/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_INTERVIEW_QUESTIONS_COUNT: process.env.NEXT_PUBLIC_INTERVIEW_QUESTIONS_COUNT,
    NEXT_PUBLIC_DRIZZLE_DB_URL: process.env.NEXT_PUBLIC_DRIZZLE_DB_URL,
  },
  
  // Enable server actions with larger body size for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Webpack configuration (if needed for specific packages)
  webpack: (config, { isServer }) => {
    // Fix for canvas package (used by some PDF libraries)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
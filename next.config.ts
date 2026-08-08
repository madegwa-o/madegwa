
import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';


const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    reloadOnOnline: true,
    workboxOptions: {
        disableDevLogs: true,
    },
});


const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/api/images/**',
            },
            {
                protocol: 'https',
                hostname: '*.vercel.app',
                pathname: '/api/images/**',
            },
            {
                protocol: 'https',
                hostname: 'duka-sandy.vercel.app',
                pathname: '/api/images/**',
            },
            {
                protocol: 'https',
                hostname: 'pub-*.r2.dev', // R2 public URLs
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'a13bab3063d300082d0a15d610f46cb4.r2.cloudflarestorage.com', // Your R2 endpoint
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};



export default withPWA(nextConfig);
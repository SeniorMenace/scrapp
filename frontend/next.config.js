/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Proxy API requests to backend during development
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*`,
            },
        ];
    },

    // Allow images from all marketplace CDNs
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**.olx.uz' },
            { protocol: 'https', hostname: '**.olxcdn.com' },
            { protocol: 'https', hostname: '**.uzum.uz' },
            { protocol: 'https', hostname: '**.ucdn.uz' },
            { protocol: 'https', hostname: '**.wbbasket.ru' },
            { protocol: 'https', hostname: '**.wildberries.ru' },
            { protocol: 'https', hostname: '**.yandex.net' },
            { protocol: 'https', hostname: '**.yastatic.net' },
            { protocol: 'https', hostname: 'avatars.mds.yandex.net' },
        ],
        unoptimized: true,
    },
};

module.exports = nextConfig;

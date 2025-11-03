/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    // Fix the workspace root issue
    outputFileTracingRoot: process.cwd(),
    // Enable standalone output for Docker
    output: 'standalone',
    // Optimize standalone output to reduce disk space
    outputFileTracingExcludes: {
        '*': [
            'node_modules/@swc/core*',
            'node_modules/@next/swc*',
            'node_modules/.cache/**',
        ],
    },
    // Remove deprecated appDir option (App Router is default in Next.js 13+)
    // Add webpack configuration to handle memory issues
    webpack: (config, { isServer }) => {
        // Ignore the _document module error
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        
        // DISABLE CACHE to prevent "no space left on device" errors
        // This will make builds slower but won't fail when disk is full
        config.cache = false;
        
        // Optimize memory usage
        config.optimization = {
            ...config.optimization,
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            },
        };
        
        return config;
    },
    // Increase memory limit for build
    experimental: {
        // Remove appDir as it's deprecated
        esmExternals: true,
    },
};

export default nextConfig;

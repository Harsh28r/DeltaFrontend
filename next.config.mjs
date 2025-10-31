/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    // Fix the workspace root issue
    outputFileTracingRoot: process.cwd(),
    // Enable standalone output for Docker
    output: 'standalone',
    // Remove deprecated appDir option (App Router is default in Next.js 13+)
    // Add webpack configuration to handle memory issues
    webpack: (config, { isServer }) => {
        // Ignore the _document module error
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        
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

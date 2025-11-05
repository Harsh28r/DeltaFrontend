/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    // Enable standalone output for Docker deployment
    output: 'standalone',
    // Image configuration
    images: {
        unoptimized: true, // Disable image optimization for simpler deployment
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
    // Remove deprecated appDir option (App Router is default in Next.js 13+)
    // Add webpack configuration to handle memory issues
    webpack: (config, { isServer }) => {
        // Ignore the _document module error
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        
        // Handle ws module (needed for socket.io-client on server)
        if (isServer) {
            config.externals = config.externals || [];
            config.externals.push({
                'ws': 'ws',
            });
        } else {
            // For client-side, mark ws as external or false
            config.resolve.fallback = {
                ...config.resolve.fallback,
                ws: false,
            };
        }
        
        // Ensure proper module resolution for ESM packages
        if (!config.resolve.fullySpecified) {
            config.resolve.fullySpecified = false;
        }
        
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

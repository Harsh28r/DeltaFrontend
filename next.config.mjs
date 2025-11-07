/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    // Speed optimizations
    swcMinify: true, // Faster minification with SWC

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

    // Compiler options for faster builds
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
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
        
        // Enable cache for better performance
        // config.cache = false;
        
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
    // Experimental features for performance
    experimental: {
        // optimizeCss: true, // Disabled - requires critters package
        optimizePackageImports: ['@tabler/icons-react', 'lodash', 'date-fns'], // Tree-shake heavy packages
    },
};

export default nextConfig;

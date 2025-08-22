/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    // Fix the workspace root issue
    outputFileTracingRoot: process.cwd(),
    // Ensure App Router is used
    experimental: {
        appDir: true,
    },
    // Add webpack configuration to handle the _document issue
    webpack: (config, { isServer }) => {
        // Ignore the _document module error
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        return config;
    },
};

export default nextConfig;

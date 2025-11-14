#!/bin/bash

# Production startup script for Next.js application
# This script sets the production API URL and starts the application

echo "🚀 Starting Next.js Application in Production Mode..."

# Set production environment variable
export NEXT_PUBLIC_API_BASE_URL=https://api.realtechmktg.com
export NODE_ENV=production

# Navigate to project directory
cd "$(dirname "$0")"

# Check if build exists
if [ ! -d ".next" ]; then
    echo "⚠️  Build not found. Building application..."
    npm run build
fi

# Stop existing PM2 process if running
pm2 delete nextjs-app 2>/dev/null || true

# Start with PM2 with environment variables
echo "📦 Starting application with PM2..."
pm2 start npm --name "nextjs-app" -- start --update-env

# Save PM2 configuration
pm2 save

echo ""
echo "✅ Application started!"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "📝 View logs: pm2 logs nextjs-app"
echo "🔄 Restart: pm2 restart nextjs-app"
echo "🛑 Stop: pm2 stop nextjs-app"


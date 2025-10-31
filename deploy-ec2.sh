#!/bin/bash

# Deployment script for EC2 instance
# Usage: ./deploy-ec2.sh

echo "🚀 Starting Next.js Frontend Deployment to EC2..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on EC2
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}Error: This script must be run on an Ubuntu/Debian EC2 instance${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✓ Node.js $(node -v) is installed${NC}"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}✓ PM2 is installed${NC}"
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx not found. Installing Nginx...${NC}"
    sudo apt-get update
    sudo apt-get install -y nginx
else
    echo -e "${GREEN}✓ Nginx is installed${NC}"
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo -e "${YELLOW}Please create .env.production with:${NC}"
    echo "NEXT_PUBLIC_API_BASE_URL=http://your-ec2-ip:5000"
    echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build the application
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful!${NC}"

# Stop existing PM2 process if running
pm2 delete nextjs-app 2>/dev/null

# Start with PM2
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 start npm --name "nextjs-app" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
echo -e "${YELLOW}Setting up PM2 startup script...${NC}"
STARTUP_CMD=$(pm2 startup | grep "sudo" || echo "")
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
fi

# Setup Nginx reverse proxy
echo -e "${YELLOW}Setting up Nginx reverse proxy...${NC}"
sudo cp nginx.conf /etc/nginx/sites-available/nextjs-app
sudo ln -sf /etc/nginx/sites-available/nextjs-app /etc/nginx/sites-enabled/

# Remove default Nginx config if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    echo -e "${GREEN}✓ Nginx configured and restarted${NC}"
else
    echo -e "${RED}Nginx configuration test failed${NC}"
    exit 1
fi

# Check status
echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo -e "${YELLOW}Application Status:${NC}"
pm2 status

echo -e "\n${GREEN}Your application should now be accessible at:${NC}"
echo "http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')"

echo -e "\n${YELLOW}Useful commands:${NC}"
echo "pm2 logs nextjs-app        # View application logs"
echo "pm2 status                 # Check application status"
echo "pm2 restart nextjs-app     # Restart application"
echo "sudo tail -f /var/log/nginx/error.log  # View Nginx errors"


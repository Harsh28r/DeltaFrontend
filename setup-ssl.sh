#!/bin/bash

echo "=========================================="
echo "Setting up SSL for DeltaYards CRM"
echo "=========================================="
echo ""
echo "⚠️  Prerequisites:"
echo "  1. DNS must be working (realtechmktg.com → 13.60.35.244)"
echo "  2. Nginx must be running"
echo "  3. Ports 80 and 443 must be open in AWS Security Group"
echo ""
read -p "Have you verified the above? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the prerequisites first!"
    exit 1
fi

# Install Certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt update
    sudo apt install certbot python3-certbot-nginx -y
else
    echo "Certbot already installed"
fi

# Get SSL certificate
echo ""
echo "Requesting SSL certificates..."
echo "You'll need to provide an email address for renewal notifications"
echo ""

sudo certbot --nginx \
    -d realtechmktg.com \
    -d www.realtechmktg.com \
    -d api.realtechmktg.com

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ SSL setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Your sites are now secured with HTTPS:"
    echo "  - https://realtechmktg.com"
    echo "  - https://www.realtechmktg.com"
    echo "  - https://api.realtechmktg.com"
    echo ""
    echo "Certificates will auto-renew every 90 days"
    echo ""
    echo "⚠️  Don't forget to update your .env.production:"
    echo "  NEXT_PUBLIC_API_BASE_URL=https://api.realtechmktg.com"
    echo ""
else
    echo ""
    echo "❌ SSL setup failed!"
    echo ""
    echo "Common issues:"
    echo "  1. DNS not propagated yet - wait 24 hours"
    echo "  2. Port 80 not open in AWS Security Group"
    echo "  3. Nginx not running - check: sudo systemctl status nginx"
    echo ""
    exit 1
fi

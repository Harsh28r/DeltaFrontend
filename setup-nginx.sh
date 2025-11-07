#!/bin/bash

echo "=========================================="
echo "Setting up Nginx for DeltaYards CRM"
echo "=========================================="

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt update
    sudo apt install nginx -y
else
    echo "Nginx already installed"
fi

# Create Nginx configuration
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/realtechmktg > /dev/null <<'EOF'
# Frontend - main domain
server {
    listen 80;
    server_name realtechmktg.com www.realtechmktg.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for long-running requests
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}

# Backend API - subdomain
server {
    listen 80;
    server_name api.realtechmktg.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

# Enable the site
echo "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/realtechmktg /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid!"
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    echo ""
    echo "=========================================="
    echo "✅ Nginx setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Your sites are configured:"
    echo "  - http://realtechmktg.com → Frontend (port 3000)"
    echo "  - http://www.realtechmktg.com → Frontend (port 3000)"
    echo "  - http://api.realtechmktg.com → Backend (port 5000)"
    echo ""
    echo "Next steps:"
    echo "1. Wait for DNS to propagate (1-24 hours)"
    echo "2. Test: curl http://realtechmktg.com"
    echo "3. Set up SSL: sudo certbot --nginx -d realtechmktg.com -d www.realtechmktg.com -d api.realtechmktg.com"
    echo ""
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

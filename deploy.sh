#!/bin/bash

# WHS Safety Audit System - Deployment Script

echo "🚀 WHS Safety Audit System - Deployment Script"
echo "============================================"

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if this is first deployment
if [ ! -f ".netlify/state.json" ]; then
    echo "📦 First time deployment detected"
    echo "Running netlify init..."
    netlify init
fi

# Deploy to Netlify
echo "🔨 Deploying to Netlify..."
netlify deploy --prod

echo "✅ Deployment complete!"
echo ""
echo "📱 Your app should be available at your Netlify URL"
echo "📝 Demo accounts:"
echo "   - admin@amazon.at / admin123"
echo "   - safety@amazon.at / safety123"
echo "   - manager@amazon.at / manager123"

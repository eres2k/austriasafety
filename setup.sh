#!/bin/bash

echo "🚀 Setting up Aurora Audit Platform..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install root dependencies
echo "📦 Installing dependencies..."
npm install

# Create functions directory if it doesn't exist
mkdir -p netlify/functions

# Create a separate package.json for functions
echo "📦 Setting up Netlify Functions..."
cat > netlify/functions/package.json << EOF
{
  "name": "aurora-functions",
  "version": "1.0.0",
  "dependencies": {
    "@netlify/blobs": "^7.0.0"
  }
}
EOF

# Install function dependencies
cd netlify/functions
npm install
cd ../..

# Check if Netlify CLI is installed globally
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI is not installed globally."
    echo "   You can run it locally with: npx netlify"
else
    echo "✅ Netlify CLI is installed"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To run the development server:"
echo "  npm run dev"
echo ""
echo "To deploy to Netlify:"
echo "  npm run deploy"
echo ""
echo "Make sure you have:"
echo "  1. A Netlify account"
echo "  2. This site linked to Netlify (run: netlify init)"
echo "  3. Netlify Identity enabled in your site settings"

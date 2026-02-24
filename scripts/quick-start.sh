#!/bin/bash

# Quick Start Script for Worker Subscription Converter
# This script helps you get started quickly

set -e

echo "🚀 Worker Subscription Converter - Quick Start"
echo "============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old (found v$NODE_VERSION)"
    echo "Please upgrade to Node.js 18 or higher"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check if wrangler is installed globally
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI not found globally"
    echo "You can install it with: npm install -g wrangler"
    echo "Or use it via npx: npx wrangler"
    echo ""
else
    echo "✅ Wrangler $(wrangler --version) detected"
    echo ""
fi

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Test locally (start dev server)"
echo "2) Deploy to Cloudflare Workers"
echo "3) View documentation"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Starting local development server..."
        echo "Access at: http://localhost:8787"
        echo "Press Ctrl+C to stop"
        echo ""
        npm run dev
        ;;
    2)
        echo ""
        echo "🚀 Preparing to deploy to Cloudflare Workers..."
        echo ""
        
        # Check if logged in
        if ! npx wrangler whoami &> /dev/null; then
            echo "You need to login to Cloudflare first"
            read -p "Login now? (y/n): " login
            if [ "$login" = "y" ]; then
                npx wrangler login
            else
                echo "Please run 'npx wrangler login' manually"
                exit 1
            fi
        fi
        
        echo ""
        echo "Choose environment:"
        echo "1) Development"
        echo "2) Production"
        read -p "Enter choice (1-2): " env
        
        if [ "$env" = "1" ]; then
            echo "Deploying to development..."
            npm run deploy:dev
        elif [ "$env" = "2" ]; then
            echo "Deploying to production..."
            npm run deploy:prod
        else
            echo "Invalid choice"
            exit 1
        fi
        
        echo ""
        echo "✅ Deployment complete!"
        echo "Check your Cloudflare dashboard for the worker URL"
        ;;
    3)
        echo ""
        echo "📚 Documentation:"
        echo "- README.md - Main documentation"
        echo "- EXAMPLES.md - Usage examples"
        echo "- DEPLOYMENT.md - Deployment guide"
        echo "- CONTRIBUTING.md - How to contribute"
        echo ""
        echo "Opening README.md..."
        
        if command -v xdg-open &> /dev/null; then
            xdg-open README.md
        elif command -v open &> /dev/null; then
            open README.md
        else
            cat README.md | less
        fi
        ;;
    4)
        echo "Goodbye! 👋"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

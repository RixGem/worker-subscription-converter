#!/bin/bash

# Update Dependencies Script
# Safely updates npm dependencies

set -e

echo "📦 Updating Dependencies"
echo "========================"
echo ""

# Check for updates
echo "Checking for updates..."
npm outdated || true
echo ""

# Ask user
read -p "Update dependencies? (y/n): " update

if [ "$update" = "y" ]; then
    echo ""
    echo "Updating dependencies..."
    npm update
    
    echo ""
    echo "Running audit..."
    npm audit fix || true
    
    echo ""
    echo "Testing updated dependencies..."
    node -c worker_to_sub.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies updated successfully"
        echo ""
        echo "Please test locally with: npm run dev"
    else
        echo "❌ Syntax check failed after update"
        echo "Please review changes"
        exit 1
    fi
else
    echo "Skipping update"
fi

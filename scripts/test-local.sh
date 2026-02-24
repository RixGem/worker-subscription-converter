#!/bin/bash

# Local Testing Script
# Tests the worker locally before deployment

set -e

echo "🧪 Testing Worker Subscription Converter"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Start worker in background
echo "Starting worker..."
npx wrangler dev --port 8787 > /dev/null 2>&1 &
WRANGLER_PID=$!

# Wait for worker to start
echo "Waiting for worker to start..."
sleep 5

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing: $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
        ((FAILED++))
    fi
}

# Run tests
echo ""
echo "Running tests..."
echo ""

# Test 1: Root endpoint should return 200
test_endpoint "Root endpoint" "http://localhost:8787/" 200

# Test 2: Missing URL parameter should return 400
test_endpoint "Missing parameters" "http://localhost:8787/?target=clash" 400

# Test 3: Invalid target format should return 400
test_endpoint "Invalid target format" "http://localhost:8787/?url=test&target=invalid" 400

# Test 4: Valid request with mock data (will likely fail to fetch, but should not crash)
test_endpoint "Valid request structure" "http://localhost:8787/?url=https://example.com&target=json" 200

echo ""
echo "Testing response content..."

# Test 5: Check if root returns HTML
echo -n "Root returns HTML... "
response=$(curl -s http://localhost:8787/)
if echo "$response" | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 6: Check if error returns JSON
echo -n "Error returns JSON... "
error_response=$(curl -s "http://localhost:8787/?target=clash")
if echo "$error_response" | grep -q "error"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Cleanup
echo ""
echo "Cleaning up..."
kill $WRANGLER_PID 2>/dev/null || true

# Results
echo ""
echo "======================================="
echo "Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "======================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed! ✗${NC}"
    exit 1
fi

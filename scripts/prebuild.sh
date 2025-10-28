#!/bin/bash

# Pre-build checks and setup script
# This script runs before building the app to ensure everything is ready

set -e  # Exit on error

echo "🔍 Running pre-build checks..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js is installed ($(node --version))"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm is installed ($(npm --version))"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
else
    print_success "Dependencies are installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please create one based on .env.example"
    if [ -f ".env.example" ]; then
        echo "You can copy .env.example to .env and fill in the values:"
        echo "  cp .env.example .env"
    fi
else
    print_success ".env file exists"
fi

# Check required environment variables
if [ -f ".env" ]; then
    if ! grep -q "EXPO_PUBLIC_SUPABASE_URL" .env || ! grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
        print_warning "Required Supabase environment variables may be missing in .env"
    else
        print_success "Required environment variables are configured"
    fi
fi

# Run TypeScript type checking
echo ""
echo "🔍 Running TypeScript type checking..."
if npm run type-check; then
    print_success "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

# Run linting
echo ""
echo "🔍 Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    exit 1
fi

# Run tests
echo ""
echo "🔍 Running tests..."
if npm run test -- --passWithNoTests; then
    print_success "Tests passed"
else
    print_error "Tests failed"
    exit 1
fi

echo ""
print_success "All pre-build checks passed! Ready to build."

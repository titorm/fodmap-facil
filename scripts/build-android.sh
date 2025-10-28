#!/bin/bash

# Android build automation script
# Builds the Android app using EAS Build

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI is not installed. Installing globally..."
    npm install -g eas-cli
fi

print_success "EAS CLI is installed"

# Default build profile
BUILD_PROFILE="${1:-preview}"

echo ""
print_info "Building Android app with profile: $BUILD_PROFILE"
echo ""

# Validate build profile
if [ "$BUILD_PROFILE" != "development" ] && [ "$BUILD_PROFILE" != "preview" ] && [ "$BUILD_PROFILE" != "production" ]; then
    print_error "Invalid build profile: $BUILD_PROFILE"
    echo "Valid profiles: development, preview, production"
    echo "Usage: ./scripts/build-android.sh [profile]"
    exit 1
fi

# Run pre-build checks
if [ -f "scripts/prebuild.sh" ]; then
    print_info "Running pre-build checks..."
    bash scripts/prebuild.sh
    echo ""
fi

# Check EAS authentication
print_info "Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    print_warning "Not logged in to EAS. Please log in:"
    eas login
fi

# Build the Android app
print_info "Starting Android build..."
echo ""

if [ "$BUILD_PROFILE" == "development" ]; then
    print_warning "Building development client for Android..."
    eas build --platform android --profile development
elif [ "$BUILD_PROFILE" == "preview" ]; then
    print_info "Building preview APK for Android..."
    eas build --platform android --profile preview
elif [ "$BUILD_PROFILE" == "production" ]; then
    print_info "Building production AAB for Android..."
    eas build --platform android --profile production
fi

echo ""
print_success "Android build completed successfully!"
print_info "You can view your builds at: https://expo.dev/accounts/[your-account]/projects/[your-project]/builds"

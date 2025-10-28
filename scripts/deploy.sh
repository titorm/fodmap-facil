#!/bin/bash

# Deployment automation script
# Submits builds to app stores using EAS Submit

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

# Parse command line arguments
PLATFORM="${1:-}"
BUILD_ID="${2:-}"

# Show usage if no platform specified
if [ -z "$PLATFORM" ]; then
    echo "Usage: ./scripts/deploy.sh [platform] [build-id]"
    echo ""
    echo "Platforms:"
    echo "  android    - Submit to Google Play Store"
    echo "  ios        - Submit to Apple App Store"
    echo "  all        - Submit to both stores"
    echo ""
    echo "Build ID (optional):"
    echo "  Specify a build ID to submit a specific build"
    echo "  If not provided, will use the latest production build"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy.sh android"
    echo "  ./scripts/deploy.sh ios abc123-def456"
    echo "  ./scripts/deploy.sh all"
    exit 1
fi

# Validate platform
if [ "$PLATFORM" != "android" ] && [ "$PLATFORM" != "ios" ] && [ "$PLATFORM" != "all" ]; then
    print_error "Invalid platform: $PLATFORM"
    echo "Valid platforms: android, ios, all"
    exit 1
fi

# Check EAS authentication
print_info "Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    print_warning "Not logged in to EAS. Please log in:"
    eas login
fi

echo ""
print_info "Deployment Configuration:"
echo "  Platform: $PLATFORM"
if [ -n "$BUILD_ID" ]; then
    echo "  Build ID: $BUILD_ID"
else
    echo "  Build ID: Latest production build"
fi
echo ""

# Function to submit Android build
submit_android() {
    print_info "Submitting Android build to Google Play Store..."
    echo ""
    
    if [ -n "$BUILD_ID" ]; then
        eas submit --platform android --id "$BUILD_ID"
    else
        eas submit --platform android --latest
    fi
    
    print_success "Android submission completed!"
}

# Function to submit iOS build
submit_ios() {
    print_info "Submitting iOS build to Apple App Store..."
    echo ""
    
    if [ -n "$BUILD_ID" ]; then
        eas submit --platform ios --id "$BUILD_ID"
    else
        eas submit --platform ios --latest
    fi
    
    print_success "iOS submission completed!"
}

# Confirm deployment
print_warning "You are about to submit to production app stores."
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Submit based on platform
if [ "$PLATFORM" == "android" ]; then
    submit_android
elif [ "$PLATFORM" == "ios" ]; then
    submit_ios
elif [ "$PLATFORM" == "all" ]; then
    submit_android
    echo ""
    submit_ios
fi

echo ""
print_success "Deployment completed successfully!"
print_info "Monitor your submissions at:"
echo "  - Google Play Console: https://play.google.com/console"
echo "  - App Store Connect: https://appstoreconnect.apple.com"

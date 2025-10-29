# Design Document: Continuous Delivery Pipeline

## Overview

This design implements a comprehensive continuous delivery pipeline for the FODMAP Fácil mobile application using EAS Build and GitHub Actions. The system provides automated builds for three environments (development, preview, production), secure environment variable management, and automated submission to TestFlight and Google Play Internal Testing.

The design extends the existing CI workflow (`.github/workflows/ci.yml`) with build and submission capabilities while maintaining the current test and lint checks.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ git push / PR
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Repository                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              GitHub Actions Workflows                     │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   CI.yml   │  │ Preview.yml  │  │ Production.yml  │  │  │
│  │  │ (lint/test)│  │ (build/dist) │  │ (build/submit)  │  │  │
│  │  └─────┬──────┘  └──────┬───────┘  └────────┬────────┘  │  │
│  └────────┼─────────────────┼──────────────────┼───────────┘  │
└───────────┼─────────────────┼──────────────────┼──────────────┘
            │                 │                  │
            │                 ▼                  ▼
            │        ┌─────────────────────────────────┐
            │        │      EAS Build Service          │
            │        │  ┌──────────┐  ┌──────────┐    │
            │        │  │   iOS    │  │ Android  │    │
            │        │  │  Build   │  │  Build   │    │
            │        │  └────┬─────┘  └─────┬────┘    │
            │        └───────┼──────────────┼─────────┘
            │                │              │
            ▼                ▼              ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │   GitHub     │  │TestFlight│  │ Google Play  │
    │   Actions    │  │  (iOS)   │  │   Internal   │
    │   Status     │  │          │  │   Testing    │
    └──────────────┘  └──────────┘  └──────────────┘
```

### Environment Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Environment Variables                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Local Development          GitHub Actions       EAS Build   │
│  ┌──────────────┐          ┌──────────────┐    ┌─────────┐  │
│  │   .env       │          │   Secrets    │    │  Expo   │  │
│  │  (gitignored)│          │  (encrypted) │    │ Secrets │  │
│  └──────┬───────┘          └──────┬───────┘    └────┬────┘  │
│         │                         │                 │        │
│         └─────────────────────────┴─────────────────┘        │
│                                   │                           │
│                                   ▼                           │
│                          ┌─────────────────┐                 │
│                          │  .env.example   │                 │
│                          │  (documented)   │                 │
│                          └─────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. EAS Build Configuration (`eas.json`)

**Purpose**: Define build profiles for different environments with platform-specific settings.

**Enhanced Configuration Structure**:

```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      },
      "ios": {
        "simulator": true,
        "bundleIdentifier": "com.fodmapfacil.app.dev"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "preview"
      },
      "ios": {
        "bundleIdentifier": "com.fodmapfacil.app.preview"
      },
      "android": {
        "buildType": "apk"
      },
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production"
      },
      "ios": {
        "bundleIdentifier": "com.fodmapfacil.app"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Key Design Decisions**:

- Development builds use simulator/emulator for faster iteration
- Preview builds use internal distribution for TestFlight/Internal Testing
- Production builds use AAB for Android (required by Play Store) and auto-increment version
- Each profile has distinct bundle identifiers to allow side-by-side installation
- Channel support for EAS Update integration (future enhancement)

### 2. GitHub Actions Workflows

#### 2.1 CI Workflow (Enhanced `.github/workflows/ci.yml`)

**Purpose**: Run tests and linting on every PR and push.

**Triggers**:

- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

**Jobs**:

1. **test-and-lint**: Type checking, linting, unit tests
2. **coverage-report**: Generate and upload coverage reports

**Key Features**:

- Caches pnpm dependencies for faster runs
- Fails fast on first error
- Uploads test coverage to GitHub artifacts

#### 2.2 Preview Build Workflow (`.github/workflows/preview.yml`)

**Purpose**: Create preview builds when code is merged to develop branch.

**Triggers**:

- Push to `develop` branch
- Manual workflow dispatch

**Jobs**:

1. **build-preview**:
   - Runs after CI passes
   - Builds iOS and Android preview builds
   - Posts build URLs as PR comment or commit status

**Environment Variables Required**:

- `EXPO_TOKEN`: EAS authentication token
- All `EXPO_PUBLIC_*` variables from `.env.example`

**Workflow Structure**:

```yaml
name: Preview Build

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  build-preview:
    runs-on: ubuntu-latest
    steps:
      - Setup environment
      - Install dependencies
      - Configure EAS
      - Build iOS (preview profile)
      - Build Android (preview profile)
      - Post build URLs
```

#### 2.3 Production Build & Submit Workflow (`.github/workflows/production.yml`)

**Purpose**: Build and submit production releases to app stores.

**Triggers**:

- Push of tags matching `v*.*.*` (e.g., v1.0.0)
- Manual workflow dispatch with approval

**Jobs**:

1. **build-production**: Build production binaries
2. **submit-ios**: Submit to TestFlight (requires approval)
3. **submit-android**: Submit to Internal Testing (requires approval)

**Environment Variables Required**:

- `EXPO_TOKEN`: EAS authentication token
- `APPLE_ID`: Apple Developer account email
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password for submission
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Base64-encoded service account JSON

**Approval Gates**:

- Manual approval required before submission jobs
- Separate approvals for iOS and Android
- Approval timeout: 24 hours

### 3. Environment Variable Management

#### 3.1 Local Development

**Files**:

- `.env`: Local environment variables (gitignored)
- `.env.example`: Template with all required variables documented

**Loading Mechanism**:

- Expo automatically loads `.env` files
- Variables prefixed with `EXPO_PUBLIC_` are embedded in the app bundle
- Non-prefixed variables are only available during build time

#### 3.2 GitHub Actions

**Storage**: GitHub Secrets (Settings → Secrets and variables → Actions)

**Required Secrets**:

```
EXPO_TOKEN
EXPO_PUBLIC_APPWRITE_ENDPOINT
EXPO_PUBLIC_APPWRITE_PROJECT_ID
EXPO_PUBLIC_APPWRITE_DATABASE_ID
EXPO_PUBLIC_APPWRITE_TABLE_TESTS_ID
EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOMS_ID
EXPO_PUBLIC_APPWRITE_TABLE_PROTOCOL_RUNS_ID
EXPO_PUBLIC_APPWRITE_TABLE_TEST_STEPS_ID
EXPO_PUBLIC_APPWRITE_TABLE_SYMPTOM_ENTRIES_ID
EXPO_PUBLIC_APPWRITE_TABLE_NOTIFICATION_HISTORY_ID
APPLE_ID
APPLE_APP_SPECIFIC_PASSWORD
GOOGLE_SERVICE_ACCOUNT_KEY
```

**Injection Method**:

```yaml
- name: Create .env file
  run: |
    echo "EXPO_PUBLIC_APPWRITE_ENDPOINT=${{ secrets.EXPO_PUBLIC_APPWRITE_ENDPOINT }}" >> .env
    echo "EXPO_PUBLIC_APPWRITE_PROJECT_ID=${{ secrets.EXPO_PUBLIC_APPWRITE_PROJECT_ID }}" >> .env
    # ... other variables
```

#### 3.3 EAS Build

**Storage**: Expo Secrets (managed via `eas secret:create`)

**Setup Commands**:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_ENDPOINT --value "https://cloud.appwrite.io/v1"
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_PROJECT_ID --value "your-project-id"
# ... other secrets
```

**Access**: EAS automatically injects secrets during build based on profile configuration.

### 4. Build Scripts (package.json)

**Enhanced Scripts**:

```json
{
  "scripts": {
    "build:dev": "eas build --profile development --platform all",
    "build:dev:ios": "eas build --profile development --platform ios",
    "build:dev:android": "eas build --profile development --platform android",

    "build:preview": "eas build --profile preview --platform all --non-interactive",
    "build:preview:ios": "eas build --profile preview --platform ios --non-interactive",
    "build:preview:android": "eas build --profile preview --platform android --non-interactive",

    "build:prod": "eas build --profile production --platform all",
    "build:prod:ios": "eas build --profile production --platform ios",
    "build:prod:android": "eas build --profile production --platform android",

    "submit:ios": "eas submit --platform ios --latest",
    "submit:android": "eas submit --platform android --latest",
    "submit:all": "eas submit --platform all --latest",

    "release:patch": "npm version patch && git push && git push --tags",
    "release:minor": "npm version minor && git push && git push --tags",
    "release:major": "npm version major && git push && git push --tags"
  }
}
```

**Design Rationale**:

- `--non-interactive` flag for CI environments prevents hanging on prompts
- `--latest` flag for submit commands uses the most recent build
- Release scripts automate version bumping and tag creation

## Data Models

### Build Artifact Structure

```typescript
interface BuildArtifact {
  id: string;
  platform: 'ios' | 'android';
  profile: 'development' | 'preview' | 'production';
  buildNumber: number;
  version: string;
  status: 'pending' | 'in-progress' | 'finished' | 'errored';
  artifacts: {
    buildUrl?: string;
    applicationArchiveUrl?: string;
    logsUrl: string;
  };
  createdAt: string;
  completedAt?: string;
}
```

### Submission Status

```typescript
interface SubmissionStatus {
  id: string;
  platform: 'ios' | 'android';
  status: 'pending' | 'in-progress' | 'finished' | 'errored';
  submittedBuild: {
    id: string;
    version: string;
    buildNumber: number;
  };
  archiveUrl?: string;
  logsUrl: string;
  createdAt: string;
  completedAt?: string;
}
```

## Error Handling

### Build Failures

**Common Failure Scenarios**:

1. **Missing Environment Variables**: Build fails during configuration
2. **Code Signing Issues**: iOS builds fail due to provisioning profile problems
3. **Native Dependency Conflicts**: Build fails during compilation
4. **Out of Memory**: Build fails on resource-constrained runners

**Handling Strategy**:

- Fail fast with clear error messages
- Log full build output to GitHub Actions artifacts
- Provide troubleshooting links in workflow output
- Retry transient failures (network issues) up to 2 times

**Error Notification**:

```yaml
- name: Notify on failure
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '❌ Build failed. Check the [workflow logs](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}) for details.'
      })
```

### Submission Failures

**Common Failure Scenarios**:

1. **Invalid Credentials**: Apple ID or service account key is incorrect
2. **App Store Connect Issues**: Temporary API outages
3. **Binary Rejection**: Build doesn't meet store requirements
4. **Version Conflict**: Version number already exists in store

**Handling Strategy**:

- Validate credentials before submission
- Implement exponential backoff for API rate limits
- Provide detailed error messages with remediation steps
- Allow manual retry without rebuilding

### Environment Variable Issues

**Detection**:

- Pre-build validation script checks for required variables
- Fails early if critical variables are missing

**Validation Script** (`scripts/validate-env.ts`):

```typescript
const requiredVars = [
  'EXPO_PUBLIC_APPWRITE_ENDPOINT',
  'EXPO_PUBLIC_APPWRITE_PROJECT_ID',
  // ... other required variables
];

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
```

## Testing Strategy

### 1. Workflow Testing

**Approach**: Test workflows in a separate branch before merging to main.

**Test Cases**:

- Trigger CI workflow on PR
- Trigger preview build on develop push
- Trigger production build on tag push
- Test manual workflow dispatch
- Verify environment variable injection
- Test failure scenarios (intentional failures)

### 2. Build Validation

**Automated Checks**:

- Build completes without errors
- Build artifacts are accessible
- Build size is within acceptable limits (< 100MB for preview)
- Build includes all required assets

**Manual Validation**:

- Install preview build on physical device
- Verify app launches successfully
- Test core functionality (auth, navigation)
- Verify environment-specific configuration

### 3. Submission Testing

**Pre-Submission Checklist**:

- Version number is incremented
- Release notes are prepared
- Screenshots are updated (if needed)
- Privacy policy is current

**Post-Submission Validation**:

- Build appears in TestFlight/Internal Testing
- Testers can install the build
- No immediate crashes on launch

### 4. Integration Testing

**End-to-End Flow**:

1. Create feature branch
2. Make code changes
3. Open PR → CI runs
4. Merge to develop → Preview build triggers
5. Test preview build
6. Create release tag → Production build triggers
7. Approve submission → App appears in stores

**Success Criteria**:

- All workflows complete successfully
- Builds are installable
- No manual intervention required (except approvals)

## Performance Considerations

### Build Time Optimization

**Current Baseline**: ~15-20 minutes per platform

**Optimization Strategies**:

1. **Dependency Caching**: Cache node_modules and CocoaPods
2. **Parallel Builds**: Build iOS and Android simultaneously
3. **Incremental Builds**: Use EAS Build caching for unchanged native code
4. **Resource Allocation**: Use larger GitHub Actions runners for production builds

**Expected Improvement**: 10-15 minutes per platform

### CI/CD Pipeline Efficiency

**Optimization Strategies**:

1. **Conditional Builds**: Only build when relevant files change
2. **Matrix Strategy**: Run tests in parallel across multiple Node versions
3. **Artifact Reuse**: Reuse test results across jobs
4. **Workflow Concurrency**: Cancel in-progress runs when new commits are pushed

**Configuration Example**:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Cost Management

**GitHub Actions Minutes**:

- Free tier: 2,000 minutes/month
- Estimated usage: ~500 minutes/month (with optimizations)

**EAS Build Credits**:

- Free tier: Limited builds per month
- Recommendation: Purchase build credits for production use

## Security Considerations

### 1. Secret Management

**Best Practices**:

- Never commit secrets to repository
- Use GitHub Secrets for CI/CD
- Use Expo Secrets for EAS builds
- Rotate secrets regularly (quarterly)
- Use least-privilege access for service accounts

**Secret Rotation Process**:

1. Generate new secret
2. Update in GitHub Secrets and Expo Secrets
3. Trigger test build to verify
4. Revoke old secret

### 2. Code Signing

**iOS**:

- Use App Store Connect API key for automated signing
- Store certificates in GitHub Secrets (encrypted)
- Use match or fastlane for certificate management

**Android**:

- Store keystore in GitHub Secrets (base64-encoded)
- Use separate keystores for preview and production
- Backup keystore securely (password manager + offline storage)

### 3. Access Control

**GitHub Repository**:

- Require PR reviews before merge
- Protect main and develop branches
- Require status checks to pass
- Restrict who can approve production deployments

**EAS Access**:

- Use team accounts, not personal accounts
- Limit who can trigger production builds
- Enable two-factor authentication

### 4. Dependency Security

**Automated Scanning**:

- Dependabot for dependency updates
- npm audit in CI pipeline
- Snyk or similar for vulnerability scanning

**Update Policy**:

- Review and update dependencies monthly
- Apply security patches immediately
- Test thoroughly before deploying updates

## Documentation Requirements

### 1. README Updates

**Build Status Badge**:

```markdown
[![CI](https://github.com/username/fodmap-facil/actions/workflows/ci.yml/badge.svg)](https://github.com/username/fodmap-facil/actions/workflows/ci.yml)
```

**Quick Start Section**:

```markdown
## Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI
- EAS CLI

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Run `pnpm install`
4. Run `pnpm start`

### Building

- Development: `pnpm run build:dev`
- Preview: `pnpm run build:preview`
- Production: `pnpm run build:prod`
```

### 2. Release Checklist

**Location**: `docs/RELEASE_CHECKLIST.md`

**Contents**:

1. Pre-release preparation
2. Version bumping
3. Changelog generation
4. Build and test
5. Submission process
6. Post-release verification
7. Rollback procedures

### 3. Troubleshooting Guide

**Location**: `docs/TROUBLESHOOTING.md`

**Common Issues**:

- Build failures and solutions
- Environment variable problems
- Code signing issues
- Submission errors
- Workflow debugging tips

### 4. Environment Setup Guide

**Location**: `docs/ENVIRONMENT_SETUP.md`

**Contents**:

- Local development setup
- GitHub Secrets configuration
- Expo Secrets configuration
- Apple Developer account setup
- Google Play Console setup

## Migration Path

### Phase 1: EAS Configuration (Week 1)

1. Update `eas.json` with enhanced profiles
2. Test local builds with each profile
3. Document bundle identifiers and signing

### Phase 2: GitHub Actions Setup (Week 1-2)

1. Enhance CI workflow with coverage
2. Create preview build workflow
3. Test preview workflow on develop branch
4. Create production workflow (without submission)

### Phase 3: Environment Variables (Week 2)

1. Document all required variables in `.env.example`
2. Set up GitHub Secrets
3. Set up Expo Secrets
4. Test variable injection in workflows

### Phase 4: Submission Automation (Week 3)

1. Configure App Store Connect API
2. Configure Google Play service account
3. Add submission jobs to production workflow
4. Test submission with internal builds

### Phase 5: Documentation & Training (Week 3-4)

1. Write release checklist
2. Write troubleshooting guide
3. Update README with badges and instructions
4. Train team on new process

### Phase 6: Rollout (Week 4)

1. Merge all changes to main
2. Create first production release using new pipeline
3. Monitor and iterate based on feedback

## Future Enhancements

### 1. EAS Update Integration

- Over-the-air updates for JavaScript changes
- Separate update channels for preview and production
- Rollback capability for bad updates

### 2. Automated Testing in CI

- E2E tests with Detox or Maestro
- Visual regression testing
- Performance benchmarking

### 3. Release Notes Automation

- Generate changelog from commit messages
- Auto-populate App Store Connect release notes
- Link to GitHub releases

### 4. Advanced Monitoring

- Build time metrics and trends
- Success rate tracking
- Cost analysis and optimization

### 5. Multi-Environment Support

- Staging environment
- QA environment
- Region-specific builds

## Conclusion

This design provides a robust, automated continuous delivery pipeline that reduces manual effort, improves reliability, and enables faster iteration. The phased migration approach ensures minimal disruption to current development workflows while progressively adding automation capabilities.

The system is designed to scale with the team and can be extended with additional features as needs evolve.

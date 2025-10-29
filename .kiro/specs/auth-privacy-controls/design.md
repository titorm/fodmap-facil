# Design Document

## Overview

This design implements a comprehensive authentication and privacy control system for the FODMAP application using Appwrite as the backend service. The system provides passwordless authentication via magic links, optional OAuth integration (Google/Apple), and complete GDPR/LGPD-compliant privacy controls including data export, account deletion, and consent management.

The architecture follows a service-oriented approach with clear separation between authentication logic, privacy operations, and UI components. All privacy operations are logged for compliance, and route guards ensure secure access to protected screens.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Screens │  │Profile Screen│  │Legal Screens │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         │      Application Layer              │             │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌───────▼──────┐      │
│  │AuthService   │  │PrivacyService│  │ConsentManager│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         │      Infrastructure Layer           │             │
│  ┌──────▼───────────────────▼──────────────────▼──────┐     │
│  │            Appwrite Client                         │     │
│  │  (Account, TablesDB, Storage)                      │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Authentication Flow (Magic Link):**

```
User → SignInScreen → AuthService.sendMagicLink() → Appwrite
                                                        ↓
User ← Email Client ← Appwrite Email Service ← Magic Link Token
  ↓
Click Link → Deep Link Handler → AuthService.verifyMagicLink()
                                        ↓
                                  Session Created
                                        ↓
                                  Navigate to App
```

**Data Export Flow:**

```
User → ProfileScreen → PrivacyService.exportUserData()
                              ↓
                    Fetch all user tables
                              ↓
                    Aggregate into JSON
                              ↓
                    Log export event
                              ↓
                    Return file/share
```

**Account Deletion Flow:**

```
User → ProfileScreen → Confirmation Dialog
                              ↓
                    Re-authentication Required
                              ↓
                    PrivacyService.deleteAccount()
                              ↓
                    Delete all user records
                              ↓
                    Log deletion event
                              ↓
                    Sign out & redirect
```

## Components and Interfaces

### 1. Authentication Service

**Location:** `src/services/auth/AuthService.ts`

```typescript
interface AuthService {
  // Magic Link Authentication
  sendMagicLink(email: string): Promise<{ success: boolean; error?: string }>;
  verifyMagicLink(userId: string, secret: string): Promise<{ success: boolean; error?: string }>;

  // OAuth Authentication
  signInWithGoogle(): Promise<{ success: boolean; error?: string }>;
  signInWithApple(): Promise<{ success: boolean; error?: string }>;

  // Session Management
  getCurrentUser(): Promise<User | null>;
  signOut(): Promise<void>;

  // Re-authentication for sensitive operations
  reauthenticate(email: string): Promise<{ success: boolean; error?: string }>;
}
```

**Key Responsibilities:**

- Handle magic link generation and verification
- Manage OAuth flows with Google and Apple
- Maintain session state
- Provide re-authentication for sensitive operations

**Implementation Details:**

- Uses Appwrite's `account.createMagicURLToken()` for magic links
- Implements OAuth using Appwrite's OAuth2 providers
- Magic links expire after 15 minutes (900 seconds)
- Deep linking integration for magic link verification
- Email validation before sending magic links

### 2. Privacy Service

**Location:** `src/services/privacy/PrivacyService.ts`

```typescript
interface ExportedUserData {
  exportDate: string;
  userId: string;
  userProfile: UserProfile;
  protocolRuns: ProtocolRun[];
  testSteps: TestStep[];
  symptomEntries: SymptomEntry[];
  washoutPeriods: WashoutPeriod[];
  foodItems: FoodItem[];
  groupResults: GroupResult[];
  notificationSchedules: NotificationSchedule[];
  notificationHistory: NotificationHistory[];
  consents: ConsentRecord[];
}

interface PrivacyService {
  // Data Export
  exportUserData(userId: string): Promise<{ data?: ExportedUserData; error?: string }>;
  shareExportedData(data: ExportedUserData): Promise<void>;

  // Account Deletion
  deleteAccount(userId: string): Promise<{ success: boolean; error?: string }>;

  // Audit Logging
  logPrivacyEvent(event: PrivacyEvent): Promise<void>;
}

interface PrivacyEvent {
  userId: string;
  eventType: 'export' | 'deletion' | 'consent_change';
  timestamp: string;
  metadata?: Record<string, any>;
}
```

**Key Responsibilities:**

- Export all user data in JSON format
- Permanently delete user accounts and all associated data
- Log all privacy-related operations for compliance
- Handle file sharing/download for exports

**Implementation Details:**

- Queries all tables in TABLES constant for user data
- Uses Expo FileSystem for temporary file storage
- Uses Expo Sharing for cross-platform file sharing
- Deletion is cascading across all related tables
- Audit logs stored in dedicated `privacy_audit_logs` table
- Export includes metadata (export date, version)

### 3. Consent Manager

**Location:** `src/services/privacy/ConsentManager.ts`

```typescript
interface ConsentType {
  id: string;
  name: string;
  description: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legitimate_interest';
  required: boolean;
  category: 'essential' | 'analytics' | 'marketing' | 'personalization';
}

interface ConsentRecord {
  userId: string;
  consentTypeId: string;
  granted: boolean;
  timestamp: string;
  version: string;
}

interface ConsentManager {
  // Consent Management
  getConsentTypes(): ConsentType[];
  getUserConsents(userId: string): Promise<ConsentRecord[]>;
  updateConsent(userId: string, consentTypeId: string, granted: boolean): Promise<void>;

  // Consent Validation
  hasConsent(userId: string, consentTypeId: string): Promise<boolean>;
  requiresConsent(feature: string): boolean;
}
```

**Key Responsibilities:**

- Define and manage consent types
- Track user consent preferences
- Validate consent before data processing
- Version consent records for audit trail

**Implementation Details:**

- Consent types defined as constants
- Stored in `user_consents` table
- Versioned to track changes over time
- Essential consents cannot be revoked
- UI warnings for functional impact of revocation

### 4. Route Guards

**Location:** `src/navigation/guards/AuthGuard.tsx`

```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

interface RouteGuard {
  // Check authentication status
  isAuthenticated(): boolean;

  // Redirect handling
  saveIntendedRoute(route: string): void;
  getIntendedRoute(): string | null;
  clearIntendedRoute(): void;
}
```

**Key Responsibilities:**

- Protect authenticated routes
- Redirect unauthenticated users to sign-in
- Preserve intended destination for post-auth redirect
- Handle session expiration

**Implementation Details:**

- HOC pattern wrapping protected screens
- Uses useAuth hook for session state
- Stores intended route in AsyncStorage
- Integrates with React Navigation

### 5. UI Components

#### SignInScreen (Enhanced)

**Location:** `src/features/auth/screens/SignInScreen.tsx`

- Email input with validation
- "Send Magic Link" button
- OAuth buttons (Google, Apple) - conditionally rendered
- Loading states and error messages
- Link to legal documents

#### ProfileScreen (Enhanced)

**Location:** `src/features/profile/screens/ProfileScreen.tsx`

- User information display
- "Export My Data" button
- "Delete Account" button (with confirmation)
- "Manage Consents" navigation
- Links to Terms and Privacy Policy

#### ConsentManagementScreen

**Location:** `src/features/profile/screens/ConsentManagementScreen.tsx`

- List of consent types with descriptions
- Toggle switches for each consent
- Warning messages for required consents
- Save/Cancel actions

#### LegalDocumentsScreen

**Location:** `src/features/profile/screens/LegalDocumentsScreen.tsx`

- Tabbed interface (Terms / Privacy)
- Scrollable document content
- Version and effective date display
- Accept/Decline actions (for first-time users)

## Data Models

### User Consents Table

```typescript
interface UserConsent {
  $id: string;
  userId: string;
  consentTypeId: string;
  granted: boolean;
  timestamp: string;
  version: string;
  $createdAt: string;
  $updatedAt: string;
}
```

### Privacy Audit Logs Table

```typescript
interface PrivacyAuditLog {
  $id: string;
  userId: string;
  eventType: 'export' | 'deletion' | 'consent_change';
  timestamp: string;
  metadata: string; // JSON string
  ipAddress?: string;
  userAgent?: string;
  $createdAt: string;
}
```

### Legal Documents Table

```typescript
interface LegalDocument {
  $id: string;
  type: 'terms' | 'privacy';
  language: string;
  version: string;
  effectiveDate: string;
  content: string; // Markdown or HTML
  $createdAt: string;
  $updatedAt: string;
}
```

## Error Handling

### Error Types

```typescript
enum AuthErrorCode {
  INVALID_EMAIL = 'auth/invalid-email',
  MAGIC_LINK_EXPIRED = 'auth/magic-link-expired',
  MAGIC_LINK_INVALID = 'auth/magic-link-invalid',
  OAUTH_FAILED = 'auth/oauth-failed',
  REAUTHENTICATION_REQUIRED = 'auth/reauth-required',
  SESSION_EXPIRED = 'auth/session-expired',
}

enum PrivacyErrorCode {
  EXPORT_FAILED = 'privacy/export-failed',
  DELETION_FAILED = 'privacy/deletion-failed',
  CONSENT_UPDATE_FAILED = 'privacy/consent-update-failed',
  INSUFFICIENT_PERMISSIONS = 'privacy/insufficient-permissions',
}
```

### Error Handling Strategy

1. **User-Facing Errors:**
   - Display localized error messages
   - Provide actionable recovery steps
   - Log errors for debugging

2. **Network Errors:**
   - Retry logic with exponential backoff
   - Offline mode indicators
   - Queue operations for later sync

3. **Validation Errors:**
   - Inline field validation
   - Clear error messages
   - Prevent invalid submissions

4. **Critical Errors:**
   - Error boundary fallback UI
   - Error reporting to monitoring service
   - Graceful degradation

## Testing Strategy

### Unit Tests

**AuthService Tests:**

- Magic link email validation
- Magic link token generation
- OAuth provider initialization
- Session state management
- Re-authentication flow

**PrivacyService Tests:**

- Data export completeness
- JSON structure validation
- Account deletion cascade
- Audit log creation
- Error handling

**ConsentManager Tests:**

- Consent type retrieval
- Consent update logic
- Consent validation
- Version tracking

### Integration Tests (Mocked)

**Export Flow Test:**

```typescript
describe('Data Export Flow', () => {
  it('should export all user data successfully', async () => {
    // Mock user with complete data
    const mockUser = createMockUser();

    // Execute export
    const result = await privacyService.exportUserData(mockUser.$id);

    // Verify completeness
    expect(result.data).toBeDefined();
    expect(result.data.userProfile).toEqual(mockUser);
    expect(result.data.symptomEntries).toHaveLength(5);
    expect(result.data.protocolRuns).toHaveLength(2);

    // Verify audit log
    const logs = await getAuditLogs(mockUser.$id);
    expect(logs).toContainEqual(
      expect.objectContaining({
        eventType: 'export',
        userId: mockUser.$id,
      })
    );
  });
});
```

**Deletion Flow Test:**

```typescript
describe('Account Deletion Flow', () => {
  it('should delete all user data permanently', async () => {
    // Mock user with complete data
    const mockUser = createMockUser();

    // Execute deletion
    const result = await privacyService.deleteAccount(mockUser.$id);

    // Verify deletion
    expect(result.success).toBe(true);

    // Verify all tables are empty for user
    const profile = await getUserProfile(mockUser.$id);
    expect(profile).toBeNull();

    const symptoms = await getSymptomEntries(mockUser.$id);
    expect(symptoms).toHaveLength(0);

    // Verify audit log exists
    const logs = await getAuditLogs(mockUser.$id);
    expect(logs).toContainEqual(
      expect.objectContaining({
        eventType: 'deletion',
        userId: mockUser.$id,
      })
    );
  });
});
```

### E2E Tests

**Magic Link Authentication:**

1. Enter email on sign-in screen
2. Verify magic link sent
3. Simulate link click
4. Verify user authenticated
5. Verify navigation to main app

**Data Export:**

1. Navigate to profile screen
2. Tap "Export My Data"
3. Verify loading state
4. Verify share dialog appears
5. Verify JSON file structure

**Account Deletion:**

1. Navigate to profile screen
2. Tap "Delete Account"
3. Verify confirmation dialog
4. Confirm deletion
5. Verify re-authentication prompt
6. Complete re-authentication
7. Verify account deleted
8. Verify redirect to sign-in

## Security Considerations

### Authentication Security

1. **Magic Links:**
   - 15-minute expiration
   - Single-use tokens
   - HTTPS-only delivery
   - Rate limiting on generation

2. **OAuth:**
   - Secure redirect URIs
   - State parameter validation
   - Token storage in secure storage
   - Refresh token rotation

3. **Session Management:**
   - Secure session tokens
   - Automatic expiration
   - Secure storage (Expo SecureStore)
   - Session invalidation on sign-out

### Privacy Security

1. **Data Export:**
   - Authentication required
   - Rate limiting (1 export per hour)
   - Temporary file cleanup
   - No PII in logs

2. **Account Deletion:**
   - Re-authentication required
   - Confirmation dialog
   - Irreversible warning
   - Audit trail maintained

3. **Consent Management:**
   - Versioned records
   - Audit trail
   - Cannot revoke essential consents
   - Clear impact warnings

## Legal Documents

### Terms of Service (pt-BR)

**Location:** `src/content/legal/terms-pt-BR.md`

**Sections:**

1. Aceitação dos Termos
2. Descrição do Serviço
3. Cadastro e Conta
4. Uso Aceitável
5. Propriedade Intelectual
6. Limitação de Responsabilidade
7. Modificações dos Termos
8. Lei Aplicável
9. Contato

### Privacy Policy (pt-BR)

**Location:** `src/content/legal/privacy-pt-BR.md`

**Sections:**

1. Introdução
2. Dados Coletados
3. Finalidade do Tratamento
4. Base Legal (LGPD)
5. Compartilhamento de Dados
6. Armazenamento e Segurança
7. Direitos do Titular (LGPD Art. 18)
   - Confirmação de tratamento
   - Acesso aos dados
   - Correção de dados
   - Anonimização, bloqueio ou eliminação
   - Portabilidade
   - Revogação de consentimento
8. Retenção de Dados
9. Cookies e Tecnologias
10. Alterações na Política
11. Contato e DPO

## Implementation Notes

### Appwrite Configuration

**Required Appwrite Setup:**

1. **Authentication Settings:**
   - Enable Magic URL authentication
   - Configure OAuth providers (Google, Apple)
   - Set redirect URLs for OAuth
   - Configure email templates for magic links

2. **Database Tables:**
   - `user_consents` table with indexes on userId
   - `privacy_audit_logs` table with indexes on userId and eventType
   - `legal_documents` table with indexes on type and language

3. **Permissions:**
   - User-level read/write for user_consents
   - User-level read for legal_documents
   - Admin-only write for legal_documents
   - System-level write for privacy_audit_logs

### Environment Variables

```
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
EXPO_PUBLIC_APPWRITE_TABLE_USER_CONSENTS_ID=user-consents-table-id
EXPO_PUBLIC_APPWRITE_TABLE_PRIVACY_AUDIT_LOGS_ID=audit-logs-table-id
EXPO_PUBLIC_APPWRITE_TABLE_LEGAL_DOCUMENTS_ID=legal-docs-table-id
```

### Deep Linking Configuration

**app.json:**

```json
{
  "expo": {
    "scheme": "fodmap",
    "ios": {
      "associatedDomains": ["applinks:fodmap.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "fodmap",
              "host": "auth"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Localization Keys

**New i18n keys required:**

```json
{
  "auth": {
    "magicLink": "Enviar link mágico",
    "magicLinkSent": "Link enviado! Verifique seu e-mail",
    "magicLinkExpired": "Link expirado. Solicite um novo",
    "signInWithGoogle": "Entrar com Google",
    "signInWithApple": "Entrar com Apple",
    "reauthRequired": "Por favor, autentique-se novamente"
  },
  "privacy": {
    "exportData": "Exportar meus dados",
    "exportSuccess": "Dados exportados com sucesso",
    "exportFailed": "Falha ao exportar dados",
    "deleteAccount": "Excluir conta",
    "deleteConfirmTitle": "Excluir conta permanentemente?",
    "deleteConfirmMessage": "Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.",
    "deleteSuccess": "Conta excluída com sucesso",
    "deleteFailed": "Falha ao excluir conta",
    "manageConsents": "Gerenciar consentimentos"
  },
  "legal": {
    "terms": "Termos de Uso",
    "privacy": "Política de Privacidade",
    "version": "Versão",
    "effectiveDate": "Data de vigência"
  }
}
```

## Performance Considerations

1. **Data Export:**
   - Paginated queries for large datasets
   - Background processing for large exports
   - Progress indicators for user feedback
   - Temporary file cleanup after sharing

2. **Account Deletion:**
   - Batch deletion operations
   - Background processing
   - Progress indicators
   - Timeout handling for large datasets

3. **Consent Management:**
   - Cached consent state
   - Optimistic UI updates
   - Background sync

4. **Route Guards:**
   - Memoized authentication checks
   - Minimal re-renders
   - Efficient navigation state management

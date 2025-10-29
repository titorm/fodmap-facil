# Design Document - B2B Portal Seed

## Overview

The B2B Portal is a Next.js 14+ application using the App Router architecture, TypeScript, and Supabase for authentication. This seed implementation establishes the foundational structure for a healthcare professional portal with patient data access and report viewing capabilities.

The portal follows a server-first approach with React Server Components where appropriate, client components for interactive elements, and a clear separation between authentication, data access, and presentation layers.

## Architecture

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth with SSR support
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI or Radix UI primitives
- **State Management**: React Context for auth state, Server Components for data fetching

### Directory Structure

```
portal/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── patients/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   ├── patients/
│   │   ├── PatientList.tsx
│   │   └── PatientCard.tsx
│   └── reports/
│       └── ReportViewer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth/
│   │   ├── permissions.ts
│   │   └── session.ts
│   └── mock-data/
│       ├── patients.ts
│       └── reports.ts
├── types/
│   ├── patient.ts
│   ├── report.ts
│   └── auth.ts
├── middleware.ts
└── next.config.js
```

## Components and Interfaces

### Authentication Layer

**Supabase Client Configuration**

Two client instances are required:

- **Client-side client** (`lib/supabase/client.ts`): For client components and browser interactions
- **Server-side client** (`lib/supabase/server.ts`): For Server Components and API routes with cookie-based session management

**Authentication Flow**

1. User accesses protected route
2. Middleware checks for valid session cookie
3. If no session, redirect to `/login`
4. Login form submits credentials to Supabase Auth
5. On success, session cookie is set and user redirected to `/patients`
6. Subsequent requests include session cookie for authentication

**Session Management Interface**

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    user_metadata: {
      name?: string;
      role?: string;
    };
  };
  access_token: string;
  expires_at: number;
}

interface AuthContext {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}
```

### Permission Layer

**Basic Permission Structure**

```typescript
enum Permission {
  VIEW_PATIENTS = 'view:patients',
  VIEW_REPORTS = 'view:reports',
}

interface PermissionCheck {
  hasPermission: (permission: Permission) => boolean;
  requirePermission: (permission: Permission) => void;
}
```

Initial implementation grants all authenticated users all permissions. The structure allows future extension with role-based rules:

```typescript
// Future extension example
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}
```

### Layout Components

**Header Component**

Displays on all authenticated pages with:

- Portal branding/logo
- Navigation links (Patients)
- User information dropdown
- Sign out button

**Dashboard Layout**

Wraps all authenticated pages with:

- Header component
- Main content area with consistent padding
- Responsive container (max-width: 1280px)

### Patient List

**Patient Data Model**

```typescript
interface Patient {
  id: string;
  name: string;
  identifier: string; // e.g., patient number or MRN
  dateOfBirth?: string;
  lastVisit?: string;
}
```

**Mock Data**

Initial seed includes 10-15 mock patients with realistic names and identifiers. Data stored in `lib/mock-data/patients.ts` as a constant array.

**Patient List Component**

- Server Component that fetches mock data
- Renders grid of patient cards (responsive: 1 col mobile, 2-3 cols desktop)
- Each card shows patient name, identifier, and last visit date
- Click on card navigates to `/reports/[patientId]`
- Empty state when no patients exist

### Report Viewer

**Report Data Model**

```typescript
interface Report {
  id: string;
  patientId: string;
  patientName: string;
  generatedAt: string;
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  content: string | ReportField[];
}

interface ReportField {
  label: string;
  value: string;
}
```

**Mock Data**

Reports linked to mock patients by ID. Each report contains:

- Patient demographics
- Test results summary (mock FODMAP test data)
- Symptom timeline
- Recommendations

**Report Viewer Component**

- Server Component that fetches report by ID
- Read-only display with clear typography hierarchy
- Sections rendered with consistent spacing
- Back button to return to patient list
- 404 handling for invalid report IDs

## Data Models

### Mock Data Strategy

All data is hardcoded in TypeScript files for the seed implementation. This approach:

- Eliminates database setup complexity
- Provides realistic data structure
- Can be easily replaced with API calls later

**Data Relationships**

```
Patient (1) -----> (1) Report
```

Each patient has exactly one report in the seed. Report ID matches patient ID for simplicity.

### Future Database Considerations

The data models are designed to map cleanly to Supabase tables:

```sql
-- Future schema (not implemented in seed)
create table patients (
  id uuid primary key,
  name text not null,
  identifier text unique not null,
  date_of_birth date,
  last_visit timestamp,
  created_at timestamp default now()
);

create table reports (
  id uuid primary key,
  patient_id uuid references patients(id),
  generated_at timestamp not null,
  data jsonb not null,
  created_at timestamp default now()
);
```

## Error Handling

### Authentication Errors

- Invalid credentials: Display error message below login form
- Session expiration: Redirect to login with message
- Network errors: Display retry option

### Route Protection

- Unauthenticated access: Redirect to `/login`
- Invalid report ID: Display 404 page with link to patient list
- Permission denied: Display 403 page (future)

### Error Boundaries

- Root error boundary catches unhandled errors
- Displays user-friendly error message
- Provides navigation back to safe routes

## Testing Strategy

### Unit Tests

- Authentication utilities (session validation, permission checks)
- Mock data accessors
- Component rendering (LoginForm, PatientCard, ReportViewer)

### Integration Tests

- Authentication flow (login → redirect → logout)
- Navigation between routes
- Protected route access

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected route while unauthenticated
- [ ] View patient list
- [ ] Click patient card and view report
- [ ] Navigate back to patient list from report
- [ ] Sign out
- [ ] Responsive layout on different screen sizes

## Styling and UI

### Design System

**Colors**

- Primary: Blue (#3B82F6)
- Secondary: Gray (#6B7280)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Background: White (#FFFFFF)
- Surface: Light Gray (#F9FAFB)

**Typography**

- Headings: Inter or system font stack
- Body: Inter or system font stack
- Sizes: Tailwind default scale (text-sm, text-base, text-lg, etc.)

**Components**

- Cards: White background, subtle shadow, rounded corners
- Buttons: Primary style for main actions, secondary for navigation
- Forms: Clear labels, validation states, accessible inputs
- Navigation: Horizontal header with dropdown menu

### Responsive Breakpoints

- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3 columns, max-width container)

## Configuration

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Next.js Configuration

- TypeScript strict mode enabled
- Tailwind CSS configured
- ESLint with recommended rules
- Path aliases: `@/` for root directory

## Development Workflow

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add Supabase credentials
4. Run development server: `npm run dev`
5. Access portal at `http://localhost:3000`

## Security Considerations

- All authentication handled by Supabase (no custom auth logic)
- Session cookies are httpOnly and secure
- Environment variables never exposed to client (except NEXT*PUBLIC*\*)
- Middleware validates session on every protected route request
- No sensitive data in mock data files

## Future Extension Points

The seed is designed for easy extension:

1. **Database Integration**: Replace mock data functions with Supabase queries
2. **Role-Based Access**: Extend permission system with role checks
3. **Patient Management**: Add create/edit patient functionality
4. **Report Generation**: Add report creation and editing
5. **Multi-tenancy**: Add organization/clinic grouping
6. **Audit Logging**: Track user actions for compliance
7. **Advanced Search**: Add filtering and search to patient list
8. **Bulk Operations**: Add batch actions for patients/reports

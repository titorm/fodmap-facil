# Implementation Plan

- [ ] 1. Initialize Next.js project structure
  - Create new Next.js 14+ project with TypeScript in `/portal` directory
  - Configure Tailwind CSS with custom color palette
  - Set up path aliases (`@/` for root)
  - Create directory structure for app router, components, lib, and types
  - _Requirements: 6.1, 6.4, 6.5_

- [ ] 2. Configure Supabase authentication
  - Install Supabase SSR package (`@supabase/ssr`)
  - Create Supabase client utilities for browser and server contexts
  - Implement cookie-based session management for SSR
  - Set up environment variables configuration
  - Create `.env.example` with required Supabase variables
  - _Requirements: 1.2, 6.2, 6.5_

- [ ] 3. Implement authentication middleware and session management
  - Create Next.js middleware to protect routes
  - Implement session validation logic
  - Configure redirect rules for unauthenticated users
  - Create basic permission checking utilities
  - _Requirements: 1.4, 5.1, 5.2, 5.4_

- [ ] 4. Build login page and authentication UI
  - Create login page at `/app/(auth)/login/page.tsx`
  - Implement LoginForm client component with email/password inputs
  - Add form validation and error display
  - Implement sign-in handler using Supabase Auth
  - Add redirect to `/patients` on successful authentication
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 5. Create dashboard layout and header
  - Implement root layout with authentication provider
  - Create dashboard layout component for authenticated pages
  - Build Header component with navigation, user info, and sign-out
  - Apply consistent styling and responsive design
  - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Create mock data for patients and reports
  - Define TypeScript interfaces for Patient and Report models
  - Create mock patient data array (10-15 patients)
  - Create mock report data linked to patients
  - Implement data accessor functions
  - _Requirements: 2.2, 3.5_

- [ ] 7. Implement patient list page
  - Create patients page at `/app/(dashboard)/patients/page.tsx`
  - Implement PatientList server component
  - Create PatientCard component for individual patient display
  - Add responsive grid layout
  - Implement navigation to report view on card click
  - Add empty state handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8. Implement report viewer page
  - Create dynamic report page at `/app/(dashboard)/reports/[id]/page.tsx`
  - Implement ReportViewer component with read-only display
  - Add report section rendering with proper typography
  - Implement back navigation to patient list
  - Add 404 handling for invalid report IDs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Add permission layer foundation
  - Define Permission enum and types
  - Implement basic permission checking functions
  - Add permission validation to route handlers
  - Create extensible structure for future role-based access
  - _Requirements: 5.1, 5.3, 5.5_

- [ ] 10. Create documentation and setup instructions
  - Write README with local setup steps
  - Document environment variable configuration
  - Add development workflow instructions
  - Include Supabase project setup guide
  - _Requirements: 6.3, 6.4_

- [ ] 11. Implement error boundaries and error handling
  - Create root error boundary component
  - Add error handling for authentication failures
  - Implement 404 page for invalid routes
  - Add user-friendly error messages
  - _Requirements: 1.3, 3.3_

- [ ]\* 12. Add basic testing setup
  - Configure Jest and React Testing Library
  - Write unit tests for authentication utilities
  - Write component tests for LoginForm and PatientCard
  - Add integration test for authentication flow
  - _Requirements: All requirements validation_

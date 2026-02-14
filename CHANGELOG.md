# Changelog

All notable changes to NPMDeck will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-02-14

### Added
- Dashboard with system overview and statistics
- Proxy Hosts management (CRUD, enable/disable, bulk actions)
- Redirection Hosts management (CRUD, enable/disable, bulk actions)
- 404 Hosts management (CRUD, enable/disable, bulk actions)
- Streams management (CRUD, enable/disable, bulk actions)
- SSL Certificate management (CRUD, renew, Let's Encrypt integration)
- Access Lists management (CRUD, authorization and client rules)
- User management (CRUD, permissions, password change)
- Settings page with configuration options
- Audit Log with clickable object references
- Import/Export functionality for all entity types
- Global search across all entities
- Dark/Light mode with theme customization
- Token stack / multi-account support with automatic token refresh
- Permission system with role-based access control
- Mobile responsive layout
- Docker image with docker-compose integration
- Cross-reference connections between Proxy Hosts and Redirection Hosts

### Code Quality (Epic #41)
- Extracted shared utility functions and custom hooks (#42)
- Created centralized constants for hardcoded values (#43)
- Established BaseEntity type hierarchy (#44)
- Eliminated all `any` types in API layer (#45)
- Eliminated all `any` types in DataTable components (#46)
- Eliminated all `any` types in hooks (#47)
- Consolidated duplicate type definitions (#48)
- Unified API layer patterns with standardized CRUD operations (#49)
- Added missing return type annotations (#50)
- Replaced all `console.error` calls with project logger (#51)
- Added memoization with `useMemo`/`useCallback` across components (#52)
- Extracted oversized components into focused sub-components (#53)
- Created `useEntityCrud` hook for page-level CRUD deduplication (#54)
- Removed dead code and unused files (#55)
- Added accessibility improvements: aria-labels, keyboard navigation, screen reader support (#56)
- Improved error handling: ErrorBoundaries, `Promise.allSettled` for bulk operations, user feedback (#57)
- Final validation: zero lint warnings, zero type errors, production build passing (#58)

### Technical Stack
- React 18 with TypeScript (strict mode)
- Material-UI (MUI) v7
- Vite build tool
- React Router v6
- Zustand for auth state management
- React Context API for theme, toast, and search
- Emotion (CSS-in-JS)
- ESLint with TypeScript and React plugins

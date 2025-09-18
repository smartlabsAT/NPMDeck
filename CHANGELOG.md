# Changelog

All notable changes to NPMDeck will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2025-09-18

### Added
- Production-ready package management with pnpm
- Logger utility integration for better debugging
- Comprehensive quality assurance workflow

### Changed
- **Package Updates (Phase 1 - Safe Updates):**
  - `react-syntax-highlighter`: 15.6.1 → 15.6.6 (syntax highlighting improvements)
  - `@mui/utils`: 7.2.0 → 7.3.2 (Material-UI utility functions)
  - `@mui/x-date-pickers`: 8.9.2 → 8.11.2 (date picker components)
  - `@tanstack/react-query`: 5.84.1 → 5.87.4 (data fetching & caching)
  - `axios`: 1.11.0 → 1.12.2 (HTTP client improvements)
  - `@types/node`: 24.1.0 → 24.4.0 (Node.js TypeScript definitions)
  - `@typescript-eslint/eslint-plugin`: 8.38.0 → 8.43.0 (ESLint TypeScript rules)
  - `@typescript-eslint/parser`: 8.38.0 → 8.43.0 (TypeScript ESLint parser)

### Fixed
- Replaced console statements with proper logger utilities in DataTableBulkActions component
- Updated ESLint configuration to properly handle logger exclusions

### Quality Assurance
- ✅ All lint checks passing (0 errors)
- ✅ TypeScript compilation successful
- ✅ Production build verified (10.29s)
- ✅ API integration tested with NPM API
- ✅ No regressions detected in existing functionality

## [0.1.2] - Previous Release

### Added
- Responsive table design with mobile card layout
- Mobile-friendly navigation with responsive breakpoints
- Responsive design for all major components:
  - AccessLists with mobile add button
  - AuditLog with mobile-friendly table
  - Certificates with mobile add button
  - DeadHosts with mobile add button

### Changed
- DataTable component now disables selection in card view
- Extended responsive settings with numeric breakpoints in types

### Removed
- Unused isMobileTable variable from AuditLog component

---

**Note**: Version 0.1.3 focuses on package maintenance and stability improvements. Major framework updates (React 19, MUI v7, Vite 7, ESLint 9) are planned for Phase 2 updates in future releases.
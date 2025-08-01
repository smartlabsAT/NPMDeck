# Nginx Proxy Manager - Complete API Endpoints Reference

This document provides a comprehensive list of ALL API endpoints used by the frontend application. This serves as the definitive reference for the new frontend development team.

## Overview

- **Base URL**: `/api` (configured via `VITE_API_URL` environment variable)
- **Authentication**: JWT Bearer tokens in Authorization header
- **Content-Type**: `application/json` (except file uploads which use `multipart/form-data`)

## Complete API Endpoints Table

| **Endpoint** | **Method** | **Purpose** | **Parameters** | **Request Body** | **Response** | **Documented** |
|--------------|------------|-------------|----------------|------------------|--------------|----------------|
| **Authentication** |
| `/tokens` | POST | Login / Create token | - | `{ identity: string, secret: string, scope?: "user" }` | `{ token: string, expires: string }` | ✅ |
| `/tokens` | GET | Refresh token | - | - | `{ token: string, expires: string }` | ✅ |
| **Users** |
| `/users/me` | GET | Get current user info | `expand?: "permissions"` | - | `User` object | ✅ |
| `/users` | GET | Get all users | `expand?: string[], query?: string` | - | `User[]` | ✅ |
| `/users/{id}` | GET | Get specific user | `expand?: string[]` | - | `User` object | ✅ |
| `/users` | POST | Create new user | - | `CreateUserPayload` | `User` object | ✅ |
| `/users/{id}` | PUT | Update user | - | `UpdateUserPayload` | `User` object | ✅ |
| `/users/{id}` | DELETE | Delete user | - | - | `void` | ✅ |
| `/users/{id}/auth` | PUT | Update user password | - | `{ type: "password", current?: string, secret: string }` | `void` | ✅ |
| `/users/{id}/permissions` | PUT | Update user permissions | - | `permissions` object | `void` | ✅ |
| `/users/{id}/login` | POST | Login as user (admin only) | - | - | `{ token: string, user: User }` | ✅ |
| **Proxy Hosts** |
| `/nginx/proxy-hosts` | GET | Get all proxy hosts | `expand?: string[]` | - | `ProxyHost[]` | ✅ |
| `/nginx/proxy-hosts/{id}` | GET | Get specific proxy host | `expand?: string[]` | - | `ProxyHost` object | ✅ |
| `/nginx/proxy-hosts` | POST | Create proxy host | - | `CreateProxyHost` | `ProxyHost` object | ✅ |
| `/nginx/proxy-hosts/{id}` | PUT | Update proxy host | - | `UpdateProxyHost` | `ProxyHost` object | ✅ |
| `/nginx/proxy-hosts/{id}` | DELETE | Delete proxy host | - | - | `boolean` | ✅ |
| `/nginx/proxy-hosts/{id}/enable` | POST | Enable proxy host | - | - | `boolean` | ✅ |
| `/nginx/proxy-hosts/{id}/disable` | POST | Disable proxy host | - | - | `boolean` | ✅ |
| **Redirection Hosts** |
| `/nginx/redirection-hosts` | GET | Get all redirection hosts | `expand?: string[]` | - | `RedirectionHost[]` | ✅ |
| `/nginx/redirection-hosts/{id}` | GET | Get specific redirection host | `expand?: string[]` | - | `RedirectionHost` object | ✅ |
| `/nginx/redirection-hosts` | POST | Create redirection host | - | `CreateRedirectionHost` | `RedirectionHost` object | ✅ |
| `/nginx/redirection-hosts/{id}` | PUT | Update redirection host | - | `UpdateRedirectionHost` | `RedirectionHost` object | ✅ |
| `/nginx/redirection-hosts/{id}` | DELETE | Delete redirection host | - | - | `void` | ✅ |
| `/nginx/redirection-hosts/{id}/enable` | POST | Enable redirection host | - | - | `RedirectionHost` object | ✅ |
| `/nginx/redirection-hosts/{id}/disable` | POST | Disable redirection host | - | - | `RedirectionHost` object | ✅ |
| **Dead Hosts** |
| `/nginx/dead-hosts` | GET | Get all dead hosts | `expand?: string[]` | - | `DeadHost[]` | ✅ |
| `/nginx/dead-hosts/{id}` | GET | Get specific dead host | `expand?: string[]` | - | `DeadHost` object | ✅ |
| `/nginx/dead-hosts` | POST | Create dead host | - | `CreateDeadHost` | `DeadHost` object | ✅ |
| `/nginx/dead-hosts/{id}` | PUT | Update dead host | - | `UpdateDeadHost` | `DeadHost` object | ✅ |
| `/nginx/dead-hosts/{id}` | DELETE | Delete dead host | - | - | `boolean` | ✅ |
| `/nginx/dead-hosts/{id}/enable` | POST | Enable dead host | - | - | `boolean` | ✅ |
| `/nginx/dead-hosts/{id}/disable` | POST | Disable dead host | - | - | `boolean` | ✅ |
| `/nginx/dead-hosts/{id}/certificates` | POST | Upload certificates for dead host | - | FormData with certificate files | `DeadHost` object | ❌ |
| **Streams** |
| `/nginx/streams` | GET | Get all streams | `expand?: string[]` | - | `Stream[]` | ✅ |
| `/nginx/streams/{id}` | GET | Get specific stream | `expand?: string[]` | - | `Stream` object | ✅ |
| `/nginx/streams` | POST | Create stream | - | `CreateStream` | `Stream` object | ✅ |
| `/nginx/streams/{id}` | PUT | Update stream | - | `UpdateStream` | `Stream` object | ✅ |
| `/nginx/streams/{id}` | DELETE | Delete stream | - | - | `boolean` | ✅ |
| `/nginx/streams/{id}/enable` | POST | Enable stream | - | - | `boolean` | ✅ |
| `/nginx/streams/{id}/disable` | POST | Disable stream | - | - | `boolean` | ✅ |
| **Certificates** |
| `/nginx/certificates` | GET | Get all certificates | `expand?: string[]` | - | `Certificate[]` | ✅ |
| `/nginx/certificates/{id}` | GET | Get specific certificate | `expand?: string[]` | - | `Certificate` object | ✅ |
| `/nginx/certificates` | POST | Create certificate | - | `CreateCertificate` | `Certificate` object | ✅ |
| `/nginx/certificates/{id}` | PUT | Update certificate | - | `UpdateCertificate` | `Certificate` object | ✅ |
| `/nginx/certificates/{id}` | DELETE | Delete certificate | - | - | `boolean` | ✅ |
| `/nginx/certificates/{id}/renew` | POST | Renew certificate | - | - | `boolean` | ✅ |
| `/nginx/certificates/test-http` | GET | Test HTTP reachability | `domains: string` (JSON array) | - | `{ reachable: boolean, error?: string }` | ❌ |
| `/nginx/certificates/validate` | POST | Validate certificate data | - | `CreateCertificate` OR FormData | `{ valid: boolean, error?: string }` | ❌ |
| `/nginx/certificates/{id}/download` | GET | Download certificate | - | - | `Blob` (certificate file) | ❌ |
| `/nginx/certificates/{id}/upload` | POST | Upload certificate files | - | FormData with files | `Certificate` object | ❌ |
| **Access Lists** |
| `/nginx/access-lists` | GET | Get all access lists | `expand?: string[]` | - | `AccessList[]` | ✅ |
| `/nginx/access-lists/{id}` | GET | Get specific access list | `expand?: string[]` | - | `AccessList` object | ✅ |
| `/nginx/access-lists` | POST | Create access list | - | `CreateAccessList` | `AccessList` object | ✅ |
| `/nginx/access-lists/{id}` | PUT | Update access list | - | `UpdateAccessList` | `AccessList` object | ✅ |
| `/nginx/access-lists/{id}` | DELETE | Delete access list | - | - | `boolean` | ✅ |
| **Audit Log** |
| `/audit-log` | GET | Get audit log entries | `expand?: string[], query?: string` | - | `AuditLogEntry[]` | ✅ |
| **Settings** |
| `/settings` | GET | Get all settings | - | - | `Setting[]` | ✅ |
| `/settings/{id}` | GET | Get specific setting | - | - | `Setting` object | ✅ |
| `/settings/{id}` | PUT | Update setting | - | `{ value: any }` | `Setting` object | ✅ |

## Key Findings

### ✅ Well Documented Endpoints (42 endpoints)
All basic CRUD operations for all resource types are properly documented in the existing API documentation.

### ❌ Undocumented Endpoints (5 endpoints)
These endpoints are used by the frontend but missing from the API documentation:

1. **`/nginx/certificates/test-http`** - Tests HTTP reachability for domains before certificate creation
2. **`/nginx/certificates/validate`** - Validates certificate data (supports both JSON and FormData)
3. **`/nginx/certificates/{id}/download`** - Downloads certificate files as a blob
4. **`/nginx/certificates/{id}/upload`** - Uploads certificate files via FormData
5. **`/nginx/dead-hosts/{id}/certificates`** - Uploads certificate files for dead hosts

### Special Parameters Not Documented

1. **Login Scope**: The `/tokens` POST endpoint accepts an optional `scope: "user"` parameter
2. **User Search**: The `/users` GET endpoint accepts a `query` parameter for searching users
3. **Domain Array Format**: The `/nginx/certificates/test-http` endpoint expects domains as a JSON array string

### Authentication & Security Features

The frontend implements sophisticated authentication handling:
- Automatic token refresh on 401 errors
- Automatic redirect to `/403` on permission errors
- Smart retry logic with `_retry` flag
- Client-side logout clearing localStorage

### Owner Filtering System

The frontend implements a complete authorization system:
- Automatic `owner_user_id` injection for non-admin users
- Owner verification for updates and deletes
- User-specific resource filtering based on permissions

## Dashboard Statistics

The dashboard makes no special API calls - it uses the standard `getAll()` methods for all resource types and calculates statistics client-side.

## Import/Export System

The frontend includes a complete import/export system that works entirely client-side:
- No special API endpoints required
- Uses existing CRUD endpoints for importing data
- Handles versioning, conflict resolution, and data sanitization
- Supports both individual item and bulk operations

## FormData Endpoints

The following endpoints specifically require `multipart/form-data`:
- `/nginx/certificates/{id}/upload`
- `/nginx/certificates/validate` (when uploading files)
- `/nginx/dead-hosts/{id}/certificates`

## Required Headers

All authenticated endpoints require:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json (except FormData uploads)
```

## Error Handling

The frontend expects these HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (triggers token refresh)
- `403` - Forbidden (triggers redirect to /403)
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Recommendations for New Frontend Team

1. **Implement all 47 endpoints** listed in this table
2. **Prioritize the 5 undocumented endpoints** as they provide critical functionality
3. **Support FormData uploads** for certificate management
4. **Implement proper error handling** including automatic token refresh
5. **Add the owner filtering system** for multi-user support
6. **Use the existing API structure** - no additional endpoints are needed

This table represents the complete API surface used by the existing frontend. No additional endpoints were discovered beyond those listed here.
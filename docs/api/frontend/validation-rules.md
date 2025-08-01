# NPMDeck Frontend Validation Documentation

## Overview

This document provides a comprehensive overview of all validation patterns implemented in the NPMDeck (Nginx Proxy Manager) frontend. These validations ensure data integrity and provide user feedback before submitting data to the backend API.

## Table of Contents

1. [Core Validation Framework](#core-validation-framework)
2. [Common Validation Patterns](#common-validation-patterns)
3. [Component-Specific Validations](#component-specific-validations)
4. [API Integration & Error Handling](#api-integration--error-handling)
5. [Validation Messages](#validation-messages)

## Core Validation Framework

### useDrawerForm Hook

The primary validation framework is implemented in `useDrawerForm` hook (`src/hooks/useDrawerForm.ts`):

```typescript
export interface FieldConfig<T = any> {
  initialValue: T;
  validate?: ValidationFunction<T>;
  required?: boolean;
  requiredMessage?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}
```

### Validation Types

1. **Field-level validation**: Individual field validation with custom messages
2. **Global validation**: Cross-field validation rules
3. **Required field validation**: Automatic validation for required fields
4. **Real-time validation**: Validation on change and blur events

## Common Validation Patterns

### 1. Email Validation

**Pattern**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Usage Locations**:
- Certificate Let's Encrypt email (`CertificateDrawer.tsx`)
- User email fields

**Example**:
```typescript
validate: (email: string) => {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}
```

### 2. Port Number Validation

**Rules**: 
- Must be a number between 1 and 65535
- Must be parseable as integer

**Usage Locations**:
- Proxy Host forward port (`ProxyHostDrawer.tsx`)
- Stream incoming/forwarding ports (`StreamDrawer.tsx`)

**Example**:
```typescript
validate: (port) => {
  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port
  if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
    return 'Port must be between 1 and 65535'
  }
  return null
}
```

### 3. Domain Name Validation

**Rules**:
- At least one domain name required
- Basic domain validation (contains '.')
- Supports wildcards (*.example.com)
- Multiple domains allowed (comma or newline separated)

**Usage Locations**:
- Proxy Host domain names (`ProxyHostDrawer.tsx`)
- Certificate domain names (`CertificateDrawer.tsx`)

**Component**: `DomainInput.tsx`
- Handles paste of multiple domains
- Removes duplicates automatically
- Trims whitespace
- Sorts domains alphabetically for display

### 4. Password Validation

**Rules**:
- Minimum 6 characters
- Confirmation password must match
- Current password required when changing own password

**Usage Location**: `UserPasswordDialog.tsx`

**Example**:
```typescript
if (newPassword.length < 6) {
  setError('Password must be at least 6 characters')
  return
}
if (newPassword !== confirmPassword) {
  setError('Passwords do not match')
  return
}
```

### 5. Required Field Validation

**Generic Pattern**:
```typescript
if (fieldConfig?.required && (value === '' || value == null)) {
  return fieldConfig.requiredMessage || `${String(key)} is required`
}
```

## Component-Specific Validations

### ProxyHostDrawer

| Field | Validation Rules |
|-------|------------------|
| domainNames | Required, at least one domain |
| forwardHost | Required, non-empty string |
| forwardPort | Number between 1-65535 |
| certificateId | Required when SSL is enabled |

**Cross-field Validation**:
- When SSL is enabled, certificate must be selected
- SSL-related options (forceSSL, http2Support, hstsEnabled) only valid when SSL is enabled

### CertificateDrawer

| Field | Validation Rules |
|-------|------------------|
| domainNames | Required, at least one domain |
| letsencryptEmail | Required for Let's Encrypt, valid email format |
| letsencryptAgree | Must be true for Let's Encrypt |
| dnsProvider | Required when DNS challenge enabled |
| dnsProviderCredentials | Required when DNS provider selected |
| certificateFile | Required for custom certificates (new only) |
| certificateKeyFile | Required for custom certificates (new only) |

**Special Validations**:
- Wildcard domains require DNS challenge to be enabled
- Let's Encrypt agreement required for Let's Encrypt certificates

### StreamDrawer

| Field | Validation Rules |
|-------|------------------|
| incomingPort | Required, number 1-65535 |
| forwardingHost | Required, non-empty string |
| forwardingPort | Required, number 1-65535 |

**Cross-field Validation**:
- At least one forwarding type (TCP or UDP) must be enabled

### AccessListDrawer

| Field | Validation Rules |
|-------|------------------|
| name | Required, non-empty string |
| authItems.username | Required if password provided |
| authItems.password | Required if username provided (new items only) |
| accessRules.address | Required, non-empty string |

### Login Page

| Field | Validation Rules |
|-------|------------------|
| email | Required (HTML5 validation) |
| password | Required (HTML5 validation) |

**Button State**:
- Submit disabled when email or password is empty
- Loading state during authentication

### UserDrawer

**Permission Validation**:
- At least one resource permission required when creating non-admin user
- Validation handled at API level

### Import/Export Dialogs

**File Validation**:
- JSON file format required for import
- File size limits handled by browser

## API Integration & Error Handling

### Error Response Format

```typescript
{
  error: {
    code: number,
    message: string
  }
}
```

### Common API Error Codes

- `400`: Bad Request (Validation failed)
- `401`: Unauthorized (Token invalid/expired)
- `403`: Forbidden (No permission)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate domain)
- `500`: Internal Server Error

### Frontend Error Handling

```typescript
try {
  await api.method(data)
} catch (error) {
  const errorMessage = getErrorMessage(error)
  // Display error to user
}
```

## Validation Messages

### Standard Messages

| Validation Type | Message Template |
|----------------|------------------|
| Required Field | `{fieldName} is required` |
| Email Format | `Please enter a valid email address` |
| Port Range | `Port must be between 1 and 65535` |
| Domain Required | `At least one domain name is required` |
| Password Length | `Password must be at least 6 characters` |
| Password Match | `Passwords do not match` |
| Certificate Required | `Please select an SSL certificate when SSL is enabled` |
| DNS Provider Required | `DNS provider is required when DNS challenge is enabled` |

### Custom Validation Messages

Components can override default messages:
```typescript
requiredMessage: 'Custom message for this field'
```

## Best Practices

1. **Client-side validation complements server-side validation** - Never rely solely on frontend validation
2. **Provide immediate feedback** - Use validateOnChange for real-time validation
3. **Clear error messages** - Be specific about what's wrong and how to fix it
4. **Consistent validation patterns** - Use the same validation logic across similar fields
5. **Accessibility** - Ensure error messages are accessible to screen readers

## Missing/Undocumented Validations

Based on the analysis, the following validations may be missing documentation:

1. **Advanced Configuration Validation** - The advanced_config field accepts custom Nginx configuration but lacks syntax validation
2. **IP Address/CIDR Validation** - Access list addresses should validate IP/CIDR format
3. **URL Validation** - Forward host could benefit from URL/hostname validation
4. **File Size Validation** - Certificate file uploads lack explicit size validation
5. **Character Limits** - Most text fields lack maximum length validation

## Recommendations

1. **Implement syntax highlighting** for advanced configuration fields
2. **Add IP/CIDR validation** for access list addresses
3. **Validate hostnames/IPs** for forward hosts
4. **Add file size limits** for certificate uploads
5. **Implement rate limiting** for form submissions
6. **Add CSRF protection** for all form submissions
7. **Enhance domain validation** to check for valid TLDs
8. **Add regex validation** for custom patterns

## Conclusion

The NPMDeck frontend implements comprehensive validation patterns using a centralized validation framework through the `useDrawerForm` hook. While most common scenarios are covered, there are opportunities to enhance validation for advanced use cases and improve security through additional client-side checks.
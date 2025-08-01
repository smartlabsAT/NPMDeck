# Nginx Proxy Manager - Complete Business Rules Documentation

## Executive Summary

This document provides a comprehensive specification of ALL business rules, workflows, data dependencies, state transitions, permission checks, and data transformations required for the nginx-proxy-manager frontend implementation. This serves as the definitive reference for any new frontend development team.

---

## Table of Contents

1. [Core Business Rules](#core-business-rules)
2. [Workflow Specifications](#workflow-specifications)
3. [Data Dependencies](#data-dependencies)
4. [State Transitions](#state-transitions)
5. [Permission System](#permission-system)
6. [Data Transformation Rules](#data-transformation-rules)
7. [Validation Rules](#validation-rules)
8. [Auto-Save and Form Management](#auto-save-and-form-management)
9. [Import/Export System](#importexport-system)
10. [UI/UX Business Logic](#uiux-business-logic)
11. [API Integration Rules](#api-integration-rules)
12. [Security Rules](#security-rules)

---

## 1. Core Business Rules

### 1.1 Entity Management Rules

#### Proxy Hosts
- **Domain Requirement**: At least one domain name is required
- **Forward Configuration**: Forward host and port are mandatory
- **SSL Dependencies**: If SSL is enabled, a certificate must be selected
- **Certificate-SSL Coupling**: SSL options (Force SSL, HTTP/2, HSTS) are only available when SSL is enabled
- **HSTS Subdomains**: Only available when HSTS is enabled
- **Port Range**: Forward port must be between 1-65535
- **Access Control**: Access list is optional (0 = publicly accessible)

#### Certificates
- **Provider Types**: Either Let's Encrypt or Custom Certificate
- **Domain Requirement**: At least one domain name required
- **Wildcard Rule**: Wildcard domains REQUIRE DNS challenge (HTTP challenge not supported)
- **Let's Encrypt Requirements**:
  - Email address is mandatory
  - Must agree to subscriber agreement
  - DNS challenge requires provider selection and credentials
- **Custom Certificate Requirements**:
  - Certificate file required (new certificates only)
  - Private key file required (new certificates only)
  - Intermediate certificate is optional
- **File Validation**: All certificate files must be validated before upload
- **Expiry Monitoring**: 3-tier warning system (>30 days = OK, ≤30 days = Warning, ≤7 days = Critical, <0 days = Expired)

#### Access Lists
- **Name Requirement**: Name is mandatory
- **Authentication Logic**: 
  - New entries: Password required for auth items
  - Existing entries: Password optional (blank = keep existing)
- **Access Rules**: At least one access rule required
- **IP Format**: Address field accepts IP addresses and CIDR ranges (validation missing - security gap)
- **Directive Types**: Allow or Deny only

#### Streams
- **Protocol Requirement**: At least one protocol (TCP or UDP) must be enabled
- **Port Validation**: Source and destination ports must be 1-65535
- **Forward Configuration**: Forward host and port mandatory

#### Dead Hosts
- **Domain Requirement**: At least one domain name required
- **Certificate Optional**: SSL certificate can be assigned

#### Redirection Hosts
- **Domain Requirement**: At least one domain name required
- **Target URL**: Forward destination URL required
- **Path Preservation**: Preserve path option available
- **SSL Support**: Can have SSL certificate assigned

### 1.2 User Management Rules

#### Authentication
- **Token-based**: JWT tokens stored in localStorage
- **Auto-refresh**: Automatic token refresh on 401 responses
- **Session Management**: Automatic logout on authentication failures

#### Authorization
- **Role Hierarchy**: Admin > Manage > View > Hidden
- **Admin Bypass**: Admin users bypass all permission checks
- **Resource-based**: Permissions per resource type (proxy_hosts, certificates, etc.)
- **Visibility Scoping**: Users can see all resources or only their own

---

## 2. Workflow Specifications

### 2.1 Certificate Creation Workflow

#### Let's Encrypt Certificate
1. **Provider Selection**: User selects "Let's Encrypt"
2. **Domain Configuration**: Enter domain names (supports wildcards)
3. **Email Validation**: Validate email format
4. **Agreement**: Must agree to Let's Encrypt terms
5. **Challenge Method Selection**:
   - HTTP Challenge: For non-wildcard domains, publicly accessible
   - DNS Challenge: For wildcard domains or behind firewalls
6. **DNS Configuration** (if DNS challenge):
   - Select DNS provider
   - Enter provider credentials
   - Set propagation time (default: 120 seconds)
7. **Domain Reachability Test** (if HTTP challenge):
   - Test if domains are publicly accessible
   - Show success/failure status
8. **Certificate Generation**: API call to create certificate
9. **Auto-renewal**: System handles renewal automatically

#### Custom Certificate
1. **Provider Selection**: User selects "Custom Certificate"
2. **Domain Configuration**: Enter domain names this certificate covers
3. **File Upload**:
   - Certificate file (required) - must start with "-----BEGIN CERTIFICATE-----"
   - Private key file (required) - must start with "-----BEGIN PRIVATE KEY-----" or "-----BEGIN RSA PRIVATE KEY-----"
   - Intermediate certificate (optional)
4. **File Validation**: Validate certificate files match and are valid
5. **Certificate Creation**: Upload files and create certificate entry

### 2.2 Proxy Host Configuration Workflow

#### Basic Configuration
1. **Domain Setup**: Enter one or more domain names
2. **Forward Configuration**: 
   - Select scheme (HTTP/HTTPS)
   - Enter forward host/IP
   - Set forward port
3. **Options Configuration**:
   - Cache assets (optional)
   - Block exploits (optional)
   - WebSocket support (optional)
4. **Access Control**: Select access list (optional)

#### SSL Configuration
1. **SSL Enablement**: Toggle SSL on/off
2. **Certificate Selection**: Choose from available certificates
   - Certificates sorted by expiry status (expired/expiring first)
   - Visual status indicators (green/yellow/red)
   - Provider type display (Let's Encrypt/Custom)
3. **SSL Options** (only when SSL enabled):
   - Force SSL (redirect HTTP to HTTPS)
   - HTTP/2 Support
   - HSTS Enabled
   - HSTS Subdomains (only when HSTS enabled)

#### Advanced Configuration
1. **Custom Nginx Config**: Free-form text area
2. **Configuration Warning**: Headers in custom config won't work (must use location blocks)

### 2.3 Import/Export Workflow

#### Export Process
1. **Item Selection**: Choose single item or multiple items
2. **Type Detection**: Automatically detect export type
3. **Sensitive Data Options**: Include/exclude sensitive data
4. **Data Cleaning**:
   - Remove IDs, timestamps, owner info
   - Redact passwords (unless including sensitive data)
   - Remove private keys (always)
   - Clean nginx status information
5. **File Generation**: Create JSON export file
6. **Download**: Trigger file download

#### Import Process
1. **File Selection**: Choose JSON import file
2. **File Validation**:
   - Check JSON format
   - Validate schema version
   - Verify data structure
3. **Compatibility Check**: Ensure version compatibility
4. **Conflict Resolution Options**:
   - Overwrite existing items
   - Skip existing items  
   - Rename on conflict
5. **Data Preparation**:
   - Remove import-specific fields
   - Set default values for missing fields
   - Clean sensitive data
6. **Import Execution**: Create items via API calls
7. **Result Report**: Show success/failure counts

---

## 3. Data Dependencies

### 3.1 Primary Dependencies

#### Proxy Host Dependencies
- **Certificate**: Optional reference to certificates table
- **Access List**: Optional reference to access_lists table
- **Owner**: Required reference to users table (owner_user_id)

#### Certificate Dependencies
- **Owner**: Required reference to users table (owner_user_id)
- **DNS Provider**: Optional external provider configuration

#### Access List Dependencies
- **Owner**: Required reference to users table (owner_user_id)
- **Auth Items**: Embedded array of username/password pairs
- **Client Rules**: Embedded array of IP/directive pairs

### 3.2 Cross-Field Dependencies

#### SSL Configuration
```
IF ssl_enabled = true THEN
  certificate_id MUST be > 0
  certificate MUST exist in certificates table
  ssl_forced, http2_support, hsts_enabled become available
  
IF hsts_enabled = true THEN
  hsts_subdomains becomes available
```

#### Certificate Challenge Method
```
IF provider = 'letsencrypt' AND contains_wildcard(domain_names) THEN
  dns_challenge MUST be true
  
IF dns_challenge = true THEN
  dns_provider MUST be selected
  dns_provider_credentials MUST be provided
```

#### Access List Authentication
```
IF authItems.length > 0 THEN
  FOR EACH authItem:
    IF username IS NOT EMPTY THEN
      password MUST be provided (for new entries)
```

### 3.3 Data Consistency Rules

#### Owner Filtering
- Non-admin users with visibility='user' see only their own resources
- Admin users see all resources regardless of ownership
- Create operations auto-inject owner_user_id for filtered users
- Update/delete operations verify ownership for filtered users

#### Certificate Status
- Expiry status calculated in real-time from expires_on field
- Status affects sorting order (expired/expiring first)
- Visual indicators updated based on calculated status

---

## 4. State Transitions

### 4.1 Form State Management

#### Form Lifecycle
```
INITIAL → PRISTINE → DIRTY → VALID/INVALID → SUBMITTING → SUCCESS/ERROR → RESET
```

#### State Definitions
- **PRISTINE**: No user modifications
- **DIRTY**: User has made changes (tracked per field)
- **TOUCHED**: Field has been focused/blurred (tracked per field)
- **VALID**: All validation rules pass
- **INVALID**: One or more validation failures
- **SUBMITTING**: Form submission in progress
- **AUTO_SAVING**: Auto-save operation in progress

#### State Transitions
```
User Input → Field Update → Validation → Dirty Check → Auto-save Trigger
Form Submit → Validation → Loading State → API Call → Success/Error → Reset/Persist
Tab Switch → Preserve State → Show Errors if Touched
```

### 4.2 Certificate Status Transitions

#### Status Calculation
```
days_until_expiry = (expires_on - current_date) / 86400000

IF days_until_expiry < 0 THEN status = 'expired', color = 'error'
ELSE IF days_until_expiry <= 7 THEN status = 'critical', color = 'error'
ELSE IF days_until_expiry <= 30 THEN status = 'warning', color = 'warning'
ELSE status = 'valid', color = 'success'
```

### 4.3 Permission State Transitions

#### Permission Evaluation
```
User Login → Load Permissions → Resource Access Check → UI State Update

Permission Check Flow:
IF user.roles.includes('admin') THEN return true
ELSE evaluate resource-specific permission level
```

---

## 5. Permission System

### 5.1 Permission Levels

#### Hierarchy (0-2 scale)
- **hidden (0)**: No access
- **view (1)**: Read-only access
- **manage (2)**: Full access (create, read, update, delete)

#### Role System
- **admin**: Bypasses all permission checks, sees all resources
- **regular users**: Subject to permission matrix

### 5.2 Resource-Based Permissions

#### Resources
- proxy_hosts
- redirection_hosts  
- dead_hosts
- streams
- access_lists
- certificates

#### Permission Matrix
```
Resource Permission Check:
required_level = action_permission_map[action]
user_level = user.permissions[resource] || 'hidden'
access_granted = PERMISSION_HIERARCHY[user_level] >= PERMISSION_HIERARCHY[required_level]
```

#### Action Mapping
- **view**: Read operations, list resources
- **create**: Create new resources
- **edit**: Update existing resources  
- **delete**: Delete resources

### 5.3 Visibility Scoping

#### Scope Types
- **all**: User sees all resources (admin-like behavior)
- **user**: User sees only resources they own

#### Owner Filtering Logic
```
IF user.permissions.visibility === 'user' AND !isAdmin(user) THEN
  apply_owner_filter = true
  filter_criteria = { owner_user_id: user.id }
```

### 5.4 UI Permission Integration

#### Component-Level Permissions
- PermissionGate: Conditionally render components
- PermissionButton: Enable/disable buttons based on permissions
- PermissionRoute: Protect routes with permission checks

#### Dynamic UI Updates
- Hide/show menu items based on resource visibility
- Disable action buttons without manage permissions
- Filter available options based on user scope

---

## 6. Data Transformation Rules

### 6.1 Input Processing

#### Domain Name Processing
```
Input: "domain1.com, domain2.com\ndomain3.com"
Process:
1. Split by comma and newline: ['domain1.com', 'domain2.com', 'domain3.com']
2. Trim whitespace: ['domain1.com', 'domain2.com', 'domain3.com']
3. Remove duplicates: Set(['domain1.com', 'domain2.com', 'domain3.com'])
4. Sort for display: ['domain1.com', 'domain2.com', 'domain3.com']
Output: ['domain1.com', 'domain2.com', 'domain3.com']
```

#### Numeric Field Processing
```
Input: "8080" (string from form)
Process: parseInt(value) || 0
Validation: 1 <= value <= 65535
Output: 8080 (number)
```

### 6.2 API Data Transformation

#### Proxy Host Form → API
```
Form Data:
{
  domainNames: ['example.com'],
  forwardScheme: 'http',
  forwardHost: '192.168.1.100',
  forwardPort: 8080,
  sslEnabled: true,
  certificateId: 5,
  forceSSL: true
}

API Payload:
{
  domain_names: ['example.com'],
  forward_scheme: 'http', 
  forward_host: '192.168.1.100',
  forward_port: 8080,
  certificate_id: 5,
  ssl_forced: true
}
```

#### Certificate Form → API
```
Form Data:
{
  provider: 'letsencrypt',
  domainNames: ['*.example.com'],
  letsencryptEmail: 'admin@example.com',
  dnsChallenge: true,
  dnsProvider: 'cloudflare'
}

API Payload:
{
  provider: 'letsencrypt',
  domain_names: ['*.example.com'],
  meta: {
    letsencrypt_email: 'admin@example.com',
    dns_challenge: true,
    dns_provider: 'cloudflare'
  }
}
```

### 6.3 Export Data Cleaning

#### Sensitive Data Removal
```
Original Item:
{
  id: 123,
  created_on: '2023-01-01',
  owner_user_id: 1,
  domain_names: ['example.com'],
  certificate_key: 'private-key-data'
}

Cleaned Export:
{
  domain_names: ['example.com']
  // Removed: id, created_on, owner_user_id, certificate_key
}
```

---

## 7. Validation Rules

### 7.1 Field-Level Validation

#### Required Fields
```
Proxy Host:
- domain_names: Array length > 0
- forward_host: Non-empty string
- forward_port: Number 1-65535
- certificate_id: > 0 when SSL enabled

Certificate:
- domain_names: Array length > 0
- letsencrypt_email: Valid email when provider='letsencrypt'
- letsencrypt_agree: true when provider='letsencrypt'
- certificate_file: Required for new custom certificates
- certificate_key_file: Required for new custom certificates

Access List:
- name: Non-empty string
- auth_items[].username: Non-empty when password provided
- auth_items[].password: Required for new entries
- access_rules[].address: Non-empty string
```

#### Format Validation
```
Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
Port: 1 <= value <= 65535
Domain: Basic format check (contains '.')
```

### 7.2 Cross-Field Validation

#### Conditional Requirements
```
SSL Configuration:
IF ssl_enabled = true THEN certificate_id MUST be > 0

Certificate Challenge:
IF provider = 'letsencrypt' AND has_wildcard_domains THEN dns_challenge MUST be true
IF dns_challenge = true THEN dns_provider AND dns_provider_credentials REQUIRED

Stream Protocols:
IF tcp_forwarding = false AND udp_forwarding = false THEN 
  ERROR: "At least one protocol must be enabled"
```

### 7.3 Business Logic Validation

#### Certificate Domain Coverage
```
When selecting certificate for proxy host:
certificate.domain_names MUST cover ALL proxy_host.domain_names
Wildcard matching: *.example.com covers sub.example.com
```

#### Access List Logic
```
satisfy_any = true: Any auth method (user/pass OR IP) grants access
satisfy_any = false: All auth methods must pass
pass_auth = true: Pass authentication to backend
```

### 7.4 Missing Validations (Security Gaps)

#### Current Missing Validations
- **IP/CIDR Format**: Access list addresses not validated
- **URL/Hostname**: Forward hosts not validated  
- **Nginx Config Syntax**: Custom configurations not validated
- **File Size Limits**: No limits on uploaded files
- **Content Validation**: No malicious content scanning

#### Recommended Additions
```javascript
// IP/CIDR Validation
const ipCidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
const isValidIpCidr = (value) => ipCidrRegex.test(value)

// URL Validation  
const isValidUrl = (url) => {
  try { new URL(url); return true } 
  catch { return false }
}

// File Size Validation
const MAX_CERT_FILE_SIZE = 10 * 1024 * 1024 // 10MB
```

---

## 8. Auto-Save and Form Management

### 8.1 Auto-Save Logic

#### Trigger Conditions
```
Auto-save triggers when ALL conditions met:
1. autoSave.enabled = true
2. form.isDirty = true (user made changes)
3. form.isValid = true (all validations pass)
4. form.loading = false (not currently submitting)
5. Debounce delay elapsed (default: 3000ms)
```

#### Auto-Save Status States
- **idle**: No auto-save activity
- **saving**: Auto-save operation in progress  
- **saved**: Auto-save completed successfully
- **error**: Auto-save failed

#### Implementation Pattern
```javascript
useEffect(() => {
  if (!autoSave?.enabled || !isDirty || !isValid || loading) return
  
  const timer = setTimeout(async () => {
    setAutoSaveStatus('saving')
    try {
      await autoSave.onAutoSave(formData)
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    } catch (error) {
      setAutoSaveStatus('error')
    }
  }, autoSave.delay || 3000)
  
  return () => clearTimeout(timer)
}, [formData, isDirty, isValid, loading])
```

### 8.2 Form State Management

#### Dirty Tracking
```
Dirty State Calculation:
isDirty = !deepEqual(currentData, initialData)

Per-field tracking:
touched[fieldName] = true (when field focused/blurred)
```

#### Validation Timing
- **onChange**: Immediate validation as user types (configurable per field)
- **onBlur**: Validation when field loses focus (configurable per field)  
- **onSubmit**: Full form validation before submission

#### State Persistence
```
Tab Switch: Preserve form state, show errors only for touched fields
Modal Close: Confirm if dirty changes exist
Page Navigation: Browser warning if unsaved changes
```

---

## 9. Import/Export System

### 9.1 Export Business Rules

#### Data Selection Rules
```
Single Item Export:
- Include item-specific data only
- Apply data cleaning based on sensitivity settings

Multiple Item Export:  
- Bundle items of same type
- Apply consistent cleaning rules
- Include metadata for import validation
```

#### Sensitivity Handling
```
includeSensitiveData = false (default):
- Remove IDs, timestamps, ownership info
- Redact passwords with '<REDACTED>'
- Never include private keys
- Remove nginx runtime status

includeSensitiveData = true:
- Keep passwords for access lists
- Still remove private keys (security)
- Remove IDs/timestamps (import compatibility)
```

#### Export Metadata
```json
{
  "version": "1.0",
  "exported_at": "2023-01-01T12:00:00Z",
  "type": "proxy_host",
  "export_source": "nginx-proxy-manager-frontend"
}
```

### 9.2 Import Business Rules

#### Validation Rules
```
File Validation:
1. Valid JSON format
2. Required fields present (version, type, data, exported_at)
3. Version compatibility check
4. Data structure validation per type
```

#### Conflict Resolution
```
overwriteExisting = true: Replace existing items with same name/domain
skipExisting = true: Keep existing items, skip imports
renameOnConflict = true: Append suffix to avoid conflicts
```

#### Data Preparation
```
Import Preparation Rules:
1. Remove import-incompatible fields (id, created_on, modified_on, owner_user_id)
2. Set default values for missing optional fields
3. Clean embedded arrays (remove IDs from auth items, access rules)
4. Validate required fields exist
5. Apply type-specific defaults
```

### 9.3 Type-Specific Import Rules

#### Proxy Host Imports
```
Default Values:
- enabled: true
- locations: []
- Advanced validation for certificate/access_list references
```

#### Certificate Imports
```
Restrictions:
- Cannot import private keys
- Let's Encrypt certificates: metadata only
- Custom certificates: require re-upload of files
```

#### Access List Imports
```
Processing Rules:
- Clean auth items: only username/password
- Clean access rules: only address/directive  
- Apply default values: satisfy_any=false, pass_auth=false
```

---

## 10. UI/UX Business Logic

### 10.1 Dynamic UI Rules

#### Tab Management
```
Error Display Rules:
- Show error indicators on tabs with validation errors
- Badge counts on tabs (e.g., SSL enabled count)
- Disable tabs based on form state (e.g., SSL tab when provider ≠ letsencrypt)
```

#### Conditional Field Display
```
SSL Options Visibility:
IF ssl_enabled = true THEN show SSL options section
IF hsts_enabled = true THEN show hsts_subdomains option

Certificate Upload:
IF provider = 'other' THEN show file upload section
IF provider = 'letsencrypt' THEN show Let's Encrypt configuration
```

#### Interactive Features
```
Domain Input:
- Multi-format paste support (comma, newline separated)
- Auto-deduplication
- Alphabetical sorting for display
- Visual list with numbered entries

Certificate Selection:
- Sort by expiry status (expired/critical first)
- Color-coded status indicators
- Provider type badges
- Domain coverage display
```

### 10.2 Loading States

#### Progressive Loading
```
Data Loading Hierarchy:
1. Initial component render
2. Load dependent data (certificates, access lists)
3. Populate form fields
4. Enable user interactions

Loading Indicators:
- Skeleton loading for lists
- Spinner overlays for forms
- Button loading states during submission
```

#### Error Handling
```
Error Display Rules:
- Field-level errors: Show only after field touched
- Global errors: Show immediately
- API errors: Extract user-friendly messages
- Network errors: Provide retry options
```

### 10.3 Responsive Behavior

#### Adaptive Layouts
```
Drawer Widths:
- Standard forms: 600px
- Complex forms (certificates): 700px
- Mobile: Full width

Form Organization:
- Vertical sections on mobile
- Horizontal field groups on desktop
- Collapsible sections for advanced options
```

---

## 11. API Integration Rules

### 11.1 Request Processing

#### Authentication
```
All API requests include:
- Authorization: Bearer {token}
- Automatic token refresh on 401 responses
- Logout on refresh failure
```

#### Data Expansion
```
Optional expand parameters:
- proxy-hosts?expand=certificate,access_list,owner
- Reduces API calls by including related data
```

#### Error Handling
```
HTTP Status Code Handling:
- 200-299: Success
- 401: Token refresh → retry → logout if fails
- 403: Permission denied → redirect to forbidden page
- 404: Resource not found → user notification
- 422: Validation error → display field errors
- 500: Server error → generic error message
```

### 11.2 Owner Filtering

#### Automatic Owner Injection
```
Create Operations:
IF shouldFilterByUser() AND !isAdmin() THEN
  payload.owner_user_id = currentUser.id
```

#### Ownership Verification
```
Update/Delete Operations:
IF shouldFilterByUser() AND !isAdmin() THEN
  1. Fetch resource by ID
  2. Verify resource.owner_user_id === currentUser.id
  3. Throw permission error if mismatch
  4. Proceed with operation if match
```

### 11.3 FormData Handling

#### File Upload Processing
```
Certificate File Upload:
1. Create FormData object
2. Append files: certificate, certificate_key, intermediate_certificate
3. POST to /nginx/certificates/{id}/upload
4. Handle validation responses

File Validation:
1. Client-side: Check file extensions, basic format
2. Server-side: Validate certificate content and key matching
3. Display validation results to user
```

---

## 12. Security Rules

### 12.1 Input Sanitization

#### Current Sanitization
- Basic HTML escaping in form inputs
- Type coercion for numeric fields
- Domain format checking

#### Missing Sanitization (Security Gaps)
- No Nginx config syntax validation
- No IP/CIDR format validation
- No URL scheme validation
- No file content scanning

### 12.2 Data Protection

#### Token Security
```javascript
Current Implementation:
- Tokens in localStorage (vulnerable to XSS)
- No CSRF protection
- Auto-refresh mechanism

Recommended Improvements:
- HttpOnly cookies for token storage
- CSRF token implementation
- Content Security Policy headers
```

#### File Upload Security
```javascript
Current Validation:
- File extension checking
- Basic format validation

Missing Security:
- File size limits
- Content type validation
- Malicious content scanning
- Path traversal prevention
```

### 12.3 Permission Enforcement

#### Frontend Security
```javascript
Permission Checks:
- UI element visibility based on permissions
- Route protection with PermissionRoute
- Button state management with permissions

Note: Frontend checks are NOT security boundaries
Backend must enforce all permission rules
```

#### API Security
```javascript
Owner Filtering:
- Automatic owner_user_id injection for non-admin users
- Ownership verification before updates/deletes
- Resource visibility filtering by ownership
```

---

## 13. Implementation Checklist for New Frontend

### 13.1 Core Features Required

#### Essential Components
- [ ] BaseDrawer with tab support and validation states
- [ ] useDrawerForm hook with auto-save and validation
- [ ] DomainInput with multi-format parsing
- [ ] Permission-based UI components (PermissionGate, PermissionButton)
- [ ] ArrayFieldManager for dynamic arrays
- [ ] FormSection with collapsible and error states

#### Data Management
- [ ] API clients with owner filtering
- [ ] Token management with auto-refresh
- [ ] Permission utilities and checking
- [ ] Import/export service with data cleaning
- [ ] Form state management with dirty tracking

### 13.2 Validation Implementation

#### Field-Level Validation
- [ ] Required field validation
- [ ] Email format validation
- [ ] Port range validation (1-65535)
- [ ] Domain format checking
- [ ] File type and size validation

#### Cross-Field Validation
- [ ] SSL certificate requirement when SSL enabled
- [ ] DNS challenge requirement for wildcards
- [ ] Protocol requirement for streams
- [ ] Authentication password requirements

#### Missing Validations to Implement
- [ ] IP/CIDR format validation for access lists
- [ ] URL/hostname validation for forward hosts
- [ ] Nginx configuration syntax validation
- [ ] File size limits for uploads
- [ ] Content security validation

### 13.3 Security Implementation

#### Authentication & Authorization
- [ ] JWT token management
- [ ] Permission hierarchy enforcement
- [ ] Owner filtering for non-admin users
- [ ] Route protection based on permissions

#### Input Security
- [ ] XSS prevention in form inputs
- [ ] SQL injection prevention (API responsibility)
- [ ] File upload security validation
- [ ] Configuration injection prevention

#### Recommended Security Enhancements
- [ ] CSRF token implementation
- [ ] Content Security Policy headers
- [ ] HttpOnly cookie token storage
- [ ] Rate limiting on sensitive operations

### 13.4 User Experience Features

#### Form Management
- [ ] Auto-save with debouncing (3-second default)
- [ ] Dirty state tracking and warnings
- [ ] Tab-based form organization
- [ ] Error display with field highlighting
- [ ] Loading states and progress indicators

#### Data Visualization
- [ ] Certificate expiry status with color coding
- [ ] Certificate sorting by expiry (critical first)
- [ ] Domain list with numbered display
- [ ] Access rule management with dynamic arrays

#### Import/Export Functionality
- [ ] JSON export with data cleaning
- [ ] Import validation and conflict resolution
- [ ] Progress reporting for bulk operations
- [ ] Error reporting with detailed messages

---

## Conclusion

This document provides the complete business rules specification for the nginx-proxy-manager frontend. Any new frontend implementation must adhere to these rules to maintain compatibility and ensure proper system functionality.

### Key Principles
1. **Security First**: Implement all validation rules and security measures
2. **User Experience**: Maintain intuitive workflows and clear error messaging
3. **Data Integrity**: Enforce all data dependencies and constraints
4. **Permission Compliance**: Respect all authorization rules and visibility scoping
5. **API Compatibility**: Follow all API integration patterns and data transformations

### Critical Security Notes
- Frontend validation is for UX only - backend must enforce all rules
- Missing validations (IP/CIDR, URL, file size) should be implemented
- Token security should be enhanced with HttpOnly cookies and CSRF protection
- File uploads need comprehensive security validation

This documentation serves as the authoritative reference for nginx-proxy-manager frontend business logic and should be updated as the system evolves.
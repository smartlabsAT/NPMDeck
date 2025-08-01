# NPMDeck API Documentation

Welcome to the comprehensive API documentation for NPMDeck (Nginx Proxy Manager). This documentation is organized to serve both backend and frontend developers with their specific needs.

## 📚 Documentation Structure

### 🔧 Backend API Documentation
Documentation focused on the Nginx Proxy Manager REST API from a backend perspective.

- **[NPM API Reference](./backend/npm-api-reference.md)** - Complete REST API reference with examples
- **[Authentication Guide](./backend/authentication-guide.md)** - JWT authentication flow and implementation
- **[API Examples](./backend/examples.md)** - Practical code examples for common operations

### 🎨 Frontend API Documentation
Documentation specifically created for frontend developers working with the NPMDeck React application.

- **[Endpoints Reference](./frontend/endpoints-reference.md)** - Complete list of ALL API endpoints used by the frontend
- **[Validation Rules](./frontend/validation-rules.md)** - Frontend validation patterns and rules
- **[Business Rules](./frontend/business-rules.md)** - Business logic and rules implemented in the frontend
- **[Integration Guide](./frontend/integration-guide.md)** - How the frontend integrates with the API
- **[Analysis Reports](./frontend/analysis-report.md)** - Comprehensive analysis of the frontend implementation

## 🚀 Quick Start

### For Backend Developers
1. Start with the [NPM API Reference](./backend/npm-api-reference.md) to understand available endpoints
2. Review the [Authentication Guide](./backend/authentication-guide.md) for JWT implementation
3. Check [API Examples](./backend/examples.md) for practical usage patterns

### For Frontend Developers
1. Check the [Endpoints Reference](./frontend/endpoints-reference.md) for a complete API overview
2. Review [Validation Rules](./frontend/validation-rules.md) to understand client-side validation
3. Study [Business Rules](./frontend/business-rules.md) for application logic
4. Use the [Integration Guide](./frontend/integration-guide.md) for implementation patterns

## 🔑 Key Information

### Base API URL
```
http://localhost:81/api
```

### Authentication
- **Method**: JWT Bearer tokens
- **Header**: `Authorization: Bearer <token>`
- **Token Lifetime**: 1 hour
- **Refresh**: GET `/api/tokens` with valid token

### Content Types
- **Request**: `application/json` (except file uploads)
- **Response**: `application/json`
- **File Uploads**: `multipart/form-data`

## 📊 API Coverage Status

### ✅ Documented Endpoints: 42
All major CRUD operations for all resource types are documented.

### ❌ Undocumented Endpoints: 5
- `/nginx/certificates/test-http`
- `/nginx/certificates/validate`
- `/nginx/certificates/{id}/download`
- `/nginx/certificates/{id}/upload`
- `/nginx/dead-hosts/{id}/certificates`

See [Endpoints Reference](./frontend/endpoints-reference.md) for complete details.

## 🛠️ Resources

### API Resources
- **Authentication** - Token management
- **Users** - User management and permissions
- **Proxy Hosts** - Reverse proxy configurations
- **Redirection Hosts** - URL redirections
- **Dead Hosts** - 404 error pages
- **Streams** - TCP/UDP stream proxying
- **Certificates** - SSL certificate management
- **Access Lists** - Access control lists
- **Audit Log** - Activity tracking
- **Settings** - Application settings

## 📝 Contributing

When updating the API documentation:
1. Keep backend and frontend documentation synchronized
2. Update both perspectives when APIs change
3. Include examples for new endpoints
4. Document validation rules for new fields
5. Update the completeness status in this README

## 🔗 Related Documentation

- [Main Documentation Index](../DOCUMENTATION_INDEX.md)
- [Architecture Documentation](../ARCHITECTURE_DOCUMENTATION.md)
- [Component API Documentation](../COMPONENT_API_DOCUMENTATION.md)
- [Developer Guide](../DEVELOPER_GUIDE.md)
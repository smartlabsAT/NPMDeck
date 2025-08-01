# NPM Authentication Guide

This guide explains the JWT-based authentication system used by Nginx Proxy Manager.

## Overview

NPM uses JSON Web Tokens (JWT) for API authentication. All API requests (except login) require a valid JWT token in the Authorization header.

## Authentication Flow

### 1. Initial Login

**Endpoint**: `POST /api/tokens`

**Request**:
```http
POST /api/tokens
Content-Type: application/json

{
  "identity": "admin@example.com",
  "secret": "password",
  "scope": "user"  // optional, defaults to "user"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-01-20T10:00:00.000Z"
}
```

### 2. Using the Token

Include the token in the Authorization header for all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Token Refresh

Tokens expire after 1 hour. To refresh before expiration:

**Endpoint**: `GET /api/tokens`

```http
GET /api/tokens
Authorization: Bearer <current-token>
```

**Response**: New token with extended validity

## Implementation Examples

### JavaScript/TypeScript
```javascript
// Login function
async function login(email, password) {
  const response = await fetch('http://localhost:81/api/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: email,
      secret: password
    })
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const { token, expires } = await response.json();
  
  // Store token
  localStorage.setItem('npm_token', token);
  localStorage.setItem('npm_token_expires', expires);
  
  return token;
}

// Making authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('npm_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    // Token expired, try to refresh
    await refreshToken();
    // Retry request with new token
    return makeAuthenticatedRequest(url, options);
  }
  
  return response;
}

// Token refresh
async function refreshToken() {
  const currentToken = localStorage.getItem('npm_token');
  
  const response = await fetch('http://localhost:81/api/tokens', {
    headers: {
      'Authorization': `Bearer ${currentToken}`
    }
  });
  
  if (!response.ok) {
    // Refresh failed, redirect to login
    window.location.href = '/login';
    return;
  }
  
  const { token, expires } = await response.json();
  localStorage.setItem('npm_token', token);
  localStorage.setItem('npm_token_expires', expires);
}
```

### Python Example
```python
import requests
import json
from datetime import datetime

class NPMClient:
    def __init__(self, base_url='http://localhost:81'):
        self.base_url = base_url
        self.token = None
        self.token_expires = None
    
    def login(self, email, password):
        """Authenticate and obtain JWT token"""
        response = requests.post(
            f'{self.base_url}/api/tokens',
            json={
                'identity': email,
                'secret': password
            }
        )
        response.raise_for_status()
        
        data = response.json()
        self.token = data['token']
        self.token_expires = datetime.fromisoformat(
            data['expires'].replace('Z', '+00:00')
        )
        
        return self.token
    
    def _get_headers(self):
        """Get headers with authentication token"""
        if not self.token:
            raise Exception('Not authenticated')
        
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def refresh_token(self):
        """Refresh the JWT token"""
        response = requests.get(
            f'{self.base_url}/api/tokens',
            headers=self._get_headers()
        )
        response.raise_for_status()
        
        data = response.json()
        self.token = data['token']
        self.token_expires = datetime.fromisoformat(
            data['expires'].replace('Z', '+00:00')
        )
    
    def request(self, method, endpoint, **kwargs):
        """Make authenticated API request"""
        # Check if token needs refresh
        if self.token_expires and datetime.now() >= self.token_expires:
            self.refresh_token()
        
        response = requests.request(
            method,
            f'{self.base_url}/api{endpoint}',
            headers=self._get_headers(),
            **kwargs
        )
        
        if response.status_code == 401:
            # Try refreshing token and retry
            self.refresh_token()
            response = requests.request(
                method,
                f'{self.base_url}/api{endpoint}',
                headers=self._get_headers(),
                **kwargs
            )
        
        response.raise_for_status()
        return response.json() if response.content else None

# Usage example
client = NPMClient()
client.login('admin@example.com', 'password')

# Get all proxy hosts
proxy_hosts = client.request('GET', '/nginx/proxy-hosts')
```

## Security Considerations

### Token Storage
- **Frontend**: Store in memory or sessionStorage for better security
- **Backend**: Never log or expose tokens
- **Mobile**: Use secure storage mechanisms

### Token Expiration
- Tokens expire after 1 hour
- Implement automatic refresh before expiration
- Handle 401 responses gracefully

### Best Practices
1. Always use HTTPS in production
2. Implement token refresh logic
3. Clear tokens on logout
4. Don't store tokens in cookies (CSRF risk)
5. Validate token expiration on client side

## Error Handling

### Common Authentication Errors

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Token missing, invalid, or expired |
| 403 | Forbidden | Valid token but insufficient permissions |
| 400 | Bad Request | Invalid credentials format |

### Error Response Format
```json
{
  "error": {
    "code": 401,
    "message": "Invalid token"
  }
}
```

## Multi-Account Support

NPM supports multiple account tokens. When implementing:
1. Store tokens per account/environment
2. Allow switching between accounts
3. Refresh tokens independently

## Testing Authentication

### Manual Testing with cURL
```bash
# Login
curl -X POST http://localhost:81/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@example.com","secret":"password"}'

# Use token
export TOKEN="eyJhbGci..."
curl -X GET http://localhost:81/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Testing
- Mock authentication in tests
- Use test tokens with extended expiration
- Test token refresh logic
- Test error scenarios (expired, invalid tokens)
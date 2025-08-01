# NPM API Examples

This document provides practical examples for common operations using the Nginx Proxy Manager API.

## Complete Workflow Examples

### 1. Setting Up a New Proxy Host with SSL

This example shows the complete process of creating a proxy host with Let's Encrypt SSL certificate.

```javascript
// Step 1: Authenticate
const loginResponse = await fetch('http://localhost:81/api/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identity: 'admin@example.com',
    secret: 'password'
  })
});
const { token } = await loginResponse.json();

// Step 2: Create the proxy host
const proxyResponse = await fetch('http://localhost:81/api/nginx/proxy-hosts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    domain_names: ['app.example.com', 'www.app.example.com'],
    forward_scheme: 'http',
    forward_host: '192.168.1.100',
    forward_port: 8080,
    access_list_id: 0,
    certificate_id: 0,
    meta: {
      letsencrypt_agree: false
    },
    advanced_config: '',
    locations: [],
    block_exploits: true,
    caching_enabled: false,
    allow_websocket_upgrade: true,
    http2_support: true,
    hsts_enabled: false,
    hsts_subdomains: false,
    ssl_forced: false
  })
});
const proxyHost = await proxyResponse.json();

// Step 3: Create Let's Encrypt certificate
const certResponse = await fetch('http://localhost:81/api/nginx/certificates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    provider: 'letsencrypt',
    domain_names: ['app.example.com', 'www.app.example.com'],
    meta: {
      letsencrypt_email: 'admin@example.com',
      letsencrypt_agree: true,
      dns_challenge: false
    }
  })
});
const certificate = await certResponse.json();

// Step 4: Update proxy host with certificate
const updateResponse = await fetch(`http://localhost:81/api/nginx/proxy-hosts/${proxyHost.id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    ...proxyHost,
    certificate_id: certificate.id,
    ssl_forced: true,
    hsts_enabled: true,
    http2_support: true
  })
});
```

### 2. Creating an Access List with Basic Auth

```javascript
// Create access list with IP restrictions and basic auth
const accessListResponse = await fetch('http://localhost:81/api/nginx/access-lists', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Private Network Access',
    satisfy_any: true,
    pass_auth: false,
    items: [
      {
        username: 'admin',
        password: 'secretpass123'
      },
      {
        username: 'developer',
        password: 'devpass456'
      }
    ],
    clients: [
      {
        address: '192.168.1.0/24',
        directive: 'allow'
      },
      {
        address: '10.0.0.0/8',
        directive: 'allow'
      },
      {
        address: 'all',
        directive: 'deny'
      }
    ]
  })
});
const accessList = await accessListResponse.json();

// Apply to proxy host
await fetch(`http://localhost:81/api/nginx/proxy-hosts/${proxyHostId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    ...existingProxyHost,
    access_list_id: accessList.id
  })
});
```

### 3. Setting Up a Wildcard Certificate with DNS Challenge

```javascript
// Create wildcard certificate using Cloudflare DNS
const wildcardCertResponse = await fetch('http://localhost:81/api/nginx/certificates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    provider: 'letsencrypt',
    domain_names: ['*.example.com', 'example.com'],
    meta: {
      letsencrypt_email: 'admin@example.com',
      letsencrypt_agree: true,
      dns_challenge: true,
      dns_provider: 'cloudflare',
      dns_provider_credentials: JSON.stringify({
        email: 'cloudflare@example.com',
        api_key: 'your-cloudflare-api-key'
      }),
      propagation_seconds: 30
    }
  })
});
```

### 4. Creating a Stream (TCP/UDP Proxy)

```javascript
// Create TCP stream for database
const streamResponse = await fetch('http://localhost:81/api/nginx/streams', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    incoming_port: 3306,
    forwarding_host: '192.168.1.50',
    forwarding_port: 3306,
    tcp_forwarding: true,
    udp_forwarding: false,
    enabled: 1,
    meta: {}
  })
});
```

### 5. Bulk Operations Example

```javascript
// Get all proxy hosts and update them
async function updateAllProxyHosts() {
  // Get all hosts
  const hostsResponse = await fetch('http://localhost:81/api/nginx/proxy-hosts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const hosts = await hostsResponse.json();

  // Update each host
  const updatePromises = hosts.map(host => {
    return fetch(`http://localhost:81/api/nginx/proxy-hosts/${host.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...host,
        block_exploits: true,
        http2_support: true
      })
    });
  });

  await Promise.all(updatePromises);
  console.log(`Updated ${hosts.length} proxy hosts`);
}
```

### 6. Custom Certificate Upload

```javascript
// Upload custom SSL certificate
const formData = new FormData();
formData.append('provider', 'other');
formData.append('nice_name', 'My Custom Certificate');
formData.append('certificate', certificateFile); // File object
formData.append('certificate_key', privateKeyFile); // File object
formData.append('intermediate_certificate', intermediateFile); // Optional

const customCertResponse = await fetch('http://localhost:81/api/nginx/certificates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Note: Don't set Content-Type for FormData
  },
  body: formData
});
```

### 7. User Management Example

```javascript
// Create a new user with limited permissions
const userResponse = await fetch('http://localhost:81/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Developer User',
    nickname: 'Dev',
    email: 'dev@example.com',
    is_disabled: false,
    permissions: {
      visibility: 'user',  // Can only see own items
      proxy_hosts: 'manage',
      redirection_hosts: 'view',
      dead_hosts: 'hidden',
      streams: 'hidden',
      access_lists: 'view',
      certificates: 'manage'
    }
  })
});
const newUser = await userResponse.json();

// Set password for the new user
await fetch(`http://localhost:81/api/users/${newUser.id}/auth`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'password',
    secret: 'secure-password-123'
  })
});
```

### 8. Monitoring and Audit

```javascript
// Get audit log with filters
const auditResponse = await fetch('http://localhost:81/api/audit-log?expand=user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const auditEntries = await auditResponse.json();

// Filter for specific actions
const proxyHostChanges = auditEntries.filter(entry => 
  entry.object_type === 'proxy-host' && 
  ['created', 'updated', 'deleted'].includes(entry.action)
);

console.log('Recent proxy host changes:', proxyHostChanges);
```

### 9. Error Handling Pattern

```javascript
class NPMApiClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    try {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, options);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // Convenience methods
  get(endpoint) { return this.request('GET', endpoint); }
  post(endpoint, data) { return this.request('POST', endpoint, data); }
  put(endpoint, data) { return this.request('PUT', endpoint, data); }
  delete(endpoint) { return this.request('DELETE', endpoint); }
}

// Usage
const client = new NPMApiClient('http://localhost:81', token);
try {
  const hosts = await client.get('/nginx/proxy-hosts');
  const newHost = await client.post('/nginx/proxy-hosts', hostData);
} catch (error) {
  console.error('Operation failed:', error);
}
```

### 10. Settings Management

```javascript
// Get all settings
const settingsResponse = await fetch('http://localhost:81/api/settings', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const settings = await settingsResponse.json();

// Update a setting
const updateSettingResponse = await fetch(`http://localhost:81/api/settings/${settingId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    value: 'new-value'
  })
});
```

## Testing Tips

### Using Environment Variables
```javascript
const API_URL = process.env.NPM_API_URL || 'http://localhost:81';
const API_EMAIL = process.env.NPM_EMAIL || 'admin@example.com';
const API_PASSWORD = process.env.NPM_PASSWORD || 'changeme';
```

### Rate Limiting Consideration
```javascript
// Add delays between bulk operations
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function bulkCreate(items) {
  for (const item of items) {
    await createProxyHost(item);
    await delay(100); // 100ms delay between requests
  }
}
```

### Debug Logging
```javascript
// Log all API requests for debugging
const debugFetch = async (url, options) => {
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  const response = await fetch(url, options);
  console.log(`[API] Response: ${response.status}`);
  return response;
};
```
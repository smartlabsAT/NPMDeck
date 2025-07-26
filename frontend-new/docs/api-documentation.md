# Nginx Proxy Manager API Documentation

Diese Dokumentation beschreibt die REST API von Nginx Proxy Manager (NPM). Die API folgt RESTful-Prinzipien und nutzt JSON für Request/Response-Daten.

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Authentifizierung](#authentifizierung)
3. [API-Endpunkte](#api-endpunkte)
4. [Fehlerbehandlung](#fehlerbehandlung)
5. [CORS](#cors)
6. [Swagger/OpenAPI](#swaggeropenapi)

## Übersicht

### Basis-URL
```
http://localhost:81/api
```

### Content-Type
- Alle Requests: `application/json`
- Alle Responses: `application/json`
- File Uploads: `multipart/form-data`

### HTTP-Methoden
- `GET` - Daten abrufen
- `POST` - Neue Ressourcen erstellen
- `PUT` - Bestehende Ressourcen aktualisieren
- `DELETE` - Ressourcen löschen
- `OPTIONS` - CORS Preflight (automatisch)

## Authentifizierung

NPM verwendet JWT (JSON Web Tokens) für die Authentifizierung.

### Login-Flow

1. **Token erstellen**
```http
POST /api/tokens
Content-Type: application/json

{
  "identity": "admin@example.com",
  "secret": "password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJSUzI1...",
  "expires": "2024-01-20T10:00:00.000Z"
}
```

2. **Token verwenden**
Füge das Token bei allen weiteren Requests im Authorization-Header ein:
```http
Authorization: Bearer eyJhbGciOiJSUzI1...
```

### Token-Refresh

Tokens sind 1 Stunde gültig. Für einen Refresh:

```http
GET /api/tokens
Authorization: Bearer <current-token>
```

Response: Neues Token mit verlängerter Gültigkeit

### Wichtige Hinweise
- Tokens werden im Frontend im LocalStorage gespeichert
- Bei 401-Fehlern: Automatischer Redirect zum Login
- Multi-Account-Support: NPM kann mehrere Tokens verwalten

## API-Endpunkte

### System

#### Health Check
```http
GET /api
```
Keine Authentifizierung erforderlich.

Response:
```json
{
  "status": "OK",
  "version": {
    "major": 2,
    "minor": 11,
    "revision": 3
  }
}
```

#### OpenAPI Schema
```http
GET /api/schema
```
Liefert die komplette OpenAPI-Dokumentation.

### Authentifizierung

#### Login
```http
POST /api/tokens
```
Body:
```json
{
  "identity": "email@example.com",
  "secret": "password"
}
```

#### Token Refresh
```http
GET /api/tokens
Authorization: Bearer <token>
```

### Benutzer

#### Alle Benutzer abrufen
```http
GET /api/users
```
Query-Parameter:
- `expand`: `permissions` - Berechtigungen einschließen

#### Benutzer erstellen
```http
POST /api/users
```
Body:
```json
{
  "name": "John Doe",
  "nickname": "John",
  "email": "john@example.com",
  "is_disabled": false,
  "permissions": {
    "visibility": "all",
    "proxy_hosts": "manage",
    "redirection_hosts": "manage",
    "dead_hosts": "manage",
    "streams": "manage",
    "access_lists": "manage",
    "certificates": "manage"
  }
}
```

#### Benutzer abrufen
```http
GET /api/users/{user_id}
```
Spezial: `{user_id}` kann `me` sein für den aktuellen Benutzer.

#### Benutzer aktualisieren
```http
PUT /api/users/{user_id}
```

#### Benutzer löschen
```http
DELETE /api/users/{user_id}
```

#### Passwort ändern
```http
PUT /api/users/{user_id}/auth
```
Body:
```json
{
  "type": "password",
  "current": "altes-passwort",
  "secret": "neues-passwort"
}
```

#### Berechtigungen setzen
```http
PUT /api/users/{user_id}/permissions
```

#### Als Benutzer einloggen (Admin only)
```http
POST /api/users/{user_id}/login
```

### Proxy Hosts

#### Alle Proxy Hosts
```http
GET /api/nginx/proxy-hosts
```
Query-Parameter:
- `expand`: `owner,access_list,certificate`

#### Proxy Host erstellen
```http
POST /api/nginx/proxy-hosts
```
Body:
```json
{
  "domain_names": ["example.com", "www.example.com"],
  "forward_scheme": "http",
  "forward_host": "192.168.1.10",
  "forward_port": 80,
  "access_list_id": 0,
  "certificate_id": 0,
  "meta": {
    "letsencrypt_agree": false
  },
  "advanced_config": "",
  "locations": [],
  "block_exploits": false,
  "caching_enabled": false,
  "allow_websocket_upgrade": false,
  "http2_support": false,
  "hsts_enabled": false,
  "hsts_subdomains": false,
  "ssl_forced": false
}
```

#### Proxy Host abrufen
```http
GET /api/nginx/proxy-hosts/{host_id}
```

#### Proxy Host aktualisieren
```http
PUT /api/nginx/proxy-hosts/{host_id}
```

#### Proxy Host löschen
```http
DELETE /api/nginx/proxy-hosts/{host_id}
```

#### Proxy Host aktivieren
```http
POST /api/nginx/proxy-hosts/{host_id}/enable
```

#### Proxy Host deaktivieren
```http
POST /api/nginx/proxy-hosts/{host_id}/disable
```

### SSL Certificates

#### Alle Zertifikate
```http
GET /api/nginx/certificates
```

#### Let's Encrypt Zertifikat erstellen
```http
POST /api/nginx/certificates
```
Body:
```json
{
  "provider": "letsencrypt",
  "domain_names": ["example.com", "*.example.com"],
  "meta": {
    "letsencrypt_email": "admin@example.com",
    "letsencrypt_agree": true,
    "dns_challenge": true,
    "dns_provider": "cloudflare",
    "dns_provider_credentials": "...",
    "propagation_seconds": 30
  }
}
```

#### Custom Zertifikat hochladen
```http
POST /api/nginx/certificates
```
Body (multipart/form-data):
- `provider`: `other`
- `certificate`: Zertifikat-Datei
- `certificate_key`: Private Key
- `intermediate_certificate`: Intermediate Cert (optional)

#### Zertifikat validieren
```http
POST /api/nginx/certificates/validate
```

#### HTTP-Challenge testen
```http
GET /api/nginx/certificates/test-http
Query: domain=example.com
```

#### Zertifikat erneuern
```http
POST /api/nginx/certificates/{cert_id}/renew
```

#### Zertifikat herunterladen
```http
GET /api/nginx/certificates/{cert_id}/download
```

### Access Lists

#### Alle Access Lists
```http
GET /api/nginx/access-lists
```

#### Access List erstellen
```http
POST /api/nginx/access-lists
```
Body:
```json
{
  "name": "Private Access",
  "satisfy_any": true,
  "pass_auth": false,
  "items": [
    {
      "username": "user1",
      "password": "pass1"
    }
  ],
  "clients": [
    {
      "address": "192.168.1.0/24",
      "directive": "allow"
    }
  ]
}
```

### Weitere Endpunkte

#### Redirection Hosts
- `GET/POST /api/nginx/redirection-hosts`
- `GET/PUT/DELETE /api/nginx/redirection-hosts/{host_id}`
- `POST /api/nginx/redirection-hosts/{host_id}/enable`
- `POST /api/nginx/redirection-hosts/{host_id}/disable`

#### Dead Hosts (404)
- `GET/POST /api/nginx/dead-hosts`
- `GET/PUT/DELETE /api/nginx/dead-hosts/{host_id}`
- `POST /api/nginx/dead-hosts/{host_id}/enable`
- `POST /api/nginx/dead-hosts/{host_id}/disable`

#### Streams
- `GET/POST /api/nginx/streams`
- `GET/PUT/DELETE /api/nginx/streams/{stream_id}`
- `POST /api/nginx/streams/{stream_id}/enable`
- `POST /api/nginx/streams/{stream_id}/disable`

#### Audit Log
```http
GET /api/audit-log
```

#### Reports
```http
GET /api/reports/hosts
```

#### Settings
```http
GET /api/settings
GET /api/settings/{setting_id}
PUT /api/settings/{setting_id}
```

## Fehlerbehandlung

### Fehlerformat
```json
{
  "error": {
    "code": 400,
    "message": "Validation failed"
  }
}
```

### Häufige Fehlercodes
- `400` - Bad Request (Validierungsfehler)
- `401` - Unauthorized (Token fehlt/ungültig)
- `403` - Forbidden (Keine Berechtigung)
- `404` - Not Found
- `409` - Conflict (z.B. doppelte Domain)
- `500` - Internal Server Error

### Debug-Informationen
Im Development-Mode enthält die Antwort zusätzlich:
```json
{
  "error": {
    "code": 500,
    "message": "Internal Error"
  },
  "debug": {
    "stack": ["..."],
    "previous": null
  }
}
```

## CORS

Alle API-Endpunkte unterstützen CORS:
- Alle Origins sind erlaubt
- Credentials werden unterstützt
- OPTIONS-Requests für Preflight

Header:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Swagger/OpenAPI

Die vollständige API-Spezifikation ist verfügbar unter:
```
GET /api/schema
```

### Swagger UI einrichten

1. Swagger UI herunterladen: https://swagger.io/tools/swagger-ui/
2. NPM API-Schema-URL eingeben: `http://localhost:81/api/schema`
3. Interaktive Dokumentation nutzen

### Schema-Struktur
```
/backend/schema/
├── swagger.json          # Haupt-Spezifikation
├── paths/               # Alle Endpunkte
│   ├── nginx/
│   │   ├── proxy-hosts/
│   │   ├── certificates/
│   │   └── ...
│   └── users/
└── components/          # Datenmodelle
    ├── proxy-host-object.json
    ├── certificate-object.json
    └── ...
```

## Best Practices

### Pagination
Bei Listen-Endpunkten werden Pagination-Header zurückgegeben:
```http
X-Dataset-Total: 100
X-Dataset-Offset: 0
X-Dataset-Limit: 50
```

### Expansion
Viele Endpunkte unterstützen `expand` Parameter:
```http
GET /api/nginx/proxy-hosts?expand=owner,certificate,access_list
```

### Idempotenz
- GET, PUT, DELETE sind idempotent
- POST erstellt immer neue Ressourcen

### Rate Limiting
Derzeit kein Rate Limiting implementiert.

## Beispiel: Vollständiger Flow

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:81/api/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identity: 'admin@example.com',
    secret: 'password'
  })
});
const { token } = await loginResponse.json();

// 2. Proxy Host erstellen
const proxyResponse = await fetch('http://localhost:81/api/nginx/proxy-hosts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    domain_names: ['test.example.com'],
    forward_scheme: 'http',
    forward_host: '192.168.1.100',
    forward_port: 80
  })
});

// 3. Let's Encrypt Zertifikat anfordern
const certResponse = await fetch('http://localhost:81/api/nginx/certificates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    provider: 'letsencrypt',
    domain_names: ['test.example.com'],
    meta: {
      letsencrypt_email: 'admin@example.com',
      letsencrypt_agree: true
    }
  })
});
```

## Weitere Ressourcen

- [NPM GitHub Repository](https://github.com/NginxProxyManager/nginx-proxy-manager)
- [NPM Dokumentation](https://nginxproxymanager.com/guide/)
- OpenAPI Schema: `/api/schema`

---

**Hinweis**: Diese Dokumentation basiert auf NPM Version 2.x. Die API kann sich in zukünftigen Versionen ändern. Prüfe immer die aktuelle OpenAPI-Spezifikation unter `/api/schema`.
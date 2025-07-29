# NPMDeck API Configuration Guide

## Overview

This document describes the comprehensive API communication setup for NPMDeck, including production-ready configurations for Docker deployment, error handling, monitoring, and performance optimization.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NPMDeck UI    │───▶│  Express Server │───▶│ Nginx Proxy Mgr │
│   (React)       │    │   (Proxy Layer) │    │   (Backend API) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Monitoring    │
                       │   & Analytics   │
                       └─────────────────┘
```

## Components

### 1. API Configuration (`server/config/api.js`)
- Environment-specific settings
- Docker networking detection
- Timeout and retry configuration
- Security headers and CORS
- Rate limiting settings

### 2. HTTP Client (`server/utils/httpClient.js`)
- Retry logic with exponential backoff
- Request/response interceptors
- Error classification and handling
- Performance monitoring

### 3. Docker Middleware (`server/middleware/docker.js`)
- Container environment detection
- Service discovery for Docker Compose
- Network configuration optimization
- Container health monitoring

### 4. API Monitor (`server/utils/apiMonitor.js`)
- Real-time performance metrics
- Error tracking and analysis
- Health status monitoring
- Request/response logging

### 5. Monitoring Routes (`server/routes/api-monitoring.js`)
- `/api/monitoring/metrics` - Comprehensive metrics
- `/api/monitoring/performance` - Performance data
- `/api/monitoring/errors` - Error analysis
- `/api/monitoring/status` - Real-time status

## Configuration Files

### Environment Variables

#### Production (`.env.production`)
```bash
NODE_ENV=production
PORT=3000
NPM_API_URL=http://npm-backend:81
REQUEST_TIMEOUT=30000
PROXY_TIMEOUT=30000
RETRY_ATTEMPTS=3
RETRY_BACKOFF=true
RATE_LIMIT_ENABLED=true
HEALTH_CHECK_ENABLED=true
```

#### Development (`.env.development`)
```bash
NODE_ENV=development
PORT=3001
NPM_API_URL=http://localhost:81
REQUEST_TIMEOUT=60000
RETRY_ATTEMPTS=2
RATE_LIMIT_ENABLED=false
LOG_LEVEL=debug
LOG_PROXY=true
```

### Docker Configuration

#### Docker Compose Services
```yaml
services:
  prod:
    environment:
      - NODE_ENV=production
      - NPM_API_URL=http://npm-backend:81
      - DOCKER_NETWORK=npmdeck
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
  
  npm-backend:
    image: jc21/nginx-proxy-manager:latest
    ports:
      - "80:80"
      - "81:81"
      - "443:443"
```

## API Features

### 1. Enhanced Proxy Configuration
- **Automatic Service Discovery**: Detects Docker environment and configures NPM service URLs
- **Request Tracking**: Unique request IDs for debugging
- **Header Management**: Proper forwarding of authentication and session headers
- **Body Handling**: Correct JSON body processing for POST/PUT requests

### 2. Retry Logic
- **Configurable Attempts**: Default 3 retries for production
- **Exponential Backoff**: Optional exponential delay between retries
- **Smart Retry**: Only retries network errors and 5xx responses
- **Timeout Handling**: Separate timeouts for connection and request

### 3. Error Handling
- **Error Classification**: Network, HTTP, and application errors
- **Detailed Logging**: Structured error logs with context
- **User-Friendly Responses**: Consistent error response format
- **Error Recovery**: Automatic retry for recoverable errors

### 4. Security
- **Rate Limiting**: Configurable per-IP rate limits
- **CORS Configuration**: Environment-specific CORS settings
- **Security Headers**: Helmet.js with CSP and security headers
- **Request Validation**: Input sanitization and validation

### 5. Monitoring & Analytics
- **Real-time Metrics**: Request counts, response times, error rates
- **Performance Tracking**: P95 response times, throughput metrics
- **Error Analysis**: Error categorization and trending
- **Health Monitoring**: Backend health checks and status tracking

## API Endpoints

### Health & Status
- `GET /health` - Application health check
- `GET /api/test-connection` - NPM connectivity test
- `GET /api/docker-info` - Docker environment info

### Monitoring
- `GET /api/monitoring/status` - Real-time status
- `GET /api/monitoring/metrics` - Comprehensive metrics
- `GET /api/monitoring/performance` - Performance data
- `GET /api/monitoring/errors` - Error analysis
- `POST /api/monitoring/test-connectivity` - Connection testing

### Configuration
- `GET /api/monitoring/config` - Current configuration
- `GET /api/monitoring/endpoints` - Endpoint statistics

## Docker Deployment

### Development Mode
```bash
# Start development environment
docker-compose up dev

# Access services
# - NPMDeck UI: http://localhost:5173
# - Express API: http://localhost:3001
# - NPM Backend: http://localhost:81
```

### Production Mode
```bash
# Start production environment
docker-compose up prod

# Access services
# - NPMDeck: http://localhost:3000
# - NPM Backend: http://localhost:81
```

### Complete Stack
```bash
# Start full stack including NPM backend
docker-compose up prod npm-backend

# This includes:
# - NPMDeck frontend + API server
# - Nginx Proxy Manager backend
# - Proper networking between services
```

## Performance Optimizations

### 1. Connection Pooling
- HTTP client reuses connections
- Configurable timeout settings
- Connection health monitoring

### 2. Request Optimization
- Request/response compression
- Efficient header handling
- Minimal data transfer

### 3. Caching Strategy
- Client-side response caching
- Conditional requests support
- Cache-aware error handling

### 4. Resource Management
- Memory usage monitoring
- Request rate limiting
- Connection cleanup

## Troubleshooting

### Common Issues

#### 1. Connection Refused (ECONNREFUSED)
```
Cause: NPM backend not accessible
Solutions:
- Check NPM_API_URL configuration
- Verify Docker networking
- Check NPM backend health
```

#### 2. Request Timeout (ETIMEDOUT)
```
Cause: Request taking too long
Solutions:
- Increase REQUEST_TIMEOUT
- Check network connectivity
- Verify NPM backend performance
```

#### 3. Docker Network Issues
```
Cause: Service discovery problems
Solutions:
- Verify docker-compose network configuration
- Check service names match
- Use docker logs to debug
```

### Debugging Commands

```bash
# Check API connectivity
curl http://localhost:3000/api/test-connection

# View monitoring metrics
curl http://localhost:3000/api/monitoring/status

# Test NPM backend directly
curl http://localhost:81/api

# Check Docker environment
curl http://localhost:3000/api/docker-info

# View container logs
docker-compose logs npmdeck-prod
```

### Log Analysis

#### Request Logs
```
[timestamp] info: HTTP Request: GET /api/nginx/proxy-hosts
[timestamp] debug: Proxying GET /api/nginx/proxy-hosts to http://npm-backend:81
[timestamp] info: HTTP Response: 200 GET /api/nginx/proxy-hosts (234ms)
```

#### Error Logs
```
[timestamp] error: Proxy error: {
  error: "ECONNREFUSED",
  target: "http://npm-backend:81",
  path: "/api/nginx/proxy-hosts"
}
```

## Verification

Run the setup verification script:
```bash
node scripts/verify-setup.js
```

This checks:
- Required files exist
- Dependencies installed
- Environment configured
- Docker setup complete
- API features implemented

## Support

For issues or questions:
1. Check the monitoring endpoints for system status
2. Review Docker container logs
3. Verify environment configuration
4. Test API connectivity manually
5. Check GitHub issues for known problems

## Security Considerations

- Never commit actual `.env` files with secrets
- Use environment-specific configurations
- Enable rate limiting in production
- Configure proper CORS origins
- Monitor for security vulnerabilities
- Regular security updates for dependencies

## Performance Monitoring

Key metrics to monitor:
- Response time percentiles (P50, P95, P99)
- Error rate percentage
- Request throughput (req/sec)
- Backend health status
- Memory and CPU usage
- Network latency to NPM backend
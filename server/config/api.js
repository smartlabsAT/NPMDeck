const logger = require('../utils/logger');

/**
 * API Configuration for NPM Proxy Communication
 * Handles environment-specific settings, timeout configurations, and Docker networking
 */
class APIConfig {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // Core API settings
      npmApiUrl: process.env.NPM_API_URL || 'http://localhost:81',
      port: parseInt(process.env.PORT, 10) || 3000,
      
      // Environment configuration
      environment: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      
      // Proxy timeout settings
      timeouts: {
        request: parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000,     // 30s
        proxy: parseInt(process.env.PROXY_TIMEOUT, 10) || 30000,        // 30s
        connect: parseInt(process.env.CONNECT_TIMEOUT, 10) || 10000,    // 10s
        socket: parseInt(process.env.SOCKET_TIMEOUT, 10) || 60000,      // 60s
      },
      
      // Retry configuration
      retry: {
        attempts: parseInt(process.env.RETRY_ATTEMPTS, 10) || 3,
        delay: parseInt(process.env.RETRY_DELAY, 10) || 1000,           // 1s
        backoff: process.env.RETRY_BACKOFF === 'true',
        retryCondition: (error) => {
          return !error.response || error.response.status >= 500;
        }
      },
      
      // CORS configuration
      cors: {
        origin: this.parseCorsOrigin(process.env.CORS_ORIGIN),
        credentials: process.env.CORS_CREDENTIALS !== 'false',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'Cache-Control',
          'X-File-Name'
        ]
      },
      
      // Security headers
      security: {
        helmet: {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              imgSrc: ["'self'", "data:", "https:", "blob:"],
              connectSrc: ["'self'", "ws:", "wss:", this.getNpmApiDomain()],
              fontSrc: ["'self'", "data:"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"]
            }
          },
          crossOriginEmbedderPolicy: false
        }
      },
      
      // Health check configuration
      healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000, // 30s
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000,    // 5s
        maxConsecutiveFailures: parseInt(process.env.HEALTH_CHECK_MAX_FAILURES, 10) || 3
      },
      
      // Logging configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        requests: process.env.LOG_REQUESTS !== 'false',
        errors: true,
        proxy: process.env.LOG_PROXY !== 'false'
      },
      
      // Rate limiting
      rateLimit: {
        enabled: process.env.RATE_LIMIT_ENABLED === 'true',
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000,   // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,              // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later'
      },
      
      // Docker networking
      docker: {
        networkName: process.env.DOCKER_NETWORK || 'npmdeck',
        npmServiceName: process.env.NPM_SERVICE_NAME || 'npm-backend',
        internalPort: parseInt(process.env.NPM_INTERNAL_PORT, 10) || 81
      }
    };
  }

  /**
   * Parse CORS origin from environment variable
   */
  parseCorsOrigin(origin) {
    if (!origin || origin === '*') {
      return true; // Allow all origins in development
    }
    
    if (origin.includes(',')) {
      return origin.split(',').map(o => o.trim());
    }
    
    return origin;
  }

  /**
   * Extract domain from NPM API URL for CSP
   */
  getNpmApiDomain() {
    try {
      const url = new URL(this.config.npmApiUrl);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      logger.warn('Failed to parse NPM API URL for CSP:', error.message);
      return "'self'";
    }
  }

  /**
   * Validate configuration values
   */
  validateConfig() {
    const config = this.config;
    
    // Validate NPM API URL
    try {
      new URL(config.npmApiUrl);
    } catch (error) {
      throw new Error(`Invalid NPM_API_URL: ${config.npmApiUrl}`);
    }
    
    // Validate port
    if (config.port < 1 || config.port > 65535) {
      throw new Error(`Invalid PORT: ${config.port}`);
    }
    
    // Validate timeouts
    Object.entries(config.timeouts).forEach(([key, value]) => {
      if (value < 1000 || value > 300000) { // 1s to 5min
        logger.warn(`Timeout ${key} value ${value}ms may be inappropriate`);
      }
    });
    
    logger.info('API configuration validated successfully');
  }

  /**
   * Get proxy middleware configuration
   */
  getProxyConfig() {
    return {
      target: this.config.npmApiUrl,
      changeOrigin: true,
      pathRewrite: (path) => `/api${path}`,
      timeout: this.config.timeouts.request,
      proxyTimeout: this.config.timeouts.proxy,
      
      // Headers handling
      onProxyReq: (proxyReq, req, res) => {
        if (this.config.logging.proxy) {
          logger.debug(`Proxying ${req.method} ${req.path} to ${this.config.npmApiUrl}`);
        }
        
        // Forward authentication headers
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }
        
        // Forward cookies for session management
        if (req.headers.cookie) {
          proxyReq.setHeader('Cookie', req.headers.cookie);
        }
        
        // Handle request body for POST/PUT
        if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
          proxyReq.end();
        }
        
        // Add custom headers for NPM compatibility
        proxyReq.setHeader('X-Forwarded-For', req.ip);
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
        proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
      },
      
      // Response handling
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers
        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Allow-Methods'] = this.config.cors.methods.join(', ');
        proxyRes.headers['Access-Control-Allow-Headers'] = this.config.cors.allowedHeaders.join(', ');
        
        // Remove problematic headers
        delete proxyRes.headers['x-frame-options'];
        
        if (this.config.logging.proxy) {
          logger.debug(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
        }
      },
      
      // Error handling with retry logic
      onError: (err, req, res) => {
        logger.error('Proxy error:', {
          error: err.message,
          code: err.code,
          target: this.config.npmApiUrl,
          path: req.path,
          method: req.method
        });
        
        // Determine error type and response
        let statusCode = 502;
        let errorMessage = 'Bad Gateway - Unable to reach NPM backend';
        
        if (err.code === 'ECONNREFUSED') {
          statusCode = 503;
          errorMessage = 'Service Unavailable - NPM backend is not responding';
        } else if (err.code === 'ENOTFOUND') {
          statusCode = 502;
          errorMessage = 'Bad Gateway - NPM backend hostname not found';
        } else if (err.code === 'ETIMEDOUT') {
          statusCode = 504;
          errorMessage = 'Gateway Timeout - NPM backend request timed out';
        }
        
        res.status(statusCode).json({
          error: 'Proxy Error',
          message: errorMessage,
          code: err.code,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        });
      },
      
      // Self-handle response for better error control
      selfHandleResponse: false,
      
      // Additional options
      followRedirects: true,
      ignorePath: false,
      xfwd: true,
      secure: false, // Set to true in production with HTTPS
      ws: true // Enable WebSocket proxying
    };
  }

  /**
   * Get CORS configuration
   */
  getCorsConfig() {
    return {
      origin: this.config.cors.origin,
      credentials: this.config.cors.credentials,
      methods: this.config.cors.methods,
      allowedHeaders: this.config.cors.allowedHeaders,
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
  }

  /**
   * Get Helmet security configuration
   */
  getSecurityConfig() {
    return this.config.security.helmet;
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    if (!this.config.rateLimit.enabled) {
      return null;
    }
    
    return {
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: this.config.rateLimit.message,
      standardHeaders: true,
      legacyHeaders: false
    };
  }

  /**
   * Get complete configuration object
   */
  getConfig() {
    return this.config;
  }

  /**
   * Check if NPM backend is healthy
   */
  async checkHealth() {
    const axios = require('axios');
    
    try {
      const response = await axios.get(`${this.config.npmApiUrl}/api/health`, {
        timeout: this.config.healthCheck.timeout,
        validateStatus: (status) => status < 500
      });
      
      return {
        healthy: response.status < 400,
        status: response.status,
        response: response.data
      };
    } catch (error) {
      logger.warn('NPM health check failed:', error.message);
      return {
        healthy: false,
        error: error.message,
        code: error.code
      };
    }
  }
}

module.exports = new APIConfig();
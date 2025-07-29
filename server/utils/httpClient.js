const axios = require('axios');
const logger = require('./logger');
const apiConfig = require('../config/api');

/**
 * Enhanced HTTP client with retry logic, error handling, and NPM-specific optimizations
 */
class HTTPClient {
  constructor() {
    this.config = apiConfig.getConfig();
    this.client = this.createClient();
    this.setupInterceptors();
  }

  /**
   * Create axios client with default configuration
   */
  createClient() {
    return axios.create({
      baseURL: this.config.npmApiUrl,
      timeout: this.config.timeouts.request,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NPMDeck/1.0.0'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add timestamp
        config.metadata = { startTime: Date.now() };
        
        if (this.config.logging.requests) {
          logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: this.sanitizeHeaders(config.headers),
            data: config.data ? 'Present' : 'None'
          });
        }
        
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        
        if (this.config.logging.requests) {
          logger.debug(`HTTP Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            duration: `${duration}ms`,
            size: response.headers['content-length'] || 'unknown'
          });
        }
        
        return response;
      },
      (error) => {
        this.logError(error);
        return Promise.reject(this.enhanceError(error));
      }
    );
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize headers for logging (remove sensitive information)
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    ['authorization', 'cookie', 'x-api-key', 'x-auth-token'].forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Log HTTP errors with appropriate detail level
   */
  logError(error) {
    const config = error.config || {};
    const response = error.response;
    
    const errorInfo = {
      method: config.method?.toUpperCase(),
      url: config.url,
      requestId: config.headers?.['X-Request-ID'],
      duration: config.metadata ? `${Date.now() - config.metadata.startTime}ms` : 'unknown'
    };

    if (response) {
      // HTTP error response
      logger.error(`HTTP Error ${response.status}:`, {
        ...errorInfo,
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
    } else if (error.code) {
      // Network error
      logger.error(`Network Error ${error.code}:`, {
        ...errorInfo,
        code: error.code,
        message: error.message
      });
    } else {
      // Other error
      logger.error('HTTP Client Error:', {
        ...errorInfo,
        message: error.message
      });
    }
  }

  /**
   * Enhance error object with additional context
   */
  enhanceError(error) {
    const enhanced = {
      ...error,
      isRetryable: this.isRetryableError(error),
      errorType: this.classifyError(error),
      timestamp: new Date().toISOString()
    };

    if (error.response) {
      enhanced.httpStatus = error.response.status;
      enhanced.httpStatusText = error.response.statusText;
    }

    if (error.code) {
      enhanced.networkCode = error.code;
    }

    return enhanced;
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error) {
    // Network errors are retryable
    if (error.code && ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETDOWN', 'ENETUNREACH'].includes(error.code)) {
      return true;
    }

    // 5xx server errors are retryable
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // 429 rate limit is retryable
    if (error.response && error.response.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Classify error type for better handling
   */
  classifyError(error) {
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          return 'CONNECTION_REFUSED';
        case 'ETIMEDOUT':
          return 'TIMEOUT';
        case 'ENOTFOUND':
          return 'DNS_ERROR';
        case 'ECONNRESET':
          return 'CONNECTION_RESET';
        default:
          return 'NETWORK_ERROR';
      }
    }

    if (error.response) {
      const status = error.response.status;
      if (status >= 500) return 'SERVER_ERROR';
      if (status === 429) return 'RATE_LIMITED';
      if (status === 404) return 'NOT_FOUND';
      if (status === 401) return 'UNAUTHORIZED';
      if (status === 403) return 'FORBIDDEN';
      if (status >= 400) return 'CLIENT_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(config, retryCount = 0) {
    try {
      const response = await this.client.request(config);
      return response;
    } catch (error) {
      // Check if we should retry
      if (retryCount < this.config.retry.attempts && this.isRetryableError(error)) {
        const delay = this.calculateRetryDelay(retryCount);
        
        logger.warn(`Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.retry.attempts})`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          error: error.message
        });
        
        await this.sleep(delay);
        return this.request(config, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Calculate retry delay with optional exponential backoff
   */
  calculateRetryDelay(retryCount) {
    const baseDelay = this.config.retry.delay;
    
    if (this.config.retry.backoff) {
      return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30s
    }
    
    return baseDelay;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get(url, config = {}) {
    return this.request({ ...config, method: 'get', url });
  }

  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'post', url, data });
  }

  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'put', url, data });
  }

  async patch(url, data, config = {}) {
    return this.request({ ...config, method: 'patch', url, data });
  }

  async delete(url, config = {}) {
    return this.request({ ...config, method: 'delete', url });
  }

  /**
   * Health check specific method
   */
  async healthCheck() {
    try {
      const response = await this.get('/api/health', {
        timeout: this.config.healthCheck.timeout
      });
      
      return {
        healthy: response.status < 400,
        status: response.status,
        data: response.data,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        errorType: error.errorType || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Test NPM API connectivity
   */
  async testConnection() {
    const tests = [
      { name: 'Basic Connectivity', path: '/api' },
      { name: 'Health Check', path: '/api/health' },
      { name: 'API Info', path: '/api/nginx/proxy-hosts' }
    ];

    const results = {};

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await this.get(test.path, { timeout: 5000 });
        const duration = Date.now() - startTime;

        results[test.name] = {
          success: true,
          status: response.status,
          duration: `${duration}ms`,
          size: response.headers['content-length'] || 'unknown'
        };
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message,
          errorType: error.errorType || 'UNKNOWN_ERROR'
        };
      }
    }

    return results;
  }

  /**
   * Get client statistics
   */
  getStats() {
    // Note: This would require implementing request counting
    // For now, return basic config info
    return {
      baseURL: this.config.npmApiUrl,
      timeout: this.config.timeouts.request,
      retryAttempts: this.config.retry.attempts,
      retryDelay: this.config.retry.delay,
      backoffEnabled: this.config.retry.backoff
    };
  }
}

// Export singleton instance
module.exports = new HTTPClient();
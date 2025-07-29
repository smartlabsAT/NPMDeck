const logger = require('./logger');
const EventEmitter = require('events');

/**
 * API Monitoring and Error Tracking System
 * Monitors API performance, tracks errors, and provides insights
 */
class APIMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        by_endpoint: new Map(),
        by_status: new Map(),
        response_times: []
      },
      errors: {
        total: 0,
        by_type: new Map(),
        by_endpoint: new Map(),
        recent: []
      },
      health: {
        status: 'unknown',
        last_check: null,
        consecutive_failures: 0,
        uptime_percentage: 100
      }
    };

    this.config = {
      max_recent_errors: 100,
      max_response_times: 1000,
      health_check_threshold: 5,
      slow_request_threshold: 5000, // 5 seconds
      error_spike_threshold: 10     // errors per minute
    };

    this.startTime = Date.now();
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for monitoring
   */
  setupEventHandlers() {
    this.on('request_start', this.handleRequestStart.bind(this));
    this.on('request_end', this.handleRequestEnd.bind(this));
    this.on('request_error', this.handleRequestError.bind(this));
    this.on('health_check', this.handleHealthCheck.bind(this));
  }

  /**
   * Record the start of a request
   */
  recordRequestStart(requestId, method, path) {
    this.emit('request_start', {
      requestId,
      method,
      path,
      timestamp: Date.now()
    });
  }

  /**
   * Record the end of a successful request
   */
  recordRequestEnd(requestId, method, path, statusCode, responseTime) {
    this.emit('request_end', {
      requestId,
      method,
      path,
      statusCode,
      responseTime,
      timestamp: Date.now()
    });
  }

  /**
   * Record a request error
   */
  recordRequestError(requestId, method, path, error, responseTime = null) {
    this.emit('request_error', {
      requestId,
      method,
      path,
      error,
      responseTime,
      timestamp: Date.now()
    });
  }

  /**
   * Record health check result
   */
  recordHealthCheck(healthy, details = null) {
    this.emit('health_check', {
      healthy,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Handle request start event
   */
  handleRequestStart(data) {
    // Initialize request tracking if needed
    if (!this.activeRequests) {
      this.activeRequests = new Map();
    }
    
    this.activeRequests.set(data.requestId, data);
  }

  /**
   * Handle request end event
   */
  handleRequestEnd(data) {
    const { method, path, statusCode, responseTime } = data;
    
    // Update metrics
    this.metrics.requests.total++;
    this.metrics.requests.success++;
    
    // Track by endpoint
    const endpoint = `${method} ${path}`;
    this.updateMapCounter(this.metrics.requests.by_endpoint, endpoint);
    
    // Track by status code
    this.updateMapCounter(this.metrics.requests.by_status, statusCode);
    
    // Track response times
    if (responseTime !== null) {
      this.metrics.requests.response_times.push(responseTime);
      
      // Keep only recent response times
      if (this.metrics.requests.response_times.length > this.config.max_response_times) {
        this.metrics.requests.response_times.shift();
      }
      
      // Log slow requests
      if (responseTime > this.config.slow_request_threshold) {
        logger.warn(`Slow request detected: ${endpoint} took ${responseTime}ms`);
      }
    }
    
    // Clean up active request tracking
    if (this.activeRequests) {
      this.activeRequests.delete(data.requestId);
    }
  }

  /**
   * Handle request error event
   */
  handleRequestError(data) {
    const { method, path, error, responseTime } = data;
    
    // Update metrics
    this.metrics.requests.total++;
    this.metrics.requests.errors++;
    this.metrics.errors.total++;
    
    // Track by endpoint
    const endpoint = `${method} ${path}`;
    this.updateMapCounter(this.metrics.requests.by_endpoint, endpoint);
    this.updateMapCounter(this.metrics.errors.by_endpoint, endpoint);
    
    // Classify error type
    const errorType = this.classifyError(error);
    this.updateMapCounter(this.metrics.errors.by_type, errorType);
    
    // Store recent error
    const errorRecord = {
      timestamp: data.timestamp,
      endpoint,
      errorType,
      message: error.message || error,
      code: error.code,
      statusCode: error.response?.status,
      responseTime
    };
    
    this.metrics.errors.recent.push(errorRecord);
    
    // Keep only recent errors
    if (this.metrics.errors.recent.length > this.config.max_recent_errors) {
      this.metrics.errors.recent.shift();
    }
    
    // Check for error spikes
    this.checkErrorSpike();
    
    // Log error
    logger.error(`API request failed: ${endpoint}`, {
      error: errorRecord.message,
      code: errorRecord.code,
      statusCode: errorRecord.statusCode,
      responseTime: errorRecord.responseTime
    });
    
    // Clean up active request tracking
    if (this.activeRequests) {
      this.activeRequests.delete(data.requestId);
    }
  }

  /**
   * Handle health check event
   */
  handleHealthCheck(data) {
    const { healthy, details } = data;
    
    this.metrics.health.last_check = data.timestamp;
    
    if (healthy) {
      this.metrics.health.status = 'healthy';
      this.metrics.health.consecutive_failures = 0;
    } else {
      this.metrics.health.consecutive_failures++;
      
      if (this.metrics.health.consecutive_failures >= this.config.health_check_threshold) {
        this.metrics.health.status = 'unhealthy';
      } else {
        this.metrics.health.status = 'degraded';
      }
    }
    
    // Calculate uptime percentage
    this.updateUptimePercentage();
    
    logger.debug(`Health check: ${healthy ? 'healthy' : 'unhealthy'}`, details);
  }

  /**
   * Update counter in a Map
   */
  updateMapCounter(map, key) {
    map.set(key, (map.get(key) || 0) + 1);
  }

  /**
   * Classify error type
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
    
    if (error.response?.status) {
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
   * Check for error spikes
   */
  checkErrorSpike() {
    const oneMinuteAgo = Date.now() - 60000;
    const recentErrors = this.metrics.errors.recent.filter(
      error => error.timestamp > oneMinuteAgo
    );
    
    if (recentErrors.length >= this.config.error_spike_threshold) {
      logger.warn(`Error spike detected: ${recentErrors.length} errors in the last minute`);
      this.emit('error_spike', {
        count: recentErrors.length,
        errors: recentErrors
      });
    }
  }

  /**
   * Update uptime percentage
   */
  updateUptimePercentage() {
    const totalChecks = this.metrics.requests.total + this.metrics.errors.total;
    if (totalChecks > 0) {
      this.metrics.health.uptime_percentage = 
        (this.metrics.requests.success / totalChecks) * 100;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      performance: this.getPerformanceMetrics(),
      active_requests: this.activeRequests ? this.activeRequests.size : 0
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const responseTimes = this.metrics.requests.response_times;
    
    if (responseTimes.length === 0) {
      return {
        average_response_time: 0,
        median_response_time: 0,
        min_response_time: 0,
        max_response_time: 0,
        p95_response_time: 0
      };
    }
    
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    
    return {
      average_response_time: Math.round(sum / responseTimes.length),
      median_response_time: sorted[Math.floor(sorted.length / 2)],
      min_response_time: sorted[0],
      max_response_time: sorted[sorted.length - 1],
      p95_response_time: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    return {
      total_errors: this.metrics.errors.total,
      error_rate: this.metrics.requests.total > 0 
        ? (this.metrics.errors.total / this.metrics.requests.total) * 100 
        : 0,
      errors_by_type: Object.fromEntries(this.metrics.errors.by_type),
      errors_by_endpoint: Object.fromEntries(this.metrics.errors.by_endpoint),
      recent_errors: this.metrics.errors.recent.slice(-10) // Last 10 errors
    };
  }

  /**
   * Get health summary
   */
  getHealthSummary() {
    return {
      status: this.metrics.health.status,
      uptime_percentage: Math.round(this.metrics.health.uptime_percentage * 100) / 100,
      consecutive_failures: this.metrics.health.consecutive_failures,
      last_check: this.metrics.health.last_check,
      uptime_duration: Date.now() - this.startTime
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        by_endpoint: new Map(),
        by_status: new Map(),
        response_times: []
      },
      errors: {
        total: 0,
        by_type: new Map(),
        by_endpoint: new Map(),
        recent: []
      },
      health: {
        status: 'unknown',
        last_check: null,
        consecutive_failures: 0,
        uptime_percentage: 100
      }
    };
    
    this.startTime = Date.now();
    
    if (this.activeRequests) {
      this.activeRequests.clear();
    }
    
    logger.info('API monitoring metrics reset');
  }
}

// Export singleton instance
module.exports = new APIMonitor();
const express = require('express');
const router = express.Router();
const apiMonitor = require('../utils/apiMonitor');
const httpClient = require('../utils/httpClient');
const dockerMiddleware = require('../middleware/docker');
const logger = require('../utils/logger');

/**
 * API Monitoring and Management Routes
 * Provides endpoints for monitoring API performance, health, and configuration
 */

// Get comprehensive API metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = apiMonitor.getMetrics();
    const errorSummary = apiMonitor.getErrorSummary();
    const healthSummary = apiMonitor.getHealthSummary();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
      errors: errorSummary,
      health: healthSummary,
      client_stats: httpClient.getStats()
    });
  } catch (error) {
    logger.error('Failed to get API metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get performance metrics only
router.get('/performance', (req, res) => {
  try {
    const metrics = apiMonitor.getMetrics();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      performance: metrics.performance,
      uptime: metrics.uptime,
      active_requests: metrics.active_requests,
      total_requests: metrics.requests.total,
      success_rate: metrics.requests.total > 0 
        ? (metrics.requests.success / metrics.requests.total) * 100 
        : 0
    });
  } catch (error) {
    logger.error('Failed to get performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get error analysis
router.get('/errors', (req, res) => {
  try {
    const errorSummary = apiMonitor.getErrorSummary();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...errorSummary
    });
  } catch (error) {
    logger.error('Failed to get error analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get health status
router.get('/health-detailed', async (req, res) => {
  try {
    const healthSummary = apiMonitor.getHealthSummary();
    const npmHealth = await httpClient.healthCheck();
    const dockerInfo = dockerMiddleware.isDockerEnvironment 
      ? await dockerMiddleware.checkDockerNetworking()  
      : null;
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      monitor: healthSummary,
      npm_backend: npmHealth,
      docker: dockerInfo,
      overall_status: healthSummary.status === 'healthy' && npmHealth.healthy 
        ? 'healthy' 
        : 'degraded'
    });
  } catch (error) {
    logger.error('Failed to get detailed health status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test API connectivity with detailed results
router.post('/test-connectivity', async (req, res) => {
  try {
    const { endpoints = [] } = req.body;
    
    // Default test endpoints if none provided
    const testEndpoints = endpoints.length > 0 ? endpoints : [
      '/api',
      '/api/health',
      '/api/nginx/proxy-hosts',
      '/api/settings'
    ];
    
    const results = {};
    
    for (const endpoint of testEndpoints) {
      try {
        const startTime = Date.now();
        const response = await httpClient.get(endpoint, { timeout: 10000 });
        const duration = Date.now() - startTime;
        
        results[endpoint] = {
          success: true,
          status: response.status,
          duration: `${duration}ms`,
          size: response.headers['content-length'] || 'unknown',
          response_headers: {
            'content-type': response.headers['content-type'],
            'server': response.headers['server'],
            'x-powered-by': response.headers['x-powered-by']
          }
        };
        
        // Record successful request
        apiMonitor.recordRequestStart(`test_${Date.now()}`, 'GET', endpoint);
        apiMonitor.recordRequestEnd(`test_${Date.now()}`, 'GET', endpoint, response.status, duration);
        
      } catch (error) {
        const duration = error.config?.metadata 
          ? Date.now() - error.config.metadata.startTime 
          : null;
          
        results[endpoint] = {
          success: false,
          error: error.message,
          error_type: error.errorType || 'UNKNOWN_ERROR',
          status: error.response?.status,
          duration: duration ? `${duration}ms` : 'unknown'
        };
        
        // Record failed request
        apiMonitor.recordRequestStart(`test_${Date.now()}`, 'GET', endpoint);
        apiMonitor.recordRequestError(`test_${Date.now()}`, 'GET', endpoint, error, duration);
      }
    }
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    res.json({
      success: successCount > 0,
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
        success_rate: `${Math.round((successCount / totalCount) * 100)}%`
      },
      results
    });
    
  } catch (error) {
    logger.error('Connectivity test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Reset monitoring metrics
router.post('/reset-metrics', (req, res) => {
  try {
    apiMonitor.reset();
    
    res.json({
      success: true,
      message: 'API monitoring metrics have been reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to reset metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get API configuration
router.get('/config', (req, res) => {
  try {
    const apiConfig = require('../config/api');
    const config = apiConfig.getConfig();
    
    // Sanitize sensitive information
    const sanitizedConfig = {
      environment: config.environment,
      npmApiUrl: config.npmApiUrl,
      timeouts: config.timeouts,
      retry: config.retry,
      cors: {
        origin: config.cors.origin === true ? 'all' : config.cors.origin,
        credentials: config.cors.credentials,
        methods: config.cors.methods
      },
      rateLimit: config.rateLimit.enabled ? {
        enabled: true,
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max
      } : { enabled: false },
      healthCheck: config.healthCheck,
      logging: config.logging,
      docker: config.docker
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      configuration: sanitizedConfig,
      docker_environment: dockerMiddleware.getEnvironmentSummary()
    });
  } catch (error) {
    logger.error('Failed to get API configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get endpoint statistics
router.get('/endpoints', (req, res) => {
  try {
    const metrics = apiMonitor.getMetrics();
    
    const endpointStats = Array.from(metrics.requests.by_endpoint.entries())
      .map(([endpoint, count]) => ({
        endpoint,
        total_requests: count,
        error_count: metrics.errors.by_endpoint.get(endpoint) || 0,
        success_rate: count > 0 
          ? Math.round(((count - (metrics.errors.by_endpoint.get(endpoint) || 0)) / count) * 100)
          : 0
      }))
      .sort((a, b) => b.total_requests - a.total_requests);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_endpoints: endpointStats.length,
      endpoints: endpointStats
    });
  } catch (error) {
    logger.error('Failed to get endpoint statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Real-time monitoring status (for dashboard)
router.get('/status', async (req, res) => {
  try {
    const metrics = apiMonitor.getMetrics();
    const healthSummary = apiMonitor.getHealthSummary();
    
    // Quick health check
    let npmStatus = 'unknown';
    try {
      const npmHealth = await httpClient.healthCheck();
      npmStatus = npmHealth.healthy ? 'healthy' : 'unhealthy';
    } catch (error) {
      npmStatus = 'error';
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: {
        overall: healthSummary.status,
        npm_backend: npmStatus,
        uptime: Math.round(metrics.uptime / 1000), // seconds
        total_requests: metrics.requests.total,
        total_errors: metrics.errors.total,
        error_rate: metrics.requests.total > 0 
          ? Math.round((metrics.errors.total / metrics.requests.total) * 100 * 100) / 100
          : 0,
        active_requests: metrics.active_requests || 0,
        avg_response_time: metrics.performance?.average_response_time || 0
      }
    });
  } catch (error) {
    logger.error('Failed to get monitoring status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
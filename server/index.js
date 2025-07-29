const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const apiConfig = require('./config/api');
const httpClient = require('./utils/httpClient');
const dockerMiddleware = require('./middleware/docker');
const apiMonitor = require('./utils/apiMonitor');

// Load environment variables
dotenv.config();

// Get configuration with Docker awareness
const config = apiConfig.getConfig();
const app = express();
const PORT = config.port;
const API_URL = dockerMiddleware.configureNpmApiUrl(config.npmApiUrl);

// Log startup information
logger.server('='.repeat(50));
logger.server('NPMDeck Server Starting...');
logger.server('='.repeat(50));
logger.server(`Environment: ${config.environment}`);
logger.server(`Port: ${PORT}`);
logger.server(`NPM API URL: ${API_URL}`);
logger.server(`Docker Environment: ${dockerMiddleware.isDockerEnvironment ? 'Yes' : 'No'}`);
if (dockerMiddleware.containerInfo) {
  logger.server(`Container: ${dockerMiddleware.containerInfo.containerName}`);
}
logger.server('='.repeat(50));

// Middleware
app.use(helmet(apiConfig.getSecurityConfig()));

// Configure CORS
app.use(cors(apiConfig.getCorsConfig()));

// Rate limiting
const rateLimitConfig = apiConfig.getRateLimitConfig();
if (rateLimitConfig) {
  app.use(rateLimit(rateLimitConfig));
  logger.info('Rate limiting enabled');
}

// Docker context middleware
app.use(dockerMiddleware.middleware());

// Request logging
app.use(morgan(config.logging.format, {
  skip: (req, res) => !config.logging.requests
}));

// Only parse JSON for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/dashboard') || req.path.startsWith('/api/logs')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// Enhanced health check with NPM backend status
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.environment
  };

  // Check NPM backend health if enabled
  if (config.healthCheck.enabled) {
    try {
      const npmHealth = await apiConfig.checkHealth();
      health.npm = npmHealth;
      
      if (!npmHealth.healthy) {
        health.status = 'degraded';
        res.status(503);
      }
    } catch (error) {
      health.npm = {
        healthy: false,
        error: error.message
      };
      health.status = 'unhealthy';
      res.status(503);
    }
  }

  res.json(health);
});

// API connectivity test endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const results = await httpClient.testConnection();
    const dockerInfo = await dockerMiddleware.checkDockerNetworking();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connection: results,
      docker: dockerInfo,
      environment: dockerMiddleware.getEnvironmentSummary()
    });
  } catch (error) {
    logger.error('Connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Docker environment info endpoint
app.get('/api/docker-info', async (req, res) => {
  try {
    const dockerInfo = await dockerMiddleware.checkDockerNetworking();
    const environmentSummary = dockerMiddleware.getEnvironmentSummary();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      docker: dockerInfo,
      environment: environmentSummary,
      configuration: {
        currentNpmUrl: API_URL,
        recommendedNpmUrl: dockerMiddleware.configureNpmApiUrl(config.npmApiUrl),
        corsOrigins: dockerMiddleware.getDockerCorsOrigins()
      }
    });
  } catch (error) {
    logger.error('Docker info failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes (for future dashboard features)
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/monitoring', require('./routes/api-monitoring'));

// Proxy all NPM API requests with enhanced configuration
logger.info('Configuring NPM API proxy:', API_URL);
const proxyConfig = apiConfig.getProxyConfig();

// Add request ID and monitoring middleware before proxy
app.use('/api', (req, res, next) => {
  // Skip monitoring routes to avoid recursion
  if (req.path.startsWith('/api/monitoring') || 
      req.path.startsWith('/api/dashboard') || 
      req.path.startsWith('/api/logs') ||
      req.path.startsWith('/api/test-connection') ||
      req.path.startsWith('/api/docker-info')) {
    return next();
  }
  
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  
  // Record request start for monitoring
  const startTime = Date.now();
  apiMonitor.recordRequestStart(requestId, req.method, req.path);
  
  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    if (res.statusCode >= 400) {
      apiMonitor.recordRequestError(requestId, req.method, req.path, {
        message: `HTTP ${res.statusCode}`,
        response: { status: res.statusCode }
      }, responseTime);
    } else {
      apiMonitor.recordRequestEnd(requestId, req.method, req.path, res.statusCode, responseTime);
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
});

app.use('/api', createProxyMiddleware(proxyConfig));

// Production: Serve React App
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Catch all handler - send React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.server(`NPMDeck Server running on port ${PORT}`);
  logger.server(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.server(`NPM API URL: ${API_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.server('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.server('HTTP server closed');
  });
});

module.exports = app;
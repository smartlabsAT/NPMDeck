module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // NPM Backend configuration
  npmApi: {
    url: process.env.NPM_API_URL || 'http://localhost:81',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000
  },
  
  // Feature flags
  features: {
    logs: process.env.ENABLE_LOGS === 'true',
    metrics: process.env.ENABLE_METRICS === 'true',
    dashboard: process.env.ENABLE_DASHBOARD !== 'false' // enabled by default
  },
  
  // Security
  security: {
    helmet: true,
    cors: {
      origin: process.env.CORS_ORIGIN || '*'
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};
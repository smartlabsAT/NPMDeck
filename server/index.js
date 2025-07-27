const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.NPM_API_URL || 'http://localhost:81';

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));

// Only parse JSON for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/dashboard') || req.path.startsWith('/api/logs')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes (for future dashboard features)
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/logs', require('./routes/logs'));

// Proxy all NPM API requests
console.log('NPM API URL:', API_URL);
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
  timeout: 30000, // 30 seconds timeout
  proxyTimeout: 30000,
  // Important: Don't parse JSON body before proxy
  onProxyReq: (proxyReq, req, res) => {
    // Log the request for debugging
    console.log(`Proxying ${req.method} ${req.path} to ${API_URL}`);
    
    // Forward all headers
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Forward cookies
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
    }
    
    // Fix body for POST/PUT requests
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      proxyReq.end();
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers if needed
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    console.error('Target URL:', API_URL);
    console.error('Request path:', req.path);
    res.status(502).json({ error: 'Bad Gateway', message: 'Unable to reach NPM backend' });
  },
  // Self handle response to fix body issues
  selfHandleResponse: false
}));

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
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`NPMDeck Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`NPM API URL: ${API_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
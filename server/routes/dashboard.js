const express = require('express');
const router = express.Router();
const axios = require('axios');

// Dashboard stats endpoint
router.get('/stats', async (req, res) => {
  try {
    // This is a placeholder for future dashboard-specific stats
    // For now, we'll just return basic info
    const stats = {
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date(),
      features: {
        logs: process.env.ENABLE_LOGS === 'true',
        metrics: process.env.ENABLE_METRICS === 'true'
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// System info endpoint
router.get('/system', async (req, res) => {
  try {
    const systemInfo = {
      nodejs: process.version,
      platform: process.platform,
      memory: {
        total: process.memoryUsage().heapTotal,
        used: process.memoryUsage().heapUsed
      }
    };

    res.json(systemInfo);
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({ error: 'Failed to fetch system info' });
  }
});

module.exports = router;
// netlify/functions/health-check.js
// Simple health check
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-netlify',
      storage: 'temporary-files',
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    // Check if data directory exists and get file info
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const tempDir = '/tmp/whs-data';
      
      const files = await fs.readdir(tempDir).catch(() => []);
      health.dataFiles = files;
      health.dataStatus = files.length > 0 ? 'data-present' : 'no-data';
    } catch (e) {
      health.dataStatus = 'no-data-directory';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(health, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

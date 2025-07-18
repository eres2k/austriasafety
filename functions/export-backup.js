// netlify/functions/export-backup.js
// Export all data as downloadable backup
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const tempDir = '/tmp/whs-data';
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      source: 'WHS Safety Audit System - Netlify Edition',
      data: {
        audits: [],
        users: [],
        metadata: null
      }
    };
    
    // Read all available data
    try {
      const auditsData = await fs.readFile(path.join(tempDir, 'audits.json'), 'utf8');
      backupData.data.audits = JSON.parse(auditsData);
    } catch (e) {
      console.log('No audits file found');
    }
    
    try {
      const usersData = await fs.readFile(path.join(tempDir, 'users.json'), 'utf8');
      backupData.data.users = JSON.parse(usersData);
    } catch (e) {
      console.log('No users file found');
    }
    
    try {
      const metadataData = await fs.readFile(path.join(tempDir, 'metadata.json'), 'utf8');
      backupData.data.metadata = JSON.parse(metadataData);
    } catch (e) {
      console.log('No metadata file found');
    }

    // Add statistics
    backupData.statistics = {
      totalAudits: backupData.data.audits.length,
      totalUsers: backupData.data.users.length,
      dataSize: JSON.stringify(backupData.data).length
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="WHS_Backup_${new Date().toISOString().split('T')[0]}.json"`
      },
      body: JSON.stringify(backupData, null, 2)
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create backup', 
        details: error.message 
      })
    };
  }
};

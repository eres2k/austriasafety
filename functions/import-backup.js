// netlify/functions/import-backup.js
// Import backup data
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const backupData = JSON.parse(event.body);
    
    // Validate backup format
    if (!backupData.data || !backupData.data.audits || !backupData.data.users) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid backup format' })
      };
    }

    const tempDir = '/tmp/whs-data';
    await fs.mkdir(tempDir, { recursive: true });
    
    // Import audits
    await fs.writeFile(
      path.join(tempDir, 'audits.json'), 
      JSON.stringify(backupData.data.audits, null, 2)
    );
    
    // Import users
    await fs.writeFile(
      path.join(tempDir, 'users.json'), 
      JSON.stringify(backupData.data.users, null, 2)
    );
    
    // Update metadata
    const metadata = {
      lastSync: new Date().toISOString(),
      auditCount: backupData.data.audits.length,
      userCount: backupData.data.users.length,
      importedFrom: backupData.exportDate || 'unknown',
      importDate: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(tempDir, 'metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Backup imported successfully',
        statistics: {
          auditsImported: backupData.data.audits.length,
          usersImported: backupData.data.users.length,
          importDate: metadata.importDate
        }
      })
    };
  } catch (error) {
    console.error('Error importing backup:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to import backup', 
        details: error.message 
      })
    };
  }
};

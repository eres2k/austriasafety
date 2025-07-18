// netlify/functions/submit-form.js
// Alternative: Use Netlify Forms for simple data submission
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
    const formData = JSON.parse(event.body);
    
    // Log the submission (in production, this could trigger notifications)
    console.log('Form submission received:', {
      timestamp: new Date().toISOString(),
      type: formData.type,
      user: formData.user,
      dataSize: JSON.stringify(formData).length
    });

    // For demo purposes, we'll just acknowledge receipt
    // In a real implementation, this could trigger email notifications,
    // webhook calls, or other integrations

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Form submitted successfully',
        id: Date.now(),
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error processing form:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to process form', 
        details: error.message 
      })
    };
  }
};

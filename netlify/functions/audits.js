// netlify/functions/audits.js
// This is an example Netlify Function for handling audit data
// In production, you would connect this to a database like Supabase, FaunaDB, or PostgreSQL

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to set these environment variables in Netlify)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get user from token
const getUserFromToken = (token) => {
  // In production, verify the Netlify Identity token
  // For now, we'll parse the basic info
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Check authentication
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const user = getUserFromToken(token);
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  const path = event.path.replace('/.netlify/functions/audits', '');
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /audits - List all audits for user
    if (event.httpMethod === 'GET' && segments.length === 0) {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', user.sub)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    // GET /audits/:id - Get specific audit
    if (event.httpMethod === 'GET' && segments.length === 1) {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', segments[0])
        .eq('user_id', user.sub)
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    // POST /audits - Create new audit
    if (event.httpMethod === 'POST' && segments.length === 0) {
      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('audits')
        .insert({
          ...body,
          user_id: user.sub,
          auditor: user.email,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    // PUT /audits/:id - Update audit
    if (event.httpMethod === 'PUT' && segments.length === 1) {
      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('audits')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', segments[0])
        .eq('user_id', user.sub)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    // DELETE /audits/:id - Delete audit
    if (event.httpMethod === 'DELETE' && segments.length === 1) {
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', segments[0])
        .eq('user_id', user.sub);

      if (error) throw error;

      return {
        statusCode: 204,
        headers,
        body: '',
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
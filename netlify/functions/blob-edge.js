// netlify/functions/blob-edge.js
// Alternative blob handler using Netlify's native context.blobs

export default async (request, context) => {
  // Parse the URL to get query parameters
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  const isList = url.searchParams.get('list') === 'true';
  
  console.log('Edge blob function:', {
    path,
    isList,
    method: request.method,
    hasIdentity: !!context.clientContext?.user
  });
  
  // Check authentication
  const user = context.clientContext?.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Get blob store from context
  const store = context.blobs;
  
  try {
    switch (request.method) {
      case 'GET':
        if (isList) {
          // List blobs
          const list = await store.list({ prefix: path });
          return new Response(
            JSON.stringify({ 
              blobs: list.map(key => ({ path: key })) 
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } else {
          // Get specific blob
          const data = await store.get(path);
          
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Not found' }),
              { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          return new Response(
            JSON.stringify(data),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        
      case 'PUT':
        // Store blob
        const body = await request.json();
        await store.set(path, body);
        
        return new Response(
          JSON.stringify({ success: true, path }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
      case 'DELETE':
        // Delete blob
        await store.delete(path);
        
        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Blob edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config = {
  path: "/.netlify/functions/blob-edge"
};

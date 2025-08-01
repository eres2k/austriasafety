// netlify/functions/blob.js
// Fixed implementation for Netlify Blobs with proper error handling

const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    console.log('Blob function called:', {
        method: event.httpMethod,
        path: event.queryStringParameters?.path,
        hasAuth: !!context.clientContext?.user
    });
    
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
    };
    
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    // Check authentication
    const user = context.clientContext?.user;
    if (!user) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ 
                error: 'Unauthorized',
                message: 'Please log in to access this resource'
            })
        };
    }
    
    // Get parameters
    const path = event.queryStringParameters?.path || '';
    const isList = event.queryStringParameters?.list === 'true';
    
    try {
        // Initialize store
        const store = getStore('audit-data');
        
        switch (event.httpMethod) {
            case 'GET':
                if (isList) {
                    // List blobs with prefix
                    console.log('Listing blobs with prefix:', path);
                    
                    try {
                        const { blobs } = await store.list({ prefix: path });
                        
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify({ 
                                blobs: blobs.map(blob => ({
                                    path: blob.key,
                                    etag: blob.etag,
                                    size: blob.size
                                }))
                            })
                        };
                    } catch (listError) {
                        console.error('List error:', listError);
                        
                        // Return empty list on error
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify({ blobs: [] })
                        };
                    }
                } else {
                    // Get specific blob
                    console.log('Getting blob:', path);
                    
                    try {
                        const data = await store.get(path);
                        
                        if (data === null) {
                            return {
                                statusCode: 404,
                                headers,
                                body: JSON.stringify({ 
                                    error: 'Not found',
                                    message: `No data found at path: ${path}`
                                })
                            };
                        }
                        
                        // Parse JSON if it's a string
                        let parsedData = data;
                        if (typeof data === 'string') {
                            try {
                                parsedData = JSON.parse(data);
                            } catch (e) {
                                // If not JSON, return as is
                            }
                        }
                        
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify(parsedData)
                        };
                    } catch (getError) {
                        console.error('Get error:', getError);
                        
                        return {
                            statusCode: 404,
                            headers,
                            body: JSON.stringify({ 
                                error: 'Not found',
                                message: 'Data not found'
                            })
                        };
                    }
                }
                
            case 'PUT':
                console.log('Saving blob:', path);
                
                try {
                    const body = JSON.parse(event.body);
                    
                    // Store as JSON string
                    await store.set(path, JSON.stringify(body));
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ 
                            success: true,
                            path: path,
                            message: 'Data saved successfully'
                        })
                    };
                } catch (putError) {
                    console.error('Put error:', putError);
                    
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({ 
                            error: 'Save failed',
                            message: putError.message
                        })
                    };
                }
                
            case 'DELETE':
                console.log('Deleting blob:', path);
                
                try {
                    await store.delete(path);
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ 
                            success: true,
                            message: 'Data deleted successfully'
                        })
                    };
                } catch (deleteError) {
                    console.error('Delete error:', deleteError);
                    
                    // Return success even if blob doesn't exist
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ 
                            success: true,
                            message: 'Delete operation completed'
                        })
                    };
                }
                
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Method not allowed',
                        message: `HTTP method ${event.httpMethod} is not supported`
                    })
                };
        }
    } catch (error) {
        console.error('Blob function error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

// Helper function to ensure consistent path formatting
function normalizePath(path) {
    // Remove leading/trailing slashes
    path = path.replace(/^\/+|\/+$/g, '');
    
    // Ensure path doesn't start with a dot
    if (path.startsWith('.')) {
        path = path.substring(1);
    }
    
    return path;
}

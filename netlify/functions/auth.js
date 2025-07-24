// Auth Function
export default async (req) => {
    const { method } = req;
    
    if (method === 'POST') {
        // Mock authentication
        return new Response(JSON.stringify({
            token: 'mock-jwt-token',
            user: {
                id: '1',
                name: 'Test User',
                email: 'test@amazon.com'
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    return new Response('Method not allowed', { status: 405 });
};
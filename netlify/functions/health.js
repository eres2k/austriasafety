// Health Check Function
export default async (req) => {
    return new Response(JSON.stringify({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
};
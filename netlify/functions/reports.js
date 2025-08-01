// netlify/functions/reports.js
// Generate and manage inspection reports

const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }
    
    const { action, inspectionId, format } = event.queryStringParameters || {};
    
    try {
        const store = getStore('audit-data');
        
        switch (action) {
            case 'generate':
                // Generate report from inspection data
                if (!inspectionId) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Inspection ID required' })
                    };
                }
                
                const inspectionData = await store.get(`inspections/${inspectionId}.json`);
                if (!inspectionData) {
                    return {
                        statusCode: 404,
                        headers,
                        body: JSON.stringify({ error: 'Inspection not found' })
                    };
                }
                
                const inspection = JSON.parse(inspectionData);
                const report = generateReport(inspection, format || 'json');
                
                return {
                    statusCode: 200,
                    headers: {
                        ...headers,
                        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json'
                    },
                    body: format === 'csv' ? report : JSON.stringify(report)
                };
                
            case 'summary':
                // Get summary statistics
                const { blobs } = await store.list({ prefix: 'inspections/' });
                
                let totalInspections = 0;
                let completedInspections = 0;
                let pendingInspections = 0;
                let complianceStats = {
                    total: 0,
                    passed: 0,
                    failed: 0
                };
                
                for (const blob of blobs) {
                    try {
                        const data = await store.get(blob.key);
                        const inspection = JSON.parse(data);
                        
                        totalInspections++;
                        if (inspection.status === 'completed') {
                            completedInspections++;
                            
                            // Calculate compliance
                            Object.values(inspection.responses || {}).forEach(response => {
                                if (response.type === 'passfail') {
                                    complianceStats.total++;
                                    if (response.value === 'pass') {
                                        complianceStats.passed++;
                                    } else if (response.value === 'fail') {
                                        complianceStats.failed++;
                                    }
                                }
                            });
                        } else {
                            pendingInspections++;
                        }
                    } catch (err) {
                        console.error('Error processing inspection:', err);
                    }
                }
                
                const complianceRate = complianceStats.total > 0 
                    ? Math.round((complianceStats.passed / complianceStats.total) * 100)
                    : 100;
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        summary: {
                            total: totalInspections,
                            completed: completedInspections,
                            pending: pendingInspections,
                            complianceRate: complianceRate,
                            complianceStats: complianceStats
                        }
                    })
                };
                
            case 'export':
                // Export multiple reports
                const { startDate, endDate, location, status } = event.queryStringParameters || {};
                const { blobs: inspectionBlobs } = await store.list({ prefix: 'inspections/' });
                
                const reports = [];
                
                for (const blob of inspectionBlobs) {
                    try {
                        const data = await store.get(blob.key);
                        const inspection = JSON.parse(data);
                        
                        // Apply filters
                        if (startDate && new Date(inspection.date) < new Date(startDate)) continue;
                        if (endDate && new Date(inspection.date) > new Date(endDate)) continue;
                        if (location && inspection.location !== location) continue;
                        if (status && inspection.status !== status) continue;
                        
                        reports.push(generateReport(inspection, 'summary'));
                    } catch (err) {
                        console.error('Error processing inspection for export:', err);
                    }
                }
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ reports })
                };
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }
    } catch (error) {
        console.error('Reports function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};

function generateReport(inspection, format) {
    if (format === 'csv') {
        return generateCSVReport(inspection);
    }
    
    // Generate comprehensive report
    const report = {
        id: inspection.id,
        metadata: {
            location: inspection.location,
            type: inspection.templateName,
            auditor: inspection.auditorName,
            date: inspection.date,
            status: inspection.status,
            duration: inspection.completedTime 
                ? calculateDuration(inspection.startTime, inspection.completedTime)
                : null
        },
        summary: {
            totalQuestions: 0,
            answeredQuestions: 0,
            passedQuestions: 0,
            failedQuestions: 0,
            naQuestions: 0,
            complianceRate: 0
        },
        findings: [],
        recommendations: []
    };
    
    // Process responses
    Object.entries(inspection.responses || {}).forEach(([questionId, response]) => {
        report.summary.totalQuestions++;
        report.summary.answeredQuestions++;
        
        if (response.value === 'pass') {
            report.summary.passedQuestions++;
        } else if (response.value === 'fail') {
            report.summary.failedQuestions++;
            
            // Add to findings
            report.findings.push({
                questionId: questionId,
                status: 'fail',
                comment: inspection.comments?.[questionId] || 'No comment provided',
                timestamp: response.timestamp
            });
        } else if (response.value === 'na') {
            report.summary.naQuestions++;
        }
    });
    
    // Calculate compliance rate
    const applicableQuestions = report.summary.passedQuestions + report.summary.failedQuestions;
    report.summary.complianceRate = applicableQuestions > 0
        ? Math.round((report.summary.passedQuestions / applicableQuestions) * 100)
        : 100;
    
    // Generate recommendations based on findings
    if (report.findings.length > 0) {
        report.recommendations.push({
            priority: 'high',
            message: 'Address failed inspection items immediately',
            count: report.findings.length
        });
    }
    
    if (report.summary.complianceRate < 90) {
        report.recommendations.push({
            priority: 'medium',
            message: 'Schedule follow-up inspection within 7 days',
            complianceRate: report.summary.complianceRate
        });
    }
    
    return format === 'summary' ? {
        id: report.id,
        location: report.metadata.location,
        date: report.metadata.date,
        auditor: report.metadata.auditor,
        complianceRate: report.summary.complianceRate,
        findings: report.findings.length
    } : report;
}

function generateCSVReport(inspection) {
    const rows = [
        ['Inspection Report'],
        ['Location', inspection.location],
        ['Type', inspection.templateName],
        ['Auditor', inspection.auditorName],
        ['Date', new Date(inspection.date).toLocaleDateString()],
        ['Status', inspection.status],
        [''],
        ['Question ID', 'Response', 'Comment', 'Timestamp']
    ];
    
    Object.entries(inspection.responses || {}).forEach(([questionId, response]) => {
        rows.push([
            questionId,
            response.value,
            inspection.comments?.[questionId] || '',
            new Date(response.timestamp).toLocaleString()
        ]);
    });
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function calculateDuration(start, end) {
    const duration = new Date(end) - new Date(start);
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

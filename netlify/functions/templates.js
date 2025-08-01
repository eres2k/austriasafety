// netlify/functions/templates.js
// Manage inspection templates

const { getStore } = require('@netlify/blobs');

const DEFAULT_TEMPLATES = [
    {
        id: 'general-safety',
        name: 'General Safety Inspection',
        type: 'general',
        version: '1.0',
        categories: [
            {
                id: 'workplace-conditions',
                name: 'Workplace Conditions',
                icon: 'fas fa-building',
                questions: [
                    {
                        id: 'wc1',
                        text: 'Are all walkways and passages clear of obstructions?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'wc2',
                        text: 'Is the lighting adequate in all work areas?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'wc3',
                        text: 'Are emergency exits clearly marked and unobstructed?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'wc4',
                        text: 'Is the temperature comfortable for working conditions?',
                        type: 'passfail',
                        required: false
                    },
                    {
                        id: 'wc5',
                        text: 'Are floor surfaces in good condition (no cracks, holes, or slippery areas)?',
                        type: 'passfail',
                        required: true
                    }
                ]
            },
            {
                id: 'equipment-safety',
                name: 'Equipment Safety',
                icon: 'fas fa-tools',
                questions: [
                    {
                        id: 'es1',
                        text: 'Are all safety guards in place on machinery?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'es2',
                        text: 'Are equipment inspection tags current?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'es3',
                        text: 'Are lockout/tagout procedures being followed?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'es4',
                        text: 'Are tools and equipment properly stored when not in use?',
                        type: 'passfail',
                        required: true
                    }
                ]
            },
            {
                id: 'ppe-compliance',
                name: 'PPE Compliance',
                icon: 'fas fa-hard-hat',
                questions: [
                    {
                        id: 'ppe1',
                        text: 'Are all employees wearing required PPE?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'ppe2',
                        text: 'Is PPE in good condition and properly maintained?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'ppe3',
                        text: 'Is appropriate eye protection being used where required?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'ppe4',
                        text: 'Are safety shoes being worn in designated areas?',
                        type: 'passfail',
                        required: true
                    }
                ]
            },
            {
                id: 'emergency-preparedness',
                name: 'Emergency Preparedness',
                icon: 'fas fa-first-aid',
                questions: [
                    {
                        id: 'ep1',
                        text: 'Are first aid kits accessible and properly stocked?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'ep2',
                        text: 'Are emergency contact numbers posted and visible?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'ep3',
                        text: 'Do employees know the evacuation procedures?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'ep4',
                        text: 'Are spill kits available and accessible?',
                        type: 'passfail',
                        required: true
                    }
                ]
            }
        ]
    },
    {
        id: 'fire-safety',
        name: 'Fire Safety Audit',
        type: 'fire',
        version: '1.0',
        categories: [
            {
                id: 'fire-equipment',
                name: 'Fire Equipment',
                icon: 'fas fa-fire-extinguisher',
                questions: [
                    {
                        id: 'fe1',
                        text: 'Are fire extinguishers properly mounted and accessible?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'fe2',
                        text: 'Are fire extinguisher inspection tags current?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'fe3',
                        text: 'Are fire alarm pull stations unobstructed?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'fe4',
                        text: 'Are sprinkler systems free of obstructions?',
                        type: 'passfail',
                        required: true
                    }
                ]
            },
            {
                id: 'fire-prevention',
                name: 'Fire Prevention',
                icon: 'fas fa-fire',
                questions: [
                    {
                        id: 'fp1',
                        text: 'Are flammable materials properly stored?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'fp2',
                        text: 'Are electrical panels clear of combustible materials?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'fp3',
                        text: 'Are hot work permits being used when required?',
                        type: 'passfail',
                        required: true
                    }
                ]
            }
        ]
    },
    {
        id: 'equipment-check',
        name: 'Equipment Check',
        type: 'equipment',
        version: '1.0',
        categories: [
            {
                id: 'conveyor-systems',
                name: 'Conveyor Systems',
                icon: 'fas fa-conveyor-belt',
                questions: [
                    {
                        id: 'cs1',
                        text: 'Are emergency stop buttons functional and accessible?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'cs2',
                        text: 'Are conveyor guards properly installed?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'cs3',
                        text: 'Are warning signs and labels visible?',
                        type: 'passfail',
                        required: true
                    }
                ]
            },
            {
                id: 'powered-equipment',
                name: 'Powered Equipment',
                icon: 'fas fa-forklift',
                questions: [
                    {
                        id: 'pe1',
                        text: 'Are pre-operation inspections being completed?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'pe2',
                        text: 'Are operators properly certified?',
                        type: 'passfail',
                        required: true
                    },
                    {
                        id: 'pe3',
                        text: 'Are battery charging areas properly ventilated?',
                        type: 'passfail',
                        required: true
                    }
                ]
            }
        ]
    }
];

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
    
    try {
        const store = getStore('audit-data');
        
        switch (event.httpMethod) {
            case 'GET':
                const { id } = event.queryStringParameters || {};
                
                if (id) {
                    // Get specific template
                    const template = await store.get(`templates/${id}.json`);
                    
                    if (!template) {
                        // Check if it's a default template
                        const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
                        if (defaultTemplate) {
                            return {
                                statusCode: 200,
                                headers,
                                body: JSON.stringify(defaultTemplate)
                            };
                        }
                        
                        return {
                            statusCode: 404,
                            headers,
                            body: JSON.stringify({ error: 'Template not found' })
                        };
                    }
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: template
                    };
                } else {
                    // List all templates
                    const { blobs } = await store.list({ prefix: 'templates/' });
                    const templates = [];
                    
                    // Add default templates
                    templates.push(...DEFAULT_TEMPLATES);
                    
                    // Add custom templates
                    for (const blob of blobs) {
                        try {
                            const data = await store.get(blob.key);
                            const template = JSON.parse(data);
                            
                            // Don't duplicate default templates
                            if (!DEFAULT_TEMPLATES.find(t => t.id === template.id)) {
                                templates.push(template);
                            }
                        } catch (err) {
                            console.error('Error loading template:', err);
                        }
                    }
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify(templates)
                    };
                }
                
            case 'POST':
            case 'PUT':
                // Create or update template
                const template = JSON.parse(event.body);
                
                // Validate template structure
                if (!template.id || !template.name || !template.categories) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Invalid template structure' })
                    };
                }
                
                // Add metadata
                template.lastModified = new Date().toISOString();
                template.modifiedBy = user.email;
                
                // Save template
                await store.set(`templates/${template.id}.json`, JSON.stringify(template));
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        message: 'Template saved successfully',
                        id: template.id 
                    })
                };
                
            case 'DELETE':
                const { templateId } = event.queryStringParameters || {};
                
                if (!templateId) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Template ID required' })
                    };
                }
                
                // Don't allow deletion of default templates
                if (DEFAULT_TEMPLATES.find(t => t.id === templateId)) {
                    return {
                        statusCode: 403,
                        headers,
                        body: JSON.stringify({ error: 'Cannot delete default templates' })
                    };
                }
                
                await store.delete(`templates/${templateId}.json`);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        message: 'Template deleted successfully' 
                    })
                };
                
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Templates function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error', 
                details: error.message 
            })
        };
    }
};

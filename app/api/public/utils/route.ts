import { NextRequest, NextResponse } from "next/server";

// GET /api/public/utils - Public utility endpoint (no authentication required)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');
        const input = searchParams.get('input');

        switch (operation) {
            case 'timestamp':
                return NextResponse.json({
                    operation: 'timestamp',
                    result: {
                        iso: new Date().toISOString(),
                        unix: Math.floor(Date.now() / 1000),
                        local: new Date().toLocaleString('vi-VN'),
                        utc: new Date().toUTCString()
                    }
                });

            case 'uuid':
                // Simple UUID v4 generator
                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0;
                    const v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                return NextResponse.json({
                    operation: 'uuid',
                    result: uuid
                });

            case 'hash':
                if (!input) {
                    return NextResponse.json({
                        error: "Input parameter required for hash operation"
                    }, { status: 400 });
                }
                // Simple hash function (not cryptographically secure)
                let hash = 0;
                for (let i = 0; i < input.length; i++) {
                    const char = input.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return NextResponse.json({
                    operation: 'hash',
                    input: input,
                    result: hash.toString(16)
                });

            case 'encode':
                if (!input) {
                    return NextResponse.json({
                        error: "Input parameter required for encode operation"
                    }, { status: 400 });
                }
                return NextResponse.json({
                    operation: 'encode',
                    input: input,
                    result: {
                        base64: Buffer.from(input, 'utf8').toString('base64'),
                        uri: encodeURIComponent(input),
                        html: input.replace(/[&<>"']/g, (match) => {
                            const entityMap: { [key: string]: string } = {
                                '&': '&amp;',
                                '<': '&lt;',
                                '>': '&gt;',
                                '"': '&quot;',
                                "'": '&#39;'
                            };
                            return entityMap[match];
                        })
                    }
                });

            case 'random':
                const min = parseInt(searchParams.get('min') || '1');
                const max = parseInt(searchParams.get('max') || '100');
                const count = parseInt(searchParams.get('count') || '1');

                const numbers = Array.from({ length: count }, () =>
                    Math.floor(Math.random() * (max - min + 1)) + min
                );

                return NextResponse.json({
                    operation: 'random',
                    parameters: { min, max, count },
                    result: count === 1 ? numbers[0] : numbers
                });

            default:
                return NextResponse.json({
                    error: "Invalid operation",
                    availableOperations: [
                        'timestamp - Get current timestamp in various formats',
                        'uuid - Generate a UUID v4',
                        'hash?input=text - Generate simple hash of input text',
                        'encode?input=text - Encode text in various formats',
                        'random?min=1&max=100&count=1 - Generate random numbers'
                    ]
                }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error in GET /api/public/utils:", error);

        return NextResponse.json({
            error: "Utility operation failed",
            message: error.message
        }, { status: 500 });
    }
}

// POST /api/public/utils - Public utility endpoint for POST operations
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { operation, data } = body;

        switch (operation) {
            case 'validate_email':
                const email = data?.email;
                if (!email) {
                    return NextResponse.json({
                        error: "Email field required"
                    }, { status: 400 });
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValid = emailRegex.test(email);

                return NextResponse.json({
                    operation: 'validate_email',
                    email: email,
                    isValid: isValid,
                    message: isValid ? 'Valid email format' : 'Invalid email format'
                });

            case 'json_format':
                const jsonString = data?.json;
                if (!jsonString) {
                    return NextResponse.json({
                        error: "JSON string required"
                    }, { status: 400 });
                }

                try {
                    const parsed = JSON.parse(jsonString);
                    const formatted = JSON.stringify(parsed, null, 2);

                    return NextResponse.json({
                        operation: 'json_format',
                        result: {
                            isValid: true,
                            formatted: formatted,
                            minified: JSON.stringify(parsed)
                        }
                    });
                } catch (parseError) {
                    return NextResponse.json({
                        operation: 'json_format',
                        result: {
                            isValid: false,
                            error: 'Invalid JSON format'
                        }
                    });
                }

            default:
                return NextResponse.json({
                    error: "Invalid operation",
                    availableOperations: [
                        'validate_email - Validate email format',
                        'json_format - Format and validate JSON'
                    ]
                }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error in POST /api/public/utils:", error);

        return NextResponse.json({
            error: "Utility operation failed",
            message: error.message
        }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";

// POST /api/public/transform - Public data transformation endpoint (no authentication required)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { operation, data } = body;

        if (!operation || !data) {
            return NextResponse.json({
                error: "Missing required fields: operation and data"
            }, { status: 400 });
        }

        switch (operation) {
            case 'to_uppercase':
                if (typeof data !== 'string') {
                    return NextResponse.json({
                        error: "Data must be a string for uppercase operation"
                    }, { status: 400 });
                }
                return NextResponse.json({
                    operation: 'to_uppercase',
                    input: data,
                    result: data.toUpperCase()
                });

            case 'to_lowercase':
                if (typeof data !== 'string') {
                    return NextResponse.json({
                        error: "Data must be a string for lowercase operation"
                    }, { status: 400 });
                }
                return NextResponse.json({
                    operation: 'to_lowercase',
                    input: data,
                    result: data.toLowerCase()
                });

            case 'reverse_string':
                if (typeof data !== 'string') {
                    return NextResponse.json({
                        error: "Data must be a string for reverse operation"
                    }, { status: 400 });
                }
                return NextResponse.json({
                    operation: 'reverse_string',
                    input: data,
                    result: data.split('').reverse().join('')
                });

            case 'count_words':
                if (typeof data !== 'string') {
                    return NextResponse.json({
                        error: "Data must be a string for word count operation"
                    }, { status: 400 });
                }
                const words = data.trim().split(/\s+/).filter(word => word.length > 0);
                return NextResponse.json({
                    operation: 'count_words',
                    input: data,
                    result: {
                        wordCount: words.length,
                        characterCount: data.length,
                        characterCountNoSpaces: data.replace(/\s/g, '').length,
                        words: words
                    }
                });

            case 'sort_array':
                if (!Array.isArray(data)) {
                    return NextResponse.json({
                        error: "Data must be an array for sort operation"
                    }, { status: 400 });
                }
                const sortedAsc = [...data].sort();
                const sortedDesc = [...data].sort().reverse();
                return NextResponse.json({
                    operation: 'sort_array',
                    input: data,
                    result: {
                        ascending: sortedAsc,
                        descending: sortedDesc,
                        original: data
                    }
                });

            case 'filter_numbers':
                if (!Array.isArray(data)) {
                    return NextResponse.json({
                        error: "Data must be an array for filter operation"
                    }, { status: 400 });
                }
                const numbers = data.filter(item => typeof item === 'number' && !isNaN(item));
                const nonNumbers = data.filter(item => typeof item !== 'number' || isNaN(item));
                return NextResponse.json({
                    operation: 'filter_numbers',
                    input: data,
                    result: {
                        numbers: numbers,
                        nonNumbers: nonNumbers,
                        statistics: {
                            total: data.length,
                            numbersCount: numbers.length,
                            nonNumbersCount: nonNumbers.length,
                            sum: numbers.reduce((acc, num) => acc + num, 0),
                            average: numbers.length > 0 ? numbers.reduce((acc, num) => acc + num, 0) / numbers.length : 0
                        }
                    }
                });

            case 'object_keys':
                if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                    return NextResponse.json({
                        error: "Data must be an object for keys operation"
                    }, { status: 400 });
                }
                return NextResponse.json({
                    operation: 'object_keys',
                    input: data,
                    result: {
                        keys: Object.keys(data),
                        values: Object.values(data),
                        entries: Object.entries(data),
                        keyCount: Object.keys(data).length
                    }
                });

            case 'csv_to_json':
                if (typeof data !== 'string') {
                    return NextResponse.json({
                        error: "Data must be a CSV string"
                    }, { status: 400 });
                }
                try {
                    const lines = data.trim().split('\n');
                    if (lines.length < 2) {
                        return NextResponse.json({
                            error: "CSV must have at least header and one data row"
                        }, { status: 400 });
                    }

                    const headers = lines[0].split(',').map(h => h.trim());
                    const jsonData = lines.slice(1).map(line => {
                        const values = line.split(',').map(v => v.trim());
                        const obj: { [key: string]: string } = {};
                        headers.forEach((header, index) => {
                            obj[header] = values[index] || '';
                        });
                        return obj;
                    });

                    return NextResponse.json({
                        operation: 'csv_to_json',
                        input: data,
                        result: {
                            headers: headers,
                            data: jsonData,
                            rowCount: jsonData.length
                        }
                    });
                } catch (error) {
                    return NextResponse.json({
                        error: "Invalid CSV format"
                    }, { status: 400 });
                }

            default:
                return NextResponse.json({
                    error: "Invalid operation",
                    availableOperations: [
                        'to_uppercase - Convert string to uppercase',
                        'to_lowercase - Convert string to lowercase',
                        'reverse_string - Reverse a string',
                        'count_words - Count words and characters in string',
                        'sort_array - Sort array in ascending/descending order',
                        'filter_numbers - Filter numbers from array with statistics',
                        'object_keys - Extract keys, values, entries from object',
                        'csv_to_json - Convert CSV string to JSON array'
                    ]
                }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error in POST /api/public/transform:", error);

        return NextResponse.json({
            error: "Transformation operation failed",
            message: error.message
        }, { status: 500 });
    }
}

// GET /api/public/transform - Get available operations
export async function GET(request: NextRequest) {
    return NextResponse.json({
        endpoint: "/api/public/transform",
        method: "POST",
        description: "Public data transformation utilities",
        operations: [
            {
                name: "to_uppercase",
                description: "Convert string to uppercase",
                input: "string",
                example: { operation: "to_uppercase", data: "hello world" }
            },
            {
                name: "to_lowercase",
                description: "Convert string to lowercase",
                input: "string",
                example: { operation: "to_lowercase", data: "HELLO WORLD" }
            },
            {
                name: "reverse_string",
                description: "Reverse a string",
                input: "string",
                example: { operation: "reverse_string", data: "hello" }
            },
            {
                name: "count_words",
                description: "Count words and characters in string",
                input: "string",
                example: { operation: "count_words", data: "Hello world from API" }
            },
            {
                name: "sort_array",
                description: "Sort array in ascending/descending order",
                input: "array",
                example: { operation: "sort_array", data: [3, 1, 4, 1, 5, 9, 2, 6] }
            },
            {
                name: "filter_numbers",
                description: "Filter numbers from array with statistics",
                input: "array",
                example: { operation: "filter_numbers", data: [1, "hello", 3.14, true, 42, "world"] }
            },
            {
                name: "object_keys",
                description: "Extract keys, values, entries from object",
                input: "object",
                example: { operation: "object_keys", data: { name: "John", age: 30, city: "NYC" } }
            },
            {
                name: "csv_to_json",
                description: "Convert CSV string to JSON array",
                input: "string (CSV format)",
                example: { operation: "csv_to_json", data: "name,age,city\nJohn,30,NYC\nJane,25,LA" }
            }
        ]
    });
}
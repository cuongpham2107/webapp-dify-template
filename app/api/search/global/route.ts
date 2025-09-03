/**
 * Global Search API Route
 * 
 * Handles global search requests for datasets and documents
 * with proper authentication and permission checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { globalSearchInDB, DatabaseSearchResult } from '@/lib/models/search';

export async function GET(request: NextRequest) {
    try {
        // Get current user session
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Extract search parameters from URL
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const limitParam = searchParams.get('limit');
        const offsetParam = searchParams.get('offset');
        const typesParam = searchParams.get('types');

        // Validate required parameters
        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        // Parse optional parameters
        const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 10; // Max 50 results
        const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;

        // Parse and validate types
        let types: ('dataset' | 'document')[] = ['dataset', 'document'];
        if (typesParam) {
            const requestedTypes = typesParam.split(',').filter(type => ['dataset', 'document'].includes(type));
            if (requestedTypes.length > 0) {
                types = requestedTypes as ('dataset' | 'document')[];
            }
        }

        // Validate limit parameter
        if (isNaN(limit) || limit <= 0) {
            return NextResponse.json(
                { error: 'Invalid limit parameter' },
                { status: 400 }
            );
        }

        // Validate offset parameter
        if (isNaN(offset) || offset < 0) {
            return NextResponse.json(
                { error: 'Invalid offset parameter' },
                { status: 400 }
            );
        }

        // Get user ID for permission filtering
        // Note: We use asgl_id to find the user in database since that's the unique identifier
        // But we need the internal User.id (string) for permission queries
        let userIdForPermissions: string | undefined;

        try {
            // Import prisma and find the user by asgl_id to get the internal id
            const prisma = (await import('@/lib/prisma')).default;
            const user = await prisma.user.findUnique({
                where: { asgl_id: session.user.asgl_id },
                select: { id: true }
            });
            userIdForPermissions = user?.id;
        } catch (error) {
            console.error('Error finding user for permissions:', error);
            // Continue without user-specific filtering if we can't find the user
        }

        // Perform the search with user ID for permission filtering
        const searchResult = await globalSearchInDB({
            query: query.trim(),
            limit,
            offset,
            types,
            userId: userIdForPermissions
        });

        // Transform database results to API response format
        const results = searchResult.results.map((result: DatabaseSearchResult) => ({
            id: result.id,
            name: result.name,
            type: result.type,
            description: result.description,
            datasetId: result.datasetId,
            datasetName: result.datasetName,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString()
        }));

        // Return successful response
        return NextResponse.json({
            results,
            total: searchResult.total,
            query: query.trim(),
            timestamp: new Date().toISOString(),
            pagination: {
                limit,
                offset,
                hasMore: searchResult.total > (offset + results.length)
            }
        });

    } catch (error: any) {
        console.error('Global search API error:', error);

        // Return appropriate error response
        return NextResponse.json(
            {
                error: 'Internal server error during search',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
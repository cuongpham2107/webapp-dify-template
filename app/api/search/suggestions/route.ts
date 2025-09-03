/**
 * Search Suggestions API Route
 * 
 * Provides search suggestions based on existing dataset and document names
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSearchSuggestionsFromDB } from '@/lib/models/search';

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

        // Validate required parameters
        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                suggestions: []
            });
        }

        // Parse optional parameters
        const limit = limitParam ? Math.min(parseInt(limitParam, 10), 10) : 5; // Max 10 suggestions

        // Get user ID for permission filtering
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
        }

        // Get suggestions from database
        const suggestions = await getSearchSuggestionsFromDB(
            query.trim(),
            limit,
            userIdForPermissions
        );

        // Return successful response
        return NextResponse.json({
            suggestions,
            query: query.trim()
        });

    } catch (error: any) {
        console.error('Search suggestions API error:', error);

        // Return empty suggestions on error
        return NextResponse.json({
            suggestions: [],
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
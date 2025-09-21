import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersCredits, getCreditStats, searchUserCredits } from '@/lib/models/credit';
import { getCurrentUserWithPermissions, isSuperAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Check authentication and permissions
        const user = await getCurrentUserWithPermissions();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only superadmin can access credit management
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden: Only superadmin can manage credits' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
        const query = searchParams.get('query');
        const stats = searchParams.get('stats') === 'true';

        let result;

        if (stats) {
            // Get credit statistics
            result = await getCreditStats(month, year);
        } else if (query) {
            // Search credits by user
            result = await searchUserCredits(query, month, year);
        } else {
            // Get all users' credits
            result = await getAllUsersCredits(month, year);
        }

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

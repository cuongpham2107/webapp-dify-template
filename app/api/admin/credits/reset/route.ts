import { NextRequest, NextResponse } from 'next/server';
import { resetMonthlyCredits } from '@/lib/models/credit';
import { getCurrentUserWithPermissions, isSuperAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        // Check authentication and permissions
        const user = await getCurrentUserWithPermissions();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden: Only superadmin can reset credits' }, { status: 403 });
        }

        const body = await request.json();
        const { month, year } = body;

        // Validate data
        if (month && (month < 1 || month > 12)) {
            return NextResponse.json({ error: 'Month must be between 1 and 12' }, { status: 400 });
        }

        if (year && year < 2020) {
            return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
        }

        const result = await resetMonthlyCredits(month, year);

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

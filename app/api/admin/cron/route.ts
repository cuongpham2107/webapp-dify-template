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
            return NextResponse.json({ error: 'Forbidden: Only superadmin can run cron jobs' }, { status: 403 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === 'reset-monthly-credits') {
            const now = new Date();
            const result = await resetMonthlyCredits(now.getMonth() + 1, now.getFullYear());

            return NextResponse.json({
                success: true,
                data: result
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { addBonusCredit } from '@/lib/models/credit';
import { getCurrentUserWithPermissions, isSuperAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        // Check authentication and permissions
        const user = await getCurrentUserWithPermissions();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden: Only superadmin can add bonus credits' }, { status: 403 });
        }

        const { userId } = params;
        const body = await request.json();
        const { amount, reason } = body;

        // Validate data
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
        }

        const result = await addBonusCredit(userId, amount, reason);

        return NextResponse.json({
            success: true,
            message: `Added ${amount} bonus credits to user`,
            data: result
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCreditUsageHistory } from '@/lib/models/credit';
import { getServerSession } from 'next-auth';
import { getInfo } from '../../utils/common';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // TODO: Replace with your auth logic
        const { user, userInfo } = await getInfo(request)

        const userId = userInfo!.id
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const history = await getCreditUsageHistory(userId, limit);

        return NextResponse.json({
            success: true,
            data: history
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

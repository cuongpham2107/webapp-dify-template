import { NextRequest, NextResponse } from 'next/server';
import { getUserCredit } from '@/lib/models/credit';
import { getServerSession } from 'next-auth';
import { getInfo } from '../utils/common';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // TODO: Replace with your auth logic
        const { user, userInfo } = await getInfo(request)

        const userId = userInfo!.id
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creditInfo = await getUserCredit(userId);

        if (!creditInfo) {
            return NextResponse.json({ error: 'Credit information not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: creditInfo
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

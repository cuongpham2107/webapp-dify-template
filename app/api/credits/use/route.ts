import { NextRequest, NextResponse } from 'next/server';
import { hasEnoughCredit, useCredit, getUserCredit } from '@/lib/models/credit';
import { getServerSession } from 'next-auth';
import { getInfo } from '../../utils/common';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        // TODO: Replace with your auth logic
        const { user, userInfo } = await getInfo(request)

        const userId = userInfo!.id
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount = 1, action = 'chat', metadata } = body;

        // Kiểm tra xem có đủ credit không
        const hasCredit = await hasEnoughCredit(userId, amount);
        if (!hasCredit) {
            return NextResponse.json(
                {
                    error: 'Insufficient credits',
                    message: 'Bạn đã hết credit cho tháng này. Credit sẽ được reset vào đầu tháng sau.'
                },
                { status: 400 }
            );
        }

        // Sử dụng credit
        const success = await useCredit(userId, amount, action, metadata);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to use credit' },
                { status: 400 }
            );
        }

        // Lấy thông tin credit sau khi sử dụng
        const updatedCredit = await getUserCredit(userId);

        return NextResponse.json({
            success: true,
            message: `Used ${amount} credit(s) successfully`,
            data: updatedCredit
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

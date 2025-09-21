import { NextRequest, NextResponse } from 'next/server';
import { getCreditById, updateCredit, addBonusCredit, deleteCredit } from '@/lib/models/credit';
import { getCurrentUserWithPermissions, isSuperAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check authentication and permissions
        const user = await getCurrentUserWithPermissions();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden: Only superadmin can manage credits' }, { status: 403 });
        }

        const creditId = params.id;
        const credit = await getCreditById(creditId);

        if (!credit) {
            return NextResponse.json({ error: 'Credit not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: credit
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check authentication and permissions
        const user = await getCurrentUserWithPermissions();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden: Only superadmin can manage credits' }, { status: 403 });
        }

        const creditId = params.id;
        const body = await request.json();
        const { totalCredits, usedCredits, remainingCredits } = body;

        // Validate data
        if (totalCredits !== undefined && totalCredits < 0) {
            return NextResponse.json({ error: 'Total credits cannot be negative' }, { status: 400 });
        }

        if (usedCredits !== undefined && usedCredits < 0) {
            return NextResponse.json({ error: 'Used credits cannot be negative' }, { status: 400 });
        }

        if (remainingCredits !== undefined && remainingCredits < 0) {
            return NextResponse.json({ error: 'Remaining credits cannot be negative' }, { status: 400 });
        }

        const updatedCredit = await updateCredit(creditId, {
            totalCredits,
            usedCredits,
            remainingCredits
        });

        return NextResponse.json({
            success: true,
            data: updatedCredit
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check authentication and permissions
        const user = await getCurrentUserWithPermissions();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden: Only superadmin can manage credits' }, { status: 403 });
        }

        const creditId = params.id;
        await deleteCredit(creditId);

        return NextResponse.json({
            success: true,
            message: 'Credit deleted successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

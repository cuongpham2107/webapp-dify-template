import { NextRequest, NextResponse } from "next/server";
import { getAdminInfo } from '@/lib/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/check-user-admin - Check if user has admin access
export async function GET(request: NextRequest) {
    try {

        const adminInfo = await getAdminInfo(request)

        return NextResponse.json({
            isAdmin: adminInfo.isAdmin,
            user: adminInfo.user ? {
                asgl_id: adminInfo.user.asgl_id,
                email: adminInfo.user.email,
                isLocalUser: adminInfo.user.isLocalUser
            } : null,
            error: adminInfo.error
        });

    } catch (error: any) {
        console.error('❌ [check-user-admin] Error checking admin access:', error);

        return NextResponse.json({
            isAdmin: false,
            error: "Failed to check admin access",
            details: error.message
        }, { status: 500 });
    }
}
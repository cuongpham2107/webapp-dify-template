import { NextRequest, NextResponse } from "next/server";
import { getAdminInfo } from '@/lib/admin'

// GET /api/admin/check-user-admin - Check if user has admin access
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 [check-user-admin] Checking admin access...')

        const adminInfo = await getAdminInfo(request)

        console.log('🔍 [check-user-admin] Admin check result:', {
            isAdmin: adminInfo.isAdmin,
            userAsglId: adminInfo.user?.asgl_id,
            error: adminInfo.error
        })

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
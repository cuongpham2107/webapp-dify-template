import { NextRequest, NextResponse } from "next/server";
import { getAllDatasetsFlat } from "@/lib/models/dataset";
import { getCurrentUserWithPermissions, hasPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
    try {
        // Get user with permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has permission to view datasets
        if (!userWithPermissions.isAdmin && !userWithPermissions.isSuperAdmin && !hasPermission(userWithPermissions, 'datasets.view')) {
            return NextResponse.json({ error: "Insufficient permissions to view datasets" }, { status: 403 });
        }

        // Fetch all datasets as flat list
        const datasets = await getAllDatasetsFlat();

        return NextResponse.json({ datasets });
    } catch (err: any) {
        console.error('❌ [Dataset All API GET] Error:', err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

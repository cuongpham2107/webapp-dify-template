import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAllDatasets } from "@/lib/models/dataset";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/datasets - Get all datasets (admin only)
export async function GET(request: NextRequest) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const datasets = await getAllDatasets();

        return NextResponse.json({
            datasets,
            total: datasets.length
        });

    } catch (error: any) {
        console.error("Error in GET /api/admin/datasets:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to fetch datasets",
            details: error.message
        }, { status: 500 });
    }
}
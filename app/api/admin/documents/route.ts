import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAllDocuments } from "@/lib/models/document";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/documents - Get all documents (admin only)
export async function GET(request: NextRequest) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { searchParams } = new URL(request.url);
        const datasetId = searchParams.get('datasetId');

        let documents;
        if (datasetId) {
            // Filter documents by dataset ID
            const allDocuments = await getAllDocuments();
            documents = allDocuments.filter((doc: any) => doc.datasetId === datasetId);
        } else {
            // Get all documents
            documents = await getAllDocuments();
        }

        return NextResponse.json({
            documents,
            total: documents.length
        });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to fetch documents",
            details: error.message
        }, { status: 500 });
    }
}
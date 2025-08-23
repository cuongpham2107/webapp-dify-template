import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDocument, getDocumentsByUserId } from "@/lib/models/document";
import { getUserIdByAsglId } from '@/lib/models/user';
import { getInfo } from "../utils/common";
import { getCurrentUserWithPermissions, hasPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const datasetId = searchParams.get("datasetId");

        if (!datasetId) {
            return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 });
        }

        // Get user with permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has permission to view documents
        if (!userWithPermissions.isAdmin && !userWithPermissions.isSuperAdmin && !hasPermission(userWithPermissions, 'documents.view')) {
            return NextResponse.json({ error: "Insufficient permissions to view documents" }, { status: 403 });
        }

        const userId = await getUserIdByAsglId(userWithPermissions.asgl_id);
        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const documents = await getDocumentsByUserId(userId, datasetId);

        return NextResponse.json({ documents });
    } catch (err: any) {
        console.error('❌ [Document API GET] Error:', err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

const documentSchema = z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    size: z.number().positive(),
    datasetId: z.string().min(1)
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const name = formData.get('name') as string;
        const type = formData.get('type') as string;
        const size = parseInt(formData.get('size') as string);
        const datasetId = formData.get('datasetId') as string;
        const file = formData.get('file') as File | null;

        // Validate file is provided
        if (!file) {
            return NextResponse.json({ error: "File is required for document creation" }, { status: 400 });
        }

        const result = documentSchema.safeParse({ name, type, size, datasetId });
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }

        // Get user with permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has permission to create documents
        if (!userWithPermissions.isAdmin && !userWithPermissions.isSuperAdmin && !hasPermission(userWithPermissions, 'documents.create')) {
            return NextResponse.json({ error: "Insufficient permissions to create documents" }, { status: 403 });
        }

        const document = await createDocument(
            userWithPermissions.asgl_id,
            name,
            type,
            size,
            datasetId,
            file
        );

        return NextResponse.json({ document });
    } catch (err: any) {
        console.error('❌ [Document API POST] Error:', err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
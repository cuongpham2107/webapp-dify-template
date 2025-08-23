

import { NextRequest, NextResponse } from "next/server";
import { deleteDocument, getDocumentById, updateDocument, checkDocumentAccess } from "@/lib/models/document";
import { getInfo } from "../../utils/common";
import { getUserIdByAsglId } from "@/lib/models/user";
import { getCurrentUserWithPermissions, canAccessDocument } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    try {
        // Get user with permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = await getUserIdByAsglId(userWithPermissions.asgl_id);
        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check view permission using the new permission system
        const canView = await canAccessDocument(userId, id[0], 'view', userWithPermissions);
        if (!canView) {
            return NextResponse.json({ error: "Bạn không có quyền xem document này" }, { status: 403 });
        }

        const document = await getDocumentById(id[0]);
        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json(document, { status: 200 });
    } catch (error) {
        console.error("❌ [Document Detail API GET] Error fetching document:", error);
        return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    try {
        const document = await getDocumentById(id[0]);
        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Get user with permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = await getUserIdByAsglId(userWithPermissions.asgl_id);
        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check edit permission using the new permission system
        const canEdit = await canAccessDocument(userId, id[0], 'edit', userWithPermissions);
        if (!canEdit) {
            return NextResponse.json({ error: "Bạn không có quyền chỉnh sửa document này" }, { status: 403 });
        }

        const formData = await request.formData();

        const name = formData.get('name') as string;
        const type = formData.get('type') as string;
        const size = parseInt(formData.get('size') as string);
        const file = formData.get('file') as File | null;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type;
        if (size) updateData.size = size;

        const updatedDocument = await updateDocument(
            id[0],
            updateData,
            file || undefined
        );

        return NextResponse.json(updatedDocument, { status: 200 });
    } catch (error) {
        console.error("❌ [Document Detail API PUT] Error updating document:", error);
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    try {
        // Get user with permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = await getUserIdByAsglId(userWithPermissions.asgl_id);
        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check delete permission using the new permission system
        const canDelete = await canAccessDocument(userId, id[0], 'delete', userWithPermissions);
        if (!canDelete) {
            return NextResponse.json({ error: "Bạn không có quyền xóa document này" }, { status: 403 });
        }

        await deleteDocument(id[0]);

        return NextResponse.json({ message: "Document deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("❌ [Document Detail API DELETE] Error deleting document:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
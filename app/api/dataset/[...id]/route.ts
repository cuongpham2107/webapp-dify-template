import { NextRequest, NextResponse } from "next/server";
import { deleteDataset, getDatasetById, getTreeDatasetById, updateDataset } from "@/lib/models/dataset"; // Adjust the import path as necessary

import { getUserIdByAsglId } from "@/lib/models/user";
import { getCurrentUserWithPermissions, canAccessDataset, hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 });
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
        const canView = await canAccessDataset(userId, id[0], 'view', userWithPermissions);
        if (!canView) {
            return NextResponse.json({ error: "Bạn không có quyền xem dataset này" }, { status: 403 });
        }

        const dataset = await getTreeDatasetById(id[0]);

        return NextResponse.json(dataset, { status: 200 });
    } catch (error) {
        console.error("❌ [Dataset Detail API GET] Error fetching dataset:", error);
        return NextResponse.json({ error: "Failed to fetch dataset" }, { status: 500 });
    }
}
export async function PUT(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 });
    }
    try {
        const dataset = await getDatasetById(id[0]);
        if (!dataset) {
            return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
        }

        const body = await request.json();

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
        const canEdit = await canAccessDataset(userId, id[0], 'edit', userWithPermissions);
        if (!canEdit) {
            return NextResponse.json({ error: "Bạn không có quyền chỉnh sửa dataset này" }, { status: 403 });
        }

        // Update the dataset with the new data
        const updatedDataset = await updateDataset(id[0], { ...body });

        return NextResponse.json(updatedDataset, { status: 200 });
    } catch (error) {
        console.error("❌ [Dataset Detail API PUT] Error updating dataset:", error);
        return NextResponse.json({ error: "Failed to update dataset" }, { status: 500 });
    }
}
export async function DELETE(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 });
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
        const canDelete = await canAccessDataset(userId, id[0], 'delete', userWithPermissions);
        if (!canDelete) {
            return NextResponse.json({ error: "Bạn không có quyền xóa dataset này" }, { status: 403 });
        }

        // Call the function to delete the dataset by ID
        await deleteDataset(id[0]);

        return NextResponse.json({ message: "Dataset deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("❌ [Dataset Detail API DELETE] Error deleting dataset:", error);
        return NextResponse.json({ error: "Failed to delete dataset" }, { status: 500 });
    }
}
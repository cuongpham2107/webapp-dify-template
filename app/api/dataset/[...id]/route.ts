import { NextRequest, NextResponse } from "next/server";
import { deleteDataset, getDatasetById, getTreeDatasetById, updateDataset } from "@/lib/models/dataset"; // Adjust the import path as necessary

import { getUserIdByAsglId } from "@/lib/models/user";
import { getCurrentUserWithPermissions, canAccessDataset, hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;
    if (!id || id.length === 0) {
        return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 });
    }

    // Use the last ID in the path as the current dataset ID
    const currentDatasetId = id[id.length - 1];

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
        const canView = await canAccessDataset(userId, currentDatasetId, 'view', userWithPermissions);
        if (!canView) {
            return NextResponse.json({ error: "Bạn không có quyền xem dataset này" }, { status: 403 });
        }

        const dataset = await getTreeDatasetById(currentDatasetId);

        return NextResponse.json(dataset, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch dataset" }, { status: 500 });
    }
}
export async function PUT(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;
    if (!id || id.length === 0) {
        return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 });
    }

    // Use the last ID in the path as the current dataset ID
    const currentDatasetId = id[id.length - 1];

    try {
        const dataset = await getDatasetById(currentDatasetId);
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
        const canEdit = await canAccessDataset(userId, currentDatasetId, 'edit', userWithPermissions);
        if (!canEdit) {
            return NextResponse.json({ error: "Bạn không có quyền chỉnh sửa dataset này" }, { status: 403 });
        }

        // Update the dataset with the new data
        const updatedDataset = await updateDataset(currentDatasetId, { ...body });

        return NextResponse.json(updatedDataset, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update dataset" }, { status: 500 });
    }
}
export async function DELETE(request: NextRequest, { params }: { params: { id: string[] } }) {
    const { id } = params;

    if (!id || id.length === 0) {
        return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 });
    }

    // Use the last ID in the path as the current dataset ID
    const currentDatasetId = id[id.length - 1];

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
        const canDelete = await canAccessDataset(userId, currentDatasetId, 'delete', userWithPermissions);
        if (!canDelete) {
            return NextResponse.json({ error: "Bạn không có quyền xóa dataset này" }, { status: 403 });
        }

        // Call the function to delete the dataset by ID
        await deleteDataset(currentDatasetId);

        return NextResponse.json({ message: "Dataset deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete dataset" }, { status: 500 });
    }
}
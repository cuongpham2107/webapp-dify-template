import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
    getUserById,
    updateUser,
    deleteUser,
    updateUserRoles,
    getUserRoles,
    getUserDatasetAccess,
    getUserDocumentAccess,
    grantUserDatasetAccess,
    grantUserDocumentAccess,
    revokeUserDatasetAccess,
    revokeUserDocumentAccess
} from "@/lib/models/userManagement";

// Validation schemas
const updateUserSchema = z.object({
    email: z.string().email("Invalid email format").optional(),
    asgl_id: z.string().min(1, "ASGL ID is required").optional(),
    name: z.string().min(1, "Name is required").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional()
});

const updateRolesSchema = z.object({
    roleIds: z.array(z.string())
});

const datasetAccessSchema = z.object({
    datasetId: z.string().min(1, "Dataset ID is required"),
    canView: z.boolean().optional(),
    canEdit: z.boolean().optional(),
    canDelete: z.boolean().optional()
});

const documentAccessSchema = z.object({
    documentId: z.string().min(1, "Document ID is required"),
    canView: z.boolean().optional(),
    canEdit: z.boolean().optional(),
    canDelete: z.boolean().optional()
});

// GET /api/admin/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const user = await getUserById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to fetch user",
            details: error.message
        }, { status: 500 });
    }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const updateData = validation.data;
        const user = await updateUser(id, updateData);

        return NextResponse.json({
            message: "User updated successfully",
            user: {
                id: user.id,
                email: user.email,
                asgl_id: user.asgl_id,
                name: user.name,
                roles: user.roles,
                updatedAt: user.updatedAt
            }
        });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to update user",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await deleteUser(id);

        return NextResponse.json({
            message: "User deleted successfully"
        });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to delete user",
            details: error.message
        }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
    getRoleById,
    updateRole,
    deleteRole
} from "@/lib/models/roleManagement";

// Validation schemas
const updateRoleSchema = z.object({
    name: z.string().min(1, "Role name is required").optional()
});

// GET /api/admin/roles/[id] - Get role by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        const role = await getRoleById(id);
        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json({ role });

    } catch (error: any) {
        console.error("Error in GET /api/admin/roles/[id]:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to fetch role",
            details: error.message
        }, { status: 500 });
    }
}

// PUT /api/admin/roles/[id] - Update role
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validation = updateRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const updateData = validation.data;
        const role = await updateRole(id, updateData);

        return NextResponse.json({
            message: "Role updated successfully",
            role
        });

    } catch (error: any) {
        console.error("Error in PUT /api/admin/roles/[id]:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error.message.includes('already exists')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({
            error: "Failed to update role",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        await deleteRole(id);

        return NextResponse.json({
            message: "Role deleted successfully"
        });

    } catch (error: any) {
        console.error("Error in DELETE /api/admin/roles/[id]:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error.message.includes('assigned to users')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({
            error: "Failed to delete role",
            details: error.message
        }, { status: 500 });
    }
}
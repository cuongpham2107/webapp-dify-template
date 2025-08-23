import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
    getRolePermissions,
    updateRolePermissions,
    assignPermissionToRole,
    removePermissionFromRole
} from "@/lib/models/roleManagement";

// Validation schemas
const updatePermissionsSchema = z.object({
    permissionIds: z.array(z.string())
});

const assignPermissionSchema = z.object({
    permissionId: z.string().min(1, "Permission ID is required")
});

// GET /api/admin/roles/[id]/permissions - Get role permissions
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        const permissions = await getRolePermissions(id);
        return NextResponse.json({ permissions });

    } catch (error: any) {
        console.error("Error in GET /api/admin/roles/[id]/permissions:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to fetch role permissions",
            details: error.message
        }, { status: 500 });
    }
}

// PUT /api/admin/roles/[id]/permissions - Update all role permissions
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validation = updatePermissionsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const { permissionIds } = validation.data;
        const role = await updateRolePermissions(id, permissionIds);

        return NextResponse.json({
            message: "Role permissions updated successfully",
            role
        });

    } catch (error: any) {
        console.error("Error in PUT /api/admin/roles/[id]/permissions:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to update role permissions",
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/admin/roles/[id]/permissions - Add single permission to role
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validation = assignPermissionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const { permissionId } = validation.data;
        const assignment = await assignPermissionToRole(id, permissionId);

        return NextResponse.json({
            message: "Permission assigned successfully",
            assignment
        });

    } catch (error: any) {
        console.error("Error in POST /api/admin/roles/[id]/permissions:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error.message.includes('already has this permission')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({
            error: "Failed to assign permission",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/admin/roles/[id]/permissions/[permissionId] - Remove permission from role
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const permissionId = searchParams.get('permissionId');

        if (!permissionId) {
            return NextResponse.json({
                error: "Permission ID is required as query parameter"
            }, { status: 400 });
        }

        await removePermissionFromRole(id, permissionId);

        return NextResponse.json({
            message: "Permission removed successfully"
        });

    } catch (error: any) {
        console.error("Error in DELETE /api/admin/roles/[id]/permissions:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to remove permission",
            details: error.message
        }, { status: 500 });
    }
}
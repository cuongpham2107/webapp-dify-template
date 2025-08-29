import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
    getUserRoles,
    updateUserRoles,
    assignRoleToUser,
    removeRoleFromUser
} from "@/lib/models/userManagement";

// Validation schemas
const updateRolesSchema = z.object({
    roleIds: z.array(z.string())
});

const assignRoleSchema = z.object({
    roleId: z.string().min(1, "Role ID is required")
});

// GET /api/admin/users/[id]/roles - Get user roles
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const roles = await getUserRoles(id);
        return NextResponse.json({ roles });

    } catch (error: any) {
        console.error("Error in GET /api/admin/users/[id]/roles:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to fetch user roles",
            details: error.message
        }, { status: 500 });
    }
}

// PUT /api/admin/users/[id]/roles - Update all user roles
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validation = updateRolesSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const { roleIds } = validation.data;
        const user = await updateUserRoles(id, roleIds);

        return NextResponse.json({
            message: "User roles updated successfully",
            user
        });

    } catch (error: any) {
        console.error("Error in PUT /api/admin/users/[id]/roles:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to update user roles",
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/admin/users/[id]/roles - Add single role to user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validation = assignRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const { roleId } = validation.data;
        const assignment = await assignRoleToUser(id, roleId);

        return NextResponse.json({
            message: "Role assigned successfully",
            assignment
        });

    } catch (error: any) {
        console.error("Error in POST /api/admin/users/[id]/roles:", error);

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error.message.includes('already has this role')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({
            error: "Failed to assign role",
            details: error.message
        }, { status: 500 });
    }
}
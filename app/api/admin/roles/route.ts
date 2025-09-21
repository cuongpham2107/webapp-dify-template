import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
    getAllRoles,
    createRole,
    searchRoles,
    getRoleStats,
    getAllPermissions,
    initializeDefaultRolesAndPermissions
} from "@/lib/models/roleManagement";

// Validation schemas
const createRoleSchema = z.object({
    name: z.string().min(1, "Role name is required")
});

const searchSchema = z.object({
    q: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional()
});

// GET /api/admin/roles - List all roles with search functionality
export async function GET(request: NextRequest) {
    try {
        // TEMPORARILY DISABLED: Check admin permissions
        // await requireAdmin(request);

        const { searchParams } = new URL(request.url);
        const validation = searchSchema.safeParse({
            q: searchParams.get("q") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined
        });

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid query parameters",
                details: validation.error.issues
            }, { status: 400 });
        }

        const { q, page, limit } = validation.data;

        let roles;

        if (q) {
            // Search roles
            roles = await searchRoles(q);
        } else {
            // Get all roles
            roles = await getAllRoles();
        }

        // Get role statistics and permissions
        const [stats, permissions] = await Promise.all([
            getRoleStats(),
            getAllPermissions()
        ]);

        // Simple pagination
        const pageNum = page ? parseInt(page) : 1;
        const pageSize = limit ? parseInt(limit) : 50;
        const startIndex = (pageNum - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const paginatedRoles = roles.slice(startIndex, endIndex);

        return NextResponse.json({
            roles: paginatedRoles,
            permissions,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total: roles.length,
                totalPages: Math.ceil(roles.length / pageSize)
            },
            stats
        });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/admin/roles - Create new role or initialize defaults
export async function POST(request: NextRequest) {
    try {
        // TEMPORARILY DISABLED: Check admin permissions
        // await requireAdmin(request);

        const body = await request.json();

        // Check if this is an initialization request
        if (body.action === 'initialize') {
            const result = await initializeDefaultRolesAndPermissions();
            return NextResponse.json(result);
        }

        // Regular role creation
        const validation = createRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const roleData = validation.data;
        const role = await createRole(roleData);

        return NextResponse.json({
            message: "Role created successfully",
            role
        }, { status: 201 });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error.message.includes('already exists')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({
            error: "Failed to create role",
            details: error.message
        }, { status: 500 });
    }
}
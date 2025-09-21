import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
    getAllUsers,
    createUser,
    searchUsers,
    getUserStats
} from "@/lib/models/userManagement";

// Validation schemas
const createUserSchema = z.object({
    email: z.string().email("Invalid email format"),
    asgl_id: z.string().min(1, "ASGL ID is required"),
    name: z.string().min(1, "Name is required"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const searchSchema = z.object({
    q: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional()
});

// GET /api/admin/users - List all users with search functionality
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

        let users;

        if (q) {
            // Search users
            users = await searchUsers(q);
        } else {
            // Get all users
            users = await getAllUsers();
        }

        // Get user statistics
        const stats = await getUserStats();

        // Simple pagination (you can enhance this)
        const pageNum = page ? parseInt(page) : 1;
        const pageSize = limit ? parseInt(limit) : 50;
        const startIndex = (pageNum - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const paginatedUsers = users.slice(startIndex, endIndex);

        return NextResponse.json({
            users: paginatedUsers,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total: users.length,
                totalPages: Math.ceil(users.length / pageSize)
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

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
    try {
        // TEMPORARILY DISABLED: Check admin permissions
        // await requireAdmin(request);

        const body = await request.json();
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const userData = validation.data;
        const user = await createUser(userData);

        return NextResponse.json({
            message: "User created successfully",
            user: {
                id: user.id,
                email: user.email,
                asgl_id: user.asgl_id,
                name: user.name,
                roles: user.roles,
                createdAt: user.createdAt
            }
        }, { status: 201 });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error.message.includes('already exists')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({
            error: "Failed to create user",
            details: error.message
        }, { status: 500 });
    }
}
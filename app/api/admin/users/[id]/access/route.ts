import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
    getUserDatasetAccess,
    getUserDocumentAccess,
    grantUserDatasetAccess,
    grantUserDocumentAccess,
    revokeUserDatasetAccess,
    revokeUserDocumentAccess,
    updateUserAccess
} from "@/lib/models/userManagement";

// Validation schemas
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

const bulkUpdateAccessSchema = z.object({
    datasetAccess: z.record(z.string(), z.object({
        canView: z.boolean().optional(),
        canEdit: z.boolean().optional(),
        canDelete: z.boolean().optional()
    })).optional(),
    documentAccess: z.record(z.string(), z.object({
        canView: z.boolean().optional(),
        canEdit: z.boolean().optional(),
        canDelete: z.boolean().optional()
    })).optional()
});

// GET /api/admin/users/[id]/access - Get user access permissions
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const [datasetAccess, documentAccess] = await Promise.all([
            getUserDatasetAccess(id),
            getUserDocumentAccess(id)
        ]);

        return NextResponse.json({
            datasetAccess,
            documentAccess
        });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to fetch user access",
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/admin/users/[id]/access - Grant access permissions
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const { type, ...accessData } = body;

        if (type === 'dataset') {
            const validation = datasetAccessSchema.safeParse(accessData);
            if (!validation.success) {
                return NextResponse.json({
                    error: "Invalid dataset access data",
                    details: validation.error.issues
                }, { status: 400 });
            }

            const { datasetId, ...permissions } = validation.data;
            const access = await grantUserDatasetAccess(id, datasetId, permissions);

            return NextResponse.json({
                message: "Dataset access granted successfully",
                access
            });

        } else if (type === 'document') {
            const validation = documentAccessSchema.safeParse(accessData);
            if (!validation.success) {
                return NextResponse.json({
                    error: "Invalid document access data",
                    details: validation.error.issues
                }, { status: 400 });
            }

            const { documentId, ...permissions } = validation.data;
            const access = await grantUserDocumentAccess(id, documentId, permissions);

            return NextResponse.json({
                message: "Document access granted successfully",
                access
            });

        } else {
            return NextResponse.json({
                error: "Invalid access type. Must be 'dataset' or 'document'"
            }, { status: 400 });
        }

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to grant access",
            details: error.message
        }, { status: 500 });
    }
}

// PUT /api/admin/users/[id]/access - Bulk update user access permissions
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validation = bulkUpdateAccessSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid access data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const { datasetAccess, documentAccess } = validation.data;
        const results = await updateUserAccess(id, {
            datasetAccess,
            documentAccess
        });

        return NextResponse.json({
            message: "User access permissions updated successfully",
            results
        });

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to update user access",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id]/access - Revoke access permissions
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin permissions
        await requireAdmin(request);

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const resourceId = searchParams.get('resourceId');

        if (!type || !resourceId) {
            return NextResponse.json({
                error: "Type and resourceId are required query parameters"
            }, { status: 400 });
        }

        if (type === 'dataset') {
            await revokeUserDatasetAccess(id, resourceId);
            return NextResponse.json({
                message: "Dataset access revoked successfully"
            });

        } else if (type === 'document') {
            await revokeUserDocumentAccess(id, resourceId);
            return NextResponse.json({
                message: "Document access revoked successfully"
            });

        } else {
            return NextResponse.json({
                error: "Invalid access type. Must be 'dataset' or 'document'"
            }, { status: 400 });
        }

    } catch (error: any) {

        if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            error: "Failed to revoke access",
            details: error.message
        }, { status: 500 });
    }
}
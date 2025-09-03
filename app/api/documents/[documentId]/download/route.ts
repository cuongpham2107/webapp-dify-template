import { NextRequest, NextResponse } from "next/server";
import { DocumentClient } from "@/service/document";
import { getCurrentUserWithPermissions, hasPermission } from '@/lib/permissions';
import { getDocumentById } from '@/lib/models/document';
import { documents } from "@/app/api/utils/common";

// GET /api/documents/[documentId]/download - Download document file
export async function GET(
    request: NextRequest,
    { params }: { params: { documentId: string } }
) {
    try {
        const { documentId } = params;
        const { searchParams } = new URL(request.url);
        const datasetId = searchParams.get('datasetId');

        if (!documentId) {
            return NextResponse.json({
                error: "Document ID is required"
            }, { status: 400 });
        }

        // Check user permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        // Check if user has permission to view documents
        if (!userWithPermissions.isAdmin &&
            !userWithPermissions.isSuperAdmin &&
            !hasPermission(userWithPermissions, 'documents.view')) {
            return NextResponse.json({
                error: "Insufficient permissions to download documents"
            }, { status: 403 });
        }

        // Get document from database to retrieve Dify IDs
        const document = await getDocumentById(documentId);
        if (!document) {
            return NextResponse.json({
                error: "Document not found"
            }, { status: 404 });
        }

        if (!document.dataset) {
            return NextResponse.json({
                error: "Dataset not found for this document"
            }, { status: 404 });
        }

        // Use the Dify API IDs for the download
        const difyDatasetId = document.dataset.dataset_id;
        const difyDocumentId = document.document_id;

        // Download file using DocumentClient with Dify IDs

        const result = await documents.downloadFile(difyDatasetId, difyDocumentId);

        if (result.data.blob) {
            // Return file as stream
            const { blob, filename, type } = result.data;

            // Convert blob to ArrayBuffer
            const arrayBuffer = await blob.arrayBuffer();

            // Properly encode filename for Content-Disposition header
            const safeFilename = encodeURIComponent(filename);

            // Return file with appropriate headers
            return new NextResponse(arrayBuffer, {
                headers: {
                    'Content-Type': type || 'application/octet-stream',
                    'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}`,
                    'Content-Length': blob.size.toString(),
                    'Cache-Control': 'no-cache'
                }
            });
        } else {
            // Return JSON response if file is not available
            return NextResponse.json({
                message: "File data not available",
                data: result.data
            });
        }

    } catch (error: any) {
        // Handle specific error cases
        if (error.message.includes('HTTP 404')) {
            return NextResponse.json({
                error: "Document or file not found"
            }, { status: 404 });
        } else if (error.message.includes('HTTP 403')) {
            return NextResponse.json({
                error: "Access denied - insufficient permissions"
            }, { status: 403 });
        } else if (error.message.includes('HTTP 401')) {
            return NextResponse.json({
                error: "Authentication required"
            }, { status: 401 });
        }

        return NextResponse.json({
            error: "Failed to download document file",
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/documents/[documentId]/download - Get download information
export async function POST(
    request: NextRequest,
    { params }: { params: { documentId: string } }
) {
    try {
        const { documentId } = params;
        const body = await request.json().catch(() => ({})); // Handle empty body
        const { datasetId } = body;

        if (!documentId) {
            return NextResponse.json({
                error: "Document ID is required"
            }, { status: 400 });
        }

        // Check user permissions
        const userWithPermissions = await getCurrentUserWithPermissions();
        if (!userWithPermissions) {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        // Check if user has permission to view documents
        if (!userWithPermissions.isAdmin &&
            !userWithPermissions.isSuperAdmin &&
            !hasPermission(userWithPermissions, 'documents.view')) {
            return NextResponse.json({
                error: "Insufficient permissions to access documents"
            }, { status: 403 });
        }

        // Get document from database to retrieve Dify IDs
        const document = await getDocumentById(documentId);
        if (!document) {
            return NextResponse.json({
                error: "Document not found"
            }, { status: 404 });
        }

        if (!document.dataset) {
            return NextResponse.json({
                error: "Dataset not found for this document"
            }, { status: 404 });
        }

        // Use the Dify API IDs for getting file info
        const difyDatasetId = document.dataset.dataset_id;
        const difyDocumentId = document.document_id;

        // Get file information using DocumentClient with Dify IDs
        const documentClient = new DocumentClient(process.env.APP_KEY_DATA || '', process.env.API_URL || '');
        const result = await documentClient.getFileInfo(difyDatasetId, difyDocumentId);

        return NextResponse.json({
            message: "File information retrieved successfully",
            documentId,
            datasetId: document.dataset.dataset_id,
            data: result.data,
            downloadUrl: `/api/documents/${documentId}/download`
        });

    } catch (error: any) {
        console.error("Error in POST /api/documents/[documentId]/download:", error);

        return NextResponse.json({
            error: "Failed to get file information",
            details: error.message
        }, { status: 500 });
    }
}
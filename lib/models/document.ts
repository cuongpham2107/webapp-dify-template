import prisma from "@/lib/prisma";
import { getCurrentUserWithPermissions, getUserAccessibleDocuments, canAccessDocument } from '@/lib/permissions';
import { documents } from '@/app/api/utils/common';

// Hàm kiểm tra quyền truy cập document cho user
export async function checkDocumentAccess(asgl_id: string, documentId: string, permission: 'canView' | 'canEdit' | 'canDelete' = 'canView'): Promise<boolean> {
    // Get user with permissions
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions || userWithPermissions.asgl_id !== asgl_id) {
        return false;
    }

    // Nếu là admin hoặc superadmin thì luôn có quyền
    if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
        return true;
    }

    try {
        // Tìm user theo asgl_id
        const user = await prisma.user.findUnique({ where: { asgl_id } });
        if (!user) return false;

        // Use the permission utility
        const actionMap = {
            canView: 'view' as const,
            canEdit: 'edit' as const,
            canDelete: 'delete' as const
        };

        const hasAccess = await canAccessDocument(
            user.id,
            documentId,
            actionMap[permission],
            userWithPermissions
        );

        return hasAccess;
    } catch (error) {
        console.error('Error checking document access:', error);
        return false;
    }
}

// Create Document: gọi service API trước, sau đó lưu local
export async function createDocument(
    userId: string,
    name: string,
    type: string,
    size: number,
    datasetId: string,
    file?: File
) {
    // Validate inputs
    if (!userId || !name || !datasetId) {
        throw new Error("UserId, name, and datasetId are required");
    }

    if (!file) {
        throw new Error("File is required for document creation");
    }

    // Lấy dataset để có dataset_id cho Dify API
    const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) {
        throw new Error("Dataset not found");
    }

    // Find user first to ensure they exist
    const user = await prisma.user.findUnique({
        where: { asgl_id: userId },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Upload file to Dify and create document
    let difyResponse;
    try {
        difyResponse = await documents.createDocumentWithFile(
            dataset.dataset_id,
            {
                name: name,
                process_rule: { mode: "automatic" }
            },
            file
        );
    } catch (error) {
        console.error("Error creating document on Dify:", error);
        throw new Error("Failed to create document on Dify API");
    }

    // Extract document ID from Dify response
    const documentId = difyResponse?.data?.document?.id;
    if (!documentId) {
        throw new Error("No document ID returned from Dify API");
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
        // Create local document with the Dify document ID
        const document = await tx.document.create({
            data: {
                document_id: documentId, // Use the ID from Dify response
                name,
                type,
                size,
                datasetId
            },
        });

        // Grant permissions to creator
        await tx.documentAccess.create({
            data: {
                userId: user.id,
                documentId: document.id,
                canView: true,
                canEdit: true,
                canDelete: true
            }
        });

        return document;
    });

    return result;
}

// Get Document by ID
export async function getDocumentById(documentId: string) {
    return prisma.document.findUnique({
        where: { id: documentId },
        include: { dataset: true, accesses: true },
    });
}

// Get Documents by Dataset ID with permission filtering
export async function getDocumentsByDatasetId(datasetId: string) {
    // Get current user with permissions
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) {
        throw new Error('User not authenticated');
    }

    // Use the permission utility to get accessible documents for this dataset
    const accessibleDocuments = await getUserAccessibleDocuments(
        userWithPermissions.id,
        userWithPermissions,
        datasetId
    );

    return accessibleDocuments;
}

// Get Documents by User ID with permission filtering
export async function getDocumentsByUserId(userId: string, datasetId?: string) {
    // Get current user with permissions
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) {
        throw new Error('User not authenticated');
    }

    // Use the permission utility to get accessible documents
    const accessibleDocuments = await getUserAccessibleDocuments(
        userId,
        userWithPermissions,
        datasetId
    );


    return accessibleDocuments;
}

// Update Document: gọi service API trước, sau đó update local
export async function updateDocument(
    id: string,
    data: Partial<{ name: string, type: string, size: number, datasetId: string }>,
    file?: File
) {
    const document = await prisma.document.findUnique({
        where: { id },
        include: { dataset: true }
    });

    if (!document) {
        throw new Error("Document not found");
    }

    // Chỉ gọi Dify API nếu có file hoặc thay đổi name (không gọi khi chỉ thay đổi datasetId)
    if ((file || (data.name && data.name !== document.name)) && document.dataset) {
        try {
            if (file) {
                await documents.updateDocumentWithFile(
                    document.dataset.dataset_id,
                    document.document_id,
                    {
                        name: data.name || document.name,
                        process_rule: { mode: "automatic" }
                    },
                    file
                );
            }
        } catch (error) {
            console.error("Error updating document on Dify:", error);
            // Tiếp tục update local nếu API fail
        }
    }

    // Update local - bao gồm cả datasetId
    return prisma.document.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.type && { type: data.type }),
            ...(data.size && { size: data.size }),
            ...(data.datasetId && { datasetId: data.datasetId }),
        }
    });
}

// Delete Document: gọi service API trước, sau đó xóa local
export async function deleteDocument(documentId: string) {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { dataset: true }
    });

    if (!document) {
        throw new Error("Document not found");
    }

    // Xóa trên Dify trước
    if (document.dataset) {
        try {
            await documents.deleteDocument(
                document.dataset.dataset_id,
                document.document_id
            );
        } catch (error) {
            console.error("Error deleting document on Dify:", error);
            // Tiếp tục xóa local nếu API fail
        }
    }

    // Xóa documentAccess liên quan trước
    await prisma.documentAccess.deleteMany({
        where: { documentId: document.id }
    });

    // Xóa document local
    return prisma.document.delete({ where: { id: document.id } });
}

// Get all Documents with permission filtering
export async function getAllDocuments() {
    // Get current user with permissions
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) {
        throw new Error('User not authenticated');
    }

    // Admin users can see all documents
    if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
        return prisma.document.findMany({
            include: { dataset: true, accesses: true }
        });
    }

    // Regular users only see documents they have access to
    return getUserAccessibleDocuments(userWithPermissions.id, userWithPermissions);
}
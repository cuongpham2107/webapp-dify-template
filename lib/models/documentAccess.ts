import prisma from "@/lib/prisma";

// Hàm cấp quyền truy cập document cho user
export async function grantDocumentAccess(
    userId: string,
    documentId: string,
    permissions: { canView?: boolean; canEdit?: boolean; canDelete?: boolean }
) {
    return prisma.documentAccess.upsert({
        where: {
            userId_documentId: {
                userId,
                documentId,
            },
        },
        update: permissions,
        create: {
            userId,
            documentId,
            canView: permissions.canView || false,
            canEdit: permissions.canEdit || false,
            canDelete: permissions.canDelete || false,
        },
    });
}

// Hàm thu hồi quyền truy cập document cho user
export async function revokeDocumentAccess(userId: string, documentId: string) {
    return prisma.documentAccess.delete({
        where: {
            userId_documentId: {
                userId,
                documentId,
            },
        },
    });
}

// Hàm lấy danh sách quyền truy cập của một document
export async function getDocumentAccesses(documentId: string) {
    return prisma.documentAccess.findMany({
        where: { documentId },
        include: { user: true },
    });
}

// Hàm lấy danh sách document mà user có quyền truy cập
export async function getUserDocumentAccesses(userId: string) {
    return prisma.documentAccess.findMany({
        where: { userId },
        include: { document: true },
    });
}

// Hàm kiểm tra quyền truy cập document cho user
export async function checkDocumentAccess(
    userId: string,
    documentId: string,
    permission: 'canView' | 'canEdit' | 'canDelete' = 'canView'
): Promise<boolean> {
    const access = await prisma.documentAccess.findUnique({
        where: {
            userId_documentId: {
                userId,
                documentId,
            },
        },
    });

    // Nếu không có record nào, kiểm tra xem có bất kỳ quyền nào được cấu hình cho document này không
    if (!access) {
        const anyAccess = await prisma.documentAccess.findFirst({
            where: { documentId },
        });

        // Nếu không có quyền nào được cấu hình cho document này, cho phép truy cập mặc định
        if (!anyAccess) {
            return true;
        }

        // Nếu có quyền được cấu hình nhưng user này không có, từ chối truy cập
        return false;
    }

    return !!access[permission];
}

// Hàm cập nhật quyền truy cập document cho user
export async function updateDocumentAccess(
    userId: string,
    documentId: string,
    permissions: { canView?: boolean; canEdit?: boolean; canDelete?: boolean }
) {
    return prisma.documentAccess.update({
        where: {
            userId_documentId: {
                userId,
                documentId,
            },
        },
        data: permissions,
    });
}
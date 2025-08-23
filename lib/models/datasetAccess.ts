import prisma from "@/lib/prisma";


// Cấp quyền truy cập vào bộ dữ liệu
export async function grantDatasetAccess(userId: string, datasetId: string, rights: { canView?: boolean; canEdit?: boolean; canDelete?: boolean }) {
    return prisma.datasetAccess.upsert({
        where: { 
            userId_datasetId: { 
                userId, 
                datasetId 
            } 
        },
        update: rights,
        create: { 
            userId, 
            datasetId, 
            ...rights 
        },
    });
}
//Nhận tất cả DatasetAccess
export async function getAllDatasetAccess() {
  return prisma.datasetAccess.findMany({include: { dataset: true }});
}
// Nhận tất cả DatasetAccess của người dùng
export async function getUserDatasetAccess(userId: string) {
  return prisma.datasetAccess.findMany({
        where: { 
            userId 
        }, 
        include: { 
            dataset: true 
        }
    });
}

// Xóa truy cập bộ dữ liệu
export async function revokeDatasetAccess(userId: string, datasetId: string) {
  return prisma.datasetAccess.delete({
    where: { 
        userId_datasetId: { 
            userId, datasetId 
        } 
    },
  });
}
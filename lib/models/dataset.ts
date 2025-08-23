

import prisma from "@/lib/prisma";
import { getCurrentUserWithPermissions, getUserAccessibleDatasets, canAccessDataset } from "@/lib/permissions";
import { datasets } from '@/app/api/utils/common'

// Hàm kiểm tra quyền truy cập dataset cho user
export async function checkDatasetAccess(
  asgl_id: string,
  datasetId: string,
  permission: 'canView' | 'canEdit' | 'canDelete' = 'canView'
): Promise<boolean> {
  // Validate inputs
  if (!asgl_id || !datasetId) {
    return false;
  }

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

    const hasAccess = await canAccessDataset(
      user.id,
      datasetId,
      actionMap[permission],
      userWithPermissions
    );

    return hasAccess;
  } catch (error) {
    console.error('Error checking dataset access:', error);
    return false;
  }
}

// Create Dataset: gọi service API trước, sau đó lưu local
export async function createDataset(userId: string, name: string, parent_id: string | null) {
  // Validate inputs
  if (!userId || !name) {
    throw new Error("UserId and name are required");
  }

  // Find user first to ensure they exist
  const user = await prisma.user.findUnique({
    where: { asgl_id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Call Dify API to create remote dataset
  const res = await datasets.createDataset({ name });
  if (res.status !== 200) {
    throw new Error(`Failed to create dataset on Dify: ${res.status}`);
  }

  const remoteId = res?.data?.id;
  if (!remoteId) {
    throw new Error("No dataset ID returned from Dify API");
  }

  // Use transaction to ensure data consistency
  const result = await prisma.$transaction(async (tx) => {
    // Create local dataset
    const dataset = await tx.dataset.create({
      data: { dataset_id: remoteId, name, parent_id },
    });

    // Grant permissions to creator
    await tx.datasetAccess.create({
      data: {
        userId: user.id,
        datasetId: dataset.id,
        canView: true,
        canEdit: true,
        canDelete: true
      }
    });

    return dataset;
  });

  return result;
}

// Get Dataset by ID
type DatasetWithChildren = Awaited<ReturnType<typeof prisma.dataset.findUnique>> & { children: DatasetWithChildren[] };

// Đệ quy lấy dataset cùng toàn bộ cây children lồng nhau
export async function getTreeDatasetById(datasetId: string) {
  if (!datasetId) {
    throw new Error("Dataset ID is required");
  }

  async function getDatasetWithChildren(id: string): Promise<DatasetWithChildren | null> {
    try {
      const dataset = await prisma.dataset.findUnique({
        where: { id },
        include: {
          documents: true,
          accesses: true,
          children: true,
        },
      });

      if (!dataset) return null;

      const children: DatasetWithChildren[] = (await Promise.all(
        dataset.children.map((child: any) => getDatasetWithChildren(child.id))
      )).filter(Boolean) as DatasetWithChildren[];

      return {
        ...dataset,
        children,
      };
    } catch (error) {
      console.error(`Error fetching dataset with ID ${id}:`, error);
      throw new Error(`Failed to fetch dataset: ${error}`);
    }
  }

  return getDatasetWithChildren(datasetId);
}

//Get Dataset by ID
export async function getDatasetById(datasetId: string) {
  return prisma.dataset.findUnique({
    where: { id: datasetId },
    include: { documents: true, accesses: true },
  });
}

//Get Dataset by parent ID
export async function getDatasetByParentId(parentId: string | null) {
  return prisma.dataset.findMany({
    where: { parent_id: parentId },
    include: { documents: true, accesses: true },
  });
}

//Get dataset by user ID 
export async function getDatasetByUserId(userId: string, parent_id: string | null) {
  // Get current user with permissions
  const userWithPermissions = await getCurrentUserWithPermissions();
  if (!userWithPermissions) {
    throw new Error('User not authenticated');
  }

  // Use the permission utility to get accessible datasets
  const accessibleDatasets = await getUserAccessibleDatasets(userId, userWithPermissions);

  // Filter by parent_id
  const filteredDatasets = accessibleDatasets.filter(dataset => dataset.parent_id === parent_id);

  return filteredDatasets;
}



// Get all Datasets with permission filtering
export async function getAllDatasets() {
  // Get current user with permissions
  const userWithPermissions = await getCurrentUserWithPermissions();
  if (!userWithPermissions) {
    throw new Error('User not authenticated');
  }

  // Admin users can see all datasets
  if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
    return prisma.dataset.findMany({
      include: {
        documents: true,
        accesses: true
      }
    });
  }

  // Regular users only see datasets they have access to
  return getUserAccessibleDatasets(userWithPermissions.id, userWithPermissions);
}

// Get Datasets by Parent ID is null with permission filtering
export async function getDatasetsByParentIdNull() {
  // Get current user with permissions
  const userWithPermissions = await getCurrentUserWithPermissions();
  if (!userWithPermissions) {
    throw new Error('User not authenticated');
  }

  // Admin users can see all top-level datasets
  if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
    return prisma.dataset.findMany({
      where: { parent_id: null },
      include: {
        documents: true,
        accesses: true
      },
    });
  }

  // Regular users only see top-level datasets they have access to
  const accessibleDatasets = await getUserAccessibleDatasets(userWithPermissions.id, userWithPermissions);
  return accessibleDatasets.filter(dataset => dataset.parent_id === null);
}

// Update Dataset: gọi service API trước, sau đó update local
export async function updateDataset(id: string, data: Partial<{ name: string, parent_id: string | null }>) {
  if (!id) {
    throw new Error("Dataset ID is required");
  }

  const dataset = await prisma.dataset.findUnique({ where: { id } });
  if (!dataset) {
    throw new Error("Dataset not found");
  }

  // Update on Dify first
  try {
    await datasets.updateDataset(dataset.dataset_id, {
      name: data.name || dataset.name,
      parent_id: data.parent_id !== undefined ? data.parent_id : dataset.parent_id
    });
  } catch (error) {
    console.error("Failed to update dataset on Dify:", error);
    throw new Error("Failed to update dataset on remote server");
  }

  // Prepare update data for Prisma
  const updateData: any = {};
  if (typeof data.name !== 'undefined') updateData.name = data.name;
  if (typeof data.parent_id !== 'undefined') {
    updateData.parent = data.parent_id
      ? { connect: { id: data.parent_id } }
      : { disconnect: true };
  }

  // Update local database
  return prisma.dataset.update({ where: { id }, data: updateData });
}



// Delete Dataset: gọi service API trước, sau đó xóa local
export async function deleteDataset(datasetId: string) {
  if (!datasetId) {
    throw new Error("Dataset ID is required");
  }

  const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });
  if (!dataset) {
    throw new Error("Dataset not found");
  }

  // Đệ quy xóa tất cả dataset con trước
  const children = await prisma.dataset.findMany({
    where: { parent_id: datasetId },
    select: { id: true }
  });

  for (const child of children) {
    await deleteDataset(child.id);
  }

  // Use transaction for data consistency
  await prisma.$transaction(async (tx) => {
    // Lấy danh sách document id thuộc dataset này
    const documents = await tx.document.findMany({
      where: { datasetId: dataset.id },
      select: { id: true }
    });
    const documentIds = documents.map(doc => doc.id);

    // Xóa documentAccess liên quan trước
    if (documentIds.length > 0) {
      await tx.documentAccess.deleteMany({
        where: { documentId: { in: documentIds } }
      });
    }

    // Xóa documents
    await tx.document.deleteMany({ where: { datasetId: dataset.id } });

    // Xóa datasetAccess liên quan
    await tx.datasetAccess.deleteMany({ where: { datasetId: dataset.id } });

    // Xóa dataset local
    await tx.dataset.delete({ where: { id: dataset.id } });
  });

  // Xóa dataset trên service (sau khi xóa local thành công)
  try {
    await datasets.deleteDataset(dataset.dataset_id);
  } catch (error) {
    console.error("Failed to delete dataset on Dify (local deletion completed):", error);
    // Don't throw error here as local deletion is already complete
  }

  return { success: true, message: "Dataset deleted successfully" };
}



import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// =============================================
// USER MANAGEMENT FUNCTIONS
// =============================================

// Get all users with their roles and access information
export async function getAllUsers() {
    return prisma.user.findMany({
        include: {
            roles: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            },
            datasets: {
                include: {
                    dataset: true
                }
            },
            documents: {
                include: {
                    document: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

// Get user by ID with full information
export async function getUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            roles: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            },
            datasets: {
                include: {
                    dataset: true
                }
            },
            documents: {
                include: {
                    document: true
                }
            }
        }
    });
}

// Get user by asgl_id
export async function getUserByAsglId(asgl_id: string) {
    return prisma.user.findUnique({
        where: { asgl_id },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
}

// Create new user
export async function createUser(data: {
    email: string;
    asgl_id: string;
    name: string;
    password: string;
}) {
    // Validate inputs
    if (!data.email || !data.asgl_id || !data.name || !data.password) {
        throw new Error("All fields are required");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email },
                { asgl_id: data.asgl_id }
            ]
        }
    });

    if (existingUser) {
        throw new Error("User with this email or ASGL ID already exists");
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    return prisma.user.create({
        data: {
            ...data,
            password: hashedPassword,
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
}

// Update user
export async function updateUser(userId: string, data: {
    email?: string;
    asgl_id?: string;
    name?: string;
    password?: string;
}) {
    const updateData: any = {};

    if (data.email) updateData.email = data.email;
    if (data.asgl_id) updateData.asgl_id = data.asgl_id;
    if (data.name) updateData.name = data.name;
    if (data.password) {
        updateData.password = bcrypt.hashSync(data.password, 10);
    }

    return prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
}

// Delete user (with cascade cleanup)
export async function deleteUser(userId: string) {
    return prisma.$transaction(async (tx) => {
        // Delete user roles
        await tx.userRole.deleteMany({
            where: { userId }
        });

        // Delete dataset access
        await tx.datasetAccess.deleteMany({
            where: { userId }
        });

        // Delete document access
        await tx.documentAccess.deleteMany({
            where: { userId }
        });

        // Delete user
        return tx.user.delete({
            where: { id: userId }
        });
    });
}

// =============================================
// ROLE ASSIGNMENT FUNCTIONS
// =============================================

// Get user roles
export async function getUserRoles(userId: string) {
    return prisma.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            }
        }
    });
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }

    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        throw new Error("Role not found");
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userRole.findUnique({
        where: {
            userId_roleId: {
                userId,
                roleId
            }
        }
    });

    if (existingAssignment) {
        throw new Error("User already has this role");
    }

    return prisma.userRole.create({
        data: {
            userId,
            roleId
        },
        include: {
            role: true,
            user: true
        }
    });
}

// Remove role from user
export async function removeRoleFromUser(userId: string, roleId: string) {
    return prisma.userRole.delete({
        where: {
            userId_roleId: {
                userId,
                roleId
            }
        }
    });
}

// Update user roles (replace all roles)
export async function updateUserRoles(userId: string, roleIds: string[]) {
    return prisma.$transaction(async (tx) => {
        // Remove all existing roles
        await tx.userRole.deleteMany({
            where: { userId }
        });

        // Add new roles
        if (roleIds.length > 0) {
            await tx.userRole.createMany({
                data: roleIds.map(roleId => ({
                    userId,
                    roleId
                }))
            });
        }

        // Return updated user with roles
        return tx.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: {
                        role: true
                    }
                }
            }
        });
    });
}

// =============================================
// DATASET ACCESS MANAGEMENT
// =============================================

// Get user dataset access
export async function getUserDatasetAccess(userId: string) {
    return prisma.datasetAccess.findMany({
        where: { userId },
        include: {
            dataset: true
        }
    });
}

// Grant dataset access to user
export async function grantUserDatasetAccess(
    userId: string,
    datasetId: string,
    permissions: { canView?: boolean; canEdit?: boolean; canDelete?: boolean }
) {
    return prisma.datasetAccess.upsert({
        where: {
            userId_datasetId: {
                userId,
                datasetId
            }
        },
        update: permissions,
        create: {
            userId,
            datasetId,
            canView: permissions.canView || false,
            canEdit: permissions.canEdit || false,
            canDelete: permissions.canDelete || false
        },
        include: {
            dataset: true,
            user: true
        }
    });
}

// Revoke dataset access from user
export async function revokeUserDatasetAccess(userId: string, datasetId: string) {
    return prisma.datasetAccess.delete({
        where: {
            userId_datasetId: {
                userId,
                datasetId
            }
        }
    });
}

// =============================================
// DOCUMENT ACCESS MANAGEMENT
// =============================================

// Get user document access
export async function getUserDocumentAccess(userId: string) {
    return prisma.documentAccess.findMany({
        where: { userId },
        include: {
            document: {
                include: {
                    dataset: true
                }
            }
        }
    });
}

// Grant document access to user
export async function grantUserDocumentAccess(
    userId: string,
    documentId: string,
    permissions: { canView?: boolean; canEdit?: boolean; canDelete?: boolean }
) {
    return prisma.documentAccess.upsert({
        where: {
            userId_documentId: {
                userId,
                documentId
            }
        },
        update: permissions,
        create: {
            userId,
            documentId,
            canView: permissions.canView || false,
            canEdit: permissions.canEdit || false,
            canDelete: permissions.canDelete || false
        },
        include: {
            document: {
                include: {
                    dataset: true
                }
            },
            user: true
        }
    });
}

// Revoke document access from user
export async function revokeUserDocumentAccess(userId: string, documentId: string) {
    return prisma.documentAccess.delete({
        where: {
            userId_documentId: {
                userId,
                documentId
            }
        }
    });
}

// =============================================
// BULK ACCESS MANAGEMENT
// =============================================

// Bulk update user access permissions
export async function updateUserAccess(
    userId: string,
    data: {
        datasetAccess?: Record<string, { canView?: boolean; canEdit?: boolean; canDelete?: boolean }>;
        documentAccess?: Record<string, { canView?: boolean; canEdit?: boolean; canDelete?: boolean }>;
    }
) {
    return prisma.$transaction(async (tx) => {
        const results: any = {};

        // Update dataset access permissions
        if (data.datasetAccess) {
            const datasetPromises = Object.entries(data.datasetAccess).map(([datasetId, permissions]) => {
                return tx.datasetAccess.upsert({
                    where: {
                        userId_datasetId: {
                            userId,
                            datasetId
                        }
                    },
                    update: permissions,
                    create: {
                        userId,
                        datasetId,
                        canView: permissions.canView || false,
                        canEdit: permissions.canEdit || false,
                        canDelete: permissions.canDelete || false
                    },
                    include: {
                        dataset: true
                    }
                });
            });
            results.datasetAccess = await Promise.all(datasetPromises);
        }

        // Update document access permissions
        if (data.documentAccess) {
            const documentPromises = Object.entries(data.documentAccess).map(([documentId, permissions]) => {
                return tx.documentAccess.upsert({
                    where: {
                        userId_documentId: {
                            userId,
                            documentId
                        }
                    },
                    update: permissions,
                    create: {
                        userId,
                        documentId,
                        canView: permissions.canView || false,
                        canEdit: permissions.canEdit || false,
                        canDelete: permissions.canDelete || false
                    },
                    include: {
                        document: {
                            include: {
                                dataset: true
                            }
                        }
                    }
                });
            });
            results.documentAccess = await Promise.all(documentPromises);
        }

        return results;
    });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Search users by name, email, or asgl_id
export async function searchUsers(query: string) {
    return prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { email: { contains: query } },
                { asgl_id: { contains: query } }
            ]
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });
}

// Get user statistics
export async function getUserStats() {
    const [totalUsers, totalRoles, totalDatasetAccess, totalDocumentAccess] = await Promise.all([
        prisma.user.count(),
        prisma.role.count(),
        prisma.datasetAccess.count(),
        prisma.documentAccess.count()
    ]);

    return {
        totalUsers,
        totalRoles,
        totalDatasetAccess,
        totalDocumentAccess
    };
}
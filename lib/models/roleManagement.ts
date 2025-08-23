import prisma from "@/lib/prisma";

// =============================================
// ROLE MANAGEMENT FUNCTIONS
// =============================================

// Get all roles with their permissions and users
export async function getAllRoles() {
    return prisma.role.findMany({
        include: {
            permissions: {
                include: {
                    permission: true
                }
            },
            users: {
                include: {
                    user: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });
}

// Get role by ID with full information
export async function getRoleById(roleId: string) {
    return prisma.role.findUnique({
        where: { id: roleId },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            },
            users: {
                include: {
                    user: true
                }
            }
        }
    });
}

// Get role by name
export async function getRoleByName(name: string) {
    return prisma.role.findUnique({
        where: { name },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });
}

// Create new role
export async function createRole(data: {
    name: string;
}) {
    // Validate inputs
    if (!data.name) {
        throw new Error("Role name is required");
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
        where: { name: data.name }
    });

    if (existingRole) {
        throw new Error("Role with this name already exists");
    }

    return prisma.role.create({
        data: {
            name: data.name,
        },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });
}

// Update role
export async function updateRole(roleId: string, data: {
    name?: string;
}) {
    const updateData: any = {};

    if (data.name) {
        // Check if new name already exists
        const existingRole = await prisma.role.findFirst({
            where: {
                name: data.name,
                NOT: { id: roleId }
            }
        });

        if (existingRole) {
            throw new Error("Role with this name already exists");
        }

        updateData.name = data.name;
    }

    return prisma.role.update({
        where: { id: roleId },
        data: updateData,
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });
}

// Delete role (with cascade cleanup)
export async function deleteRole(roleId: string) {
    return prisma.$transaction(async (tx) => {
        // Check if role has users
        const roleWithUsers = await tx.userRole.findFirst({
            where: { roleId }
        });

        if (roleWithUsers) {
            throw new Error("Cannot delete role that is assigned to users");
        }

        // Delete role permissions
        await tx.rolePermission.deleteMany({
            where: { roleId }
        });

        // Delete role
        return tx.role.delete({
            where: { id: roleId }
        });
    });
}

// =============================================
// PERMISSION MANAGEMENT FUNCTIONS
// =============================================

// Get all permissions
export async function getAllPermissions() {
    return prisma.permission.findMany({
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

// Get permission by ID
export async function getPermissionById(permissionId: string) {
    return prisma.permission.findUnique({
        where: { id: permissionId },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
}

// Get permission by name
export async function getPermissionByName(name: string) {
    return prisma.permission.findUnique({
        where: { name }
    });
}

// Create new permission
export async function createPermission(data: {
    name: string;
}) {
    // Validate inputs
    if (!data.name) {
        throw new Error("Permission name is required");
    }

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
        where: { name: data.name }
    });

    if (existingPermission) {
        throw new Error("Permission with this name already exists");
    }

    return prisma.permission.create({
        data: {
            name: data.name,
        }
    });
}

// Update permission
export async function updatePermission(permissionId: string, data: {
    name?: string;
}) {
    const updateData: any = {};

    if (data.name) {
        // Check if new name already exists
        const existingPermission = await prisma.permission.findFirst({
            where: {
                name: data.name,
                NOT: { id: permissionId }
            }
        });

        if (existingPermission) {
            throw new Error("Permission with this name already exists");
        }

        updateData.name = data.name;
    }

    return prisma.permission.update({
        where: { id: permissionId },
        data: updateData
    });
}

// Delete permission (with cascade cleanup)
export async function deletePermission(permissionId: string) {
    return prisma.$transaction(async (tx) => {
        // Delete role permissions
        await tx.rolePermission.deleteMany({
            where: { permissionId }
        });

        // Delete permission
        return tx.permission.delete({
            where: { id: permissionId }
        });
    });
}

// =============================================
// ROLE-PERMISSION ASSIGNMENT FUNCTIONS
// =============================================

// Get role permissions
export async function getRolePermissions(roleId: string) {
    return prisma.rolePermission.findMany({
        where: { roleId },
        include: {
            permission: true
        }
    });
}

// Assign permission to role
export async function assignPermissionToRole(roleId: string, permissionId: string) {
    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        throw new Error("Role not found");
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) {
        throw new Error("Permission not found");
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.rolePermission.findUnique({
        where: {
            roleId_permissionId: {
                roleId,
                permissionId
            }
        }
    });

    if (existingAssignment) {
        throw new Error("Role already has this permission");
    }

    return prisma.rolePermission.create({
        data: {
            roleId,
            permissionId
        },
        include: {
            role: true,
            permission: true
        }
    });
}

// Remove permission from role
export async function removePermissionFromRole(roleId: string, permissionId: string) {
    return prisma.rolePermission.delete({
        where: {
            roleId_permissionId: {
                roleId,
                permissionId
            }
        }
    });
}

// Update role permissions (replace all permissions)
export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
    return prisma.$transaction(async (tx) => {
        // Remove all existing permissions
        await tx.rolePermission.deleteMany({
            where: { roleId }
        });

        // Add new permissions
        if (permissionIds.length > 0) {
            await tx.rolePermission.createMany({
                data: permissionIds.map(permissionId => ({
                    roleId,
                    permissionId
                }))
            });
        }

        // Return updated role with permissions
        return tx.role.findUnique({
            where: { id: roleId },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
    });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Search roles by name
export async function searchRoles(query: string) {
    return prisma.role.findMany({
        where: {
            name: { contains: query }
        },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            },
            users: {
                include: {
                    user: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });
}

// Search permissions by name
export async function searchPermissions(query: string) {
    return prisma.permission.findMany({
        where: {
            name: { contains: query }
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

// Get role statistics
export async function getRoleStats() {
    const [totalRoles, totalPermissions, totalRolePermissions, totalUserRoles] = await Promise.all([
        prisma.role.count(),
        prisma.permission.count(),
        prisma.rolePermission.count(),
        prisma.userRole.count()
    ]);

    return {
        totalRoles,
        totalPermissions,
        totalRolePermissions,
        totalUserRoles
    };
}

// Initialize default roles and permissions
export async function initializeDefaultRolesAndPermissions() {
    const defaultPermissions = [
        'admin',
        'user_management',
        'role_management',
        'dataset_management',
        'document_management',
        'view_all_datasets',
        'edit_all_datasets',
        'delete_all_datasets'
    ];

    const defaultRoles = [
        { name: 'admin', permissions: defaultPermissions },
        { name: 'super_admin', permissions: defaultPermissions },
        { name: 'user', permissions: [] },
        { name: 'viewer', permissions: [] }
    ];

    return prisma.$transaction(async (tx) => {
        // Create permissions
        for (const permissionName of defaultPermissions) {
            await tx.permission.upsert({
                where: { name: permissionName },
                update: {},
                create: { name: permissionName }
            });
        }

        // Create roles and assign permissions
        for (const roleData of defaultRoles) {
            const role = await tx.role.upsert({
                where: { name: roleData.name },
                update: {},
                create: { name: roleData.name }
            });

            // Clear existing permissions
            await tx.rolePermission.deleteMany({
                where: { roleId: role.id }
            });

            // Assign new permissions
            for (const permissionName of roleData.permissions) {
                const permission = await tx.permission.findUnique({
                    where: { name: permissionName }
                });

                if (permission) {
                    await tx.rolePermission.create({
                        data: {
                            roleId: role.id,
                            permissionId: permission.id
                        }
                    });
                }
            }
        }

        return { message: 'Default roles and permissions initialized successfully' };
    });
}
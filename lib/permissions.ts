import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export interface UserWithPermissions {
    id: string
    asgl_id: string
    name: string | null
    email: string
    roles: string[]
    permissions: string[]
    isAdmin: boolean
    isSuperAdmin: boolean
}

/**
 * Get the current authenticated user with their roles and permissions
 */
export async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return null
        }

        const user = await prisma.user.findUnique({
            where: { asgl_id: session.user.asgl_id },
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
                }
            }
        })

        if (!user) {
            return null
        }

        // Check for admin roles
        const isAdmin = user.asgl_id === 'admin' || user.asgl_id === 'superadmin'
        const isSuperAdmin = user.asgl_id === 'superadmin'

        // Extract roles and permissions
        const roles = user.roles.map((userRole: any) => userRole.role.name)
        const permissions = user.roles
            .flatMap((userRole: any) =>
                userRole.role.permissions.map((rp: any) => rp.permission.name)
            )
            .filter((permission: string, index: number, array: string[]) => array.indexOf(permission) === index)

        // Admin users get all permissions by default
        if (isAdmin || isSuperAdmin) {
            const adminRoles = isSuperAdmin ? ['super_admin', 'admin'] : ['admin']
            const allPermissions = [
                'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
                'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.assign_permissions',
                'datasets.view', 'datasets.create', 'datasets.edit', 'datasets.delete', 'datasets.manage_access',
                'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'documents.manage_access',
                'system.admin', 'system.view_logs', 'system.configure'
            ]

            return {
                id: user.id,
                asgl_id: user.asgl_id,
                name: user.name,
                email: user.email,
                roles: adminRoles,
                permissions: allPermissions,
                isAdmin,
                isSuperAdmin
            }
        }

        return {
            id: user.id,
            asgl_id: user.asgl_id,
            name: user.name,
            email: user.email,
            roles,
            permissions,
            isAdmin,
            isSuperAdmin
        }

    } catch (error) {
        console.error('Error fetching current user with permissions:', error)
        return null
    }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: UserWithPermissions, permission: string): boolean {
    // Admin and super admin have all permissions
    if (user.isAdmin || user.isSuperAdmin) {
        return true
    }
    return user.permissions.includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: UserWithPermissions, permissions: string[]): boolean {
    // Admin and super admin have all permissions
    if (user.isAdmin || user.isSuperAdmin) {
        return true
    }
    return permissions.some(permission => user.permissions.includes(permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: UserWithPermissions, permissions: string[]): boolean {
    // Admin and super admin have all permissions
    if (user.isAdmin || user.isSuperAdmin) {
        return true
    }
    return permissions.every(permission => user.permissions.includes(permission))
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserWithPermissions, role: string): boolean {
    return user.roles.includes(role)
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: UserWithPermissions, roles: string[]): boolean {
    return roles.some(role => user.roles.includes(role))
}

/**
 * Check if a user can access a specific resource with a specific action
 */
export function canAccess(user: UserWithPermissions, resource: string, action: string): boolean {
    const permission = `${resource}.${action}`
    return hasPermission(user, permission)
}

/**
 * Check if a user is an admin (admin or super_admin)
 */
export function isAdmin(user: UserWithPermissions): boolean {
    return user.isAdmin || user.isSuperAdmin
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(user: UserWithPermissions): boolean {
    return user.isSuperAdmin
}

/**
 * Get accessible datasets for a user based on their permissions and access rights
 */
export async function getUserAccessibleDatasets(userId: string, userWithPermissions: UserWithPermissions) {
    try {
        // Admin and super admin can access all datasets
        if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
            return await prisma.dataset.findMany({
                include: {
                    documents: true,
                    accesses: true
                },
                orderBy: { createdAt: 'desc' }
            })
        }

        // For regular users, check dataset access permissions
        const accessibleDatasets = await prisma.dataset.findMany({
            where: {
                accesses: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                documents: true,
                accesses: {
                    where: { userId },
                    select: {
                        canEdit: true,
                        canDelete: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return accessibleDatasets

    } catch (error) {
        console.error('Error fetching accessible datasets:', error)
        return []
    }
}

/**
 * Get accessible documents for a user based on their permissions and access rights
 */
export async function getUserAccessibleDocuments(userId: string, userWithPermissions: UserWithPermissions, datasetId?: string) {
    try {
        // Admin and super admin can access all documents
        if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
            const whereClause = datasetId ? { datasetId } : {}
            return await prisma.document.findMany({
                where: whereClause,
                include: {
                    dataset: true,
                    accesses: true
                },
                orderBy: { createdAt: 'desc' }
            })
        }

        // For regular users, check document access permissions
        const whereClause: any = {
            accesses: {
                some: {
                    userId: userId
                }
            }
        }

        if (datasetId) {
            whereClause.datasetId = datasetId
        }

        const accessibleDocuments = await prisma.document.findMany({
            where: whereClause,
            include: {
                dataset: true,
                accesses: {
                    where: { userId },
                    select: {
                        canEdit: true,
                        canDelete: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return accessibleDocuments

    } catch (error) {
        console.error('Error fetching accessible documents:', error)
        return []
    }
}

/**
 * Check if a user can perform a specific action on a dataset
 */
export async function canAccessDataset(
    userId: string,
    datasetId: string,
    action: 'view' | 'edit' | 'delete',
    userWithPermissions: UserWithPermissions
): Promise<boolean> {
    try {
        // Admin and super admin can perform all actions
        if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
            return true
        }

        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId },
            include: {
                accesses: {
                    where: { userId }
                }
            }
        })

        if (!dataset) {
            return false
        }

        // Check explicit access permissions
        const access = dataset.accesses[0]
        if (!access) {
            return false
        }

        switch (action) {
            case 'view':
                return access.canView
            case 'edit':
                return access.canEdit
            case 'delete':
                return access.canDelete
            default:
                return false
        }

    } catch (error) {
        console.error('Error checking dataset access:', error)
        return false
    }
}

/**
 * Check if a user can perform a specific action on a document
 */
export async function canAccessDocument(
    userId: string,
    documentId: string,
    action: 'view' | 'edit' | 'delete',
    userWithPermissions: UserWithPermissions
): Promise<boolean> {
    try {
        // Admin and super admin can perform all actions
        if (userWithPermissions.isAdmin || userWithPermissions.isSuperAdmin) {
            return true
        }

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                accesses: {
                    where: { userId }
                }
            }
        })

        if (!document) {
            return false
        }

        // Check explicit access permissions
        const access = document.accesses[0]
        if (!access) {
            return false
        }

        switch (action) {
            case 'view':
                return access.canView
            case 'edit':
                return access.canEdit
            case 'delete':
                return access.canDelete
            default:
                return false
        }

    } catch (error) {
        console.error('Error checking document access:', error)
        return false
    }
}
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { NextRequest } from 'next/server'

// Admin roles that have full system access
const ADMIN_ROLES = ['admin', 'super_admin']

// Check if user has admin privileges based on asgl_id
export function isAdminUser(asgl_id: string): boolean {
    return asgl_id === 'admin' || asgl_id === 'superadmin'
}

// Check if user has admin privileges based on database roles
export async function hasAdminRole(userId: string): Promise<boolean> {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: true
            }
        })

        return userRoles.some(userRole => ADMIN_ROLES.includes(userRole.role.name))
    } catch (error) {
        console.error('Error checking admin role:', error)
        return false
    }
}

// Get admin info from request
export async function getAdminInfo(request: NextRequest) {

    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return { isAdmin: false, user: null, error: 'Unauthorized' }
    }

    const { user } = session

    // Check admin privileges (asgl_id check for compatibility)
    let isAdmin = isAdminUser(user.asgl_id)


    // If not admin by asgl_id, check database roles for local users
    if (!isAdmin && user.isLocalUser) {

        try {
            // For local users, check their database roles
            const localUser = await prisma.user.findUnique({
                where: { asgl_id: user.asgl_id },
                include: {
                    roles: {
                        include: {
                            role: true
                        }
                    }
                }
            })


            if (localUser) {
                isAdmin = localUser.roles.some(userRole => ADMIN_ROLES.includes(userRole.role.name))

            }
        } catch (error) {
            console.error('❌ [getAdminInfo] Error checking local user admin roles:', error)
        }
    }

    if (!isAdmin) {

        return { isAdmin: false, user, error: 'Admin access required' }
    }


    return { isAdmin: true, user, error: null }
}

// Admin middleware for API routes
export async function requireAdmin(request: NextRequest) {

    const adminInfo = await getAdminInfo(request)

    if (!adminInfo.isAdmin) {

        throw new Error(adminInfo.error || 'Admin access required')
    }


    return adminInfo.user
}

// Check if user has specific permission
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
        const userPermissions = await prisma.userRole.findMany({
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
        })

        return userPermissions.some(userRole =>
            userRole.role.permissions.some(rolePermission =>
                rolePermission.permission.name === permissionName
            )
        )
    } catch (error) {
        console.error('Error checking permission:', error)
        return false
    }
}
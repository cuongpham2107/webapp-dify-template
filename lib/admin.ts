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
    console.log('🔍 [getAdminInfo] Starting admin verification...')
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        console.log('❌ [getAdminInfo] No session or user found')
        return { isAdmin: false, user: null, error: 'Unauthorized' }
    }

    const { user } = session
    console.log('👤 [getAdminInfo] User details:', {
        asgl_id: user.asgl_id,
        isLocalUser: user.isLocalUser,
        email: user.email
    })

    // Check admin privileges (asgl_id check for compatibility)
    let isAdmin = isAdminUser(user.asgl_id)
    console.log('🔑 [getAdminInfo] asgl_id admin check:', {
        asgl_id: user.asgl_id,
        isAdmin: isAdmin
    })

    // If not admin by asgl_id, check database roles for local users
    if (!isAdmin && user.isLocalUser) {
        console.log('💾 [getAdminInfo] Checking database roles for local user...')
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

            console.log('💾 [getAdminInfo] Local user data:', {
                found: !!localUser,
                rolesCount: localUser?.roles?.length || 0,
                roles: localUser?.roles?.map(ur => ur.role.name) || []
            })

            if (localUser) {
                isAdmin = localUser.roles.some(userRole => ADMIN_ROLES.includes(userRole.role.name))
                console.log('💾 [getAdminInfo] Database role admin check:', {
                    isAdmin: isAdmin,
                    adminRoles: ADMIN_ROLES
                })
            }
        } catch (error) {
            console.error('❌ [getAdminInfo] Error checking local user admin roles:', error)
        }
    }

    if (!isAdmin) {
        console.log('❌ [getAdminInfo] Admin access denied for user:', user.asgl_id)
        return { isAdmin: false, user, error: 'Admin access required' }
    }

    console.log('✅ [getAdminInfo] Admin access granted for user:', user.asgl_id)
    return { isAdmin: true, user, error: null }
}

// Admin middleware for API routes
export async function requireAdmin(request: NextRequest) {
    console.log('🔐 [requireAdmin] Starting admin check...')
    const adminInfo = await getAdminInfo(request)

    console.log('🔐 [requireAdmin] Admin info:', {
        isAdmin: adminInfo.isAdmin,
        userAsglId: adminInfo.user?.asgl_id,
        userIsLocal: adminInfo.user?.isLocalUser,
        error: adminInfo.error
    })

    if (!adminInfo.isAdmin) {
        console.log('❌ [requireAdmin] Admin access denied:', adminInfo.error)
        throw new Error(adminInfo.error || 'Admin access required')
    }

    console.log('✅ [requireAdmin] Admin access granted')
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
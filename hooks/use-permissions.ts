import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface UserPermissions {
    roles: string[]
    permissions: string[]
    isAdmin: boolean
    isSuperAdmin: boolean
}

interface PermissionInfo {
    userPermissions: UserPermissions
    isLoading: boolean
    error: string | null
    hasPermission: (permission: string) => boolean
    hasAnyPermission: (permissions: string[]) => boolean
    hasAllPermissions: (permissions: string[]) => boolean
    hasRole: (role: string) => boolean
    hasAnyRole: (roles: string[]) => boolean
    canAccess: (resource: string, action: string) => boolean
}

export function usePermissions(): PermissionInfo {
    const { user: currentUser, isAuthenticated } = useAuth()
    const [permissionInfo, setPermissionInfo] = useState<PermissionInfo>({
        userPermissions: {
            roles: [],
            permissions: [],
            isAdmin: false,
            isSuperAdmin: false
        },
        isLoading: true,
        error: null,
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        hasRole: () => false,
        hasAnyRole: () => false,
        canAccess: () => false
    })

    useEffect(() => {
        async function fetchUserPermissions() {

            if (!isAuthenticated || !currentUser) {
                setPermissionInfo(prev => ({
                    ...prev,
                    userPermissions: {
                        roles: [],
                        permissions: [],
                        isAdmin: false,
                        isSuperAdmin: false
                    },
                    isLoading: false,
                    error: 'Not authenticated'
                }))
                return
            }

            try {

                // Check for admin roles first (highest priority)
                const isAdmin = currentUser.asgl_id === 'admin' || currentUser.asgl_id === 'superadmin'
                const isSuperAdmin = currentUser.asgl_id === 'superadmin'

                let roles: string[] = []
                let permissions: string[] = []

                if (isAdmin || isSuperAdmin) {
                    // Admin users have all permissions by default
                    roles = isSuperAdmin ? ['super_admin', 'admin'] : ['admin']
                    permissions = [
                        // User management
                        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
                        // Role management  
                        'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.assign_permissions',
                        // Dataset management
                        'datasets.view', 'datasets.create', 'datasets.edit', 'datasets.delete', 'datasets.manage_access',
                        // Document management
                        'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'documents.manage_access',
                        // System administration
                        'system.admin', 'system.view_logs', 'system.configure'
                    ]
                } else {
                    // For regular users, fetch permissions from API
                    const response = await fetch(`/api/admin/users/permissions?asgl_id=${encodeURIComponent(currentUser.asgl_id)}`)

                    if (response.ok) {
                        const data = await response.json()
                        roles = data.roles || []
                        permissions = data.permissions || []

                    } else {
                        throw new Error(`Failed to fetch permissions: ${response.status}`)
                    }
                }

                const userPermissions: UserPermissions = {
                    roles,
                    permissions,
                    isAdmin,
                    isSuperAdmin
                }

                // Helper functions
                const hasPermission = (permission: string): boolean => {
                    // Admin and super admin have all permissions
                    if (userPermissions.isAdmin || userPermissions.isSuperAdmin) {
                        return true
                    }
                    return userPermissions.permissions.includes(permission)
                }

                const hasAnyPermission = (permissionList: string[]): boolean => {
                    // Admin and super admin have all permissions
                    if (userPermissions.isAdmin || userPermissions.isSuperAdmin) {
                        return true
                    }
                    return permissionList.some(permission => userPermissions.permissions.includes(permission))
                }

                const hasAllPermissions = (permissionList: string[]): boolean => {
                    // Admin and super admin have all permissions
                    if (userPermissions.isAdmin || userPermissions.isSuperAdmin) {
                        return true
                    }
                    return permissionList.every(permission => userPermissions.permissions.includes(permission))
                }

                const hasRole = (role: string): boolean => {
                    return userPermissions.roles.includes(role)
                }

                const hasAnyRole = (roleList: string[]): boolean => {
                    return roleList.some(role => userPermissions.roles.includes(role))
                }

                const canAccess = (resource: string, action: string): boolean => {
                    const permission = `${resource}.${action}`
                    return hasPermission(permission)
                }

                setPermissionInfo({
                    userPermissions,
                    isLoading: false,
                    error: null,
                    hasPermission,
                    hasAnyPermission,
                    hasAllPermissions,
                    hasRole,
                    hasAnyRole,
                    canAccess
                })

            } catch (error) {
                console.error('❌ [usePermissions] Error fetching permissions:', error)
                setPermissionInfo(prev => ({
                    ...prev,
                    userPermissions: {
                        roles: [],
                        permissions: [],
                        isAdmin: false,
                        isSuperAdmin: false
                    },
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Error fetching permissions'
                }))
            }
        }

        fetchUserPermissions()
    }, [isAuthenticated, currentUser])

    return permissionInfo
}
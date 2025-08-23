import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface AdminInfo {
    isAdmin: boolean
    isLoading: boolean
    error: string | null
}

export function useAdmin(): AdminInfo {
    const { user: currentUser, isAuthenticated } = useAuth()
    const [adminInfo, setAdminInfo] = useState<AdminInfo>({
        isAdmin: false,
        isLoading: true,
        error: null
    })

    useEffect(() => {
        async function checkAdminAccess() {

            if (!isAuthenticated || !currentUser) {
                setAdminInfo({
                    isAdmin: false,
                    isLoading: false,
                    error: 'Not authenticated'
                })
                return
            }

            try {
                // First check if user has hardcoded admin asgl_id (for backward compatibility)
                const hasAdminAsglId = currentUser.asgl_id === 'admin' || currentUser.asgl_id === 'superadmin'

                if (hasAdminAsglId) {
                    setAdminInfo({
                        isAdmin: true,
                        isLoading: false,
                        error: null
                    })
                    return
                }

                const response = await fetch(`/api/admin/check-user-admin?asgl_id=${encodeURIComponent(currentUser.asgl_id)}`)

                if (response.ok) {
                    const data = await response.json()
                    const isAdmin = data.isAdmin || false

                    setAdminInfo({
                        isAdmin,
                        isLoading: false,
                        error: isAdmin ? null : 'Insufficient permissions'
                    })
                } else {
                    const errorData = await response.json().catch(() => ({}))
                    setAdminInfo({
                        isAdmin: false,
                        isLoading: false,
                        error: errorData.error || 'Failed to check permissions'
                    })
                }
            } catch (error) {
                setAdminInfo({
                    isAdmin: false,
                    isLoading: false,
                    error: 'Error checking permissions'
                })
            }
        }

        checkAdminAccess()
    }, [isAuthenticated, currentUser])

    return adminInfo
}
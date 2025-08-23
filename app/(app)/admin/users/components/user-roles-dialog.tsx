'use client'

import { useState, useEffect } from 'react'
import { adminUserAPI, adminRoleAPI } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface User {
    id: string
    email: string
    asgl_id: string
    name: string
    roles?: {
        role: {
            id: string
            name: string
        }
    }[]
}

interface Role {
    id: string
    name: string
}

interface UserRolesDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    user: User | null
}

export default function UserRolesDialog({
    open,
    onClose,
    onSuccess,
    user
}: UserRolesDialogProps) {
    const [loading, setLoading] = useState(false)
    const [availableRoles, setAvailableRoles] = useState<Role[]>([])
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [fetchingRoles, setFetchingRoles] = useState(false)

    useEffect(() => {
        if (open) {
            fetchRoles()
            if (user?.roles) {
                setSelectedRoles(user.roles.map(ur => ur.role.id))
            }
        }
    }, [open, user])

    const fetchRoles = async () => {
        try {
            setFetchingRoles(true)
            const response = await adminRoleAPI.getRoles()
            setAvailableRoles(response.roles || [])
        } catch (error: any) {
            console.error('Error fetching roles:', error)
            toast.error("Không thể tải danh sách vai trò")
        } finally {
            setFetchingRoles(false)
        }
    }

    const handleRoleToggle = (roleId: string, checked: boolean) => {
        setSelectedRoles(prev => {
            if (checked) {
                return [...prev, roleId]
            } else {
                return prev.filter(id => id !== roleId)
            }
        })
    }

    const handleSave = async () => {
        if (!user) return

        try {
            setLoading(true)
            await adminUserAPI.updateUserRoles(user.id, selectedRoles)

            toast.success("Cập nhật vai trò người dùng thành công")

            onSuccess()
        } catch (error: any) {
            console.error('Error updating user roles:', error)
            toast.error(error.message || "Không thể cập nhật vai trò người dùng")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Quản lý vai trò người dùng</DialogTitle>
                    <DialogDescription>
                        Chọn các vai trò để gán cho người dùng này.
                    </DialogDescription>
                </DialogHeader>

                {user && (
                    <div className="py-4">
                        <div className="mb-4">
                            <p><strong>Người dùng:</strong> {user.name} ({user.email})</p>
                        </div>

                        {fetchingRoles ? (
                            <div className="text-center py-4">Đang tải vai trò...</div>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {availableRoles.length === 0 ? (
                                    <p className="text-sm text-gray-500">Không có vai trò nào</p>
                                ) : (
                                    availableRoles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={role.id}
                                                checked={selectedRoles.includes(role.id)}
                                                onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                                            />
                                            <label
                                                htmlFor={role.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {role.name}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || fetchingRoles}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu vai trò'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

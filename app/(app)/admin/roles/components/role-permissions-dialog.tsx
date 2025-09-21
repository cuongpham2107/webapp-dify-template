'use client'

import { useState, useEffect } from 'react'
import { adminRoleAPI } from '@/lib/api/admin'
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
import { toast } from "sonner"

interface Role {
    id: string
    name: string
    permissions?: Array<{
        permission: {
            id: string
            name: string
        }
    }>
}

interface Permission {
    id: string
    name: string
}

interface RolePermissionsDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    role: Role | null
}

export default function RolePermissionsDialog({
    open,
    onClose,
    onSuccess,
    role
}: RolePermissionsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [fetchingPermissions, setFetchingPermissions] = useState(false)

    useEffect(() => {
        if (open) {
            fetchPermissions()
            if (role?.permissions) {
                setSelectedPermissions(role.permissions.map(rp => rp.permission.id))
            }
        }
    }, [open, role])

    const fetchPermissions = async () => {
        try {
            setFetchingPermissions(true)
            const response = await adminRoleAPI.getRoles()
            setAvailablePermissions(response.permissions || [])
        } catch (error: any) {
            toast.error("Không thể tải danh sách quyền")
        } finally {
            setFetchingPermissions(false)
        }
    }

    const handlePermissionToggle = (permissionId: string, checked: boolean) => {
        setSelectedPermissions(prev => {
            if (checked) {
                return [...prev, permissionId]
            } else {
                return prev.filter(id => id !== permissionId)
            }
        })
    }

    const handleSave = async () => {
        if (!role) return

        try {
            setLoading(true)
            await adminRoleAPI.updateRolePermissions(role.id, selectedPermissions)

            toast.success("Cập nhật quyền vai trò thành công")

            onSuccess()
        } catch (error: any) {
            toast.error(error.message || "Không thể cập nhật quyền vai trò")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Quản lý quyền vai trò</DialogTitle>
                    <DialogDescription>
                        Chọn quyền để gán cho vai trò này.
                    </DialogDescription>
                </DialogHeader>

                {role && (
                    <div className="py-4">
                        <div className="mb-4">
                            <p><strong>Vai trò:</strong> {role.name}</p>
                        </div>

                        {fetchingPermissions ? (
                            <div className="text-center py-4">Đang tải quyền...</div>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {availablePermissions.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500">Không có quyền nào khả dụng</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Quyền mặc định sẽ được khởi tạo tự động
                                        </p>
                                    </div>
                                ) : (
                                    availablePermissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={permission.id}
                                                checked={selectedPermissions.includes(permission.id)}
                                                onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                                            />
                                            <label
                                                htmlFor={permission.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {permission.name}
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
                        disabled={loading || fetchingPermissions}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu quyền'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

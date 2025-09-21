'use client'

import { useState, useEffect } from 'react'
import { adminRoleAPI } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
}

interface RoleAddEditDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    role: Role | null
    type: 'add' | 'edit'
}

export default function RoleAddEditDialog({
    open,
    onClose,
    onSuccess,
    role,
    type
}: RoleAddEditDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: ''
    })

    useEffect(() => {
        if (open) {
            if (type === 'edit' && role) {
                setFormData({
                    name: role.name
                })
            } else {
                setFormData({
                    name: ''
                })
            }
        }
    }, [open, type, role])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error("Tên vai trò là bắt buộc")
            return
        }

        try {
            setLoading(true)

            if (type === 'add') {
                await adminRoleAPI.createRole({ name: formData.name.trim() })
                toast.success("Tạo vai trò thành công")
            } else if (role) {
                await adminRoleAPI.updateRole(role.id, { name: formData.name.trim() })
                toast.success("Cập nhật vai trò thành công")
            }

            onSuccess()
        } catch (error: any) {
            toast.error(error.message || "Không thể lưu vai trò")
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {type === 'add' ? 'Thêm Vai Trò Mới' : 'Chỉnh Sửa Vai Trò'}
                    </DialogTitle>
                    <DialogDescription>
                        {type === 'add'
                            ? 'Tạo một vai trò mới cho hệ thống.'
                            : 'Cập nhật thông tin vai trò.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Tên Vai Trò *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Nhập tên vai trò"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Đang lưu...' : (type === 'add' ? 'Tạo Vai Trò' : 'Cập Nhật Vai Trò')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

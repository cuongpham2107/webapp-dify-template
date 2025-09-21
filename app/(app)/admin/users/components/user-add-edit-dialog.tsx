'use client'

import { useState, useEffect } from 'react'
import { adminUserAPI } from '@/lib/api/admin'
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
import { toast } from 'sonner'

interface User {
    id: string
    email: string
    asgl_id: string
    name: string
    createdAt: string
    updatedAt: string
}

interface UserAddEditDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    user: User | null
    type: 'add' | 'edit'
}

export default function UserAddEditDialog({
    open,
    onClose,
    onSuccess,
    user,
    type
}: UserAddEditDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        asgl_id: '',
        name: '',
        password: ''
    })

    useEffect(() => {
        if (open) {
            if (type === 'edit' && user) {
                setFormData({
                    email: user.email,
                    asgl_id: user.asgl_id,
                    name: user.name,
                    password: ''
                })
            } else {
                setFormData({
                    email: '',
                    asgl_id: '',
                    name: '',
                    password: ''
                })
            }
        }
    }, [open, type, user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.email || !formData.asgl_id || !formData.name) {
            toast.error("Vui lòng điền đầy đủ các trường bắt buộc")
            return
        }

        if (type === 'add' && !formData.password) {
            toast.error("Mật khẩu là bắt buộc cho người dùng mới")
            return
        }

        try {
            setLoading(true)

            if (type === 'add') {
                await adminUserAPI.createUser(formData)
                toast.success("Tạo người dùng thành công")
            } else if (user) {
                const updateData: any = {
                    email: formData.email,
                    asgl_id: formData.asgl_id,
                    name: formData.name
                }

                if (formData.password) {
                    updateData.password = formData.password
                }

                await adminUserAPI.updateUser(user.id, updateData)
                toast.success("Cập nhật người dùng thành công")
            }

            onSuccess()
        } catch (error: any) {
            toast.error(error.message || "Không thể lưu người dùng")
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
                        {type === 'add' ? 'Thêm Người Dùng Mới' : 'Chỉnh Sửa Người Dùng'}
                    </DialogTitle>
                    <DialogDescription>
                        {type === 'add'
                            ? 'Tạo tài khoản người dùng mới với thông tin cơ bản.'
                            : 'Cập nhật thông tin người dùng. Để trống mật khẩu để giữ mật khẩu hiện tại.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Họ và Tên *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Nhập họ và tên"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Nhập địa chỉ email"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="asgl_id">ASGL ID *</Label>
                            <Input
                                id="asgl_id"
                                value={formData.asgl_id}
                                onChange={(e) => handleInputChange('asgl_id', e.target.value)}
                                placeholder="Nhập ASGL ID"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Mật khẩu {type === 'add' ? '*' : '(tùy chọn)'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder={
                                    type === 'add'
                                        ? "Nhập mật khẩu"
                                        : "Để trống để giữ mật khẩu hiện tại"
                                }
                                required={type === 'add'}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Đang lưu...' : (type === 'add' ? 'Tạo Người Dùng' : 'Cập Nhật Người Dùng')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

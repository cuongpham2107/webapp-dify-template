'use client'

import { useState } from 'react'
import { adminUserAPI } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
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

interface UserDeleteDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    user: User | null
}

export default function UserDeleteDialog({
    open,
    onClose,
    onSuccess,
    user
}: UserDeleteDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!user) return

        try {
            setLoading(true)
            await adminUserAPI.deleteUser(user.id)

            toast.success("Xóa người dùng thành công")

            onSuccess()
        } catch (error: any) {
            console.error('Error deleting user:', error)
            toast.error("Không thể xóa người dùng")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Xóa Người Dùng</DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.
                    </DialogDescription>
                </DialogHeader>

                {user && (
                    <div className="py-4">
                        <div className="space-y-2">
                            <p><strong>Tên:</strong> {user.name}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>ASGL ID:</strong> {user.asgl_id}</p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? 'Đang xóa...' : 'Xóa Người Dùng'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

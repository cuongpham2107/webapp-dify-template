'use client'

import { useState } from 'react'
import { adminRoleAPI } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
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
    users?: Array<{
        user: {
            id: string
            name: string
            email: string
        }
    }>
    permissions?: Array<{
        permission: {
            id: string
            name: string
        }
    }>
}

interface RoleDeleteDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    role: Role | null
}

export default function RoleDeleteDialog({
    open,
    onClose,
    onSuccess,
    role
}: RoleDeleteDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!role) return

        try {
            setLoading(true)
            await adminRoleAPI.deleteRole(role.id)

            toast.success("Role deleted successfully")

            onSuccess()
        } catch (error: any) {
            console.error('Error deleting role:', error)
            toast.error(error.message || "Failed to delete role")
        } finally {
            setLoading(false)
        }
    }

    const hasUsers = role?.users && role.users.length > 0
    const hasPermissions = role?.permissions && role.permissions.length > 0

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Role</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this role? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {role && (
                    <div className="py-4">
                        <div className="space-y-3">
                            <p><strong>Role Name:</strong> {role.name}</p>

                            {hasUsers && (
                                <div>
                                    <p><strong>Assigned Users:</strong></p>
                                    <ul className="list-disc list-inside ml-4 text-sm">
                                        {role.users?.map((roleUser) => (
                                            <li key={roleUser.user.id}>
                                                {roleUser.user.name} ({roleUser.user.email})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {hasPermissions && (
                                <div>
                                    <p><strong>Assigned Permissions:</strong></p>
                                    <ul className="list-disc list-inside ml-4 text-sm">
                                        {role.permissions?.map((rolePermission) => (
                                            <li key={rolePermission.permission.id}>
                                                {rolePermission.permission.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(hasUsers || hasPermissions) && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Warning:</strong> Deleting this role will remove all user assignments and permission associations.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
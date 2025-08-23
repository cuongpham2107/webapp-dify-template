'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { adminRoleAPI } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, Shield, Settings } from 'lucide-react'
import RoleAddEditDialog from './components/role-add-edit-dialog'
import RoleDeleteDialog from './components/role-delete-dialog'
import RolePermissionsDialog from './components/role-permissions-dialog'

interface Role {
    id: string
    name: string
    users: Array<{
        user: {
            id: string
            name: string
            email: string
        }
    }>
    permissions: Array<{
        permission: {
            id: string
            name: string
        }
    }>
}

interface RoleStats {
    totalRoles: number
    totalPermissions: number
    totalAssignments: number
}

export default function RolesPage() {
    const { user: currentUser, isAuthenticated } = useAuth()
    const router = useRouter()

    const [roles, setRoles] = useState<Role[]>([])
    const [stats, setStats] = useState<RoleStats>({
        totalRoles: 0,
        totalPermissions: 0,
        totalAssignments: 0
    })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)



    // Load roles
    const loadRoles = async () => {
        try {
            setLoading(true)
            const response = await adminRoleAPI.getRoles(searchQuery || undefined)

            if (response.roles) {
                setRoles(response.roles)
            }
            if (response.stats) {
                setStats(response.stats)
            }
        } catch (error: any) {
            console.error('❌ [RolesPage] Error loading roles:', error)
            console.error('❌ [RolesPage] Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            })
            // Don't redirect on API error, just show error state
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Only load if user is authenticated and is admin
        if (isAuthenticated && currentUser &&
            (currentUser.asgl_id === 'admin' || currentUser.asgl_id === 'superadmin')) {
            loadRoles()
        }
    }, [searchQuery, isAuthenticated, currentUser])

    const handleAddRole = () => {
        setSelectedRole(null)
        setShowAddDialog(true)
    }

    const handleEditRole = (role: Role) => {
        setSelectedRole(role)
        setShowEditDialog(true)
    }

    const handleDeleteRole = (role: Role) => {
        setSelectedRole(role)
        setShowDeleteDialog(true)
    }

    const handleManagePermissions = (role: Role) => {
        setSelectedRole(role)
        setShowPermissionsDialog(true)
    }

    const handleRoleUpdated = () => {
        loadRoles()
        setShowAddDialog(false)
        setShowEditDialog(false)
        setShowDeleteDialog(false)
        setShowPermissionsDialog(false)
    }
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Vai trò</h1>
                    <p className="text-muted-foreground">
                        Quản lý các vai trò hệ thống và phân quyền
                    </p>
                </div>
                <Button onClick={handleAddRole} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm Vai trò
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng số Vai trò</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRoles}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng số Quyền</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPermissions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng số Phân quyền</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Roles Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle>Vai trò</CardTitle>
                        <CardDescription>
                            Quản lý các vai trò hệ thống và quyền của chúng
                        </CardDescription>
                    </div>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm vai trò..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-6">Đang tải vai trò...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên Vai trò</TableHead>
                                    <TableHead>Quyền</TableHead>
                                    <TableHead>Người dùng được phân</TableHead>
                                    <TableHead>Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {role.permissions.slice(0, 3).map((rolePermission) => (
                                                    <Badge key={rolePermission.permission.id} variant="secondary">
                                                        {rolePermission.permission.name}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <Badge variant="outline">+{role.permissions.length - 3} khác</Badge>
                                                )}
                                                {role.permissions.length === 0 && (
                                                    <Badge variant="outline">Không có quyền</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {role.users.slice(0, 2).map((roleUser) => (
                                                    <Badge key={roleUser.user.id} variant="outline">
                                                        {roleUser.user.name}
                                                    </Badge>
                                                ))}
                                                {role.users.length > 2 && (
                                                    <Badge variant="outline">+{role.users.length - 2} khác</Badge>
                                                )}
                                                {role.users.length === 0 && (
                                                    <span className="text-sm text-muted-foreground">Không có người dùng</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditRole(role)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleManagePermissions(role)}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteRole(role)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {roles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6">
                                            Không tìm thấy vai trò nào
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <RoleAddEditDialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSuccess={handleRoleUpdated}
                role={null}
                type="add"
            />

            <RoleAddEditDialog
                open={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onSuccess={handleRoleUpdated}
                role={selectedRole}
                type="edit"
            />

            <RoleDeleteDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onSuccess={handleRoleUpdated}
                role={selectedRole}
            />

            <RolePermissionsDialog
                open={showPermissionsDialog}
                onClose={() => setShowPermissionsDialog(false)}
                onSuccess={handleRoleUpdated}
                role={selectedRole}
            />
        </div>
    )
}

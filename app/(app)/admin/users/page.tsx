'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { adminUserAPI } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, Shield, Database, FileText, Users } from 'lucide-react'
import UserAddEditDialog from './components/user-add-edit-dialog'
import UserDeleteDialog from './components/user-delete-dialog'
import UserRolesDialog from './components/user-roles-dialog'
import UserAccessDialog from './components/user-access-dialog'

interface User {
    id: string
    email: string
    asgl_id: string
    name: string
    tokensUsed?: number
    createdAt: string
    updatedAt: string
    roles: Array<{
        role: {
            id: string
            name: string
        }
    }>
    datasets?: Array<{
        dataset: {
            id: string
            name: string
        }
        canView: boolean
        canEdit: boolean
        canDelete: boolean
    }>
    documents?: Array<{
        document: {
            id: string
            name: string
        }
        canView: boolean
        canEdit: boolean
        canDelete: boolean
    }>
}

interface UserStats {
    totalUsers: number
    totalRoles: number
    totalDatasetAccess: number
    totalDocumentAccess: number
}

export default function UsersPage() {
    const { user: currentUser, isAuthenticated } = useAuth()
    const router = useRouter()

    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        totalRoles: 0,
        totalDatasetAccess: 0,
        totalDocumentAccess: 0
    })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showRolesDialog, setShowRolesDialog] = useState(false)
    const [showAccessDialog, setShowAccessDialog] = useState(false)


    // Load users
    const loadUsers = async () => {
        try {
            setLoading(true)
            const response = await adminUserAPI.getUsers(searchQuery || undefined)

            if (response.users) {
                setUsers(response.users)
            }
            if (response.stats) {
                setStats(response.stats)
            }
        } catch (error: any) {
            console.error('Error loading users:', error)
            // Show error notification or toast here
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        // Only load if user is authenticated and is admin
        if (isAuthenticated && currentUser &&
            (currentUser.asgl_id === 'admin' || currentUser.asgl_id === 'superadmin')) {
            loadUsers()
        }
    }, [searchQuery, isAuthenticated, currentUser])

    const handleAddUser = () => {
        setSelectedUser(null)
        setShowAddDialog(true)
    }

    const handleEditUser = (user: User) => {
        setSelectedUser(user)
        setShowEditDialog(true)
    }

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user)
        setShowDeleteDialog(true)
    }

    const handleManageRoles = (user: User) => {
        setSelectedUser(user)
        setShowRolesDialog(true)
    }

    const handleManageAccess = (user: User) => {
        setSelectedUser(user)
        setShowAccessDialog(true)
    }

    const handleUserUpdated = () => {
        loadUsers()
        setShowAddDialog(false)
        setShowEditDialog(false)
        setShowDeleteDialog(false)
        setShowRolesDialog(false)
        setShowAccessDialog(false)
    }
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        Quản lý người dùng
                    </h1>
                    <p className="text-muted-foreground">
                        Quản lý người dùng, phân quyền vai trò và kiểm soát quyền truy cập
                    </p>
                </div>
                <Button onClick={handleAddUser} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm người dùng
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng số người dùng</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Tài khoản người dùng hoạt động
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng số vai trò</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRoles}</div>
                        <p className="text-xs text-muted-foreground">
                            Quyền vai trò đã được phân bổ
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Truy cập Dataset</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDatasetAccess}</div>
                        <p className="text-xs text-muted-foreground">
                            Quyền truy cập dataset đã cấp
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Truy cập Tài liệu</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDocumentAccess}</div>
                        <p className="text-xs text-muted-foreground">
                            Quyền truy cập tài liệu đã cấp
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex flex-col gap-2">
                        <CardTitle>Tài khoản người dùng</CardTitle>
                        <CardDescription>
                            Quản lý người dùng hệ thống và quyền truy cập tài khoản
                        </CardDescription>
                    </div>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground mr-3" />
                        <Input
                            placeholder="Tìm kiếm người dùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p>Đang tải người dùng...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>ASGL ID</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Token đã sử dụng</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="w-[120px]">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                {user.asgl_id}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {user.roles.map((userRole) => (
                                                    <Badge key={userRole.role.id} variant="secondary">
                                                        {userRole.role.name}
                                                    </Badge>
                                                ))}
                                                {user.roles.length === 0 && (
                                                    <Badge variant="outline">Không có vai trò</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {(user.tokensUsed || 0).toLocaleString('vi-VN')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditUser(user)}
                                                    title="Chỉnh sửa người dùng"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleManageRoles(user)}
                                                    title="Quản lý vai trò"
                                                >
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleManageAccess(user)}
                                                    title="Quản lý quyền truy cập"
                                                >
                                                    <Database className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Xóa người dùng"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <div className="text-center">
                                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-500">Không tìm thấy người dùng</p>
                                                {searchQuery && (
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        Thử điều chỉnh từ khóa tìm kiếm của bạn
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <UserAddEditDialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSuccess={handleUserUpdated}
                user={null}
                type="add"
            />

            <UserAddEditDialog
                open={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onSuccess={handleUserUpdated}
                user={selectedUser}
                type="edit"
            />

            <UserDeleteDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onSuccess={handleUserUpdated}
                user={selectedUser}
            />

            <UserRolesDialog
                open={showRolesDialog}
                onClose={() => setShowRolesDialog(false)}
                onSuccess={handleUserUpdated}
                user={selectedUser}
            />

            <UserAccessDialog
                open={showAccessDialog}
                onClose={() => setShowAccessDialog(false)}
                onSuccess={handleUserUpdated}
                user={selectedUser}
            />
        </div>
    )
}

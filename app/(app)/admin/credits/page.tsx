'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, CreditCard, Gift, RefreshCw, Search, TrendingUp, Users, Edit, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface CreditInfo {
    id: string
    userId: string
    month: number
    year: number
    totalCredits: number
    usedCredits: number
    remainingCredits: number
    lastChatAt: string | null
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        email: string
        asgl_id: string
    }
    _count: {
        creditUsages: number
    }
}

interface CreditStats {
    month: number
    year: number
    totalUsers: number
    usersWithCredit: number
    activeUsers: number
    totalUsedCredits: number
    totalRemainingCredits: number
    totalCreditUsages: number
    averageUsagePerActiveUser: number
}



export default function AdminCreditsPage() {
    const { user, isLoading } = useAuth()
    const [credits, setCredits] = useState<CreditInfo[]>([])
    const [stats, setStats] = useState<CreditStats | null>(null)
    const [loadingCredits, setLoadingCredits] = useState(true)
    const [loadingStats, setLoadingStats] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

    // Dialog states
    const [bonusDialogOpen, setBonusDialogOpen] = useState(false)
    const [rowBonusDialogOpen, setRowBonusDialogOpen] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState('')
    const [selectedCredit, setSelectedCredit] = useState<CreditInfo | null>(null)
    const [bonusAmount, setBonusAmount] = useState('')
    const [bonusReason, setBonusReason] = useState('')
    const [editTotalCredits, setEditTotalCredits] = useState('')
    const [editUsedCredits, setEditUsedCredits] = useState('')

    // Check if user is super admin
    const isSuperAdmin = user?.asgl_id === 'superadmin'

    useEffect(() => {
        if (!isLoading && user) {
            if (!isSuperAdmin) {
                toast.error('Chỉ có superadmin mới có quyền truy cập trang này')
                return
            }
            fetchCredits()
            fetchStats()
        }
    }, [user, isLoading, selectedMonth, selectedYear, searchQuery])

    const fetchCredits = async () => {
        try {
            setLoadingCredits(true)
            const params = new URLSearchParams({
                month: selectedMonth.toString(),
                year: selectedYear.toString(),
            })

            if (searchQuery) {
                params.append('query', searchQuery)
            }

            const response = await fetch(`/api/admin/credits?${params}`)
            const data = await response.json()

            if (data.success) {
                setCredits(data.data)
            } else {
                toast.error(data.error || 'Không thể tải thông tin credit')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải thông tin credit')
        } finally {
            setLoadingCredits(false)
        }
    }

    const fetchStats = async () => {
        try {
            setLoadingStats(true)
            const params = new URLSearchParams({
                month: selectedMonth.toString(),
                year: selectedYear.toString(),
                stats: 'true'
            })

            const response = await fetch(`/api/admin/credits?${params}`)
            const data = await response.json()

            if (data.success) {
                setStats(data.data)
            } else {
                toast.error(data.error || 'Không thể tải thống kê credit')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải thống kê credit')
        } finally {
            setLoadingStats(false)
        }
    }

    const handleAddBonus = async () => {
        if (!selectedUserId || !bonusAmount) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            const response = await fetch('/api/admin/credits/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userIdentifier: selectedUserId, // có thể là email hoặc asgl_id
                    amount: parseInt(bonusAmount),
                    month: selectedMonth,
                    year: selectedYear,
                    note: bonusReason
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                setBonusDialogOpen(false)
                setBonusAmount('')
                setBonusReason('')
                setSelectedUserId('')
                fetchCredits()
                fetchStats()
            } else {
                toast.error(data.error || 'Không thể tạo credit mới')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tạo credit mới')
        }
    }

    const handleRowBonus = async () => {
        if (!selectedCredit || !bonusAmount) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            const response = await fetch(`/api/admin/credits/bonus/${selectedCredit.userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseInt(bonusAmount),
                    reason: bonusReason
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                setRowBonusDialogOpen(false)
                setBonusAmount('')
                setBonusReason('')
                setSelectedCredit(null)
                fetchCredits()
                fetchStats()
            } else {
                toast.error(data.error || 'Không thể thêm bonus credit')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm bonus credit')
        }
    }

    const handleResetCredits = async () => {
        try {
            const response = await fetch('/api/admin/credits/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: selectedYear
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.data.message)
                setResetDialogOpen(false)
                fetchCredits()
                fetchStats()
            } else {
                toast.error(data.error || 'Không thể reset credit')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi reset credit')
        }
    }

    const handleEditCredit = async () => {
        if (!selectedCredit || !editTotalCredits || !editUsedCredits) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        const totalCredits = parseInt(editTotalCredits)
        const usedCredits = parseInt(editUsedCredits)

        if (usedCredits > totalCredits) {
            toast.error('Credit đã sử dụng không thể lớn hơn tổng credit')
            return
        }

        try {
            const response = await fetch(`/api/admin/credits/${selectedCredit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    totalCredits,
                    usedCredits,
                    remainingCredits: totalCredits - usedCredits
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Cập nhật credit thành công')
                setEditDialogOpen(false)
                setSelectedCredit(null)
                setEditTotalCredits('')
                setEditUsedCredits('')
                fetchCredits()
                fetchStats()
            } else {
                toast.error(data.error || 'Không thể cập nhật credit')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi cập nhật credit')
        }
    }

    const handleDeleteCredit = async () => {
        if (!selectedCredit) return

        try {
            const response = await fetch(`/api/admin/credits/${selectedCredit.id}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Xóa credit thành công')
                setDeleteDialogOpen(false)
                setSelectedCredit(null)
                fetchCredits()
                fetchStats()
            } else {
                toast.error(data.error || 'Không thể xóa credit')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xóa credit')
        }
    }

    const openEditDialog = (credit: CreditInfo) => {
        setSelectedCredit(credit)
        setEditTotalCredits(credit.totalCredits.toString())
        setEditUsedCredits(credit.usedCredits.toString())
        setEditDialogOpen(true)
    }

    const openDeleteDialog = (credit: CreditInfo) => {
        setSelectedCredit(credit)
        setDeleteDialogOpen(true)
    }

    const openRowBonusDialog = (credit: CreditInfo) => {
        setSelectedCredit(credit)
        setBonusAmount('')
        setBonusReason('')
        setRowBonusDialogOpen(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const getStatusBadge = (credit: CreditInfo) => {
        const usagePercent = (credit.usedCredits / credit.totalCredits) * 100

        if (usagePercent >= 90) {
            return <Badge variant="destructive">Gần hết</Badge>
        } else if (usagePercent >= 70) {
            return <Badge variant="secondary">Đang dùng nhiều</Badge>
        } else if (usagePercent > 0) {
            return <Badge variant="default">Đang hoạt động</Badge>
        } else {
            return <Badge variant="outline">Chưa sử dụng</Badge>
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Đang tải...</div>
    }

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Truy cập bị từ chối</h1>
                <p className="text-muted-foreground">Chỉ có superadmin mới có quyền truy cập trang này.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Quản lý Credit</h1>
                    <p className="text-muted-foreground">
                        Quản lý credit của người dùng trong hệ thống
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo Credit Mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tạo Credit Mới</DialogTitle>
                                <DialogDescription>
                                    Tạo credit mới cho người dùng chưa có credit trong tháng này
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="userId">User ID hoặc Email</Label>
                                    <Input
                                        id="userId"
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        placeholder="Nhập user ID hoặc email"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Nhập ASGL ID hoặc email của user cần tạo credit
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="amount">Số lượng credit</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min="1"
                                        value={bonusAmount}
                                        onChange={(e) => setBonusAmount(e.target.value)}
                                        placeholder="Nhập số credit"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="reason">Ghi chú (tùy chọn)</Label>
                                    <Input
                                        id="reason"
                                        value={bonusReason}
                                        onChange={(e) => setBonusReason(e.target.value)}
                                        placeholder="Ghi chú tạo credit"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setBonusDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button onClick={handleAddBonus}>
                                    Tạo Credit
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset Credit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reset Credit Hàng Tháng</DialogTitle>
                                <DialogDescription>
                                    Reset credit cho tất cả người dùng trong tháng {selectedMonth}/{selectedYear}
                                </DialogDescription>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground">
                                Hành động này sẽ tạo credit mới cho tất cả người dùng nếu chưa có.
                                Credit hiện tại sẽ không bị thay đổi nếu đã tồn tại.
                            </p>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button onClick={handleResetCredits}>
                                    Xác nhận Reset
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4 items-end">
                        <div>
                            <Label>Tháng</Label>
                            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                            Tháng {i + 1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Năm</Label>
                            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year = new Date().getFullYear() - i
                                        return (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label>Tìm kiếm người dùng</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Tìm theo tên, email hoặc ASGL ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.usersWithCredit} có credit
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeUsers}</div>
                            <p className="text-xs text-muted-foreground">
                                Đã sử dụng credit
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Credit đã sử dụng</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsedCredits}</div>
                            <p className="text-xs text-muted-foreground">
                                Còn lại: {stats.totalRemainingCredits}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">TB mỗi người</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.averageUsagePerActiveUser}</div>
                            <p className="text-xs text-muted-foreground">
                                Credit/người hoạt động
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Credits Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Credit</CardTitle>
                    <CardDescription>
                        Credit của người dùng trong tháng {selectedMonth}/{selectedYear}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingCredits ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="text-muted-foreground">Đang tải...</div>
                        </div>
                    ) : credits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-muted-foreground">Không có dữ liệu credit</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Người dùng</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Tổng</TableHead>
                                        <TableHead className="text-right">Đã dùng</TableHead>
                                        <TableHead className="text-right">Còn lại</TableHead>
                                        <TableHead className="text-right">Lần chat cuối</TableHead>
                                        <TableHead className="text-right">Số lần sử dụng</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {credits.map((credit) => (
                                        <TableRow key={credit.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{credit.user.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {credit.user.email} • {credit.user.asgl_id}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(credit)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {credit.totalCredits}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {credit.usedCredits}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {credit.remainingCredits}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {credit.lastChatAt ? formatDate(credit.lastChatAt) : 'Chưa chat'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {credit._count.creditUsages}
                                            </TableCell>
                                            <TableCell >
                                                <div className="flex justify-end items-center gap-2">
                                                    <Gift
                                                        onClick={() => openRowBonusDialog(credit)}
                                                        className="h-4 w-4 mr-2 cursor-pointer text-blue-600 hover:text-blue-800"
                                                    />
                                                    <Edit
                                                        onClick={() => openEditDialog(credit)}
                                                        className="h-4 w-4 mr-2 cursor-pointer text-green-600 hover:text-green-800"
                                                    />
                                                    <Trash2
                                                        onClick={() => openDeleteDialog(credit)}
                                                        className="h-4 w-4 mr-2 cursor-pointer text-red-600 hover:text-red-800"
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Credit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa Credit</DialogTitle>
                        <DialogDescription>
                            Chỉnh sửa thông tin credit cho {selectedCredit?.user.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Người dùng</Label>
                            <div className="p-2 bg-muted rounded">
                                {selectedCredit?.user.name} ({selectedCredit?.user.asgl_id})
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="editTotalCredits">Tổng credit</Label>
                            <Input
                                id="editTotalCredits"
                                type="number"
                                min="0"
                                value={editTotalCredits}
                                onChange={(e) => setEditTotalCredits(e.target.value)}
                                placeholder="Tổng credit"
                            />
                        </div>
                        <div>
                            <Label htmlFor="editUsedCredits">Credit đã sử dụng</Label>
                            <Input
                                id="editUsedCredits"
                                type="number"
                                min="0"
                                value={editUsedCredits}
                                onChange={(e) => setEditUsedCredits(e.target.value)}
                                placeholder="Credit đã sử dụng"
                            />
                        </div>
                        <div>
                            <Label>Credit còn lại</Label>
                            <div className="p-2 bg-muted rounded">
                                {editTotalCredits && editUsedCredits
                                    ? (parseInt(editTotalCredits) - parseInt(editUsedCredits))
                                    : 0
                                }
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleEditCredit}>
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Credit Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa Credit</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa credit của {selectedCredit?.user.name}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded">
                            <p className="text-sm text-destructive">
                                <strong>Cảnh báo:</strong> Hành động này sẽ xóa vĩnh viễn:
                            </p>
                            <ul className="text-sm text-destructive mt-2 ml-4 list-disc">
                                <li>Credit record của {selectedCredit?.user.name}</li>
                                <li>Tất cả lịch sử sử dụng credit ({selectedCredit?._count.creditUsages} record)</li>
                            </ul>
                        </div>
                        <div>
                            <Label>Thông tin Credit sẽ bị xóa:</Label>
                            <div className="p-2 bg-muted rounded text-sm">
                                <div>Tổng: {selectedCredit?.totalCredits}</div>
                                <div>Đã sử dụng: {selectedCredit?.usedCredits}</div>
                                <div>Còn lại: {selectedCredit?.remainingCredits}</div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteCredit}>
                            Xóa Credit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Row Bonus Dialog */}
            <Dialog open={rowBonusDialogOpen} onOpenChange={setRowBonusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm Bonus Credit</DialogTitle>
                        <DialogDescription>
                            Thêm credit bonus cho {selectedCredit?.user.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Người dùng</Label>
                            <div className="p-2 bg-muted rounded">
                                {selectedCredit?.user.name} ({selectedCredit?.user.asgl_id})
                            </div>
                        </div>
                        <div>
                            <Label>Thông tin Credit hiện tại</Label>
                            <div className="p-2 bg-muted rounded text-sm">
                                <div>Tổng: {selectedCredit?.totalCredits}</div>
                                <div>Đã sử dụng: {selectedCredit?.usedCredits}</div>
                                <div>Còn lại: {selectedCredit?.remainingCredits}</div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="bonusAmount">Số credit bonus</Label>
                            <Input
                                id="bonusAmount"
                                type="number"
                                min="1"
                                value={bonusAmount}
                                onChange={(e) => setBonusAmount(e.target.value)}
                                placeholder="Nhập số credit bonus"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bonusReason">Lý do (tùy chọn)</Label>
                            <Input
                                id="bonusReason"
                                value={bonusReason}
                                onChange={(e) => setBonusReason(e.target.value)}
                                placeholder="Lý do thêm bonus"
                            />
                        </div>
                        {bonusAmount && (
                            <div>
                                <Label>Credit sau khi thêm bonus</Label>
                                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                    <div>Tổng: {selectedCredit ? selectedCredit.totalCredits + parseInt(bonusAmount || '0') : 0}</div>
                                    <div>Đã sử dụng: {selectedCredit?.usedCredits}</div>
                                    <div>Còn lại: {selectedCredit ? selectedCredit.remainingCredits + parseInt(bonusAmount || '0') : 0}</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRowBonusDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleRowBonus}>
                            Thêm Bonus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Activity,
    Users,
    MessageSquare,
    Clock,
    DollarSign
} from 'lucide-react'

interface TraceData {
    id: string
    timestamp: string
    name?: string
    userId?: string
    sessionId?: string
    version?: string
    release?: string
    environment?: string
    input?: any
    output?: any
    metadata?: any
    tags?: string[]
    level: string
    statusMessage?: string
    totalCost?: number
    latency?: number
    [key: string]: any
}

interface TracesResponse {
    data: TraceData[]
    meta: {
        page: number
        limit: number
        totalItems: number
        totalPages: number
    }
}

export default function AdminLangfusePage() {
    const { user, isLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [tracesData, setTracesData] = useState<TracesResponse | null>(null)

    // Form states
    const [fromTimestamp, setFromTimestamp] = useState<string>('2025-01-01T00:00:00Z')
    const [toTimestamp, setToTimestamp] = useState<string>('2025-09-20T23:59:59Z')
    const [limit, setLimit] = useState<string>('50')
    const [page, setPage] = useState<string>('1')
    const [userId, setUserId] = useState<string>('user_c6917075-c848-49b7-a522-51d8316d29ea:cmf48lfus000iazi7ycxzb21g')
    const [sessionId, setSessionId] = useState<string>('')

    // Check if user is super admin
    const isSuperAdmin = user?.asgl_id === 'superadmin'

    useEffect(() => {
        if (!isLoading && user) {
            if (!isSuperAdmin) {
                toast.error('Chỉ có superadmin mới có quyền truy cập trang này')
                return
            }
            // Load initial data
            fetchTraces()
        }
    }, [user, isLoading])

    const fetchTraces = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page,
                limit,
                userId,
                sessionId,
                fromTimestamp,
                toTimestamp
            })

            const response = await fetch(`/api/admin/langfuse?${params}`)
            const data = await response.json()

            if (data.success) {
                setTracesData(data.data)
                toast.success('Đã tải thành công dữ liệu traces')
            } else {
                toast.error(data.error || 'Không thể tải thông tin traces')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải thông tin traces')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const formatCurrency = (amount?: number) => {
        if (!amount) return '$0.0000'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4
        }).format(amount)
    }

    const calculateTotalCost = () => {
        if (!tracesData?.data) return 0
        return tracesData.data.reduce((sum, trace) => sum + (trace.totalCost || 0), 0)
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
                    <h1 className="text-3xl font-bold">Langfuse Traces</h1>
                    <p className="text-muted-foreground">
                        Theo dõi và phân tích traces từ Langfuse
                    </p>
                </div>
            </div>

            {/* Filter Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <Label htmlFor="fromTimestamp">Từ thời gian</Label>
                            <Input
                                id="fromTimestamp"
                                type="datetime-local"
                                value={fromTimestamp.replace('Z', '').replace('.000', '')}
                                onChange={(e) => setFromTimestamp(e.target.value + 'Z')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="toTimestamp">Đến thời gian</Label>
                            <Input
                                id="toTimestamp"
                                type="datetime-local"
                                value={toTimestamp.replace('Z', '').replace('.000', '')}
                                onChange={(e) => setToTimestamp(e.target.value + 'Z')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="limit">Giới hạn</Label>
                            <Input
                                id="limit"
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                min="1"
                                max="500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <Label htmlFor="userId">User ID</Label>
                            <Input
                                id="userId"
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter User ID"
                            />
                        </div>
                        <div>
                            <Label htmlFor="sessionId">Session ID</Label>
                            <Input
                                id="sessionId"
                                type="text"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                placeholder="Enter Session ID (optional)"
                            />
                        </div>
                        <div>
                            <Label htmlFor="page">Trang</Label>
                            <Input
                                id="page"
                                type="number"
                                value={page}
                                onChange={(e) => setPage(e.target.value)}
                                min="1"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={fetchTraces}
                            disabled={loading}
                        >
                            {loading ? 'Đang tải...' : 'Tải dữ liệu'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            {tracesData && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng Traces</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tracesData.meta.totalItems}</div>
                            <p className="text-xs text-muted-foreground">
                                Trong hệ thống
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng Chi phí</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(calculateTotalCost())}</div>
                            <p className="text-xs text-muted-foreground">
                                Chi phí hiện tại
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trang hiện tại</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tracesData.meta.page}/{tracesData.meta.totalPages}</div>
                            <p className="text-xs text-muted-foreground">
                                Hiển thị {tracesData.data.length} traces
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Set(tracesData.data.filter(t => t.userId).map(t => t.userId)).size}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Người dùng khác nhau
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Set(tracesData.data.filter(t => t.sessionId).map(t => t.sessionId)).size}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sessions khác nhau
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Traces Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Traces</CardTitle>
                    <CardDescription>
                        Hiển thị các traces từ Langfuse API
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : tracesData && tracesData.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Session ID</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>Latency</TableHead>
                                    <TableHead>Token</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Tags</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tracesData.data.map((trace) => (
                                    <TableRow key={trace.id}>
                                        <TableCell className="font-mono text-xs">
                                            {trace.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {trace.name || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {trace.userId ? trace.userId.substring(0, 20) + '...' : '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {trace.sessionId ? trace.sessionId.substring(0, 8) + '...' : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                trace.level === 'ERROR' ? 'destructive' :
                                                    trace.level === 'WARNING' ? 'secondary' :
                                                        'default'
                                            }>
                                                {trace.level}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(trace.totalCost)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {trace.latency ? `${trace.latency} ms` : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {trace.metadata.total_tokens || '-'}
                                        </TableCell>
                                        <TableCell>{formatDate(trace.timestamp)}</TableCell>
                                        <TableCell>
                                            {trace.tags && trace.tags.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {trace.tags.slice(0, 2).map((tag, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {trace.tags.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{trace.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            Không có dữ liệu traces
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {tracesData && tracesData.meta.totalPages > 1 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPage(String(Math.max(1, parseInt(page) - 1)))
                                }}
                                disabled={parseInt(page) <= 1 || loading}
                            >
                                Trang trước
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Trang {tracesData.meta.page} / {tracesData.meta.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPage(String(Math.min(tracesData.meta.totalPages, parseInt(page) + 1)))
                                }}
                                disabled={parseInt(page) >= tracesData.meta.totalPages || loading}
                            >
                                Trang sau
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

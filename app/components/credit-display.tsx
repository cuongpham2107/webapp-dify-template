'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, History, Info } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface CreditInfo {
    totalCredits: number
    usedCredits: number
    remainingCredits: number
    month: number
    year: number
    lastChatAt: string | null
}

interface CreditUsageHistory {
    id: string
    amount: number
    action: string
    metadata?: string
    createdAt: string
    credit: {
        month: number
        year: number
    }
}

interface CreditDisplayProps {
    className?: string
}

export function CreditDisplay({ className }: CreditDisplayProps) {
    const { user } = useAuth()
    const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
    const [history, setHistory] = useState<CreditUsageHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

    useEffect(() => {
        if (user) {
            fetchCreditInfo()
        }
    }, [user])

    const fetchCreditInfo = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/credits')
            const data = await response.json()

            if (data.success) {
                setCreditInfo(data.data)
            } else {
                console.error('Failed to fetch credit info:', data.error)
            }
        } catch (error) {
            console.error('Error fetching credit info:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true)
            const response = await fetch('/api/credits/history?limit=20')
            const data = await response.json()

            if (data.success) {
                setHistory(data.data)
            } else {
                toast.error('Không thể tải lịch sử sử dụng credit')
            }
        } catch (error) {
            console.error('Error fetching credit history:', error)
            toast.error('Có lỗi xảy ra khi tải lịch sử')
        } finally {
            setHistoryLoading(false)
        }
    }

    const handleHistoryClick = () => {
        setHistoryDialogOpen(true)
        if (history.length === 0) {
            fetchHistory()
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const getActionText = (action: string) => {
        switch (action) {
            case 'chat':
                return 'Trò chuyện'
            case 'bonus':
                return 'Thưởng'
            default:
                return action
        }
    }

    const getUsagePercent = () => {
        if (!creditInfo) return 0
        return (creditInfo.usedCredits / creditInfo.totalCredits) * 100
    }

    const getStatusColor = () => {
        const percent = getUsagePercent()
        if (percent >= 90) return 'destructive'
        if (percent >= 70) return 'secondary'
        return 'default'
    }

    const getStatusText = () => {
        const percent = getUsagePercent()
        if (percent >= 90) return 'Gần hết'
        if (percent >= 70) return 'Đang dùng nhiều'
        if (percent > 0) return 'Bình thường'
        return 'Chưa sử dụng'
    }

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center">
                        <div className="text-sm text-muted-foreground">Đang tải thông tin credit...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!creditInfo) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center">
                        <div className="text-sm text-muted-foreground">Không thể tải thông tin credit</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className={className}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Credit tháng {creditInfo.month}/{creditInfo.year}
                        </CardTitle>
                        <CardDescription>
                            Còn lại {creditInfo.remainingCredits} / {creditInfo.totalCredits} credit
                        </CardDescription>
                    </div>
                    <Badge variant={getStatusColor()}>
                        {getStatusText()}
                    </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Đã sử dụng: {creditInfo.usedCredits}</span>
                            <span>{Math.round(getUsagePercent())}%</span>
                        </div>
                        <Progress value={getUsagePercent()} className="h-2" />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                            Lần sử dụng cuối: {creditInfo.lastChatAt ? formatDate(creditInfo.lastChatAt) : 'Chưa sử dụng'}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleHistoryClick}
                            className="h-6 px-2"
                        >
                            <History className="h-3 w-3 mr-1" />
                            Lịch sử
                        </Button>
                    </div>

                    {creditInfo.remainingCredits === 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-destructive">Hết credit!</p>
                                    <p className="text-muted-foreground">
                                        Bạn đã sử dụng hết credit cho tháng này. Credit sẽ được reset vào đầu tháng tới.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History Dialog */}
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Lịch sử sử dụng Credit</DialogTitle>
                        <DialogDescription>
                            20 giao dịch gần nhất
                        </DialogDescription>
                    </DialogHeader>

                    {historyLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="text-sm text-muted-foreground">Đang tải...</div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-sm text-muted-foreground">Chưa có lịch sử sử dụng</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Thời gian</TableHead>
                                        <TableHead>Hành động</TableHead>
                                        <TableHead className="text-right">Số lượng</TableHead>
                                        <TableHead>Tháng</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-sm">
                                                {formatDate(item.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {item.action === 'bonus' && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Thưởng
                                                        </Badge>
                                                    )}
                                                    {getActionText(item.action)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {item.amount > 0 ? `-${item.amount}` : `+${Math.abs(item.amount)}`}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {item.credit.month}/{item.credit.year}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

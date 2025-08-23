'use client'

import { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { getAllDatasets } from '@/lib/api/dataset'
import { Dataset } from '@/types/base'
import { PenBox, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'



interface DatasetTableProps {
    datasets: Dataset[]
}

export function DatasetTable({ datasets }: DatasetTableProps) {
    const router = useRouter()
    return (
        <Table className="border border-gray-300 rounded-md overflow-hidden">
            <TableHeader>
                <TableRow className="bg-gray-100">
                    <TableHead className="border-b border-r border-gray-300">Tên</TableHead>
                    <TableHead className="border-b border-r border-gray-300">Dataset ID</TableHead>
                    <TableHead className="border-b border-r border-gray-300">Số lượng tài liệu</TableHead>
                    <TableHead className="border-b border-r border-gray-300">Ngày tạo</TableHead>
                    <TableHead className="border-b border-gray-300 text-center">Thao tác</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {!datasets || datasets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center border-b border-gray-300">Không có dataset nào</TableCell>
                    </TableRow>
                ) : (
                    (datasets ?? []).map((dataset, idx) => (
                        <TableRow
                            key={dataset.id}
                            className={`cursor-pointer hover:bg-gray-50 ${idx !== (datasets.length - 1) ? 'border-b border-gray-300' : ''}`}
                            onClick={() => router.push(`/dataset/${dataset.id}`)}
                        >
                            <TableCell className="font-medium border-r border-gray-300">{dataset.name}</TableCell>
                            <TableCell className="border-r border-gray-300">{dataset.dataset_id}</TableCell>
                            <TableCell className="border-r border-gray-300">{dataset.documents.length}</TableCell>
                            <TableCell className="border-r border-gray-300">
                                {formatDistanceToNow(new Date(dataset.createdAt), { addSuffix: true, locale: vi })}
                            </TableCell>
                            <TableCell className='space-x-2 text-center'>
                                <Button className='' variant="outline">
                                    <PenBox className="inline-block" />
                                </Button>
                                <Button className='' variant="outline">
                                    <Trash2 className="inline-block" color='red' />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>

    )
}
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
import { Document } from '@/types/base'
import { PenBox, Trash2, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/use-permissions'
import { DocumentDownloadButton } from '@/components/ui/document-download'

interface DocumentTableProps {
    documents: Document[]
    onEdit?: (document: Document) => void
    onDelete?: (document: Document) => void
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get file type icon
function getFileTypeIcon(type: string) {
    // You can extend this with more specific icons based on file type
    return <FileText className="w-4 h-4" />;
}

export function DocumentTable({ documents, onEdit, onDelete }: DocumentTableProps) {
    const router = useRouter()
    const { userPermissions, canAccess } = usePermissions()

    // Permission checks
    const canEditDocuments = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('documents', 'edit')
    const canDeleteDocuments = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('documents', 'delete')
    const canDownloadDocuments = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('documents', 'view')

    const showActions = canEditDocuments || canDeleteDocuments || canDownloadDocuments

    return (
        <Table className="border border-gray-300 rounded-md overflow-hidden">
            <TableHeader>
                <TableRow className="bg-gray-100">
                    <TableHead className="border-b border-r border-gray-300">Tên</TableHead>
                    <TableHead className="border-b border-r border-gray-300">Loại</TableHead>
                    <TableHead className="border-b border-r border-gray-300">Kích thước</TableHead>
                    <TableHead className="border-b border-r border-gray-300">Document ID</TableHead>
                    <TableHead className={`border-b ${showActions ? 'border-r' : ''} border-gray-300`}>Ngày tạo</TableHead>
                    {showActions && (
                        <TableHead className="border-b border-gray-300 text-center">Thao tác</TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {!documents || documents.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={showActions ? 6 : 5} className="text-center border-b border-gray-300">
                            Không có tài liệu nào
                        </TableCell>
                    </TableRow>
                ) : (
                    (documents ?? []).map((document, idx) => (
                        <TableRow
                            key={document.id}
                            className={`cursor-pointer hover:bg-gray-50 ${idx !== (documents.length - 1) ? 'border-b border-gray-300' : ''}`}
                        >
                            <TableCell className="font-medium border-r border-gray-300">
                                <div className="flex items-center gap-2">
                                    {getFileTypeIcon(document.type)}
                                    {document.name}
                                </div>
                            </TableCell>
                            <TableCell className="border-r border-gray-300">
                                <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                                    {document.type.toUpperCase()}
                                </span>
                            </TableCell>
                            <TableCell className="border-r border-gray-300">
                                {formatFileSize(document.size)}
                            </TableCell>
                            <TableCell className="border-r border-gray-300 font-mono text-sm">
                                {document.document_id}
                            </TableCell>
                            <TableCell className={`${showActions ? 'border-r' : ''} border-gray-300`}>
                                {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true, locale: vi })}
                            </TableCell>
                            {showActions && (
                                <TableCell className='flex flex-row space-x-2 text-center'>

                                    {canEditDocuments && onEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(document);
                                            }}
                                        >
                                            <PenBox className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {canDownloadDocuments && (
                                        <DocumentDownloadButton
                                            documentId={document.id}
                                            datasetId={""} // Will be fetched from database
                                            documentName={document.name}
                                            variant="outline"
                                            size="sm"
                                        />
                                    )}
                                    {canDeleteDocuments && onDelete && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(document);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" color='red' />
                                        </Button>
                                    )}

                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
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
import { Dataset, Document } from '@/types/base'
import { PenBox, Trash2, FileText, Folder, FolderOpen, Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/use-permissions'
import { DocumentDownloadButton } from '../[...id]/components/document-download'
import { AddEditDatasetDialog } from './add-edit'
import { DeleteDatasetDialog } from './delete-confirm'
import { AddEditDocumentDialog } from '../[...id]/components/document-add-edit'
import { DeleteDocumentDialog } from '../[...id]/components/document-delete-confirm'

// Union type for table data
type TableData = Dataset | Document

// Type guards to differentiate between datasets and documents
function isDataset(item: TableData): item is Dataset {
    return 'dataset_id' in item && 'children' in item
}

function isDocument(item: TableData): item is Document {
    return 'document_id' in item && 'type' in item && 'size' in item
}

interface UnifiedTableProps {
    data: TableData[]
    type: 'dataset' | 'document' | 'mixed'
    datasetId?: string
    currentPath?: string[] // Add current path for nested navigation
    // Callback handlers
    handleReloadDatasets?: () => void
    onEdit?: (document: Document) => void
    onDelete?: (document: Document) => void
    onRefresh?: () => void
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Enhanced helper function to get specific file type icons with hover support
function getFileTypeIcon(type: string, isHovered: boolean = false) {
    const fileType = type.toLowerCase()

    // Return FileText with hover-aware styling for all document types
    // Future enhancement: could add specific icons for different file types
    return <FileText className={`w-4 h-4 ${isHovered ? 'text-blue-600' : 'text-green-600'}`} />
}

export function UnifiedTable({
    data,
    type,
    datasetId,
    currentPath = [],
    handleReloadDatasets,
    onEdit,
    onDelete,
    onRefresh
}: UnifiedTableProps) {
    const router = useRouter()
    const { userPermissions, canAccess } = usePermissions()

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'dataset' | 'document'>('all')

    // Debounced search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

    // Hover state for rows
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Optimized permission checks
    const isAdmin = userPermissions.isAdmin || userPermissions.isSuperAdmin
    const canEditDatasets = isAdmin || canAccess('datasets', 'edit')
    const canDeleteDatasets = isAdmin || canAccess('datasets', 'delete')
    const canEditDocuments = isAdmin || canAccess('documents', 'edit')
    const canDeleteDocuments = isAdmin || canAccess('documents', 'delete')
    const canDownloadDocuments = (type === 'document' || type === 'mixed') && (isAdmin || canAccess('documents', 'view'))

    // Dynamic permission based on type and context
    const canEditItems = type === 'dataset' ? canEditDatasets : type === 'document' ? canEditDocuments : (canEditDatasets || canEditDocuments)
    const canDeleteItems = type === 'dataset' ? canDeleteDatasets : type === 'document' ? canDeleteDocuments : (canDeleteDatasets || canDeleteDocuments)

    const showActions = canEditItems || canDeleteItems || canDownloadDocuments

    // Define columns based on type - optimized for maintainability
    const getColumns = () => {
        const baseColumns = {
            name: { key: 'name', label: 'Tên', width: 'w-1/4' },
            createdAt: { key: 'created_at', label: 'Ngày tạo', width: 'w-1/6' },
            actions: { key: 'actions', label: 'Thao tác', width: 'w-1/6' }
        }

        const datasetColumns = [
            baseColumns.name,
            { key: 'dataset_id', label: 'Dataset ID', width: 'w-1/4' },
            { key: 'document_count', label: 'Số lượng tài liệu', width: 'w-1/6' },
            baseColumns.createdAt,
            ...(showActions ? [baseColumns.actions] : [])
        ]

        const documentColumns = [
            { key: 'name', label: 'Tên', width: 'w-1/5' },
            { key: 'type', label: 'Định dạng', width: 'w-1/6' },
            { key: 'size', label: 'Kích thước', width: 'w-1/6' },
            { key: 'document_id', label: 'Document ID', width: 'w-1/4' },
            baseColumns.createdAt,
            ...(showActions ? [baseColumns.actions] : [])
        ]

        const mixedColumns = [
            { key: 'type_indicator', label: 'Loại', width: 'w-1/8' },
            baseColumns.name,
            { key: 'id_or_type', label: 'ID/Định dạng', width: 'w-1/5' },
            { key: 'size_or_count', label: 'Kích thước/Số lượng', width: 'w-1/6' },
            baseColumns.createdAt,
            ...(showActions ? [baseColumns.actions] : [])
        ]

        return type === 'dataset' ? datasetColumns : type === 'document' ? documentColumns : mixedColumns
    }

    const columns = getColumns()

    // Filter and search logic
    const filteredData = useMemo(() => {
        let filtered = data

        // Apply type filter for mixed mode
        if (type === 'mixed' && filterType !== 'all') {
            filtered = filtered.filter(item => {
                if (filterType === 'dataset') return isDataset(item)
                if (filterType === 'document') return isDocument(item)
                return true
            })
        }

        // Apply search filter
        if (debouncedSearchTerm) {
            filtered = filtered.filter(item => {
                const searchLower = debouncedSearchTerm.toLowerCase()

                // Search in name
                if (item.name.toLowerCase().includes(searchLower)) return true

                // Search in dataset_id for datasets
                if (isDataset(item) && item.dataset_id.toLowerCase().includes(searchLower)) return true

                // Search in document_id and type for documents
                if (isDocument(item)) {
                    if (item.document_id.toLowerCase().includes(searchLower)) return true
                    if (item.type.toLowerCase().includes(searchLower)) return true
                }

                return false
            })
        }

        return filtered
    }, [data, debouncedSearchTerm, filterType, type])

    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('')
        setDebouncedSearchTerm('')
    }, [])

    // Clear filter function
    const clearFilter = useCallback(() => {
        setFilterType('all')
    }, [])

    const renderCell = (item: TableData, columnKey: string) => {
        switch (columnKey) {
            case 'type_indicator':
                return (
                    <div className="flex items-center justify-center">
                        {isDataset(item) ? (
                            hoveredRowId === item.id ? (
                                <FolderOpen strokeWidth={1.5} className="w-8 h-8 text-blue-600" />
                            ) : (
                                <Folder strokeWidth={1.5} className="w-8 h-8 text-gray-600" />
                            )
                        ) : (
                            hoveredRowId === item.id ? (
                                <FileText strokeWidth={1.5} className="w-8 h-8 text-green-600" />
                            ) : (
                                <FileText strokeWidth={1.5} className="w-8 h-8 text-gray-600" />
                            )
                        )}
                    </div>
                )

            case 'name':
                if (type === 'mixed') {
                    return (
                        <div className="flex items-center gap-2">
                            {item.name}
                        </div>
                    )
                } else if (type === 'document' && isDocument(item)) {
                    return (
                        <div className="flex items-center gap-2">
                            {getFileTypeIcon(item.type, hoveredRowId === item.id)}
                            {item.name}
                        </div>
                    )
                } else if (type === 'dataset' && isDataset(item)) {
                    return (
                        <div className="flex items-center gap-2">
                            {hoveredRowId === item.id ? (
                                <FolderOpen className="w-4 h-4 text-blue-600" />
                            ) : (
                                <Folder className="w-4 h-4 text-blue-600" />
                            )}
                            {item.name}
                        </div>
                    )
                }
                return item.name

            case 'dataset_id':
                return isDataset(item) ? item.dataset_id : ''

            case 'document_count':
                return isDataset(item) ? item.documents?.length || 0 : ''

            case 'type':
                return isDocument(item) ? (
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                        {item.type.toUpperCase()}
                    </span>
                ) : ''

            case 'size':
                return isDocument(item) ? formatFileSize(item.size) : ''

            case 'document_id':
                return isDocument(item) ? (
                    <span className="font-mono text-sm">{item.document_id}</span>
                ) : ''

            case 'id_or_type':
                if (isDataset(item)) {
                    return (
                        <span className="font-mono text-sm">{item.dataset_id}</span>
                    )
                } else if (isDocument(item)) {
                    return (
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                            {item.type.toUpperCase()}
                        </span>
                    )
                }
                return ''

            case 'size_or_count':
                if (isDataset(item)) {
                    return `${item.children?.length || 0} thưc mục | ${item.documents?.length || 0} tài liệu`
                } else if (isDocument(item)) {
                    return formatFileSize(item.size)
                }
                return ''

            case 'created_at':
                return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })

            case 'actions':
                return renderActions(item)

            default:
                return ''
        }
    }

    const renderActions = (item: TableData) => {
        if (isDataset(item)) {
            return (
                <div className='flex flex-row space-x-2 justify-center items-center'>
                    {canEditDatasets && (
                        <AddEditDatasetDialog
                            type="edit"
                            id={item.id}
                            parentId={item.parent_id}
                            handleReloadDatasets={handleReloadDatasets || onRefresh}
                        />
                    )}
                    {canDeleteDatasets && (
                        <DeleteDatasetDialog
                            id={item.id}
                            name={item.name}
                            onDeleted={handleReloadDatasets || onRefresh}
                        />
                    )}
                </div>
            )
        } else if (isDocument(item)) {
            return (
                <div className='flex flex-row space-x-2 justify-center items-center'>
                    {canEditDocuments && onEdit && (
                        <AddEditDocumentDialog
                            type="edit"
                            id={item.id}
                            datasetId={datasetId || ''}
                            document={item}
                            handleReloadDocuments={onRefresh || (() => onEdit && onEdit(item))}
                        />
                    )}
                    {canDownloadDocuments && datasetId && (
                        <DocumentDownloadButton
                            documentId={item.id}
                            datasetId={datasetId}
                            documentName={item.name}
                            variant="outline"
                            size="sm"
                        />
                    )}
                    {canDeleteDocuments && onDelete && (
                        <DeleteDocumentDialog
                            id={item.id}
                            name={item.name}
                            onDeleted={() => onDelete(item)}
                        />
                    )}
                </div>
            )
        }
        return null
    }

    const handleRowClick = (item: TableData) => {
        if (isDataset(item)) {
            // Build nested path: current path + new dataset ID
            const newPath = [...currentPath, item.id].join('/');
            router.push(`/dataset/${newPath}`);
        }
        // Documents don't have row click navigation
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder={type === 'mixed' ? 'Tìm kiếm thư mục hoặc tài liệu...' : type === 'dataset' ? 'Tìm kiếm thư mục...' : 'Tìm kiếm tài liệu...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSearch}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Filter Controls - Only show for mixed type */}
                {type === 'mixed' && (
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <Select value={filterType} onValueChange={(value: 'all' | 'dataset' | 'document') => setFilterType(value)}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="dataset">
                                    <div className="flex items-center gap-2">
                                        <Folder className="w-4 h-4 text-blue-600" />
                                        Dataset
                                    </div>
                                </SelectItem>
                                <SelectItem value="document">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-green-600" />
                                        Tài liệu
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {filterType !== 'all' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilter}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {(debouncedSearchTerm || filterType !== 'all') && (
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                    <span>
                        Hiển thị {filteredData.length} trong tổng số {data.length} mục
                    </span>
                    {debouncedSearchTerm && (
                        <span className="text-blue-600">
                            - Tìm kiếm: "{debouncedSearchTerm}"
                        </span>
                    )}
                    |
                    {filterType !== 'all' && (
                        <span className="text-blue-600">
                            - Lọc: {filterType === 'dataset' ? 'Dataset' : 'Tài liệu'}
                        </span>
                    )}
                </div>
            )}

            <Table className="border border-gray-300 rounded-md overflow-hidden">
                <TableHeader>
                    <TableRow className="bg-gray-100">
                        {columns.map((column, index) => (
                            <TableHead
                                key={column.key}
                                className={`border-b text-black font-semibold ${index < columns.length - 1 ? 'border-r' : ''} border-gray-300 ${column.key === 'actions' ? 'text-center' : ''}`}
                            >
                                {column.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!filteredData || filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="text-center border-b border-gray-300">
                                {debouncedSearchTerm || filterType !== 'all'
                                    ? 'Không tìm thấy kết quả nào phù hợp'
                                    : type === 'dataset'
                                        ? 'Không có dataset nào'
                                        : type === 'document'
                                            ? 'Không có tài liệu nào'
                                            : 'Không có dữ liệu nào'
                                }
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((item, idx) => (
                            <TableRow
                                key={item.id}
                                className={`${isDataset(item) ? 'cursor-pointer' : ''} hover:bg-gray-50 ${idx !== (filteredData.length - 1) ? 'border-b border-gray-300' : ''}`}
                                onClick={() => isDataset(item) && handleRowClick(item)}
                                onMouseEnter={() => setHoveredRowId(item.id)}
                                onMouseLeave={() => setHoveredRowId(null)}
                            >
                                {columns.map((column, colIndex) => (
                                    <TableCell
                                        key={column.key}
                                        className={`${column.key === 'name' ? 'font-medium' : ''} ${colIndex < columns.length - 1 ? 'border-r' : ''} border-gray-300 ${column.key === 'actions' ? 'text-center' : ''}`}
                                        onClick={column.key === 'actions' ? (e) => e.stopPropagation() : undefined}
                                    >
                                        {renderCell(item, column.key)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
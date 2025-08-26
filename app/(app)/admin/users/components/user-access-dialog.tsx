'use client'

import { useState, useEffect } from 'react'
import { adminUserAPI, adminDatasetAPI, adminDocumentAPI } from '@/lib/api/admin'
import { useAdmin } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
}

interface Dataset {
    id: string
    name: string
    dataset_id: string
}

interface Document {
    id: string
    name: string
    document_id: string
    dataset: {
        name: string
    }
}

interface AccessPermissions {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
}

interface UserAccessDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    user: User | null
}

export default function UserAccessDialog({
    open,
    onClose,
    onSuccess,
    user
}: UserAccessDialogProps) {
    const [loading, setLoading] = useState(false)
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [datasetAccess, setDatasetAccess] = useState<Record<string, AccessPermissions>>({})
    const [documentAccess, setDocumentAccess] = useState<Record<string, AccessPermissions>>({})
    const [fetchingData, setFetchingData] = useState(false)
    const [datasetSearchQuery, setDatasetSearchQuery] = useState('')
    const [documentSearchQuery, setDocumentSearchQuery] = useState('')
    const { isAdmin, isLoading: adminLoading } = useAdmin()

    useEffect(() => {
        if (open && user && !adminLoading) {
            fetchAllData()
        }
    }, [open, user, adminLoading])

    const fetchAllData = async () => {
        if (!user) return

        try {
            setFetchingData(true)

            // Check if current user is admin/superadmin
            if (!isAdmin) {
                toast.error("Access denied. Admin privileges required.")
                return
            }

            // Fetch all datasets and documents for admin users
            const [allDatasetsResponse, allDocumentsResponse, userAccessResponse] = await Promise.all([
                adminDatasetAPI.getAllDatasets(), // Get all datasets
                adminDocumentAPI.getAllDocuments(), // Get all documents
                adminUserAPI.getUserAccess(user.id) // Get current user's access
            ])

            // Process all datasets
            const allDatasets = allDatasetsResponse.datasets || []
            const datasetPermissions: Record<string, AccessPermissions> = {}

            // Initialize all datasets with no permissions
            allDatasets.forEach((dataset: any) => {
                datasetPermissions[dataset.id] = {
                    canView: false,
                    canEdit: false,
                    canDelete: false
                }
            })

            // Update with existing user permissions
            const datasetAccessData = userAccessResponse.datasetAccess || []
            datasetAccessData.forEach((access: any) => {
                if (access.dataset && datasetPermissions[access.dataset.id]) {
                    datasetPermissions[access.dataset.id] = {
                        canView: access.canView || false,
                        canEdit: access.canEdit || false,
                        canDelete: access.canDelete || false
                    }
                }
            })

            // Process all documents
            const allDocuments = allDocumentsResponse.documents || []
            const documentPermissions: Record<string, AccessPermissions> = {}

            // Initialize all documents with no permissions and prepare display format
            const documentsWithDatasetInfo = allDocuments.map((doc: any) => ({
                id: doc.id,
                name: doc.name,
                document_id: doc.document_id,
                dataset: {
                    name: doc.dataset?.name || 'Unknown Dataset'
                }
            }))

            documentsWithDatasetInfo.forEach((doc: any) => {
                documentPermissions[doc.id] = {
                    canView: false,
                    canEdit: false,
                    canDelete: false
                }
            })

            // Update with existing user document permissions
            const documentAccessData = userAccessResponse.documentAccess || []
            documentAccessData.forEach((access: any) => {
                if (access.document && documentPermissions[access.document.id]) {
                    documentPermissions[access.document.id] = {
                        canView: access.canView || false,
                        canEdit: access.canEdit || false,
                        canDelete: access.canDelete || false
                    }
                }
            })

            setDatasets(allDatasets)
            setDocuments(documentsWithDatasetInfo)
            setDatasetAccess(datasetPermissions)
            setDocumentAccess(documentPermissions)
        } catch (error: any) {
            console.error('Error fetching access data:', error)
            toast.error("Failed to fetch access data")
        } finally {
            setFetchingData(false)
        }
    }

    const handleDatasetPermissionChange = (datasetId: string, permission: keyof AccessPermissions, value: boolean) => {
        setDatasetAccess(prev => ({
            ...prev,
            [datasetId]: {
                ...prev[datasetId],
                [permission]: value
            }
        }))
    }

    const handleDocumentPermissionChange = (documentId: string, permission: keyof AccessPermissions, value: boolean) => {
        setDocumentAccess(prev => ({
            ...prev,
            [documentId]: {
                ...prev[documentId],
                [permission]: value
            }
        }))
    }

    const handleSave = async () => {
        if (!user) return

        try {
            setLoading(true)

            // Filter out datasets and documents with no permissions
            const filteredDatasetAccess = Object.fromEntries(
                Object.entries(datasetAccess).filter(([_, permissions]) =>
                    permissions.canView || permissions.canEdit || permissions.canDelete
                )
            )

            const filteredDocumentAccess = Object.fromEntries(
                Object.entries(documentAccess).filter(([_, permissions]) =>
                    permissions.canView || permissions.canEdit || permissions.canDelete
                )
            )

            await adminUserAPI.updateUserAccess(user.id, {
                datasetAccess: filteredDatasetAccess,
                documentAccess: filteredDocumentAccess
            })

            const totalDatasetPermissions = Object.keys(filteredDatasetAccess).length
            const totalDocumentPermissions = Object.keys(filteredDocumentAccess).length

            toast.success(`Cập nhật quyền truy cập thành công! Đã cấp quyền cho ${totalDatasetPermissions} datasets và ${totalDocumentPermissions} documents.`)

            onSuccess()
        } catch (error: any) {
            console.error('Error updating user access:', error)
            toast.error(error.message || "Failed to update user access")
        } finally {
            setLoading(false)
        }
    }

    // Bulk actions for datasets
    const handleBulkDatasetAction = (action: 'selectAll' | 'selectNone' | 'viewOnly') => {
        const filteredDatasets = datasets.filter(dataset =>
            dataset.name.toLowerCase().includes(datasetSearchQuery.toLowerCase())
        )

        const newAccess = { ...datasetAccess }
        filteredDatasets.forEach(dataset => {
            switch (action) {
                case 'selectAll':
                    newAccess[dataset.id] = { canView: true, canEdit: true, canDelete: true }
                    break
                case 'selectNone':
                    newAccess[dataset.id] = { canView: false, canEdit: false, canDelete: false }
                    break
                case 'viewOnly':
                    newAccess[dataset.id] = { canView: true, canEdit: false, canDelete: false }
                    break
            }
        })
        setDatasetAccess(newAccess)
    }

    // Bulk actions for documents
    const handleBulkDocumentAction = (action: 'selectAll' | 'selectNone' | 'viewOnly') => {
        const filteredDocuments = documents.filter(document =>
            document.name.toLowerCase().includes(documentSearchQuery.toLowerCase()) ||
            document.dataset.name.toLowerCase().includes(documentSearchQuery.toLowerCase())
        )

        const newAccess = { ...documentAccess }
        filteredDocuments.forEach(document => {
            switch (action) {
                case 'selectAll':
                    newAccess[document.id] = { canView: true, canEdit: true, canDelete: true }
                    break
                case 'selectNone':
                    newAccess[document.id] = { canView: false, canEdit: false, canDelete: false }
                    break
                case 'viewOnly':
                    newAccess[document.id] = { canView: true, canEdit: false, canDelete: false }
                    break
            }
        })
        setDocumentAccess(newAccess)
    }

    // Filter datasets and documents based on search
    const filteredDatasets = datasets.filter(dataset =>
        dataset.name.toLowerCase().includes(datasetSearchQuery.toLowerCase())
    )

    const filteredDocuments = documents.filter(document =>
        document.name.toLowerCase().includes(documentSearchQuery.toLowerCase()) ||
        document.dataset.name.toLowerCase().includes(documentSearchQuery.toLowerCase())
    )

    const renderPermissionCheckboxes = (
        itemId: string,
        permissions: AccessPermissions,
        onChange: (permission: keyof AccessPermissions, value: boolean) => void
    ) => (
        <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={`${itemId}-view`}
                    checked={permissions?.canView || false}
                    onCheckedChange={(checked) => onChange('canView', checked as boolean)}
                />
                <label htmlFor={`${itemId}-view`} className="text-sm">Xem</label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={`${itemId}-edit`}
                    checked={permissions?.canEdit || false}
                    onCheckedChange={(checked) => onChange('canEdit', checked as boolean)}
                />
                <label htmlFor={`${itemId}-edit`} className="text-sm">Sửa</label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={`${itemId}-delete`}
                    checked={permissions?.canDelete || false}
                    onCheckedChange={(checked) => onChange('canDelete', checked as boolean)}
                />
                <label htmlFor={`${itemId}-delete`} className="text-sm">Xoá</label>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Quản lý quyền truy cập người dùng</DialogTitle>
                    <DialogDescription>
                        Cấp quyền truy cập datasets và documents cho user. Chỉ admin và superadmin mới có thể thực hiện thao tác này.
                    </DialogDescription>
                </DialogHeader>

                {user && (
                    <div className="py-4">
                        <div className="mb-4">
                            <p><strong>Tài khoản:</strong> {user.name} ({user.email})</p>
                        </div>

                        {fetchingData ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                <p>Đang tải dữ liệu truy cập ...</p>
                            </div>
                        ) : !isAdmin ? (
                            <div className="text-center py-8">
                                <p className="text-red-500">Chỉ admin và superadmin mới có quyền quản lý quyền truy cập</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="datasets" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="datasets">Datasets ({datasets.length})</TabsTrigger>
                                    <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                                </TabsList>

                                <TabsContent value="datasets" className="space-y-4 max-h-96 overflow-y-auto">
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <strong>Hướng dẫn:</strong> Chọn các quyền mà user <strong>{user?.name}</strong> có thể thực hiện trên từng dataset.
                                            Chỉ những dataset được chọn quyền "Xem" trở lên mới hiển thị cho user này.
                                        </p>
                                    </div>

                                    {/* Search and bulk actions */}
                                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <Input
                                                placeholder="Tìm kiếm thư mục..."
                                                value={datasetSearchQuery}
                                                onChange={(e) => setDatasetSearchQuery(e.target.value)}
                                                className="flex-1"
                                            />
                                            <span className="text-sm text-gray-500 min-w-fit">
                                                {filteredDatasets.length}/{datasets.length}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBulkDatasetAction('viewOnly')}
                                            >
                                                Chỉ xem tất cả
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBulkDatasetAction('selectAll')}
                                            >
                                                Chọn tất cả
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBulkDatasetAction('selectNone')}
                                            >
                                                Bỏ chọn tất cả
                                            </Button>
                                        </div>
                                    </div>

                                    {filteredDatasets.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            {datasetSearchQuery ? 'Không tìm thấy dataset nào khớp với từ khóa' : 'Không có dataset nào trong hệ thống'}
                                        </p>
                                    ) : (
                                        filteredDatasets.map((dataset) => (
                                            <div key={dataset.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-medium text-lg">{dataset.name}</h4>
                                                        <p className="text-sm text-gray-500">ID: {dataset.dataset_id}</p>
                                                    </div>
                                                </div>
                                                <div className="border-t pt-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Quyền truy cập:</p>
                                                    {renderPermissionCheckboxes(
                                                        dataset.id,
                                                        datasetAccess[dataset.id] || { canView: false, canEdit: false, canDelete: false },
                                                        (permission, value) => handleDatasetPermissionChange(dataset.id, permission, value)
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>

                                <TabsContent value="documents" className="space-y-4 max-h-96 overflow-y-auto">
                                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm text-green-700">
                                            <strong>Hướng dẫn:</strong> Chọn các quyền mà user <strong>{user?.name}</strong> có thể thực hiện trên từng document.
                                            Chỉ những document được chọn quyền "Xem" trở lên mới hiển thị cho user này.
                                        </p>
                                    </div>

                                    {/* Search and bulk actions */}
                                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <Input
                                                placeholder="Tìm kiếm document hoặc dataset..."
                                                value={documentSearchQuery}
                                                onChange={(e) => setDocumentSearchQuery(e.target.value)}
                                                className="flex-1"
                                            />
                                            <span className="text-sm text-gray-500 min-w-fit">
                                                {filteredDocuments.length}/{documents.length}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBulkDocumentAction('viewOnly')}
                                            >
                                                Chỉ xem tất cả
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBulkDocumentAction('selectAll')}
                                            >
                                                Chọn tất cả
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBulkDocumentAction('selectNone')}
                                            >
                                                Bỏ chọn tất cả
                                            </Button>
                                        </div>
                                    </div>

                                    {filteredDocuments.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            {documentSearchQuery ? 'Không tìm thấy document nào khớp với từ khóa' : 'Không có document nào trong hệ thống'}
                                        </p>
                                    ) : (
                                        filteredDocuments.map((document) => (
                                            <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-medium text-lg">{document.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Dataset: <span className="font-medium">{document.dataset.name}</span> | ID: {document.document_id}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="border-t pt-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Quyền truy cập:</p>
                                                    {renderPermissionCheckboxes(
                                                        document.id,
                                                        documentAccess[document.id] || { canView: false, canEdit: false, canDelete: false },
                                                        (permission, value) => handleDocumentPermissionChange(document.id, permission, value)
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Huỷ
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || fetchingData || !isAdmin}
                    >
                        {loading ? 'Đang lưu...' : 'Cập nhật quyền truy cập'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
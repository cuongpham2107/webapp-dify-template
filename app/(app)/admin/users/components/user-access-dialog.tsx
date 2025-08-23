'use client'

import { useState, useEffect } from 'react'
import { adminUserAPI } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

    useEffect(() => {
        if (open && user) {
            fetchUserAccess()
        }
    }, [open, user])

    const fetchUserAccess = async () => {
        if (!user) return

        try {
            setFetchingData(true)
            const response = await adminUserAPI.getUserAccess(user.id)

            // Process dataset access data
            const datasetAccessData = response.datasetAccess || []
            const datasetsMap = new Map()
            const datasetPermissions: Record<string, AccessPermissions> = {}

            datasetAccessData.forEach((access: any) => {
                // Add dataset to map if not already present
                if (access.dataset && !datasetsMap.has(access.dataset.id)) {
                    datasetsMap.set(access.dataset.id, {
                        id: access.dataset.id,
                        name: access.dataset.name,
                        dataset_id: access.dataset.dataset_id
                    })
                }

                // Set permissions for this dataset
                if (access.dataset) {
                    datasetPermissions[access.dataset.id] = {
                        canView: access.canView || false,
                        canEdit: access.canEdit || false,
                        canDelete: access.canDelete || false
                    }
                }
            })

            // Process document access data
            const documentAccessData = response.documentAccess || []
            const documentsMap = new Map()
            const documentPermissions: Record<string, AccessPermissions> = {}

            documentAccessData.forEach((access: any) => {
                // Add document to map if not already present
                if (access.document && !documentsMap.has(access.document.id)) {
                    documentsMap.set(access.document.id, {
                        id: access.document.id,
                        name: access.document.name,
                        document_id: access.document.document_id,
                        dataset: {
                            name: access.document.dataset?.name || 'Unknown Dataset'
                        }
                    })
                }

                // Set permissions for this document
                if (access.document) {
                    documentPermissions[access.document.id] = {
                        canView: access.canView || false,
                        canEdit: access.canEdit || false,
                        canDelete: access.canDelete || false
                    }
                }
            })

            // Convert maps to arrays
            const datasetsArray = Array.from(datasetsMap.values())
            const documentsArray = Array.from(documentsMap.values())

            setDatasets(datasetsArray)
            setDocuments(documentsArray)
            setDatasetAccess(datasetPermissions)
            setDocumentAccess(documentPermissions)
        } catch (error: any) {
            console.error('Error fetching user access:', error)
            toast.error("Failed to fetch user access data")
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
            await adminUserAPI.updateUserAccess(user.id, {
                datasetAccess,
                documentAccess
            })

            toast.success("User access permissions updated successfully")

            onSuccess()
        } catch (error: any) {
            console.error('Error updating user access:', error)
            toast.error(error.message || "Failed to update user access",)
        } finally {
            setLoading(false)
        }
    }

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
                        Định cấu hình dữ liệu và quyền truy cập tài liệu cho người dùng này.
                    </DialogDescription>
                </DialogHeader>

                {user && (
                    <div className="py-4">
                        <div className="mb-4">
                            <p><strong>Tìa khoản:</strong> {user.name} ({user.email})</p>
                        </div>

                        {fetchingData ? (
                            <div className="text-center py-8">Đang tải dữ liệu truy cập ...</div>
                        ) : (
                            <Tabs defaultValue="datasets" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="datasets">Tài liệu</TabsTrigger>
                                    <TabsTrigger value="documents">Tệp đính kèm</TabsTrigger>
                                </TabsList>

                                <TabsContent value="datasets" className="space-y-4 max-h-96 overflow-y-auto">

                                    {datasets.length === 0 ? (
                                        <p className="text-sm text-gray-500">Không có bộ dữ liệu có sẵn</p>
                                    ) : (
                                        datasets.map((dataset) => (
                                            <div key={dataset.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-medium">{dataset.name}</h4>
                                                        <p className="text-sm text-gray-500">ID: {dataset.dataset_id}</p>
                                                    </div>
                                                </div>
                                                {renderPermissionCheckboxes(
                                                    dataset.id,
                                                    datasetAccess[dataset.id] || { canView: false, canEdit: false, canDelete: false },
                                                    (permission, value) => handleDatasetPermissionChange(dataset.id, permission, value)
                                                )}
                                            </div>
                                        ))
                                    )}
                                </TabsContent>

                                <TabsContent value="documents" className="space-y-4 max-h-96 overflow-y-auto">
                                    {documents.length === 0 ? (
                                        <p className="text-sm text-gray-500">Không có tài liệu có sẵn</p>
                                    ) : (
                                        documents.map((document) => (
                                            <div key={document.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-medium">{document.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Dataset: {document.dataset.name} | ID: {document.document_id}
                                                        </p>
                                                    </div>
                                                </div>
                                                {renderPermissionCheckboxes(
                                                    document.id,
                                                    documentAccess[document.id] || { canView: false, canEdit: false, canDelete: false },
                                                    (permission, value) => handleDocumentPermissionChange(document.id, permission, value)
                                                )}
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
                        disabled={loading || fetchingData}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu quyền truy cập'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
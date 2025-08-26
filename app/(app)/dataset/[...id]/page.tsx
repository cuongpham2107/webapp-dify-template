'use client'

import { getDatasetById } from "@/lib/api/dataset";
import { AddEditDatasetDialog } from "../components/add-edit";
import { UnifiedTable } from "../components/unified-table";
import { AddEditDocumentDialog } from "./components/document-add-edit";
import { DeleteDocumentDialog } from "./components/document-delete-confirm";
import { getAllDocuments } from "@/lib/api/document";
import { useEffect, useState } from "react";
import { Dataset, Document } from "@/types/base";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

export default function DatasetDetailPage({ params }: { params: { id: string[] } }) {
    const datasetId = params.id[0];
    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [deleteDocument, setDeleteDocument] = useState<Document | null>(null);

    // Get user permissions
    const { userPermissions, isLoading: permissionsLoading, canAccess } = usePermissions();

    useEffect(() => {
        if (!permissionsLoading) {
            fetchDatasets(datasetId);
            fetchDocuments();
        }
    }, [datasetId, permissionsLoading]);

    const fetchDatasets = async (datasetId: string) => {
        try {
            setLoading(true);
            const response = await getDatasetById(datasetId);
            setDataset(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }

    const fetchDocuments = async () => {
        try {
            setDocumentsLoading(true);
            const response = await getAllDocuments(datasetId);
            setDocuments(response.documents || []);
        } catch (err) {
            console.error('Error fetching documents:', err);
        } finally {
            setDocumentsLoading(false);
        }
    }

    const handleEditDocument = (document: Document) => {
        setSelectedDocument(document);
    }

    const handleDeleteDocument = (document: Document) => {
        setDeleteDocument(document);
    }

    // Permission checks
    const canViewDatasets = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('datasets', 'view');
    const canCreateDatasets = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('datasets', 'create');
    const canViewDocuments = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('documents', 'view');
    const canCreateDocuments = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('documents', 'create');

    // Combine datasets and documents into a single array
    const combinedData = [];
    if (canViewDatasets && dataset?.children) {
        combinedData.push(...dataset.children);
    }
    if (canViewDocuments) {
        combinedData.push(...documents);
    }

    if (permissionsLoading || loading) {
        return <div className="p-4">Đang tải...</div>;
    }

    if (!canViewDatasets && !canViewDocuments) {
        return <div className="p-4">Bạn không có quyền truy cập trang này</div>;
    }

    if (error) {
        return <div className="p-4">Lỗi: {error}</div>;
    }

    if (!dataset) {
        return <div className="p-4">Không tìm thấy dataset</div>;
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{dataset.name}</h1>
                    <p className="text-muted-foreground">ID: {datasetId}</p>
                </div>
                <div className="flex gap-2">
                    {canCreateDatasets && (
                        <AddEditDatasetDialog
                            type="add"
                            parentId={datasetId}
                            handleReloadDatasets={() => fetchDatasets(datasetId)}
                        />
                    )}
                    {canCreateDocuments && (
                        <AddEditDocumentDialog
                            type="add"
                            datasetId={datasetId}
                            handleReloadDocuments={fetchDocuments}
                        />
                    )}
                </div>
            </div>

            {/* Combined Table */}
            <div className="space-y-4">
                <div className="border border-gray-300 rounded-md">
                    {(loading || documentsLoading) ? (
                        <div className="text-center py-8">Đang tải...</div>
                    ) : (
                        <UnifiedTable
                            data={combinedData}
                            type="mixed"
                            datasetId={datasetId}
                            handleReloadDatasets={() => fetchDatasets(datasetId)}
                            onEdit={handleEditDocument}
                            onDelete={handleDeleteDocument}
                        />
                    )}
                </div>
            </div>

            {/* Edit Document Dialog */}
            {selectedDocument && canCreateDocuments && (
                <AddEditDocumentDialog
                    type="edit"
                    id={selectedDocument.id}
                    datasetId={datasetId}
                    document={selectedDocument}
                    handleReloadDocuments={() => {
                        fetchDocuments();
                        setSelectedDocument(null);
                    }}
                />
            )}

            {/* Delete Document Dialog */}
            {deleteDocument && (
                <DeleteDocumentDialog
                    id={deleteDocument.id}
                    name={deleteDocument.name}
                    onDeleted={() => {
                        fetchDocuments();
                        setDeleteDocument(null);
                    }}
                />
            )}
        </div>
    );
}

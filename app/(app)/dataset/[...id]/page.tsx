'use client'

import { getDatasetById, getAllDatasets } from "@/lib/api/dataset";
import { AddEditDatasetDialog } from "../components/add-edit";
import { UnifiedTable } from "../components/unified-table";
import { AddEditDocumentDialog } from "./components/document-add-edit";
import { DeleteDocumentDialog } from "./components/document-delete-confirm";
import { getAllDocuments } from "@/lib/api/document";
import { useEffect, useState } from "react";
import React from "react";
import { Dataset, Document } from "@/types/base";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";

export default function DatasetDetailPage({ params }: { params: { id: string[] } }) {
    const router = useRouter();
    // For nested paths like dataset/id1/id2/id3, the last ID is the current dataset
    const currentPath = params.id; // Full path array
    const datasetId = params.id[params.id.length - 1]; // Current dataset ID (last in path)
    const parentPath = params.id.slice(0, -1); // Parent path (all except last)
    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [deleteDocument, setDeleteDocument] = useState<Document | null>(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; name: string }[]>([]);

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
            console.log('Fetching dataset:', datasetId);
            console.log('Current path:', currentPath);
            console.log('Parent path:', parentPath);

            const response = await getDatasetById(datasetId);
            console.log('Dataset response:', response);
            setDataset(response);

            // Build breadcrumb path by fetching each dataset in the hierarchy
            await buildBreadcrumbPath();
        } catch (err) {
            console.error('Error in fetchDatasets:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }

    // Function to build breadcrumb path from the URL segments
    const buildBreadcrumbPath = async () => {
        const pathItems: { id: string; name: string }[] = [];

        // Fetch each dataset in the path to get their names
        for (let i = 0; i < currentPath.length; i++) {
            try {
                const pathDatasetId = currentPath[i];
                const pathDataset = await getDatasetById(pathDatasetId);
                pathItems.push({ id: pathDatasetId, name: pathDataset.name });
            } catch (err) {
                console.error(`Error fetching dataset ${currentPath[i]}:`, err);
                // If we can't fetch a dataset, use its ID as name
                pathItems.push({ id: currentPath[i], name: currentPath[i] });
            }
        }

        setBreadcrumbPath(pathItems);
    };

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
            {/* Breadcrumb Navigation */}
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/">
                                Trang chủ
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbPage>Quản lý tài liệu</BreadcrumbPage>
                        </BreadcrumbItem>

                        {/* Dynamic breadcrumb path for nested datasets */}
                        {breadcrumbPath.map((pathItem, index) => (
                            <React.Fragment key={pathItem.id}>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    {index === breadcrumbPath.length - 1 ? (
                                        // Last item is current page - not clickable
                                        <BreadcrumbPage>{pathItem.name}</BreadcrumbPage>
                                    ) : (
                                        // Previous items are clickable
                                        <BreadcrumbLink
                                            href={`/dataset/${currentPath.slice(0, index + 1).join('/')}`}
                                        >
                                            {pathItem.name}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{dataset.name}</h1>
                    <p className="text-muted-foreground">ID: {datasetId}</p>
                </div>
                <div className="flex gap-2 items-center">
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
                            currentPath={currentPath}
                            handleReloadDatasets={() => fetchDatasets(datasetId)}
                            onEdit={handleEditDocument}
                            onDelete={handleDeleteDocument}
                        />
                    )}
                </div>
            </div>

            {/* Edit Document Dialog */}
            {
                selectedDocument && canCreateDocuments && (
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
                )
            }

            {/* Delete Document Dialog */}
            {
                deleteDocument && (
                    <DeleteDocumentDialog
                        id={deleteDocument.id}
                        name={deleteDocument.name}
                        onDeleted={() => {
                            fetchDocuments();
                            setDeleteDocument(null);
                        }}
                    />
                )
            }
        </div >
    );
}

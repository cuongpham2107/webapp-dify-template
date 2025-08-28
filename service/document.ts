import { DifyClient } from "dify-client";
import type { RequestMethods } from "dify-client";
import { API_URL, APP_KEY_DATA } from '@/config';

export const documentRoutes = {
    getDocuments: {
        method: "GET" as RequestMethods,
        url: (datasetId: string, params: {
            page: number,
            limit: number
        }) => {
            const { page, limit } = params;
            return `/datasets/${datasetId}/documents?page=${page}&limit=${limit}`;
        }
    },
    getDocumentDetail: {
        method: "GET" as RequestMethods,
        url: (datasetId: string, documentId: string) => `/datasets/${datasetId}/documents/${documentId}?metadata=all`
    },
    uploadFile: {
        method: "POST" as RequestMethods,
        url: () => `/files/upload`
    },
    createDocumentByFile: {
        method: "POST" as RequestMethods,
        url: (datasetId: string) => `/datasets/${datasetId}/documents`
    },
    updateDocumentWithFile: {
        method: "POST" as RequestMethods,
        url: (datasetId: string, documentId: string) => `/datasets/${datasetId}/documents/${documentId}/update_by_file`
    },
    deleteDocument: {
        method: "DELETE" as RequestMethods,
        url: (datasetId: string, documentId: string) => `/datasets/${datasetId}/documents/${documentId}`
    },
    getUploadFile: {
        method: "GET" as RequestMethods,
        url: (datasetId: string, documentId: string) => `/datasets/${datasetId}/documents/${documentId}/upload-file`
    }
}

export class DocumentClient extends DifyClient {

    getDocuments(datasetId: string, page: number = 1, limit: number = 20) {
        return this.sendRequest(
            documentRoutes.getDocuments.method,
            documentRoutes.getDocuments.url(datasetId, { page, limit })
        );
    }

    getDocumentDetail(datasetId: string, documentId: string) {
        return this.sendRequest(
            documentRoutes.getDocumentDetail.method,
            documentRoutes.getDocumentDetail.url(datasetId, documentId)
        );
    }

    // Create document with file using direct fetch to properly handle multipart/form-data
    async createDocumentWithFile(datasetId: string, data: any, file: File) {
        try {

            // Use direct fetch instead of sendRequest to properly handle FormData
            const formData = new FormData();

            // Match the exact data structure from the curl command
            const documentData = {
                name: data.name,
                indexing_technique: 'high_quality',
                process_rule: {
                    rules: {
                        pre_processing_rules: [
                            { id: "remove_extra_spaces", enabled: true },
                            { id: "remove_urls_emails", enabled: true }
                        ],
                        segmentation: {
                            separator: "/n/n",
                            max_tokens: 1024,
                            chunk_overlap: 50
                        }
                    },
                    mode: "custom"
                }
            };

            // Add the data field as JSON string (as in curl)
            formData.append('data', JSON.stringify(documentData));

            // Add the file
            formData.append('file', file);

            const endpoint = `/datasets/${datasetId}/document/create-by-file`;

            // Use direct fetch with proper headers for multipart/form-data
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${APP_KEY_DATA}`,
                    // DON'T set Content-Type - let browser set it with boundary for multipart/form-data
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData
                });
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { data: result }; // Wrap in data property to match expected format

        } catch (error: any) {
            console.error('Error in createDocumentWithFile:', error);
            console.error('Error details:', {
                message: error?.message || 'Unknown error',
                status: error?.status,
                statusText: error?.statusText
            });
            throw error;
        }
    }

    updateDocumentWithFile(datasetId: string, documentId: string, data: any, file: File) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));
        formData.append('file', file);

        return this.sendRequest(
            documentRoutes.updateDocumentWithFile.method,
            documentRoutes.updateDocumentWithFile.url(datasetId, documentId),
            formData
        );
    }

    deleteDocument(datasetId: string, documentId: string) {
        return this.sendRequest(
            documentRoutes.deleteDocument.method,
            documentRoutes.deleteDocument.url(datasetId, documentId)
        );
    }

    // Download/fetch file from document using upload-file endpoint
    async downloadFile(datasetId: string, documentId: string) {
        try {
            const endpoint = documentRoutes.getUploadFile.url(datasetId, documentId);

            // Step 1: Get file information and download URL
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${APP_KEY_DATA}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }



            // Parse the JSON response to get download URL
            const fileInfo = await response.json();

            if (!fileInfo.download_url) {
                throw new Error('No download URL provided in response');
            }

            // Step 2: Download the actual file using the download_url
            // Note: File URLs are served from the root domain, not /v1 endpoint
            const baseURL = API_URL.replace('/v1', ''); // Remove /v1 for file downloads
            const fileDownloadURL = fileInfo.download_url.startsWith('http')
                ? fileInfo.download_url
                : `${baseURL}${fileInfo.download_url}`;

            const downloadResponse = await fetch(fileDownloadURL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${APP_KEY_DATA}`,
                }
            });

            if (!downloadResponse.ok) {
                throw new Error(`Failed to download file: HTTP ${downloadResponse.status}`);
            }

            // Get the file blob
            const blob = await downloadResponse.blob();
            const filename = fileInfo.name || this.getFilenameFromResponse(downloadResponse) || `document_${documentId}`;

            return {
                data: {
                    blob: blob,
                    filename: filename,
                    size: blob.size,
                    type: blob.type || fileInfo.mime_type || 'application/octet-stream',
                    url: URL.createObjectURL(blob),
                    fileInfo: fileInfo // Include original file info
                }
            };

        } catch (error: any) {
            console.error('Error details:', {
                message: error?.message || 'Unknown error',
                datasetId,
                documentId
            });
            throw error;
        }
    }

    // Helper method to extract filename from response headers
    private getFilenameFromResponse(response: Response): string | null {
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                return filenameMatch[1];
            }
        }
        return null;
    }

    // Alternative method using the sendRequest approach
    getFileInfo(datasetId: string, documentId: string) {
        return this.sendRequest(
            documentRoutes.getUploadFile.method,
            documentRoutes.getUploadFile.url(datasetId, documentId)
        );
    }
}
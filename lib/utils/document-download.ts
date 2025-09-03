/**
 * Document File Download Utilities
 * 
 * This module provides convenient functions for downloading document files
 * through the Next.js API routes with proper error handling and user feedback.
 */

export interface DownloadOptions {
    onProgress?: (progress: number) => void;
    onStart?: () => void;
    onComplete?: (filename: string) => void;
    onError?: (error: string) => void;
}

export interface FileInfo {
    documentId: string;
    datasetId: string;
    data: any;
    downloadUrl: string;
}

/**
 * Download a document file directly
 * @param documentId - The ID of the document (internal database ID)
 * @param datasetId - Optional dataset ID (deprecated - will be fetched from database)
 * @param options - Optional callback functions for handling download events
 */
export async function downloadDocumentFile(
    documentId: string,
    datasetId?: string, // Made optional since we fetch from database
    options: DownloadOptions = {}
): Promise<void> {
    const { onProgress, onStart, onComplete, onError } = options;

    try {
        onStart?.();

        const downloadUrl = `/api/documents/${documentId}/download`;

        // Create a fetch request to get the file
        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Check if response is a file or JSON
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            // Handle JSON response (file not available)
            const data = await response.json();
            throw new Error(data.message || 'File not available for download');
        }

        // Get filename from headers
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `document_${documentId}`;

        if (contentDisposition) {
            // Handle both encoded (filename*=UTF-8'') and standard (filename="") formats
            const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
            const standardMatch = contentDisposition.match(/filename="?([^"]+)"?/);

            if (encodedMatch) {
                filename = decodeURIComponent(encodedMatch[1]);
            } else if (standardMatch) {
                filename = standardMatch[1];
            }
        }

        // Handle file download with progress tracking
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('ReadableStream not supported');
        }

        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            received += value.length;

            // Report progress
            if (total > 0 && onProgress) {
                const progress = (received / total) * 100;
                onProgress(progress);
            }
        }

        // Create blob and download
        const blob = new Blob(chunks);
        const url = URL.createObjectURL(blob);

        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        URL.revokeObjectURL(url);

        onComplete?.(filename);

    } catch (error: any) {
        console.error('Document download failed:', error);
        onError?.(error.message || 'Download failed');
        throw error;
    }
}

/**
 * Get file information without downloading
 * @param documentId - The ID of the document (internal database ID)
 * @param datasetId - Optional dataset ID (deprecated - will be fetched from database)
 */
export async function getDocumentFileInfo(
    documentId: string,
    datasetId?: string // Made optional since we fetch from database
): Promise<FileInfo> {
    try {
        const response = await fetch(`/api/documents/${documentId}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ datasetId }) // Send datasetId if provided, otherwise API will fetch from database
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();

    } catch (error: any) {
        console.error('Failed to get file info:', error);
        throw error;
    }
}

/**
 * Check if a document file is available for download
 * @param documentId - The ID of the document (internal database ID)
 * @param datasetId - Optional dataset ID (deprecated - will be fetched from database)
 */
export async function isDocumentFileAvailable(
    documentId: string,
    datasetId?: string // Made optional since we fetch from database
): Promise<boolean> {
    try {
        await getDocumentFileInfo(documentId, datasetId);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * React hook for document file downloads
 */
export function useDocumentDownload() {
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const downloadFile = async (documentId: string, datasetId?: string) => {
        setDownloading(true);
        setProgress(0);
        setError(null);

        try {
            await downloadDocumentFile(documentId, datasetId, {
                onStart: () => {
                    setProgress(0);
                },
                onProgress: (progress) => {
                    setProgress(progress);
                },
                onComplete: (filename) => {
                    setProgress(100);

                },
                onError: (error) => {
                    setError(error);
                }
            });
        } catch (err: any) {
            setError(err.message || 'Download failed');
        } finally {
            setDownloading(false);
        }
    };

    const reset = () => {
        setDownloading(false);
        setProgress(0);
        setError(null);
    };

    return {
        downloading,
        progress,
        error,
        downloadFile,
        reset
    };
}

// Import useState for the hook
import { useState } from 'react';
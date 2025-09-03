// Document API client functions for frontend communication

export const getAllDocuments = async (datasetId: string) => {
    const res = await fetch(`/api/documents?datasetId=${datasetId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return res.json();
};

export const createDocument = async (
    name: string,
    type: string,
    size: number,
    datasetId: string,
    file: File  // Make file required
) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('size', size.toString());
    formData.append('datasetId', datasetId);
    formData.append('file', file);

    const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
    });
    return res;
};

export const getDocumentById = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return res.json();
};

export const updateDocument = async (
    id: string,
    name: string,
    type: string,
    size: number,
    asgl_id: string,
    file?: File
) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('size', size.toString());
    formData.append('asgl_id', asgl_id);

    if (file) {
        formData.append('file', file);
    }

    const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        body: formData,
    });
    return res;
};

export const deleteDocument = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    return res;
};

export const createBatchDocuments = async (
    files: File[],
    datasetId: string,
    onProgress?: (index: number, progress: number) => void
) => {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            onProgress?.(i, 0);

            const formData = new FormData();
            formData.append('name', file.name);
            formData.append('type', file.type || getFileExtension(file.name));
            formData.append('size', file.size.toString());
            formData.append('datasetId', datasetId);
            formData.append('file', file);

            const res = await fetch("/api/documents", {
                method: "POST",
                body: formData,
            });

            onProgress?.(i, 100);

            if (res.ok) {
                const data = await res.json();
                results.push({ success: true, document: data.document, file: file.name });
            } else {
                const errorData = await res.json();
                errors.push({ file: file.name, error: errorData.error || "Tải lên thất bại" });
                results.push({ success: false, file: file.name, error: errorData.error });
            }
        } catch (error: any) {
            errors.push({ file: file.name, error: error.message || "Lỗi mạng" });
            results.push({ success: false, file: file.name, error: error.message });
        }
    }

    return { results, errors, totalFiles: files.length };
};

const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

// Document download function with proper filename handling
export const downloadDocument = async (documentId: string, datasetId?: string) => {
    const url = new URL(`/api/documents/${documentId}/download`, window.location.origin);
    if (datasetId) {
        url.searchParams.set('datasetId', datasetId);
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header
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

    // Get blob
    const blob = await response.blob();

    return {
        blob,
        filename,
        contentType: response.headers.get('content-type') || 'application/octet-stream'
    };
};

// Trigger file download in browser
export const triggerDocumentDownload = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Download and save document file
export const downloadAndSaveDocument = async (documentId: string, datasetId?: string): Promise<void> => {
    try {
        const { blob, filename } = await downloadDocument(documentId, datasetId);
        triggerDocumentDownload(blob, filename);
    } catch (error) {
        console.error('Error downloading document file:', error);
        throw error;
    }
};
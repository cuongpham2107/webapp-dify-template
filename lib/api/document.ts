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
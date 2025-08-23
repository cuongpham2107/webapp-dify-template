
export const getAllDatasets = async (parent_id?: string) => {
    const res = await fetch(`/api/dataset?parent_id=${parent_id || ""}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return res.json();
};

export const createDataset = async (name: string, parent_id: string | null) => {
    const res = await fetch("/api/dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id }),
    });
    return res;
};


export const getDatasetById = async (id: string) => {
    const res = await fetch(`/api/dataset/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return res.json();
}

export const updateDataset = async (id: string, name: string, parent_id: string | null, asgl_id: string) => {
    const res = await fetch(`/api/dataset/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id, asgl_id }),
    });
    return res;
};

export const deleteDataset = async (id: string) => {
    const res = await fetch(`/api/dataset/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    return res;
};

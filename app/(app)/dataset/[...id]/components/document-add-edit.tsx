import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { createDocument, updateDocument, getDocumentById } from "@/lib/api/document"
import { PenBox, PlusIcon, Upload } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { Document } from "@/types/base"

interface AddEditDocumentDialogProps {
    type: "add" | "edit",
    id?: string,
    datasetId: string,
    document?: Document,
    handleReloadDocuments?: () => void
}

const documentSchema = z.object({
    name: z.string().min(1, "Tên tài liệu là bắt buộc"),
    type: z.string().min(1, "Loại tài liệu là bắt buộc"),
    size: z.number().min(1, "Kích thước tài liệu phải lớn hơn 0")
});

export function AddEditDocumentDialog({
    type = "add",
    id,
    datasetId,
    document,
    handleReloadDocuments
}: AddEditDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [docType, setDocType] = useState("");
    const [size, setSize] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Nếu là chế độ chỉnh sửa, lấy thông tin document hiện tại
        if (type === "edit" && document) {
            setName(document.name);
            setDocType(document.type);
            setSize(document.size);
        } else if (type === "edit" && id) {
            getDocumentById(id).then(data => {
                if (data) {
                    setName(data.name);
                    setDocType(data.type);
                    setSize(data.size);
                }
            });
        }
    }, [type, id, document]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Auto-fill form based on file
            if (type === "add") {
                setName(selectedFile.name);
                setDocType(selectedFile.type || getFileExtension(selectedFile.name));
                setSize(selectedFile.size);
            }
        }
    };

    const getFileExtension = (filename: string): string => {
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (type === "add" && !file) {
            toast.error("Vui lòng chọn file để upload");
            return;
        }

        const result = documentSchema.safeParse({ name, type: docType, size });
        if (!result.success) {
            toast.error(result.error.issues[0].message);
            return;
        }

        setLoading(true);
        try {
            let res;
            const asgl_id = localStorage.getItem("asgl_id") || "";

            if (type === "edit" && id) {
                res = await updateDocument(id, name, docType, size, asgl_id, file || undefined);
                if (!res.ok) {
                    const data = await res.json();
                    toast.error(data.error || "Cập nhật tài liệu thất bại");
                } else {
                    toast.success("Cập nhật document thành công!");
                    setOpen(false);
                    resetForm();
                    handleReloadDocuments?.();
                }
            } else {
                // file is required for creation, so we ensure it exists
                res = await createDocument(name, docType, size, datasetId, file!);
                if (!res.ok) {
                    const data = await res.json();
                    toast.error(data.error || "Tạo tài liệu thất bại");
                } else {
                    toast.success("Tạo mới document thành công!");
                    setOpen(false);
                    resetForm();
                    handleReloadDocuments?.();
                }
            }
        } catch (err) {
            toast.error("Lỗi mạng");
            console.error("[AddEditDocumentDialog] error", err);
        } finally {
            setLoading(false);
        }
    }

    const resetForm = () => {
        setName("");
        setDocType("");
        setSize(0);
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen && type === "add") {
            resetForm();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {type === "add" ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="!p-2 h-8">
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Thêm tài liệu
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Thêm tài liệu mới</p>
                    </TooltipContent>
                </Tooltip>
            ) : (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" type="button">
                        <PenBox className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {type === "add" ? "Thêm tài liệu mới" : "Chỉnh sửa tài liệu"}
                        </DialogTitle>
                        <DialogDescription>
                            {type === "add"
                                ? "Upload file và nhập thông tin cho tài liệu mới."
                                : "Chỉnh sửa thông tin tài liệu. Upload file mới để thay thế."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 mt-4">
                        <div className="grid gap-3">
                            <Label htmlFor="file-upload">
                                {type === "add" ? "Tệp tin*" : "Tệp tin (không bắt buộc)"}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    {file ? file.name : "Chọn file"}
                                </Button>
                                {file && (
                                    <span className="text-sm text-gray-600">
                                        ({formatFileSize(file.size)})
                                    </span>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".txt,.pdf,.doc,.docx,.json,.csv,.md,.xlsx"
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="name">Tên tài liệu*</Label>
                            <Input
                                id="name"
                                name="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nhập tên tài liệu"
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="type">Loại*</Label>
                            <Input
                                id="type"
                                name="type"
                                value={docType}
                                onChange={e => setDocType(e.target.value)}
                                placeholder="pdf, txt, doc, ..."
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="size">Kích thước (bytes)*</Label>
                            <Input
                                id="size"
                                name="size"
                                type="number"
                                value={size}
                                onChange={e => setSize(parseInt(e.target.value) || 0)}
                                placeholder="Kích thước file"
                            />
                            {size > 0 && (
                                <span className="text-sm text-gray-600">
                                    ≈ {formatFileSize(size)}
                                </span>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Hủy</Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Đang lưu..." : "Lưu lại"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

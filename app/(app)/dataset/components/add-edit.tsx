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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { getAllDatasets, createDataset, updateDataset } from "@/lib/api/dataset"
import { PenBox, PlusIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { getDatasetById } from "@/lib/api/dataset"
import { cn } from "@/lib/utils"

interface AddEditDatasetDialogProps {
    type: "add" | "edit",
    id?: string,
    parentId?: string | null,
    hidden_label?: boolean | null,
    hidden_border?: boolean | null,
    handleReloadDatasets?: () => void
}

const datasetSchema = z.object({
    name: z.string().min(1, "Dataset name is required"),
    parent_id: z.string().nullable()
});

export function AddEditDatasetDialog({ type = "add", id, parentId: initialParentId, hidden_label, hidden_border, handleReloadDatasets }: AddEditDatasetDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [parentId, setParentId] = useState(initialParentId || "");
    const [loading, setLoading] = useState(false);
    const [parentOptions, setParentOptions] = useState<{ id: string, name: string }[]>([]);
    useEffect(() => {
        // Lấy danh sách dataset cha từ API
        if (type === "add" && !id) {
            getAllDatasets().then(data => {
                if (data.datasets) {
                    setParentOptions(data.datasets.map((ds: any) => ({ id: ds.id, name: ds.name })));
                }
            });
        }

        // Nếu là chế độ chỉnh sửa, lấy thông tin dataset hiện tại
        if (type === "edit" && id) {
            getDatasetById(id).then(data => {
                if (data) {
                    setName(data.name);
                    setParentId(data.parent_id || "");
                }
            });
        }
    }, [type, id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const result = datasetSchema.safeParse({ name, parent_id: parentId || null });
        if (!result.success) {
            toast.error(result.error.issues[0].message);
            return;
        }
        setLoading(true);
        try {
            let res;
            // Lấy asgl_id từ localStorage (hoặc thay bằng context nếu dự án bạn dùng context)
            const asgl_id = localStorage.getItem("asgl_id") || "";
            if (type === "edit" && id) {
                res = await updateDataset(id, name, parentId || null, asgl_id);
                if (!res.ok) {
                    const data = await res.json();
                    toast.error(data.error || "Failed to update dataset");
                } else {
                    toast.success("Cập nhật dataset thành công!");
                    setOpen(false);
                    handleReloadDatasets?.();
                }
            } else {
                res = await createDataset(name, parentId || null);
                if (!res.ok) {
                    const data = await res.json();
                    toast.error(data.error || "Failed to create dataset");
                } else {
                    toast.success("Tạo mới dataset thành công!");
                    setName("");
                    setParentId("");
                    setOpen(false);
                    handleReloadDatasets?.();
                }
            }
        } catch (err) {
            toast.error("Network error");
            console.error("[AddEditDatasetDialog] error", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {type === "add" ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="!p-2 h-8" >
                                <PlusIcon className="h-4 w-4" />
                                {!hidden_label && 'Tạo mới thư mục'}
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Tạo mới thư mục</p>
                    </TooltipContent>
                </Tooltip>
            ) : (
                <DialogTrigger asChild>
                    <Button variant={hidden_border ? 'link' : 'outline'} size="sm" type="button" className={hidden_border ? 'p-0' : ''}>
                        <PenBox className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {type === "add" ? "Tạo mới thư mục" : "Chỉnh sửa thư mục"}
                        </DialogTitle>
                        <DialogDescription>
                            {type === "add" ? "Nhập thông tin cho thư mục mới." : "Nhập thông tin để chỉnh sửa thư mục."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 mt-4">
                        <div className="grid gap-3">
                            <Label htmlFor="name-1">Tên*</Label>
                            <Input id="name-1" name="name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        {type === "edit" && (
                            <div className="grid gap-3">
                                <Label htmlFor="parent-id">Thuộc</Label>
                                <Select
                                    value={parentId === "" ? "none" : parentId}
                                    onValueChange={val => setParentId(val === "none" ? "" : val)}
                                    name="parent_id"
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Không có" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không có</SelectItem>
                                        {parentOptions.map(opt => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                    </div>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Hủy</Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu lại"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

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
import { deleteDataset } from "@/lib/api/dataset"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface DeleteDatasetDialogProps {
    id: string,
    name: string,
    hidden_border?: boolean | null,
    onDeleted?: () => void
}

export function DeleteDatasetDialog({ id, name, hidden_border, onDeleted }: DeleteDatasetDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            const res = await deleteDataset(id);
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Không thể xóa dataset. Vui lòng thử lại sau.");
            } else {
                toast.success("Xóa dataset thành công!");
                setOpen(false);
                onDeleted?.();
            }
        } catch (error) {
            console.error("Error deleting dataset:", error);
            toast.error("Không thể xóa dataset. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={hidden_border ? 'link' : 'outline'} size="sm" type="button" className={hidden_border ? 'p-0 pr-2' : ''}>
                    <Trash2 className="h-4 w-4" color="red" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xác nhận xóa dataset</DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn xóa dataset "{name}"? Hành động này không thể hoàn tác.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Hủy</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? "Đang xóa..." : "Xóa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
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
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface DeleteDatasetDialogProps {
    id: string,
    name: string,
    onDeleted?: () => void
}

export function DeleteDatasetDialog({ id, name, onDeleted }: DeleteDatasetDialogProps) {
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
                <div className="flex items-center w-full cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" color="red" />
                </div>
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
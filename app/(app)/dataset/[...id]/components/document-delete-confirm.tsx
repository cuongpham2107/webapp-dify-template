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
import { deleteDocument } from "@/lib/api/document"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface DeleteDocumentDialogProps {
    id: string,
    name: string,
    onDeleted?: () => void,

}

export function DeleteDocumentDialog({ id, name, onDeleted }: DeleteDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            const res = await deleteDocument(id);
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Không thể xóa tài liệu. Vui lòng thử lại sau.");
            } else {
                toast.success("Xóa tài liệu thành công!");
                setOpen(false);
                onDeleted?.();
            }
            setLoading(false);
        } catch (error) {
            console.error("Error deleting document:", error);
            toast.error("Không thể xóa tài liệu. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" type="button">
                    <Trash2 className="h-4 w-4" color="red" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xác nhận xóa tài liệu</DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn xóa tài liệu "{name}"? Hành động này không thể hoàn tác.
                        Tài liệu sẽ bị xóa khỏi cả hệ thống local và Dify.
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
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { createBatchDocuments } from "@/lib/api/document"
import { Upload, X, FileIcon, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface BatchDocumentUploadDialogProps {
    datasetId: string
    handleReloadDocuments?: () => void
}

interface FileUploadStatus {
    file: File
    status: 'pending' | 'uploading' | 'success' | 'error'
    progress: number
    error?: string
}

export function BatchDocumentUploadDialog({
    datasetId,
    handleReloadDocuments
}: BatchDocumentUploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<FileUploadStatus[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (selectedFiles) {
            const newFiles: FileUploadStatus[] = Array.from(selectedFiles).map(file => ({
                file,
                status: 'pending',
                progress: 0
            }))
            setFiles(newFiles)
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error("Vui lòng chọn ít nhất một file")
            return
        }

        setUploading(true)

        // Reset all files to uploading status
        setFiles(prev => prev.map(file => ({ ...file, status: 'uploading', progress: 0 })))

        try {
            const fileList = files.map(f => f.file)

            const { results, errors, totalFiles } = await createBatchDocuments(
                fileList,
                datasetId,
                (index: number, progress: number) => {
                    setFiles(prev => prev.map((file, i) =>
                        i === index ? { ...file, progress } : file
                    ))
                }
            )

            // Update file statuses based on results
            setFiles(prev => prev.map((file, index) => {
                const result = results[index]
                return {
                    ...file,
                    status: result.success ? 'success' : 'error',
                    progress: 100,
                    error: result.success ? undefined : result.error
                }
            }))

            const successCount = results.filter(r => r.success).length
            const errorCount = errors.length

            if (successCount > 0 && errorCount === 0) {
                toast.success(`Tải lên thành công ${successCount} tài liệu!`)
                handleReloadDocuments?.()
                setTimeout(() => {
                    setOpen(false)
                    resetForm()
                }, 2000)
            } else if (successCount > 0 && errorCount > 0) {
                toast.warning(`Tải lên thành công ${successCount}/${totalFiles} tài liệu. ${errorCount} tài liệu thất bại.`)
                handleReloadDocuments?.()
            } else {
                toast.error(`Tải lên thất bại cho tất cả ${totalFiles} tài liệu`)
            }

        } catch (err) {
            toast.error("Lỗi mạng khi tải lên tài liệu")
            console.error("[BatchDocumentUpload] error", err)
            // Set all files to error status
            setFiles(prev => prev.map(file => ({
                ...file,
                status: 'error',
                error: "Lỗi mạng"
            })))
        } finally {
            setUploading(false)
        }
    }

    const resetForm = () => {
        setFiles([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            resetForm()
        }
    }

    const getStatusIcon = (status: FileUploadStatus['status']) => {
        switch (status) {
            case 'pending':
                return <FileIcon className="h-4 w-4 text-gray-500" />
            case 'uploading':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />
        }
    }

    const canUpload = files.length > 0 && !uploading
    const hasUploading = files.some(f => f.status === 'uploading')

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="!p-2 h-8">
                            <Upload className="h-4 w-4 mr-1" />
                            Tải nhiều tài liệu
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Tải lên nhiều tài liệu cùng lúc</p>
                </TooltipContent>
            </Tooltip>

            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Tải lên nhiều tài liệu</DialogTitle>
                    <DialogDescription>
                        Chọn nhiều file để tải lên cùng lúc. Hệ thống sẽ xử lý từng file một cách tuần tự.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 mt-4">
                    {/* File Selection */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                            disabled={uploading}
                        >
                            <Upload className="h-4 w-4" />
                            Chọn nhiều file
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                            Hỗ trợ: .txt, .pdf, .doc, .docx, .json, .csv, .md, .xlsx
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".txt,.pdf,.doc,.docx,.json,.csv,.md,.xlsx"
                            disabled={uploading}
                        />
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                            <div className="p-3 border-b bg-gray-50">
                                <span className="font-medium">Danh sách file ({files.length})</span>
                            </div>
                            {files.map((fileStatus, index) => (
                                <div key={index} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {getStatusIcon(fileStatus.status)}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {fileStatus.file.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatFileSize(fileStatus.file.size)}
                                            </div>
                                            {fileStatus.status === 'uploading' && (
                                                <Progress value={fileStatus.progress} className="h-1 mt-1" />
                                            )}
                                            {fileStatus.error && (
                                                <div className="text-xs text-red-500 mt-1">
                                                    {fileStatus.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {!hasUploading && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button variant="outline" type="button" disabled={uploading}>
                            {uploading ? "Đang tải lên..." : "Hủy"}
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleUpload}
                        disabled={!canUpload}
                        className="min-w-[120px]"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang tải lên...
                            </>
                        ) : (
                            `Tải lên ${files.length} file`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
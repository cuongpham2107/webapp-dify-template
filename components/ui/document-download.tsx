import React from 'react';
import { Button } from '@/components/ui/button';
import { useDocumentDownload } from '@/lib/utils/document-download';
import { Download, FileDown, AlertCircle, CheckCircle } from 'lucide-react';

interface DocumentDownloadButtonProps {
    documentId: string;
    datasetId?: string; // Made optional since it will be fetched from database
    documentName?: string;
    className?: string;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'lg' | 'default';
}

/**
 * A reusable button component for downloading document files
 */
export function DocumentDownloadButton({
    documentId,
    datasetId = "", // Default to empty string - API will fetch from database
    documentName = 'Document',
    className = '',
    disabled = false,
    variant = 'outline',
    size = 'sm'
}: DocumentDownloadButtonProps) {
    const { downloading, progress, error, downloadFile, reset } = useDocumentDownload();

    const handleDownload = async () => {
        if (downloading) return;

        try {
            await downloadFile(documentId, datasetId);
        } catch (err) {
            // Error is already handled by the hook
            console.error('Download failed:', err);
        }
    };

    const getButtonContent = () => {
        if (downloading) {
            return (
                <>
                    <FileDown className="h-4 w-4 animate-pulse" />
                    {progress > 0 ? `${Math.round(progress)}%` : 'Downloading...'}
                </>
            );
        }

        if (error) {
            return (
                <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </>
            );
        }

        return (
            <>
                <Download className="h-4 w-4" />
            </>
        );
    };

    return (
        <div className="space-y-2">
            <Button
                onClick={handleDownload}
                disabled={disabled || downloading}
                variant={error ? 'destructive' : variant}
                size={size}
                className={className}
                title={`Download ${documentName}`}
            >
                {getButtonContent()}
            </Button>

            {/* Progress bar */}
            {downloading && progress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                    <Button
                        onClick={reset}
                        variant="ghost"
                        size="sm"
                        className="text-xs underline"
                    >
                        Retry
                    </Button>
                </div>
            )}
        </div>
    );
}

interface DocumentCardWithDownloadProps {
    document: {
        id: string;
        name: string;
        document_id: string;
        type?: string;
        size?: number;
        createdAt?: string;
    };
    datasetId?: string; // Made optional since it will be fetched from database
    onDownloadComplete?: (filename: string) => void;
}

/**
 * A more comprehensive document card with download functionality
 */
export function DocumentCardWithDownload({
    document,
    datasetId = "", // Default to empty string - API will fetch from database
    onDownloadComplete
}: DocumentCardWithDownloadProps) {
    const { downloading, progress, error, downloadFile, reset } = useDocumentDownload();

    const handleDownload = async () => {
        try {
            await downloadFile(document.id, datasetId);
            onDownloadComplete?.(document.name);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';

        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
            {/* Document Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate" title={document.name}>
                        {document.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        {document.type && (
                            <span className="uppercase">{document.type}</span>
                        )}
                        {document.size && (
                            <span>{formatFileSize(document.size)}</span>
                        )}
                        {document.createdAt && (
                            <span>{formatDate(document.createdAt)}</span>
                        )}
                    </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center space-x-2 ml-2">
                    {downloading && <FileDown className="h-4 w-4 text-blue-500 animate-pulse" />}
                    {error && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {!downloading && !error && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
            </div>

            {/* Progress Bar */}
            {downloading && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Downloading...</span>
                        <span>{progress > 0 ? `${Math.round(progress)}%` : '0%'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button
                            onClick={reset}
                            variant="ghost"
                            size="sm"
                            className="text-xs underline"
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-gray-500">
                    ID: {document.document_id}
                </div>

                <div className="flex space-x-2">
                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        variant="outline"
                        size="sm"
                    >
                        <Download className="h-3 w-3 mr-1" />
                        {downloading ? 'Downloading...' : 'Download'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DocumentDownloadButton;
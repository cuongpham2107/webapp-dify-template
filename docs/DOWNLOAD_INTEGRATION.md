# Integration Example: Adding Download Functionality to Existing Components

This guide shows how to integrate the new document download functionality into your existing document management components.

## Example 1: Adding Download Button to Document List

If you have an existing document list component, you can easily add download functionality:

```typescript
// In your existing document list component
import React from 'react';
import { DocumentDownloadButton } from '@/components/ui/document-download';

interface DocumentListProps {
  documents: Array<{
    id: string;
    name: string;
    document_id: string;
    type: string;
    size: number;
    createdAt: string;
  }>;
  datasetId: string;
}

export function DocumentList({ documents, datasetId }: DocumentListProps) {
  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h3 className="font-medium">{document.name}</h3>
            <p className="text-sm text-gray-500">
              {document.type} • {formatFileSize(document.size)} • {formatDate(document.createdAt)}
            </p>
          </div>
          
          {/* Add download button */}
          <DocumentDownloadButton
            documentId={document.id}
            datasetId={datasetId}
            documentName={document.name}
            variant="outline"
            size="sm"
          />
        </div>
      ))}
    </div>
  );
}
```

## Example 2: Using the Utility Functions Directly

For more control, you can use the utility functions directly:

```typescript
import React, { useState } from 'react';
import { downloadDocumentFile, getDocumentFileInfo } from '@/lib/utils/document-download';
import { Button } from '@/components/ui/button';

export function CustomDocumentActions({ documentId, datasetId }: { documentId: string; datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await downloadDocumentFile(documentId, datasetId, {
        onStart: () => console.log('Download started'),
        onProgress: (progress) => console.log(`Progress: ${progress}%`),
        onComplete: (filename) => console.log(`Downloaded: ${filename}`),
        onError: (error) => console.error('Download failed:', error)
      });
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetInfo = async () => {
    try {
      const info = await getDocumentFileInfo(documentId, datasetId);
      setFileInfo(info);
    } catch (error) {
      console.error('Failed to get file info:', error);
    }
  };

  return (
    <div className="space-x-2">
      <Button onClick={handleDownload} disabled={loading}>
        {loading ? 'Downloading...' : 'Download'}
      </Button>
      <Button onClick={handleGetInfo} variant="outline">
        Get Info
      </Button>
      {fileInfo && (
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(fileInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

## Example 3: Using the React Hook

The `useDocumentDownload` hook provides the most flexibility:

```typescript
import React from 'react';
import { useDocumentDownload } from '@/lib/utils/document-download';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function AdvancedDownloadComponent({ documentId, datasetId, documentName }: {
  documentId: string;
  datasetId: string;
  documentName: string;
}) {
  const { downloading, progress, error, downloadFile, reset } = useDocumentDownload();

  const handleDownload = () => {
    downloadFile(documentId, datasetId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Button 
          onClick={handleDownload} 
          disabled={downloading}
          className="flex-1"
        >
          {downloading ? 'Downloading...' : `Download ${documentName}`}
        </Button>
        
        {error && (
          <Button onClick={reset} variant="outline" size="sm">
            Retry
          </Button>
        )}
      </div>

      {downloading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 text-center">
            {progress > 0 ? `${Math.round(progress)}% complete` : 'Starting download...'}
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
```

## Example 4: Integration with Existing Dataset/Document Page

If you have an existing dataset page with documents, add the download functionality:

```typescript
// In your existing dataset/[...id]/page.tsx or similar
import { DocumentCardWithDownload } from '@/components/ui/document-download';

export default function DatasetPage({ params }: { params: { id: string[] } }) {
  const [documents, setDocuments] = useState([]);
  const datasetId = params.id[0];

  const handleDownloadComplete = (filename: string) => {
    // Optional: Show success message or update UI
    console.log(`Successfully downloaded: ${filename}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1>Dataset Documents</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {documents.map((document) => (
          <DocumentCardWithDownload
            key={document.id}
            document={document}
            datasetId={datasetId}
            onDownloadComplete={handleDownloadComplete}
          />
        ))}
      </div>
    </div>
  );
}
```

## API Usage Examples

### Direct API Calls

```typescript
// Download a file directly via API
const downloadViaAPI = async (documentId: string, datasetId: string) => {
  try {
    const response = await fetch(`/api/documents/${documentId}/download?datasetId=${datasetId}`);
    
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document.pdf'; // or get from headers
      link.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
};

// Get file information
const getFileInfo = async (documentId: string, datasetId: string) => {
  try {
    const response = await fetch(`/api/documents/${documentId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId })
    });
    
    const info = await response.json();
    return info;
  } catch (error) {
    console.error('Failed to get file info:', error);
  }
};
```

## Environment Configuration

Make sure your environment variables are properly configured:

```env
# .env.local
API_URL=http://dify.asgl.net.vn/v1
APP_KEY_DATA=your_api_key_here
```

## Error Handling Best Practices

```typescript
import { toast } from 'sonner';

const handleDownloadWithToast = async (documentId: string, datasetId: string) => {
  try {
    await downloadDocumentFile(documentId, datasetId, {
      onStart: () => {
        toast.info('Starting download...');
      },
      onComplete: (filename) => {
        toast.success(`Downloaded: ${filename}`);
      },
      onError: (error) => {
        toast.error(`Download failed: ${error}`);
      }
    });
  } catch (error) {
    // Additional error handling if needed
    console.error('Unexpected error:', error);
  }
};
```

## Security Considerations

1. **Permission Checks**: The API automatically checks user permissions before allowing downloads
2. **Rate Limiting**: Consider implementing rate limiting for production use
3. **File Validation**: The backend validates file access through the Dify API
4. **Error Handling**: Sensitive information is not exposed in error messages

## Performance Tips

1. **Progress Tracking**: Use the progress callbacks for large files
2. **Memory Management**: Always revoke object URLs after use
3. **Caching**: Consider caching file info for frequently accessed documents
4. **Background Downloads**: For large files, consider using service workers

This integration guide should help you easily add download functionality to your existing document management components!
# Document File Download Implementation

This document explains how to use the new file download functionality added to the DocumentClient class.

## New Methods Added

### 1. `downloadFile(datasetId: string, documentId: string)`

Downloads a file from a document using the `/datasets/{dataset_id}/documents/{document_id}/upload-file` endpoint.

**Parameters:**
- `datasetId` (string): The ID of the dataset containing the document
- `documentId` (string): The ID of the document to download the file from

**Returns:**
```typescript
Promise<{
  data: {
    blob: Blob;           // File content as blob
    filename: string;     // Extracted filename
    size: number;         // File size in bytes
    type: string;         // MIME type
    url: string;          // Object URL for download
  } | any                 // JSON response if API returns JSON
}>
```

### 2. `getFileInfo(datasetId: string, documentId: string)`

Alternative method using the standard sendRequest approach to get file information.

**Parameters:**
- `datasetId` (string): The ID of the dataset
- `documentId` (string): The ID of the document

**Returns:**
```typescript
Promise<any> // API response data
```

## Usage Examples

### Basic Usage

```typescript
import { DocumentClient } from '@/service/document';

const documentClient = new DocumentClient();

// Download a file
async function downloadDocumentFile(datasetId: string, documentId: string) {
  try {
    const result = await documentClient.downloadFile(datasetId, documentId);
    
    if (result.data.blob) {
      // Handle file download
      const { blob, filename, url } = result.data;
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(url);
      
      console.log(`Downloaded file: ${filename} (${blob.size} bytes)`);
    } else {
      // Handle JSON response
      console.log('API Response:', result.data);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

### React Component Example

```typescript
import React, { useState } from 'react';
import { DocumentClient } from '@/service/document';

interface FileDownloadProps {
  datasetId: string;
  documentId: string;
  fileName?: string;
}

const FileDownloadComponent: React.FC<FileDownloadProps> = ({ 
  datasetId, 
  documentId, 
  fileName = 'document' 
}) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    
    try {
      const documentClient = new DocumentClient();
      const result = await documentClient.downloadFile(datasetId, documentId);
      
      if (result.data.blob) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = result.data.filename || fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        URL.revokeObjectURL(result.data.url);
      } else {
        setError('File not available for download');
      }
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleDownload} 
        disabled={downloading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {downloading ? 'Downloading...' : 'Download File'}
      </button>
      {error && (
        <p className="text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};

export default FileDownloadComponent;
```

### Advanced Usage with Progress Tracking

```typescript
async function downloadWithProgress(datasetId: string, documentId: string) {
  try {
    const documentClient = new DocumentClient();
    
    // For progress tracking, we need to use fetch directly
    const endpoint = `/datasets/${datasetId}/documents/${documentId}/upload-file`;
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APP_KEY_DATA}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');
    
    const chunks: Uint8Array[] = [];
    let received = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      received += value.length;
      
      // Update progress
      if (total > 0) {
        const progress = (received / total) * 100;
        console.log(`Download progress: ${progress.toFixed(2)}%`);
      }
    }
    
    // Combine chunks
    const blob = new Blob(chunks);
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_${documentId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('Download completed successfully');
    
  } catch (error) {
    console.error('Download with progress failed:', error);
  }
}
```

## Error Handling

The methods include comprehensive error handling:

```typescript
try {
  const result = await documentClient.downloadFile(datasetId, documentId);
  // Handle success
} catch (error: any) {
  if (error.message.includes('HTTP 404')) {
    console.error('Document or file not found');
  } else if (error.message.includes('HTTP 403')) {
    console.error('Access denied - check API key permissions');
  } else if (error.message.includes('HTTP 500')) {
    console.error('Server error - try again later');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## API Endpoint Details

**Endpoint:** `GET /v1/datasets/{dataset_id}/documents/{document_id}/upload-file`

**Headers:**
- `Authorization: Bearer {api_key}`
- `Content-Type: application/json`

**Response Types:**
1. **File Response**: Binary file data with appropriate headers
2. **JSON Response**: Error or metadata information

## Notes

1. The `downloadFile` method handles both file downloads and JSON responses
2. Object URLs are created for blob data to enable browser downloads
3. Remember to revoke object URLs after use to prevent memory leaks
4. The method includes filename extraction from response headers
5. Error responses are properly logged with detailed information

## Integration with Existing Code

This functionality integrates seamlessly with the existing DocumentClient class and can be used alongside other document operations like create, update, and delete.
/**
 * Citation API client functions
 */

export interface DownloadCitationParams {
    datasetId: string
    documentId: string
}

export interface DownloadCitationResponse {
    blob: Blob
    filename: string
    contentType: string
}

/**
 * Download a citation file
 * @param params - Dataset and document IDs
 * @returns Promise with file blob and metadata
 */
export async function downloadCitation(params: DownloadCitationParams): Promise<DownloadCitationResponse> {
    const { datasetId, documentId } = params

    if (!datasetId || !documentId) {
        throw new Error('Missing required parameters: datasetId and documentId')
    }

    const response = await fetch('/api/citations/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            datasetId,
            documentId
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `document_${documentId}`
    if (contentDisposition) {
        // Handle both encoded (filename*=UTF-8'') and standard (filename="") formats
        const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/)
        const standardMatch = contentDisposition.match(/filename="?([^"]+)"?/)

        if (encodedMatch) {
            filename = decodeURIComponent(encodedMatch[1])
        } else if (standardMatch) {
            filename = standardMatch[1]
        }
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Get blob
    const blob = await response.blob()

    return {
        blob,
        filename,
        contentType
    }
}

/**
 * Trigger file download in browser
 * @param blob - File blob
 * @param filename - Name for downloaded file
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Download and save citation file
 * @param params - Dataset and document IDs
 */
export async function downloadAndSaveCitation(params: DownloadCitationParams): Promise<void> {
    try {
        const { blob, filename } = await downloadCitation(params)
        triggerFileDownload(blob, filename)
    } catch (error) {
        console.error('Error downloading citation file:', error)
        throw error
    }
}
import { documents } from '@/app/api/utils/common'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { datasetId, documentId } = await request.json()

        if (!datasetId || !documentId) {
            return NextResponse.json(
                { error: 'Missing required parameters: datasetId and documentId' },
                { status: 400 }
            )
        }

        const result = await documents.downloadFile(datasetId, documentId)

        if (!result.data || !result.data.blob) {
            return NextResponse.json(
                { error: 'Failed to retrieve file' },
                { status: 404 }
            )
        }

        // Convert blob to buffer for response
        const buffer = Buffer.from(await result.data.blob.arrayBuffer())

        // Properly encode filename for Content-Disposition header
        const safeFilename = encodeURIComponent(result.data.filename)

        // Set appropriate headers for file download
        const headers = new Headers()
        headers.set('Content-Type', result.data.type || 'application/octet-stream')
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}`)
        headers.set('Content-Length', buffer.length.toString())

        return new NextResponse(buffer, {
            status: 200,
            headers,
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
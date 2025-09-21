import { NextRequest, NextResponse } from 'next/server'
import { getTraces } from '@/service/langfuse'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Get all parameters
        const page = searchParams.get('page') || '1'
        const limit = searchParams.get('limit') || '50'
        const userId = searchParams.get('userId') || ''
        const name = searchParams.get('name') || ''
        const sessionId = searchParams.get('sessionId') || ''
        const fromTimestamp = searchParams.get('fromTimestamp') || '2025-01-01T00:00:00Z'
        const toTimestamp = searchParams.get('toTimestamp') || '2025-09-20T23:59:59Z'
        const orderBy = searchParams.get('orderBy') || ''
        const tags = searchParams.get('tags') || ''
        const version = searchParams.get('version') || ''
        const release = searchParams.get('release') || ''
        const environment = searchParams.get('environment') || ''
        const fields = searchParams.get('fields') || ''

        const result = await getTraces({
            page: parseInt(page),
            limit: parseInt(limit),
            userId: userId || undefined,
            name: name || undefined,
            sessionId: sessionId || undefined,
            fromTimestamp,
            toTimestamp,
            orderBy: orderBy || undefined,
            tags: tags || undefined,
            version: version || undefined,
            release: release || undefined,
            environment: environment || undefined,
            fields: fields || undefined
        })

        return NextResponse.json({
            success: true,
            data: result
        })

    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
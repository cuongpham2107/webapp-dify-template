import { NextRequest, NextResponse } from 'next/server'
import { checkDocumentAccess } from '@/lib/models/documentAccess'
import { getInfo } from '../utils/common'

export async function POST(request: NextRequest) {
    try {
        const { userInfo } = await getInfo(request)
        if (!userInfo?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { documentIds } = await request.json()

        if (!Array.isArray(documentIds)) {
            return NextResponse.json({ error: 'documentIds must be an array' }, { status: 400 })
        }

        // Check access for each document
        const accessResults = await Promise.all(
            documentIds.map(async (documentId: string) => {
                const hasAccess = await checkDocumentAccess(userInfo.id as string, documentId)
                return { documentId, hasAccess }
            })
        )

        return NextResponse.json({ accessResults })
    } catch (error) {
        console.error('Error checking document access:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

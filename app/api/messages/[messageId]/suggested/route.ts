import { NextRequest, NextResponse } from 'next/server'
import { getInfo } from '@/app/api/utils/common'
import { API_KEY, API_URL } from '@/config'

export async function GET(
    request: NextRequest,
    { params }: { params: { messageId: string } }
) {
    try {
        const { user } = await getInfo(request)
        const { messageId } = params

        if (!messageId) {
            return NextResponse.json(
                { error: 'Message ID is required' },
                { status: 400 }
            )
        }

        // Check if messageId is a UUID format (Dify only supports suggested questions for UUID messages)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)

        if (!isUUID) {
            return NextResponse.json({
                data: [],
                message: 'Suggested questions only available for messages with UUID format'
            })
        }

        const response = await fetch(
            `${API_URL}/messages/${messageId}/suggested?user=${user}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        )


        if (!response.ok) {
            return NextResponse.json({
                data: [],
                message: `API returned ${response.status}`
            })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json(
            {
                data: [],
                error: 'Failed to fetch suggested questions',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 200 } // Return 200 to avoid breaking the UI
        )
    }
}
import { NextRequest } from 'next/server'
import { getInfo } from '../utils/common'
import { API_KEY, API_URL } from '@/config'

export async function POST(request: NextRequest) {
    try {
        const { message_id, text } = await request.json()
        const { user } = await getInfo(request)

        const difyUrl = `${API_URL || 'https://api.dify.ai/v1'}/text-to-audio`

        const difyResponse = await fetch(difyUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message_id, text, user }),
        })

        const contentType = difyResponse.headers.get('content-type') || 'audio/wav'
        const arrayBuffer = await difyResponse.arrayBuffer()

        return new Response(arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': arrayBuffer.byteLength.toString()
            }
        })

    } catch (error: any) {
        return Response.json({
            error: 'Error converting text to audio',
            details: error.message,
        }, { status: 500 })
    }
}

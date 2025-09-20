import { NextRequest } from 'next/server'
import { getInfo } from '../utils/common'
import { API_KEY, API_URL } from '@/config'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const user = formData.get('user') as string

        if (!file) {
            return Response.json({
                error: 'No audio file provided',
            }, { status: 400 })
        }

        // Create form data for Dify API
        const difyFormData = new FormData()
        difyFormData.append('file', file)
        difyFormData.append('user', user || `user-${Date.now()}`)

        const difyUrl = `${API_URL || 'https://api.dify.ai/v1'}/audio-to-text`

        const difyResponse = await fetch(difyUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: difyFormData,
        })

        if (!difyResponse.ok) {
            const errorData = await difyResponse.text()
            return Response.json({
                error: 'Error converting audio to text',
                details: errorData,
            }, { status: difyResponse.status })
        }

        const result = await difyResponse.json()

        return Response.json(result, {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        })

    } catch (error: any) {
        console.error('Audio to text conversion error:', error)
        return Response.json({
            error: 'Error converting audio to text',
            details: error.message,
        }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { checkDocumentAccess } from '@/lib/models/documentAccess'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Lấy các tham số từ URL
        const { searchParams } = new URL(request.url)
        const document_id = searchParams.get('document_id')
        const user_id = searchParams.get('user_id')

        // Kiểm tra các tham số bắt buộc
        if (!document_id || !user_id) {
            return NextResponse.json(
                { error: 'Missing required parameters: document_id and user_id' },
                { status: 400 }
            )
        }

        // Kiểm tra quyền can_view trong bảng document_access
        const hasAccess = await checkDocumentAccess(user_id, document_id, 'canView')

        // Trả về kết quả
        return NextResponse.json({ hasAccess })

    } catch (error) {
        console.error('Error checking document access:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

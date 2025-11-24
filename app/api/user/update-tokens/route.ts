import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)


        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        const body = await req.json()
        const { totalTokens } = body
        if (typeof totalTokens !== 'number' || totalTokens < 0) {
            return NextResponse.json(
                { error: 'Invalid token count' },
                { status: 400 }
            )
        }
        // Update user's total tokens used
        const updatedUser = await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: {
                tokensUsed: {
                    increment: totalTokens,
                },
            },
            select: {
                id: true,
                email: true,
                tokensUsed: true,
            },
        })
        return NextResponse.json({
            success: true,
            tokensUsed: updatedUser.tokensUsed,
        })
    } catch (error) {
        console.error('❌ Error updating tokens:', error)
        return NextResponse.json(
            { error: 'Failed to update tokens' },
            { status: 500 }
        )
    }
}

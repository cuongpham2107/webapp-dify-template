import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {

        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const asgl_id = searchParams.get('asgl_id')

        if (!asgl_id) {
            return NextResponse.json(
                { error: 'asgl_id parameter is required' },
                { status: 400 }
            )
        }

        // Find user by asgl_id
        const user = await prisma.user.findUnique({
            where: { asgl_id },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Extract roles and permissions
        const roles = user.roles.map((userRole: any) => userRole.role.name)
        const permissions = user.roles
            .flatMap((userRole: any) =>
                userRole.role.permissions.map((rp: any) => rp.permission.name)
            )
            .filter((permission: string, index: number, array: string[]) => array.indexOf(permission) === index) // Remove duplicates

        return NextResponse.json({
            roles,
            permissions,
            user: {
                id: user.id,
                asgl_id: user.asgl_id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        console.error('❌ [API] Error fetching permissions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
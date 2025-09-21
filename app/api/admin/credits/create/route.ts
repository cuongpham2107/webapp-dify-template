import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, isSuperAdmin } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        // Check authentication and permissions
        const user = await getCurrentUserWithPermissions()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user is super admin
        if (!isSuperAdmin(user)) {
            return NextResponse.json(
                { success: false, error: 'Chỉ superadmin mới có quyền thực hiện hành động này' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { userIdentifier, amount, month, year, note } = body

        if (!userIdentifier || !amount || !month || !year) {
            return NextResponse.json(
                { success: false, error: 'Thiếu thông tin bắt buộc' },
                { status: 400 }
            )
        }

        if (amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Số lượng credit phải lớn hơn 0' },
                { status: 400 }
            )
        }

        // Find user by email or asgl_id
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: userIdentifier },
                    { asgl_id: userIdentifier }
                ]
            }
        })

        if (!targetUser) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy người dùng với email hoặc ASGL ID này' },
                { status: 404 }
            )
        }

        // Check if credit already exists for this user in this month/year
        const existingCredit = await prisma.credit.findFirst({
            where: {
                userId: targetUser.id,
                month: month,
                year: year
            }
        })

        if (existingCredit) {
            return NextResponse.json(
                { success: false, error: `Người dùng đã có credit trong tháng ${month}/${year}. Vui lòng sử dụng chức năng chỉnh sửa thay thế.` },
                { status: 400 }
            )
        }

        // Create new credit
        const newCredit = await prisma.credit.create({
            data: {
                userId: targetUser.id,
                month: month,
                year: year,
                totalCredits: amount,
                usedCredits: 0,
                remainingCredits: amount,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        asgl_id: true
                    }
                }
            }
        })

        // Log the creation action if note is provided
        if (note) {
            await prisma.creditUsage.create({
                data: {
                    userId: targetUser.id,
                    creditId: newCredit.id,
                    amount: 0,
                    action: 'system_create',
                    metadata: JSON.stringify({
                        type: 'credit_created',
                        adminId: user.id,
                        initialAmount: amount,
                        note: note
                    })
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: `Đã tạo ${amount} credit cho ${targetUser.name} (${targetUser.asgl_id}) trong tháng ${month}/${year}`,
            data: newCredit
        })

    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Có lỗi xảy ra khi tạo credit' },
            { status: 500 }
        )
    }
}

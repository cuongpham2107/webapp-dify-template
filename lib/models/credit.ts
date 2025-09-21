import prisma from "@/lib/prisma";

// =============================================
// CREDIT INFORMATION FUNCTIONS
// =============================================

export interface CreditInfo {
    id: string;
    userId: string;
    month: number;
    year: number;
    totalCredits: number;
    usedCredits: number;
    remainingCredits: number;
    lastChatAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreditUsageInfo {
    id: string;
    userId: string;
    creditId: string;
    amount: number;
    action: string;
    metadata?: string;
    createdAt: Date;
    credit?: {
        month: number;
        year: number;
    };
}

// Get user credit for current month
export async function getUserCredit(userId: string): Promise<CreditInfo | null> {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const year = now.getFullYear();

    let credit = await prisma.credit.findUnique({
        where: {
            userId_month_year: {
                userId,
                month,
                year,
            },
        },
    });

    // If no credit for this month, create new one
    if (!credit) {
        credit = await createMonthlyCredit(userId, month, year);
    }

    return credit;
}

// Create monthly credit for user
export async function createMonthlyCredit(userId: string, month: number, year: number) {
    return await prisma.credit.create({
        data: {
            userId,
            month,
            year,
            totalCredits: 200,
            usedCredits: 0,
            remainingCredits: 200,
        },
    });
}

// Check if user has enough credit
export async function hasEnoughCredit(userId: string, amount: number = 1): Promise<boolean> {
    const creditInfo = await getUserCredit(userId);
    return creditInfo ? creditInfo.remainingCredits >= amount : false;
}

// Use credit (deduct from user's balance)
export async function useCredit(
    userId: string,
    amount: number = 1,
    action: string = 'chat',
    metadata?: any
): Promise<boolean> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get current credit
    let credit = await prisma.credit.findUnique({
        where: {
            userId_month_year: {
                userId,
                month,
                year,
            },
        },
    });

    // If no credit for this month, create new one
    if (!credit) {
        credit = await createMonthlyCredit(userId, month, year);
    }

    // Check if has enough credit
    if (credit.remainingCredits < amount) {
        return false; // Not enough credit
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
        // Update credit
        await tx.credit.update({
            where: {
                id: credit!.id,
            },
            data: {
                usedCredits: {
                    increment: amount,
                },
                remainingCredits: {
                    decrement: amount,
                },
                lastChatAt: now,
            },
        });

        // Log credit usage
        await tx.creditUsage.create({
            data: {
                userId,
                creditId: credit!.id,
                amount,
                action,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });
    });

    return true; // Credit used successfully
}

// Get credit usage history
export async function getCreditUsageHistory(userId: string, limit: number = 50) {
    return await prisma.creditUsage.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        include: {
            credit: {
                select: {
                    month: true,
                    year: true,
                },
            },
        },
    });
}

// Get monthly credit statistics for user
export async function getMonthlyStats(userId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();

    return await prisma.credit.findMany({
        where: {
            userId,
            year: currentYear,
        },
        orderBy: {
            month: 'asc',
        },
        include: {
            _count: {
                select: {
                    creditUsages: true,
                },
            },
        },
    });
}

// =============================================
// ADMIN CREDIT MANAGEMENT FUNCTIONS
// =============================================

// Get all users' credits (admin only)
export async function getAllUsersCredits(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();

    return await prisma.credit.findMany({
        where: {
            month: targetMonth,
            year: targetYear,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    asgl_id: true,
                },
            },
            _count: {
                select: {
                    creditUsages: true,
                },
            },
        },
        orderBy: {
            user: {
                name: 'asc',
            },
        },
    });
}

// Get credit by ID (admin only)
export async function getCreditById(creditId: string) {
    return await prisma.credit.findUnique({
        where: { id: creditId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    asgl_id: true,
                },
            },
            creditUsages: {
                orderBy: {
                    createdAt: 'desc',
                },
                take: 50,
            },
        },
    });
}

// Update credit (admin only)
export async function updateCredit(
    creditId: string,
    data: {
        totalCredits?: number;
        usedCredits?: number;
        remainingCredits?: number;
    }
) {
    return await prisma.credit.update({
        where: { id: creditId },
        data,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    asgl_id: true,
                },
            },
        },
    });
}

// Add bonus credit to user (admin only)
export async function addBonusCredit(userId: string, amount: number, reason?: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let credit = await prisma.credit.findUnique({
        where: {
            userId_month_year: {
                userId,
                month,
                year,
            },
        },
    });

    if (!credit) {
        credit = await createMonthlyCredit(userId, month, year);
    }

    await prisma.$transaction(async (tx) => {
        // Update credit
        await tx.credit.update({
            where: {
                id: credit!.id,
            },
            data: {
                totalCredits: {
                    increment: amount,
                },
                remainingCredits: {
                    increment: amount,
                },
            },
        });

        // Log bonus credit
        await tx.creditUsage.create({
            data: {
                userId,
                creditId: credit!.id,
                amount: -amount, // Negative amount for bonus
                action: 'bonus',
                metadata: reason ? JSON.stringify({ reason }) : null,
            },
        });
    });

    return await getUserCredit(userId);
}

// Reset monthly credits for all users (admin only, can be used in cron job)
export async function resetMonthlyCredits(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    // Create credit for the month for all users
    const creditPromises = users.map(user =>
        prisma.credit.upsert({
            where: {
                userId_month_year: {
                    userId: user.id,
                    month: targetMonth,
                    year: targetYear,
                },
            },
            create: {
                userId: user.id,
                month: targetMonth,
                year: targetYear,
                totalCredits: 200,
                usedCredits: 0,
                remainingCredits: 200,
            },
            update: {
                // Don't update if already exists
            },
        })
    );

    await Promise.all(creditPromises);

    return {
        message: `Reset credits for ${users.length} users for ${targetMonth}/${targetYear}`,
        count: users.length,
        month: targetMonth,
        year: targetYear,
    };
}

// Delete credit (admin only)
export async function deleteCredit(creditId: string) {
    return await prisma.$transaction(async (tx) => {
        // Delete credit usage history
        await tx.creditUsage.deleteMany({
            where: { creditId }
        });

        // Delete credit
        return tx.credit.delete({
            where: { id: creditId }
        });
    });
}

// =============================================
// CREDIT STATISTICS FUNCTIONS
// =============================================

// Get credit system statistics (admin only)
export async function getCreditStats(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();

    const [
        totalUsers,
        totalCreditsRecord,
        totalUsedCredits,
        totalRemainingCredits,
        totalCreditUsages,
        activeUsersThisMonth
    ] = await Promise.all([
        prisma.user.count(),
        prisma.credit.count({
            where: {
                month: targetMonth,
                year: targetYear,
            }
        }),
        prisma.credit.aggregate({
            where: {
                month: targetMonth,
                year: targetYear,
            },
            _sum: {
                usedCredits: true,
            }
        }),
        prisma.credit.aggregate({
            where: {
                month: targetMonth,
                year: targetYear,
            },
            _sum: {
                remainingCredits: true,
            }
        }),
        prisma.creditUsage.count({
            where: {
                credit: {
                    month: targetMonth,
                    year: targetYear,
                }
            }
        }),
        prisma.credit.count({
            where: {
                month: targetMonth,
                year: targetYear,
                usedCredits: {
                    gt: 0
                }
            }
        })
    ]);

    return {
        month: targetMonth,
        year: targetYear,
        totalUsers,
        usersWithCredit: totalCreditsRecord,
        activeUsers: activeUsersThisMonth,
        totalUsedCredits: totalUsedCredits._sum.usedCredits || 0,
        totalRemainingCredits: totalRemainingCredits._sum.remainingCredits || 0,
        totalCreditUsages,
        averageUsagePerActiveUser: activeUsersThisMonth > 0
            ? Math.round((totalUsedCredits._sum.usedCredits || 0) / activeUsersThisMonth)
            : 0,
    };
}

// Search credits by user (admin only)
export async function searchUserCredits(query: string, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();

    return await prisma.credit.findMany({
        where: {
            month: targetMonth,
            year: targetYear,
            user: {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                    { asgl_id: { contains: query } }
                ]
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    asgl_id: true,
                },
            },
            _count: {
                select: {
                    creditUsages: true,
                },
            },
        },
        orderBy: {
            user: {
                name: 'asc',
            },
        },
    });
}

import { PrismaClient } from '../prisma/generated/prisma';

const prisma = new PrismaClient();

export interface CreditInfo {
    totalCredits: number;
    usedCredits: number;
    remainingCredits: number;
    month: number;
    year: number;
    lastChatAt?: Date;
}

export class CreditService {
    /**
     * Lấy thông tin credit của user trong tháng hiện tại
     */
    static async getUserCredit(userId: string): Promise<CreditInfo | null> {
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

        // Nếu chưa có credit cho tháng này, tạo mới
        if (!credit) {
            credit = await this.createMonthlyCredit(userId, month, year);
        }

        return {
            totalCredits: credit.totalCredits,
            usedCredits: credit.usedCredits,
            remainingCredits: credit.remainingCredits,
            month: credit.month,
            year: credit.year,
            lastChatAt: credit.lastChatAt || undefined,
        };
    }

    /**
     * Tạo credit cho tháng mới
     */
    static async createMonthlyCredit(userId: string, month: number, year: number) {
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

    /**
     * Sử dụng credit (mỗi lần chat)
     */
    static async useCredit(userId: string, amount: number = 1, action: string = 'chat', metadata?: any): Promise<boolean> {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Lấy credit hiện tại
        let credit = await prisma.credit.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month,
                    year,
                },
            },
        });

        // Nếu chưa có credit cho tháng này, tạo mới
        if (!credit) {
            credit = await this.createMonthlyCredit(userId, month, year);
        }

        // Kiểm tra xem còn đủ credit không
        if (credit.remainingCredits < amount) {
            return false; // Không đủ credit
        }

        // Sử dụng transaction để đảm bảo tính nhất quán
        await prisma.$transaction(async (tx) => {
            // Cập nhật credit
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

            // Ghi log sử dụng credit
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

        return true; // Sử dụng credit thành công
    }

    /**
     * Kiểm tra xem user có đủ credit không
     */
    static async hasEnoughCredit(userId: string, amount: number = 1): Promise<boolean> {
        const creditInfo = await this.getUserCredit(userId);
        return creditInfo ? creditInfo.remainingCredits >= amount : false;
    }

    /**
     * Lấy lịch sử sử dụng credit
     */
    static async getCreditUsageHistory(userId: string, limit: number = 50) {
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

    /**
     * Lấy thống kê credit theo tháng
     */
    static async getMonthlyStats(userId: string, year?: number) {
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

    /**
     * Reset credit cho tháng mới (có thể dùng trong cron job)
     */
    static async resetMonthlyCredits() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Lấy tất cả user active
        const users = await prisma.user.findMany({
            select: {
                id: true,
            },
        });

        // Tạo credit cho tháng mới cho tất cả user
        const creditPromises = users.map(user =>
            prisma.credit.upsert({
                where: {
                    userId_month_year: {
                        userId: user.id,
                        month,
                        year,
                    },
                },
                create: {
                    userId: user.id,
                    month,
                    year,
                    totalCredits: 200,
                    usedCredits: 0,
                    remainingCredits: 200,
                },
                update: {
                    // Không cập nhật gì nếu đã tồn tại
                },
            })
        );

        await Promise.all(creditPromises);

        return {
            message: `Reset credits for ${users.length} users for ${month}/${year}`,
            count: users.length,
        };
    }

    /**
     * Thêm credit bonus cho user (admin function)
     */
    static async addBonusCredit(userId: string, amount: number, reason?: string) {
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
            credit = await this.createMonthlyCredit(userId, month, year);
        }

        await prisma.$transaction(async (tx) => {
            // Cập nhật credit
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

            // Ghi log bonus credit
            await tx.creditUsage.create({
                data: {
                    userId,
                    creditId: credit!.id,
                    amount: -amount, // Negative amount cho bonus
                    action: 'bonus',
                    metadata: reason ? JSON.stringify({ reason }) : null,
                },
            });
        });

        return await this.getUserCredit(userId);
    }
}

export default CreditService;

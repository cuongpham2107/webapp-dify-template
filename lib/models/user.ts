

import prisma from "../prisma";
import bcrypt from "bcryptjs";

// Authenticate local user with password verification
export async function authenticateLocalUser(login: string, password: string) {
    // Try to find user by asgl_id or email
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { asgl_id: login },
                { email: login }
            ]
        },
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
    });

    if (!user) {
        return null; // User not found locally
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return null; // Invalid password
    }

    return user;
}

export async function loginUser(email: string, asgl_id: string, name: string, password: string) {
    const checkUser = await prisma.user.findUnique({
        where: { email },
    });
    if (checkUser) {
        return checkUser;
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    return prisma.user.create({
        data: {
            email,
            asgl_id,
            name,
            password: hashedPassword,
        },
    });
}

// Get User id by asgl_id
export async function getUserIdByAsglId(asgl_id: string) {
    const user = await prisma.user.findUnique({
        where: { asgl_id },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user.id;
}

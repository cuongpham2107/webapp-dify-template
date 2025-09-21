

import prisma from "../prisma";
import bcrypt from "bcryptjs";

// Authenticate local user with password verification
export async function authenticateLocalUser(login: string, password: string) {
    // Try to find user by asgl_id or email
    const user = await prisma.user.findFirst({
        where: { asgl_id: login },
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
    console.log('Local user lookup:', user ? 'Found' : 'Not found');

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

    if (checkUser) {
        return checkUser;
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Use transaction to create user and assign default role
    return await prisma.$transaction(async (tx) => {
        // Find the default 'user' role
        const userRole = await tx.role.findUnique({
            where: { name: 'user' },
        });

        if (!userRole) {
            throw new Error('Default user role not found. Please run database seeding.');
        }

        // Create the new user
        const newUser = await tx.user.create({
            data: {
                email,
                asgl_id,
                name,
                password: hashedPassword,
            },
        });

        // Assign the default 'user' role to the new user
        await tx.userRole.create({
            data: {
                userId: newUser.id,
                roleId: userRole.id,
            },
        });

        // Return the user with role information
        return await tx.user.findUnique({
            where: { id: newUser.id },
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

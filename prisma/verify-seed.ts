import { PrismaClient } from './generated/prisma'

const prisma = new PrismaClient()

async function verifySeeding() {
    console.log('🔍 Verifying database seeding...\n')

    // Check permissions
    const permissionCount = await prisma.permission.count()
    console.log(`📋 Permissions: ${permissionCount}/23 created`)

    // Check roles
    const roleCount = await prisma.role.count()
    const roles = await prisma.role.findMany({
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    })

    console.log(`👥 Roles: ${roleCount}/5 created`)
    for (const role of roles) {
        console.log(`   • ${role.name}: ${role.permissions.length} permissions`)
    }

    // Check users
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    })

    console.log(`👤 Users: ${userCount} created`)
    for (const user of users) {
        const userRoles = user.roles.map(ur => ur.role.name).join(', ')
        console.log(`   • ${user.name} (${user.asgl_id}): ${userRoles}`)
    }

    // Check if superadmin exists and has correct role
    const superadmin = await prisma.user.findUnique({
        where: { asgl_id: 'superadmin' },
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

    if (superadmin) {
        const superadminRole = superadmin.roles.find(ur => ur.role.name === 'super_admin')
        if (superadminRole) {
            const permissionCount = superadminRole.role.permissions.length
            console.log(`\n✅ Superadmin verification:`)
            console.log(`   • User exists: ${superadmin.name}`)
            console.log(`   • Has super_admin role: Yes`)
            console.log(`   • Permissions count: ${permissionCount}/23`)

            if (permissionCount === 23) {
                console.log(`   • All permissions assigned: ✅`)
            } else {
                console.log(`   • Missing permissions: ❌`)
            }
        } else {
            console.log(`\n❌ Superadmin exists but doesn't have super_admin role`)
        }
    } else {
        console.log(`\n❌ Superadmin user not found`)
    }

    console.log('\n🎉 Verification completed!')
}

verifySeeding()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error during verification:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
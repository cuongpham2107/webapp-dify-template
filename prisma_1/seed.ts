import { PrismaClient } from './generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seeding...')

    // Create permissions
    console.log('📋 Creating permissions...')
    const permissions = await Promise.all([
        // Dataset management permissions
        prisma.permission.upsert({
            where: { name: 'datasets.view' },
            update: {},
            create: { name: 'datasets.view' }
        }),
        prisma.permission.upsert({
            where: { name: 'datasets.create' },
            update: {},
            create: { name: 'datasets.create' }
        }),
        prisma.permission.upsert({
            where: { name: 'datasets.edit' },
            update: {},
            create: { name: 'datasets.edit' }
        }),
        prisma.permission.upsert({
            where: { name: 'datasets.delete' },
            update: {},
            create: { name: 'datasets.delete' }
        }),
        prisma.permission.upsert({
            where: { name: 'datasets.manage_access' },
            update: {},
            create: { name: 'datasets.manage_access' }
        }),

        // Document management permissions
        prisma.permission.upsert({
            where: { name: 'documents.view' },
            update: {},
            create: { name: 'documents.view' }
        }),
        prisma.permission.upsert({
            where: { name: 'documents.create' },
            update: {},
            create: { name: 'documents.create' }
        }),
        prisma.permission.upsert({
            where: { name: 'documents.edit' },
            update: {},
            create: { name: 'documents.edit' }
        }),
        prisma.permission.upsert({
            where: { name: 'documents.delete' },
            update: {},
            create: { name: 'documents.delete' }
        }),
        prisma.permission.upsert({
            where: { name: 'documents.manage_access' },
            update: {},
            create: { name: 'documents.manage_access' }
        }),

        // System administration permissions
        prisma.permission.upsert({
            where: { name: 'system.admin' },
            update: {},
            create: { name: 'system.admin' }
        }),
        prisma.permission.upsert({
            where: { name: 'system.view_logs' },
            update: {},
            create: { name: 'system.view_logs' }
        }),
        prisma.permission.upsert({
            where: { name: 'system.configure' },
            update: {},
            create: { name: 'system.configure' }
        })
    ])

    console.log(`✅ Created ${permissions.length} permissions`)

    // Create roles
    console.log('👥 Creating roles...')

    // Super Admin role with all permissions
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'super_admin' },
        update: {},
        create: { name: 'super_admin' }
    })

    // Admin role with most permissions (excluding some system-level ones)
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: { name: 'admin' }
    })

    // Manager role with user and content management permissions
    const managerRole = await prisma.role.upsert({
        where: { name: 'manager' },
        update: {},
        create: { name: 'manager' }
    })

    // User role with basic permissions
    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: { name: 'user' }
    })

    // Guest role with minimal permissions
    const guestRole = await prisma.role.upsert({
        where: { name: 'guest' },
        update: {},
        create: { name: 'guest' }
    })

    console.log('✅ Created roles: super_admin, admin, manager, user, guest')

    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...')

    // Super Admin gets all permissions
    const allPermissions = permissions.map(p => p.id)
    for (const permissionId of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: superAdminRole.id,
                    permissionId: permissionId
                }
            },
            update: {},
            create: {
                roleId: superAdminRole.id,
                permissionId: permissionId
            }
        })
    }

    // Admin gets most permissions (excluding system.configure)
    const adminPermissions = permissions.filter(p =>
        p.name !== 'system.configure'
    ).map(p => p.id)

    for (const permissionId of adminPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permissionId
                }
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: permissionId
            }
        })
    }

    // Manager gets content management permissions (excluding user/role management)
    const managerPermissions = permissions.filter(p =>
        p.name.startsWith('datasets.') ||
        p.name.startsWith('documents.')
    ).map(p => p.id)

    for (const permissionId of managerPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: managerRole.id,
                    permissionId: permissionId
                }
            },
            update: {},
            create: {
                roleId: managerRole.id,
                permissionId: permissionId
            }
        })
    }

    // User gets basic view and create permissions
    const userPermissions = permissions.filter(p =>
        p.name === 'datasets.view' ||
        p.name === 'datasets.create' ||
        p.name === 'documents.view' ||
        p.name === 'documents.create' ||
        p.name === 'documents.edit'
    ).map(p => p.id)

    for (const permissionId of userPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: userRole.id,
                    permissionId: permissionId
                }
            },
            update: {},
            create: {
                roleId: userRole.id,
                permissionId: permissionId
            }
        })
    }

    // Guest gets only view permissions
    const guestPermissions = permissions.filter(p =>
        p.name === 'datasets.view' ||
        p.name === 'documents.view'
    ).map(p => p.id)

    for (const permissionId of guestPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: guestRole.id,
                    permissionId: permissionId
                }
            },
            update: {},
            create: {
                roleId: guestRole.id,
                permissionId: permissionId
            }
        })
    }

    console.log('✅ Assigned permissions to all roles')

    // Create superadmin user
    console.log('👤 Creating superadmin user...')

    const hashedPassword = bcrypt.hashSync('superadmin123', 10)

    const superAdminUser = await prisma.user.upsert({
        where: { email: 'superadmin@asgl.net.vn' },
        update: {},
        create: {
            email: 'superadmin@asgl.net.vn',
            asgl_id: 'superadmin',
            name: 'Super Administrator',
            password: hashedPassword
        }
    })

    // Assign super_admin role to the superadmin user
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: superAdminUser.id,
                roleId: superAdminRole.id
            }
        },
        update: {},
        create: {
            userId: superAdminUser.id,
            roleId: superAdminRole.id
        }
    })

    console.log('✅ Created superadmin user with credentials:')
    console.log('   📧 Email: superadmin@asgl.net.vn')
    console.log('   🆔 ASGL ID: superadmin')
    console.log('   🔑 Password: superadmin123')
    console.log('   👑 Role: super_admin')

    // Create a demo admin user
    console.log('👤 Creating demo admin user...')

    const adminHashedPassword = bcrypt.hashSync('admin123', 10)

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@asgl.net.vn' },
        update: {},
        create: {
            email: 'admin@asgl.net.vn',
            asgl_id: 'admin',
            name: 'Administrator',
            password: adminHashedPassword
        }
    })

    // Assign admin role to the admin user
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id
            }
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id
        }
    })

    console.log('✅ Created admin user with credentials:')
    console.log('   📧 Email: admin@asgl.net.vn')
    console.log('   🆔 ASGL ID: admin')
    console.log('   🔑 Password: admin123')
    console.log('   🛡️ Role: admin')

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📝 Summary:')
    console.log(`   • ${permissions.length} permissions created`)
    console.log('   • 5 roles created (super_admin, admin, manager, user, guest)')
    console.log('   • 2 admin users created')
    console.log('   • All permissions properly assigned to roles')
    console.log('\n⚠️  Please change the default passwords after first login!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error during seeding:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
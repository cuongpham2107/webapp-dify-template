# Database Seeding

This directory contains the database seeding script that initializes your application with default data including users, roles, and permissions.

## What the seed script creates

### Permissions (23 total)
The script creates comprehensive permissions organized by feature area:

**User Management:**
- `users.view` - View users list and details
- `users.create` - Create new users
- `users.edit` - Edit existing users
- `users.delete` - Delete users
- `users.assign_roles` - Assign roles to users

**Role Management:**
- `roles.view` - View roles list and details
- `roles.create` - Create new roles
- `roles.edit` - Edit existing roles
- `roles.delete` - Delete roles
- `roles.assign_permissions` - Assign permissions to roles

**Dataset Management:**
- `datasets.view` - View datasets
- `datasets.create` - Create new datasets
- `datasets.edit` - Edit existing datasets
- `datasets.delete` - Delete datasets
- `datasets.manage_access` - Manage dataset access permissions

**Document Management:**
- `documents.view` - View documents
- `documents.create` - Create new documents
- `documents.edit` - Edit existing documents
- `documents.delete` - Delete documents
- `documents.manage_access` - Manage document access permissions

**System Administration:**
- `system.admin` - Full system administration access
- `system.view_logs` - View system logs
- `system.configure` - Configure system settings

### Roles (5 total)
The script creates a hierarchical role system:

1. **super_admin** - Has ALL permissions (23/23)
   - Full system access including system configuration
   
2. **admin** - Has most permissions (22/23)
   - All permissions except `system.configure`
   
3. **manager** - Has content and user management permissions (15/23)
   - All user, dataset, and document management permissions
   
4. **user** - Has basic content permissions (5/23)
   - Can view and create datasets/documents, edit own documents
   
5. **guest** - Has minimal view-only permissions (2/23)
   - Can only view datasets and documents

### Default Users (2 total)

1. **Super Administrator**
   - Email: `superadmin@asgl.net.vn`
   - ASGL ID: `superadmin`
   - Password: `superadmin123`
   - Role: `super_admin`

2. **Administrator**
   - Email: `admin@asgl.net.vn`
   - ASGL ID: `admin`
   - Password: `admin123`
   - Role: `admin`

## How to run the seed script

### Option 1: Using npm script
```bash
npm run seed
```

### Option 2: Using Prisma CLI
```bash
npx prisma db seed
```

### Option 3: Direct execution
```bash
npx tsx prisma/seed.ts
```

## Verifying the Seed Data

To verify that the seed script created all the data correctly:

```bash
npm run verify-seed
```

This will check:
- All 23 permissions were created
- All 5 roles were created with correct permission assignments
- Admin users were created with proper roles
- Superadmin has all permissions assigned

## Important Security Notes

⚠️ **CHANGE DEFAULT PASSWORDS** - The default passwords are for development only. Make sure to change them after first login in production environments.

🔒 **Production Setup** - In production, consider:
- Using environment variables for admin credentials
- Implementing password policies
- Setting up proper SSL/TLS
- Enabling audit logging

## Database Reset and Re-seeding

If you need to reset the database and re-seed:

```bash
# Reset the database (WARNING: This will delete all data)
npx prisma migrate reset

# The reset command will automatically run the seed script
# Or you can run it manually after reset:
npm run seed
```

## Customizing the Seed Data

To customize the seed data:

1. Edit `prisma/seed.ts`
2. Modify the permissions, roles, or users as needed
3. Run the seed script again

The script uses `upsert` operations, so it's safe to run multiple times - it won't create duplicates.

## Troubleshooting

**Error: Cannot find module 'tsx'**
```bash
npm install --save-dev tsx
```

**Error: Prisma Client not found**
```bash
npx prisma generate
```

**Error: Database connection failed**
- Check your `DATABASE_URL` in `.env`
- Ensure the database server is running
- Run `npx prisma migrate dev` to apply migrations first
# Hybrid Authentication System

This project now implements a hybrid authentication system that checks local users first before falling back to the external ASGL API.

## How it Works

### Authentication Flow

1. **Local Database Check**: When a user attempts to login, the system first checks if the user exists in the local Prisma database
2. **Password Verification**: If found locally, bcrypt is used to verify the password
3. **ASGL API Fallback**: If local authentication fails (user not found or wrong password), the system attempts to authenticate via the external ASGL API
4. **User Synchronization**: ASGL-authenticated users are automatically synced to the local database for future local authentication

### Benefits

- **Performance**: Local users authenticate instantly without external API calls
- **Reliability**: System continues to work even if ASGL API is temporarily unavailable for local users
- **Admin Access**: Seeded admin users (superadmin, admin) can always login locally
- **Hybrid Support**: External ASGL users continue to work seamlessly

## User Types

### Local Users
- Created via database seeding or admin interface
- Stored in local Prisma database with bcrypt-hashed passwords
- Include role-based permissions for admin functionality
- Examples: `superadmin`, `admin` (from seed data)

### ASGL Users
- Authenticated via external ASGL API (https://id.asgl.net.vn)
- Automatically synced to local database after successful login
- Maintain ASGL permissions and company information

## Authentication Credentials

### Default Seeded Users

**Super Administrator:**
- Username: `superadmin`
- Password: `superadmin123`
- Role: `super_admin` (all permissions)

**Administrator:**
- Username: `admin` 
- Password: `admin123`
- Role: `admin` (most permissions)

⚠️ **Important**: Change these default passwords in production!

## Testing the Authentication

Run the authentication test suite:

```bash
npm run test-auth
```

This will test:
- Local superadmin authentication
- Local admin authentication  
- Wrong password handling (local → ASGL fallback)
- Non-existent user handling (local → ASGL fallback)

## Implementation Details

### Files Modified

1. **`lib/models/user.ts`**
   - Added `authenticateLocalUser()` function
   - Implements bcrypt password verification
   - Returns user with roles and permissions

2. **`service/auth.ts`**
   - Modified `login()` to check local users first
   - Added console logging for debugging
   - Maintains compatibility with ASGL API response format

3. **`lib/auth.ts`** (NextAuth configuration)
   - Updated to handle local user authentication
   - Added `isLocalUser` flag to distinguish user types
   - Enhanced session management

4. **`types/auth.ts`**
   - Extended interfaces to include `isLocalUser` property
   - Maintains type safety for both local and ASGL users

### Database Integration

The system uses Prisma ORM to:
- Query users by `asgl_id` or `email`
- Include user roles and permissions in authentication response
- Verify passwords using bcrypt comparison
- Maintain transaction safety

## Security Considerations

- **Password Hashing**: All local passwords use bcrypt with salt rounds of 10
- **Token Generation**: Local users receive temporary tokens for session management
- **Permission Checking**: Local users have role-based permissions enforced
- **Fallback Security**: ASGL API validation continues to work for external users

## Configuration

No additional configuration is required. The system automatically:
- Detects local vs external users
- Handles authentication flow switching
- Manages session data appropriately

## Troubleshooting

### Common Issues

**Login fails for seeded users:**
- Verify the database was seeded correctly: `npm run verify-seed`
- Check if passwords were changed from defaults
- Ensure Prisma database is accessible

**ASGL API fallback not working:**
- Check network connectivity to https://id.asgl.net.vn
- Verify ASGL credentials are correct
- Review console logs for specific error messages

**Session management issues:**
- Clear browser sessions/cookies
- Restart the development server
- Check NextAuth configuration in `.env`

### Debug Logging

The authentication service includes console logging:
- `🔍 Checking local database for user: {username}`
- `✅ Local user authenticated: {name}`
- `🌐 Local authentication failed, trying ASGL API...`

Enable these logs to debug authentication issues.

## Future Enhancements

Potential improvements:
- Add user preference to force ASGL authentication
- Implement password change functionality for local users
- Add audit logging for authentication attempts
- Support for multi-factor authentication
- Automatic password policy enforcement
// Admin API client functions for frontend communication

// =============================================
// USER MANAGEMENT API CLIENTS
// =============================================

export const adminUserAPI = {
    // Get all users with optional search
    async getUsers(query?: string, page?: number, limit?: number) {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());

        const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Get user by ID
    async getUserById(userId: string) {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Create new user
    async createUser(userData: {
        email: string;
        asgl_id: string;
        name: string;
        password: string;
    }) {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return res.json();
    },

    // Update user
    async updateUser(userId: string, userData: {
        email?: string;
        asgl_id?: string;
        name?: string;
        password?: string;
    }) {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return res.json();
    },

    // Delete user
    async deleteUser(userId: string) {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Get user roles
    async getUserRoles(userId: string) {
        const res = await fetch(`/api/admin/users/${userId}/roles`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Update user roles
    async updateUserRoles(userId: string, roleIds: string[]) {
        const res = await fetch(`/api/admin/users/${userId}/roles`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleIds })
        });
        return res.json();
    },

    // Assign single role to user
    async assignRole(userId: string, roleId: string) {
        const res = await fetch(`/api/admin/users/${userId}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleId })
        });
        return res.json();
    },

    // Get user access permissions
    async getUserAccess(userId: string) {
        const res = await fetch(`/api/admin/users/${userId}/access`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Update user access permissions (bulk update)
    async updateUserAccess(userId: string, accessData: {
        datasetAccess?: Record<string, { canView?: boolean; canEdit?: boolean; canDelete?: boolean }>;
        documentAccess?: Record<string, { canView?: boolean; canEdit?: boolean; canDelete?: boolean }>;
    }) {
        const res = await fetch(`/api/admin/users/${userId}/access`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accessData)
        });
        return res.json();
    },

    // Grant dataset access
    async grantDatasetAccess(userId: string, datasetId: string, permissions: {
        canView?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }) {
        const res = await fetch(`/api/admin/users/${userId}/access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'dataset',
                datasetId,
                ...permissions
            })
        });
        return res.json();
    },

    // Grant document access
    async grantDocumentAccess(userId: string, documentId: string, permissions: {
        canView?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }) {
        const res = await fetch(`/api/admin/users/${userId}/access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'document',
                documentId,
                ...permissions
            })
        });
        return res.json();
    },

    // Revoke access
    async revokeAccess(userId: string, type: 'dataset' | 'document', resourceId: string) {
        const params = new URLSearchParams({ type, resourceId });
        const res = await fetch(`/api/admin/users/${userId}/access?${params.toString()}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    }
};

// =============================================
// ROLE MANAGEMENT API CLIENTS
// =============================================

export const adminRoleAPI = {
    // Get all roles with optional search
    async getRoles(query?: string, page?: number, limit?: number) {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());

        const url = `/api/admin/roles${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Get role by ID
    async getRoleById(roleId: string) {
        const res = await fetch(`/api/admin/roles/${roleId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Create new role
    async createRole(roleData: { name: string }) {
        const res = await fetch('/api/admin/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roleData)
        });
        return res.json();
    },

    // Update role
    async updateRole(roleId: string, roleData: { name?: string }) {
        const res = await fetch(`/api/admin/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roleData)
        });
        return res.json();
    },

    // Delete role
    async deleteRole(roleId: string) {
        const res = await fetch(`/api/admin/roles/${roleId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Get role permissions
    async getRolePermissions(roleId: string) {
        const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Update role permissions
    async updateRolePermissions(roleId: string, permissionIds: string[]) {
        const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissionIds })
        });
        return res.json();
    },

    // Assign single permission to role
    async assignPermission(roleId: string, permissionId: string) {
        const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissionId })
        });
        return res.json();
    },

    // Remove permission from role
    async removePermission(roleId: string, permissionId: string) {
        const params = new URLSearchParams({ permissionId });
        const res = await fetch(`/api/admin/roles/${roleId}/permissions?${params.toString()}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    },

    // Initialize default roles and permissions
    async initializeDefaults() {
        const res = await fetch('/api/admin/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'initialize' })
        });
        return res.json();
    }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const adminAPI = {
    // Handle API response with error checking
    async handleResponse(response: Response) {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    },

    // Check if user has admin privileges
    async checkAdminAccess() {
        try {
            const res = await fetch('/api/admin/users?limit=1', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return res.ok;
        } catch {
            return false;
        }
    }
};
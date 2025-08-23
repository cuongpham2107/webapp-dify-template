"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Users, Settings } from "lucide-react"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavAdmin() {
    const router = useRouter()
    const { user: currentUser, isAuthenticated } = useAuth()

    // Don't render if user is not authenticated
    if (!isAuthenticated || !currentUser) {
        return null
    }

    // Simple admin check: only admin or superadmin can access
    const isAdmin = currentUser.asgl_id === 'admin' || currentUser.asgl_id === 'superadmin'

    if (!isAdmin) {
        return null
    }

    // Define admin menu items (all visible for admin/superadmin)
    const adminMenuItems = [
        {
            title: "Người dùng",
            icon: Users,
            url: "/admin/users",
            description: "Manage users, roles, and permissions"
        },
        {
            title: "Phân quyền",
            icon: Settings,
            url: "/admin/roles",
            description: "Manage roles and permissions"
        }
    ]

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between ">
                <span> Quản lý tài khoản</span>
            </SidebarGroupLabel>
            <SidebarMenu>
                {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild onClick={() => router.push(item.url)}>
                            <a href={item.url} title={item.description}>
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.title}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
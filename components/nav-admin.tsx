"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Users, Settings, CreditCard, BarChart3 } from "lucide-react"
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
    const isSuperAdmin = currentUser.asgl_id === 'superadmin'

    if (!isAdmin) {
        return null
    }

    // Define admin menu items
    const adminMenuItems = [
        {
            title: "Người dùng",
            icon: Users,
            url: "/admin/users",
            description: "Manage users, roles, and permissions",
            requiredRole: 'admin' // admin or superadmin
        },
        {
            title: "Phân quyền",
            icon: Settings,
            url: "/admin/roles",
            description: "Manage roles and permissions",
            requiredRole: 'admin' // admin or superadmin
        }
    ]

    // Add credit management for superadmin only
    if (isSuperAdmin) {
        adminMenuItems.push({
            title: "Quản lý Credit",
            icon: CreditCard,
            url: "/admin/credits",
            description: "Manage user credits",
            requiredRole: 'superadmin'
        })

        adminMenuItems.push({
            title: "Langfuse Analytics",
            icon: BarChart3,
            url: "/admin/langfuse",
            description: "AI model costs and usage analytics",
            requiredRole: 'superadmin'
        })
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between text-white/90 font-medium">
                <span> Quản lý tài khoản</span>
            </SidebarGroupLabel>
            <SidebarMenu>
                {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            onClick={(e) => {
                                e.preventDefault()
                                router.push(item.url)
                            }}
                            className="text-white/90 hover:text-white hover:bg-white/10 active:text-white active:bg-white/15 active:scale-95 transition-all duration-150 cursor-pointer"
                            title={item.description}
                        >
                            <item.icon className="mr-2 h-4 w-4 text-sky-100" />
                            <span>{item.title}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
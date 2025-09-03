"use client"

import { EllipsisVerticalIcon, FolderKanban, PenBox } from "lucide-react"

import {
  Collapsible,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { AddEditDatasetDialog } from "@/app/(app)/dataset/components/add-edit"
import { DeleteDatasetDialog } from "@/app/(app)/dataset/components/delete-confirm"
import { useEffect, useState } from "react"
import { getAllDatasets } from "@/lib/api/dataset"
import { Dataset } from "@/types/base"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavDataset() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const { userPermissions, isLoading: permissionsLoading, canAccess } = usePermissions();

  useEffect(() => {
    if (!permissionsLoading) {
      getDatasets();
    }
  }, [permissionsLoading]);

  const getDatasets = () => {
    getAllDatasets().then(data => {
      if (data.datasets) {
        setDatasets(data.datasets.map((ds: any) => ({ id: ds.id, name: ds.name })));
      }
    });
  }

  // Check permissions for dataset operations
  const canViewDatasets = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('datasets', 'view');
  const canCreateDatasets = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('datasets', 'create');
  const canEditDatasets = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('datasets', 'edit');
  const canDeleteDatasets = userPermissions.isAdmin || userPermissions.isSuperAdmin || canAccess('datasets', 'delete');

  // Don't render if user doesn't have permission to view datasets
  if (permissionsLoading || !canViewDatasets) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between text-white/90 font-medium">
        <span> Quản lý tài liệu</span>
        {canCreateDatasets && (
          <AddEditDatasetDialog type={"add"} hidden_label={true} sidebar={true} handleReloadDatasets={getDatasets} />
        )}
      </SidebarGroupLabel>
      <SidebarMenu className="mt-2">
        {datasets.map((item) => (
          <Collapsible key={item.name} asChild>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.name} className="pr-0 text-white/90 hover:text-white hover:bg-white/10 active:text-white active:bg-white/15 active:scale-95 transition-all duration-150">
                <div
                  className="relative flex items-center w-full"
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <div
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(`/dataset/${item.id}`)
                    }}
                    className="flex items-center w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                    title={item.name}
                  >
                    <FolderKanban className="mr-2 min-w-[16px] w-4 h-4 text-sky-100" size={16} />
                    <span
                      className={`overflow-hidden text-ellipsis whitespace-nowrap transition-all flex-1 pr-0 ${hoveredItemId === item.id && (canEditDatasets || canDeleteDatasets) ? 'pr-16' : ''}`}
                      style={{ transition: 'padding-right 0.2s' }}
                    >
                      {item.name}
                    </span>
                  </div>
                  {(canEditDatasets || canDeleteDatasets) && (
                    <div
                      className={`absolute right-0 flex flex-row items-center gap-2 transition-opacity duration-200 dark:bg-background px-1 ${hoveredItemId === item.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      style={{ height: '100%' }}
                    >
                      {canEditDatasets && (
                        <AddEditDatasetDialog type="edit" id={item.id} hidden_border={true} sidebar={true} handleReloadDatasets={getDatasets} />
                      )}
                      {canDeleteDatasets && (
                        <DeleteDatasetDialog id={item.id} name={item.name} hidden_border={true} onDeleted={getDatasets} />
                      )}
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

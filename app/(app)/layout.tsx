import { getLocaleOnServer } from '@/i18n/server'
import '../styles/globals.css'
import '../styles/markdown.scss'
import AuthProvider from '@/components/auth-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from "@/components/ui/sonner"
const LocaleLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <body className="h-full">
        <AuthProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <div className="overflow-x-auto">
                <div className="h-screen min-w-[300px]">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}

export default LocaleLayout

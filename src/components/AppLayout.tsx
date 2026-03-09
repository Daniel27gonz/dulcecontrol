import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import dulceControlLogo from '@/assets/dulcecontrol-logo.png';

export function AppLayout({ children }: {children: React.ReactNode;}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Sidebar - always visible on desktop, hidden on mobile */}
        <div className="hidden md:block sticky top-0 h-screen">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top logo bar */}
          <div className="sticky top-0 z-30 flex items-center justify-center py-3 md:hidden">
            
          </div>

          <main className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
        </div>

        {/* Bottom nav - only on mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>);

}
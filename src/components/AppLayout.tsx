import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Sidebar - always visible on desktop, hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
        </div>

        {/* Bottom nav - only on mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}

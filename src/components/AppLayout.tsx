import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop top bar with sidebar trigger */}
          <header className="hidden md:flex h-12 items-center border-b border-border/50 bg-card px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>

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

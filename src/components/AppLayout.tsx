import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import dulceControlLogo from '@/assets/dulcecontrol-logo.png';

export function AppLayout({ children }: {children: React.ReactNode;}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Sidebar - fixed on desktop, offcanvas drawer on mobile */}
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile hamburger bar */}
          <div className="sticky top-0 z-30 flex items-center gap-2 px-3 py-2 md:hidden bg-card/95 backdrop-blur-lg border-b border-border/50">
            <SidebarTrigger className="h-9 w-9" />
            <img src={dulceControlLogo} alt="DulceControl" className="h-8 object-contain" />
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
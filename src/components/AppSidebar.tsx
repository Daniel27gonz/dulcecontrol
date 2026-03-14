import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Package, Calculator, FileText, Sparkles, ClipboardList, Wallet,
  HelpCircle, Settings, ChefHat, Users, Receipt, LogOut
} from 'lucide-react';
import dulceControlLogo from '@/assets/dulcecontrol-logo.png';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Inicio', url: '/dashboard', icon: Home },
  { title: 'Ingredientes', url: '/ingredients', icon: Package },
  { title: 'Mis Recetas', url: '/recipes', icon: ChefHat },
  { title: 'Mano de Obra', url: '/labor', icon: Users },
  { title: 'Gastos del Mes', url: '/indirect-costs', icon: Receipt },
  { title: 'Calcular', url: '/calculator', icon: Calculator },
  { title: 'Cotizar', url: '/quotations', icon: FileText },
  { title: 'Diseño', url: '/personalization', icon: Sparkles },
  { title: 'Pedidos', url: '/orders', icon: ClipboardList },
  { title: 'Finanzas', url: '/finances', icon: Wallet },
];

const bottomItems = [
  { title: 'Tutorial', url: '/help', icon: HelpCircle },
  { title: 'Configuración', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useApp();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/50">
      <SidebarContent className="bg-card">
        {/* Logo / Brand */}
        <div className="px-3 py-4 border-b border-border/50 flex items-center justify-center">
          <img src={dulceControlLogo} alt="DulceControl" className="h-10 w-auto object-contain" />
        </div>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">
            Menú
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom items */}
      <SidebarFooter className="bg-card border-t border-border/50">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
                  activeClassName="bg-primary/10 text-primary font-semibold"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Logout button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="text-sm">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
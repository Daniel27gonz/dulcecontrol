import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Download, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';

interface AppHeaderProps {
  title?: string;
  showGreeting?: boolean;
  showBack?: boolean;
}

export function AppHeader({ title, showGreeting = false, showBack = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const { logout, user, settings } = useApp();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
  };

  const handleInstall = async () => {
    console.log('[PWA] Header install button clicked');
    try {
      const installed = await promptInstall();
      if (installed) {
        toast.success('¡App instalada correctamente!');
      }
    } catch (error) {
      console.error('[PWA] Error en instalación:', error);
      toast.error('Error al instalar. Intenta desde el menú del navegador.');
    }
  };

  const showInstallButton = isInstallable && !isInstalled;

  return (
    <div className="bg-gradient-to-br from-caramel/20 to-accent/20 p-4 pt-10 safe-top">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {showBack && (
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            {showGreeting ? (
              <>
                <p className="text-muted-foreground text-sm">¡Hola! 👋</p>
                <h1 className="text-xl font-bold text-foreground truncate">
                  {user?.name || settings.userName || 'Bienvenido'}
                </h1>
              </>
            ) : (
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {showInstallButton && (
            <Button
              onClick={handleInstall}
              variant="secondary"
              size="sm"
              className="whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-1" />
              Instalar
            </Button>
          )}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-caramel"
          >
            <Link to="/settings">
              <Settings className="w-5 h-5" />
            </Link>
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

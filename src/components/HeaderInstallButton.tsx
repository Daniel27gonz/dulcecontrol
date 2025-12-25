import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function HeaderInstallButton() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  // Only show if automatic installation is available and not already installed
  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    console.log('[PWA] Header install button clicked');
    await promptInstall();
  };

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs bg-caramel/10 border-caramel/30 text-caramel hover:bg-caramel/20 hover:text-caramel"
    >
      <Download className="w-3.5 h-3.5" />
      Instalar
    </Button>
  );
}

import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calculator, ClipboardList, Wallet, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/calculator', icon: Calculator, label: 'Calcular' },
  { to: '/quotations', icon: FileText, label: 'Cotizar' },
  { to: '/orders', icon: ClipboardList, label: 'Pedidos' },
  { to: '/finances', icon: Wallet, label: 'Finanzas' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive ? 'text-caramel' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-caramel/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5 relative z-10', isActive && 'scale-110')} />
              <span className="text-[10px] mt-1 font-medium relative z-10">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

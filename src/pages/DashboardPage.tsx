import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, ChefHat, FileText, Users, Receipt } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { AppHeader } from '@/components/AppHeader';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { settings } = useApp();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <AppHeader title="Inicio" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-6 lg:p-8"
        >
          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-4">Acceso rápido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { icon: Plus, label: 'Nueva receta', path: '/calculator', accent: true },
                { icon: ChefHat, label: 'Mis recetas', path: '/recipes' },
                { icon: Users, label: 'Mano de Obra', path: '/labor' },
                { icon: Receipt, label: 'Gastos Indirectos', path: '/indirect-costs' },
                { icon: FileText, label: 'Cotizaciones', path: '/quotations' },
                { icon: ClipboardList, label: 'Pedidos', path: '/orders' },
              ].map(({ icon: Icon, label, path, accent }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-card border border-border/50 shadow-soft hover:shadow-card transition-all duration-300 active:scale-[0.97] group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${accent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

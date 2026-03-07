import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, ChefHat, FileText, Users, Receipt } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/AppLayout';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, settings } = useApp();

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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-6 lg:p-8 space-y-6"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="text-center py-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Bienvenida a DulceControl
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tu panel de control para gestionar tu negocio de repostería 🧁
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-4">Acceso rápido</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-card transition-all duration-300 active:scale-[0.96] group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${accent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ChefHat, FileText, Users, Receipt, ClipboardList, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/AppLayout';
import dashboardBg from '@/assets/dashboard-bg.jpg';

const quickActions = [
  { icon: Plus, label: 'Nueva Receta', path: '/calculator', description: 'Crea y costea' },
  { icon: ChefHat, label: 'Mis Recetas', path: '/recipes', description: 'Ver catálogo' },
  { icon: Users, label: 'Mano de Obra', path: '/labor', description: 'Gestionar equipo' },
  { icon: Receipt, label: 'Gastos del Mes', path: '/indirect-costs', description: 'Costos fijos' },
  { icon: FileText, label: 'Cotizaciones', path: '/quotations', description: 'Presupuestos' },
  { icon: ClipboardList, label: 'Pedidos', path: '/orders', description: 'Seguimiento' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useApp();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={dashboardBg}
            alt=""
            className="w-full h-full object-cover opacity-[0.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8"
        >
          {/* Hero Welcome */}
          <motion.div
            variants={itemVariants}
            className="text-center py-8 sm:py-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 text-secondary-foreground text-xs font-semibold mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Panel de Control
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Bienvenida a{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-[hsl(var(--caramel))]">
                DulceControl
              </span>
            </h1>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-md mx-auto">
              Gestiona tu negocio de repostería con precisión y estilo ✨
            </p>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Acceso rápido
              </h2>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-secondary/50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {quickActions.map(({ icon: Icon, label, path, description }, index) => (
                <motion.button
                  key={path}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(path)}
                  className="group relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:border-primary/20 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    index === 0
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-foreground block leading-tight">{label}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">{description}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Decorative footer */}
          <motion.div variants={itemVariants} className="text-center pt-4 pb-8">
            <p className="text-[11px] text-muted-foreground/60">
              DulceControl · Tu asistente de costos para repostería
            </p>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

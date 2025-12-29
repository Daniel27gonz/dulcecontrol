import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, DollarSign, TrendingUp, Wallet, TrendingDown, ChefHat, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';
import { UpcomingOrdersCard } from '@/components/dashboard/UpcomingOrdersCard';
import { Card, CardContent } from '@/components/ui/card';
import { startOfMonth, parseISO, isWithinInterval, endOfMonth } from 'date-fns';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { recipes, orders, transactions, settings, getTotalIncome, getTotalExpenses, getNetProfit } = useApp();

  // Calculate current month stats
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyProfit = monthlyIncome - monthlyExpenses;

  // All time stats
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const netProfit = getNetProfit();

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

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
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Dashboard" showGreeting />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-5"
      >
        {/* Hero Metric - Monthly Profit */}
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Ganancia del mes"
            value={formatCurrency(monthlyProfit)}
            subtitle="Este mes"
            icon={<TrendingUp className="w-7 h-7" />}
            variant="primary"
            size="lg"
          />
        </motion.div>

        {/* Monthly Income/Expenses */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Ingresos"
            value={formatCurrency(monthlyIncome)}
            subtitle="Este mes"
            icon={<Wallet className="w-5 h-5" />}
            variant="success"
            size="sm"
          />
          <MetricCard
            title="Gastos"
            value={formatCurrency(monthlyExpenses)}
            subtitle="Este mes"
            icon={<TrendingDown className="w-5 h-5" />}
            variant="warning"
            size="sm"
          />
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants}>
          <QuickStats />
        </motion.div>

        {/* Weekly Chart */}
        <motion.div variants={itemVariants}>
          <MonthlyChart />
        </motion.div>

        {/* Top Products */}
        <motion.div variants={itemVariants}>
          <TopProductsCard />
        </motion.div>

        {/* Upcoming Orders */}
        <motion.div variants={itemVariants}>
          <UpcomingOrdersCard />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-foreground mb-3">Acceso rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => navigate('/calculator')}
              variant="warm"
              size="lg"
              className="w-full justify-start"
            >
              <Plus className="w-5 h-5" />
              Nueva receta
            </Button>

            <Button
              onClick={() => navigate('/recipes')}
              variant="secondary"
              size="lg"
              className="w-full justify-start"
            >
              <ChefHat className="w-5 h-5" />
              Mis recetas
            </Button>

            <Button
              onClick={() => navigate('/quotations')}
              variant="secondary"
              size="lg"
              className="w-full justify-start"
            >
              <FileText className="w-5 h-5" />
              Cotizaciones
            </Button>

            <Button
              onClick={() => navigate('/orders')}
              variant="secondary"
              size="lg"
              className="w-full justify-start"
            >
              <ClipboardList className="w-5 h-5" />
              Pedidos
            </Button>
          </div>
        </motion.div>

        {/* Empty state if no recipes */}
        {recipes.length === 0 && (
          <motion.div variants={itemVariants}>
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">🧁</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">
                  ¡Comienza ahora!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea tu primera receta y descubre cuánto deberías cobrar por ella
                </p>
                <Button onClick={() => navigate('/calculator')} variant="warm">
                  <Plus className="w-4 h-4" />
                  Crear primera receta
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* All-time summary at bottom */}
        {transactions.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2 text-center">Acumulado total</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-success">{formatCurrency(totalIncome)}</p>
                    <p className="text-xs text-muted-foreground">Ingresos</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                    <p className="text-xs text-muted-foreground">Gastos</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(netProfit)}</p>
                    <p className="text-xs text-muted-foreground">Neto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <BottomNav />
    </div>
  );
}

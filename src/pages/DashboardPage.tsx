import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, TrendingUp, ChefHat, DollarSign, Package, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { recipes, orders, settings, calculateRecipeCost, getTotalIncome, getTotalExpenses, getNetProfit } = useApp();

  // Calculated stats from local data
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const netProfit = getNetProfit();
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const lastRecipe = recipes[recipes.length - 1];
  const lastRecipeCost = lastRecipe ? calculateRecipeCost(lastRecipe) : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Dashboard" showGreeting />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Main Financial Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3">
          {/* Net Profit - Hero Card */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Ganancia Neta</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(netProfit)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income and Expenses */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
                    <p className="text-xs text-muted-foreground">Ingresos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                    <p className="text-xs text-muted-foreground">Gastos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Business Stats */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-foreground mb-3">Resumen del negocio</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-caramel" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{recipes.length}</p>
                  <p className="text-xs text-muted-foreground">Recetas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                  <Package className="w-5 h-5 text-caramel" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                  <p className="text-xs text-muted-foreground">Total pedidos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Order Status Summary */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Estado de pedidos</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">{pendingOrders}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{inProgressOrders}</p>
                  <p className="text-xs text-muted-foreground">En proceso</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">{completedOrders}</p>
                  <p className="text-xs text-muted-foreground">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Last Recipe */}
        {lastRecipe && lastRecipeCost && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Última receta</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success font-medium">
                    {lastRecipe.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{lastRecipe.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Costo: {formatCurrency(lastRecipeCost.totalCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(lastRecipeCost.suggestedPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ganancia: {formatCurrency(lastRecipeCost.profit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-foreground mb-3">Acceso rápido</h2>
          <div className="grid grid-cols-1 gap-3">
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
              onClick={() => navigate('/orders')}
              variant="secondary"
              size="lg"
              className="w-full justify-start"
            >
              <ClipboardList className="w-5 h-5" />
              Ver pedidos
            </Button>

            <Button
              onClick={() => navigate('/finances')}
              variant="secondary"
              size="lg"
              className="w-full justify-start"
            >
              <DollarSign className="w-5 h-5" />
              Ver finanzas
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
      </motion.div>

      <BottomNav />
    </div>
  );
}

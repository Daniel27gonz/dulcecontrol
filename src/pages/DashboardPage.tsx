import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, TrendingUp, ChefHat, DollarSign, Package, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { BottomNav } from '@/components/BottomNav';

const DashboardPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { recipes, orders, settings, calculateRecipeCost, getNetProfit } = useApp();
  const { user, logout } = useAuth();

  const totalProfit = getNetProfit();
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'in_progress').length;
  const lastRecipe = recipes[recipes.length - 1];
  const lastRecipeCost = lastRecipe ? calculateRecipeCost(lastRecipe) : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-caramel/20 to-accent/20 p-6 pt-10 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div className="space-y-1">
            <p className="text-muted-foreground">¡Hola! 👋</p>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.name || settings.userName || 'Bienvenido'}
            </h1>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Main Stats Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Ganancia Total</p>
                  <p className="text-3xl font-bold mt-1">
                    {settings.currencySymbol}{totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
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
                <p className="text-2xl font-bold text-foreground">{pendingOrders}</p>
                <p className="text-xs text-muted-foreground">Pedidos activos</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Último precio calculado</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success font-medium">
                    {lastRecipe.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{lastRecipe.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Costo: {settings.currencySymbol}{lastRecipeCost.totalCost}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success">
                      {settings.currencySymbol}{lastRecipeCost.suggestedPrice}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ganancia: {settings.currencySymbol}{lastRecipeCost.profit}
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
              Ver ganancias
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
});

DashboardPage.displayName = 'DashboardPage';

export default DashboardPage;

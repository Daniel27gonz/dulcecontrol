import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, CalendarDays, 
  FileText, ShoppingCart, Package, Users, Wrench, 
  ChevronLeft, ChevronRight, Plus, Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { useBaseIngredients, INGREDIENT_CATEGORIES } from '@/context/BaseIngredientsContext';
import { useIndirectCosts } from '@/context/IndirectCostsContext';
import { useLabor } from '@/context/LaborContext';
import { useQuotations } from '@/context/QuotationsContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { TransactionForm } from '@/components/finances/TransactionForm';
import { FinanceChart } from '@/components/finances/FinanceChart';
import { TransactionList } from '@/components/finances/TransactionList';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function FinancesPage() {
  const { settings, transactions, orders, deleteTransaction } = useApp();
  const { ingredients: baseIngredients } = useBaseIngredients();
  const { } = useIndirectCosts();
  const { } = useLabor();
  const { quotations } = useQuotations();

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const isInMonth = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    } catch { return false; }
  };

  // Navigate months
  const prevMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // === DATA COMPUTATIONS ===
  const monthlyData = useMemo(() => {
    // Transactions this month
    const monthTransactions = transactions.filter(t => isInMonth(t.date));
    const incomeTransactions = monthTransactions.filter(t => t.type === 'income');
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Orders this month
    const monthOrders = orders.filter(o => isInMonth(o.createdAt));
    const completedOrders = monthOrders.filter(o => o.status === 'completed');

    // Quotations this month
    const monthQuotations = quotations.filter(q => isInMonth(q.createdAt));

    // === GROUPED DATA FOR RESUMEN ===

    // 1. Ingredients grouped by category
    const ingredientTransactions = expenseTransactions.filter(t => t.sourceType === 'ingredient');
    const ingredientsByCategory: Record<string, number> = {};
    ingredientTransactions.forEach(t => {
      // Find the ingredient to get its category
      const ingredient = baseIngredients.find(ing => ing.id === t.sourceId);
      const catId = ingredient?.category || 'otros';
      const catLabel = INGREDIENT_CATEGORIES.find(c => c.id === catId)?.name || catId;
      ingredientsByCategory[catLabel] = (ingredientsByCategory[catLabel] || 0) + t.amount;
    });

    // 2. Labor total from transactions
    const laborTransactions = expenseTransactions.filter(t => t.sourceType === 'worker');
    const totalLaborCost = laborTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 3. Indirect costs grouped by description (concept)
    const indirectTransactions = expenseTransactions.filter(t => t.sourceType === 'indirect_cost');
    const indirectByCategory: Record<string, number> = {};
    indirectTransactions.forEach(t => {
      indirectByCategory[t.description] = (indirectByCategory[t.description] || 0) + t.amount;
    });

    // 4. Other manual transactions (no source)
    const otherExpenses = expenseTransactions.filter(t => !t.sourceType);

    // Combined expenses for the month (all from transactions)
    const combinedExpenses = totalExpenses;

    // Profit
    const profit = totalIncome - combinedExpenses;

    // Anticipos (advance payments) vs final payments
    const anticipos = incomeTransactions.filter(t => t.description.toLowerCase().includes('anticipo'));
    const totalAnticipos = anticipos.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      combinedExpenses,
      profit,
      monthOrders,
      completedOrders,
      monthQuotations,
      incomeTransactions,
      expenseTransactions,
      monthTransactions,
      totalLaborCost,
      totalAnticipos,
      ingredientsByCategory,
      indirectByCategory,
      otherExpenses,
    };
  }, [transactions, orders, quotations, baseIngredients, selectedMonth]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cs = settings.currencySymbol;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Finanzas" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-5"
      >
        {/* Header with Month Selector */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Finanzas del Negocio</h1>
          <p className="text-sm text-muted-foreground">Resumen financiero del mes seleccionado</p>
          
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="bg-card border border-border/50 rounded-xl px-5 py-2 min-w-[180px]">
              <p className="text-base font-semibold text-foreground capitalize">
                {format(selectedMonth, 'MMMM yyyy', { locale: es })}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-full">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* 3 Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Income Card */}
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-success/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos del mes</p>
              </div>
              <p className="text-2xl font-bold text-success">
                {cs}{monthlyData.totalIncome.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-destructive/15 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Gastos y compras del mes</p>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {cs}{monthlyData.combinedExpenses.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Profit Card */}
          <Card className={cn(
            'border-0',
            monthlyData.profit >= 0
              ? 'bg-gradient-to-br from-success/10 to-success/5'
              : 'bg-gradient-to-br from-destructive/10 to-destructive/5'
          )}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center',
                  monthlyData.profit >= 0 ? 'bg-success/15' : 'bg-destructive/15'
                )}>
                  <Wallet className={cn('w-5 h-5', monthlyData.profit >= 0 ? 'text-success' : 'text-destructive')} />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {monthlyData.profit >= 0 ? 'Ganancia del mes' : 'Pérdida del mes'}
                </p>
              </div>
              <p className={cn(
                'text-2xl font-bold',
                monthlyData.profit >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {cs}{Math.abs(monthlyData.profit).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{monthlyData.monthQuotations.length}</p>
                  <p className="text-xs text-muted-foreground">Cotizaciones este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{monthlyData.monthOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Pedidos este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3-Column Financial Summary */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-muted-foreground" />
                Resumen Financiero del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Materials grouped by category */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Compras de ingredientes
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(monthlyData.ingredientsByCategory).map(([category, total]) => (
                      <div key={category} className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-muted/30 text-sm">
                        <span className="text-foreground truncate mr-2">{category}</span>
                        <span className="text-destructive font-medium whitespace-nowrap">{cs}{total.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(monthlyData.ingredientsByCategory).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Sin compras registradas</p>
                    )}
                  </div>
                </div>

                {/* Column 2: Expenses grouped */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    Gastos del mes
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(monthlyData.indirectByCategory).map(([concept, total]) => (
                      <div key={concept} className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-muted/30 text-sm">
                        <span className="text-foreground truncate mr-2">{concept}</span>
                        <span className="text-destructive font-medium whitespace-nowrap">{cs}{total.toFixed(2)}</span>
                      </div>
                    ))}
                    {monthlyData.totalLaborCost > 0 && (
                      <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-muted/30 text-sm">
                        <span className="text-foreground">Mano de obra</span>
                        <span className="text-destructive font-medium">{cs}{monthlyData.totalLaborCost.toFixed(2)}</span>
                      </div>
                    )}
                    {monthlyData.otherExpenses.map(t => (
                      <div key={t.id} className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-muted/30 text-sm">
                        <span className="text-foreground truncate mr-2">{t.description}</span>
                        <span className="text-destructive font-medium whitespace-nowrap">{cs}{t.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(monthlyData.indirectByCategory).length === 0 && monthlyData.totalLaborCost === 0 && monthlyData.otherExpenses.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Sin gastos registrados</p>
                    )}
                  </div>
                </div>

                {/* Column 3: Income */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Ingresos del mes
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {monthlyData.incomeTransactions.map(t => (
                      <div key={t.id} className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-success/5 text-sm">
                        <div className="truncate mr-2">
                          <span className="text-foreground">{t.description}</span>
                          {t.description.toLowerCase().includes('anticipo') && (
                            <span className="ml-1 text-[10px] bg-accent/50 text-accent-foreground px-1.5 py-0.5 rounded-full">Anticipo</span>
                          )}
                        </div>
                        <span className="text-success font-medium whitespace-nowrap">{cs}{t.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {monthlyData.incomeTransactions.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Sin ingresos registrados</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Totals */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Anticipos</p>
              <p className="text-xl font-bold text-foreground">{cs}{monthlyData.totalAnticipos.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Ingresos</p>
              <p className="text-xl font-bold text-success">{cs}{monthlyData.totalIncome.toFixed(2)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction History Table */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Historial de Transacciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="min-w-[500px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Categoría</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Descripción</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.monthTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No hay transacciones en este mes
                          </td>
                        </tr>
                      ) : (
                        [...monthlyData.monthTransactions]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(t => (
                            <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="p-3 text-foreground whitespace-nowrap">
                                {format(new Date(t.date), 'dd MMM yyyy', { locale: es })}
                              </td>
                              <td className="p-3">
                                <span className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                  t.type === 'income'
                                    ? 'bg-success/10 text-success'
                                    : 'bg-destructive/10 text-destructive'
                                )}>
                                  {t.type === 'income' ? (
                                    <><TrendingUp className="w-3 h-3" /> Ingreso</>
                                  ) : (
                                    <><TrendingDown className="w-3 h-3" /> Gasto</>
                                  )}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground capitalize">{t.category.replace('_', ' ')}</td>
                              <td className="p-3 text-foreground">{t.description}</td>
                              <td className={cn(
                                'p-3 text-right font-semibold whitespace-nowrap',
                                t.type === 'income' ? 'text-success' : 'text-destructive'
                              )}>
                                {t.type === 'income' ? '+' : '-'}{cs}{t.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}

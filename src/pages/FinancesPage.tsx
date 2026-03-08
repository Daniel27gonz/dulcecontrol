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

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get unique categories from month transactions
  const monthCategories = useMemo(() => {
    const cats = new Set(monthlyData.monthTransactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [monthlyData.monthTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...monthlyData.monthTransactions];
    if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType);
    if (filterCategory !== 'all') filtered = filtered.filter(t => t.category === filterCategory);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthlyData.monthTransactions, filterType, filterCategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Finanzas" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Month Selector */}
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span className="capitalize">{format(selectedMonth, 'MMMM yyyy', { locale: es })}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-9">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* 3 Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
              <p className="text-lg font-bold text-success">{cs}{monthlyData.totalIncome.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Gastos</p>
              <p className="text-lg font-bold text-destructive">{cs}{monthlyData.combinedExpenses.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className={cn(
            monthlyData.profit >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
          )}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className={cn('text-lg font-bold', monthlyData.profit >= 0 ? 'text-success' : 'text-destructive')}>
                {cs}{Math.abs(monthlyData.profit).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters + Table */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Historial de Transacciones</CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="text-sm rounded-lg border border-border bg-background px-3 py-1.5 text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-3 py-1.5 text-foreground"
                >
                  <option value="all">Todas las categorías</option>
                  {monthCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
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
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No hay transacciones
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map(t => (
                          <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-foreground whitespace-nowrap">
                              {format(new Date(t.date), 'dd MMM yyyy', { locale: es })}
                            </td>
                            <td className="p-3">
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                t.type === 'income'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-orange-500/10 text-orange-600'
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
                              t.type === 'income' ? 'text-success' : 'text-orange-600'
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
              <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                {filteredTransactions.length} registro{filteredTransactions.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, CalendarDays, 
  FileText, ShoppingCart, Package, Users, Wrench, 
  ChevronLeft, ChevronRight, Plus, Receipt,
  ChevronDown, Calendar, Filter, Trash2
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { TransactionForm } from '@/components/finances/TransactionForm';
import { FinanceChart } from '@/components/finances/FinanceChart';
import { TransactionList } from '@/components/finances/TransactionList';
import { useMonthlyFinancials } from '@/hooks/useMonthlyFinancials';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function FinancesPage() {
  const { settings, transactions, deleteTransaction } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Use the unified financial hook - single source of truth
  const monthlyData = useMonthlyFinancials(selectedMonth);

  // Navigate months
  const prevMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

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
                {cs}{monthlyData.totalExpenses.toFixed(2)}
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
                    {Object.entries(monthlyData.depreciationByEquipment).map(([name, amount]) => (
                      <div key={name} className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-muted/30 text-sm">
                        <span className="text-foreground truncate mr-2">{name}</span>
                        <span className="text-destructive font-medium whitespace-nowrap">{cs}{amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(monthlyData.indirectByCategory).length === 0 && monthlyData.totalLaborCost === 0 && monthlyData.otherExpenses.length === 0 && monthlyData.totalDepreciation === 0 && (
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
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Anticipos</p>
              <p className="text-xl font-bold text-foreground">{cs}{monthlyData.totalAnticipos.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Otros Ingresos</p>
              <p className="text-xl font-bold text-primary">{cs}{monthlyData.totalOtherIncome.toFixed(2)}</p>
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
        {/* ===== HISTORIAL DE TRANSACCIONES ===== */}
        <HistorialTransacciones 
          transactions={transactions}
          cs={cs}
          itemVariants={itemVariants}
          deleteTransaction={deleteTransaction}
        />
      </motion.div>

      <BottomNav />
    </div>
  );
}

/* ============ Historial de Transacciones Component ============ */
function HistorialTransacciones({ 
  transactions, 
  cs, 
  itemVariants,
  deleteTransaction,
}: { 
  transactions: any[];
  cs: string;
  itemVariants: any;
  deleteTransaction: (id: string) => void;
}) {
  const [histMonth, setHistMonth] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  // Use the unified financial hook for summary cards
  const histFinancials = useMonthlyFinancials(histMonth);

  const histMonthStart = startOfMonth(histMonth);
  const histMonthEnd = endOfMonth(histMonth);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const d = new Date(t.date);
        if (!isWithinInterval(d, { start: histMonthStart, end: histMonthEnd })) return false;
      } catch { return false; }
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, histMonth, typeFilter, categoryFilter]);

  // Use unified hook values for summary cards
  const histIncome = histFinancials.totalIncome;
  const histExpenses = histFinancials.totalExpenses;
  const histBalance = histFinancials.profit;

  // Available months from all transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      try {
        const d = new Date(t.date);
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
      } catch {}
    });
    // Always include current month
    const now = new Date();
    months.add(`${now.getFullYear()}-${now.getMonth()}`);
    months.add(`${histMonth.getFullYear()}-${histMonth.getMonth()}`);
    
    return Array.from(months)
      .map(m => {
        const [y, mo] = m.split('-').map(Number);
        return new Date(y, mo, 1);
      })
      .sort((a, b) => b.getTime() - a.getTime());
  }, [transactions, histMonth]);

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Historial de Transacciones</CardTitle>
            
            {/* Month Selector Dropdown */}
            <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{format(histMonth, 'MMMM yyyy', { locale: es })}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1" align="end">
                <ScrollArea className="max-h-60">
                  <div className="space-y-0.5">
                    {availableMonths.map((m) => {
                      const isSelected = m.getFullYear() === histMonth.getFullYear() && m.getMonth() === histMonth.getMonth();
                      return (
                        <button
                          key={m.toISOString()}
                          onClick={() => { setHistMonth(m); setMonthPickerOpen(false); }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors capitalize',
                            isSelected 
                              ? 'bg-primary text-primary-foreground font-medium' 
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <span>{format(m, 'MMMM yyyy', { locale: es })}</span>
                          {isSelected && <span className="float-right">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 3 Summary Mini Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-success/10 p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-medium">Ingresos</p>
              <p className="text-lg font-bold text-success">{cs}{histIncome.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-destructive/10 p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-medium">Gastos</p>
              <p className="text-lg font-bold text-destructive">{cs}{histExpenses.toFixed(2)}</p>
            </div>
            <div className={cn('rounded-xl p-3 text-center', histBalance >= 0 ? 'bg-success/5' : 'bg-destructive/5')}>
              <p className="text-[11px] text-muted-foreground font-medium">Balance</p>
              <p className={cn('text-lg font-bold', histBalance >= 0 ? 'text-success' : 'text-destructive')}>
                {cs}{Math.abs(histBalance).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="h-8 text-xs w-[120px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Ingreso</SelectItem>
                <SelectItem value="expense">Gasto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
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
                    <th className="w-10 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No hay transacciones en este mes
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t: any) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-foreground whitespace-nowrap">
                          {format(new Date(t.date), 'dd MMM yyyy', { locale: es })}
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            t.type === 'income'
                              ? 'bg-success/10 text-success'
                              : 'bg-orange-500/10 text-orange-500'
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
                        <td className="p-3 text-center">
                          {!t.sourceId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteTransaction(t.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          {/* Record count + filtered total */}
          <div className="flex items-center justify-between border-t border-border pt-3 px-1">
            <span className="text-xs text-muted-foreground">
              Total ({filteredTransactions.length} registros)
            </span>
            <span className={cn(
              'text-sm font-bold',
              (histIncome - histExpenses) >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {(histIncome - histExpenses) >= 0 ? '+' : '-'}{cs}{Math.abs(histIncome - histExpenses).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

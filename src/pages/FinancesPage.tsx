import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { TransactionForm } from '@/components/finances/TransactionForm';
import { FinanceChart } from '@/components/finances/FinanceChart';
import { TransactionList } from '@/components/finances/TransactionList';

export default function FinancesPage() {
  const { settings, transactions, deleteTransaction, getTotalIncome, getTotalExpenses, getNetProfit } = useApp();
  const income = getTotalIncome();
  const expenses = getTotalExpenses();
  const profit = getNetProfit();

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
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Finanzas" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-lg font-bold text-success">
                    {settings.currencySymbol}{income.toFixed(2)}
                  </p>
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
                  <p className="text-lg font-bold text-destructive">
                    {settings.currencySymbol}{expenses.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Gastos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Profit Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Ganancia Neta</p>
                  <p className="text-3xl font-bold mt-1">
                    {settings.currencySymbol}{profit.toFixed(2)}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                  <Wallet className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Transaction Button */}
        <motion.div variants={itemVariants}>
          <TransactionForm />
        </motion.div>

        {/* Chart */}
        <motion.div variants={itemVariants}>
          <FinanceChart 
            transactions={transactions} 
            currencySymbol={settings.currencySymbol} 
          />
        </motion.div>

        {/* Transaction History */}
        <motion.div variants={itemVariants}>
          <TransactionList
            transactions={transactions}
            currencySymbol={settings.currencySymbol}
            onDelete={deleteTransaction}
          />
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}

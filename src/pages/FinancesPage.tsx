import { forwardRef } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp, Transaction } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const FinancesPage = forwardRef<HTMLDivElement>((_, ref) => {
  const { settings, transactions, addTransaction, deleteTransaction, getTotalIncome, getTotalExpenses, getNetProfit } = useApp();
  const { toast } = useToast();
  const income = getTotalIncome();
  const expenses = getTotalExpenses();
  const profit = getNetProfit();

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' });
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      description,
      amount: parseFloat(amount),
      category: category || (type === 'income' ? 'Ventas' : 'Gastos'),
      date: new Date().toISOString(),
    };

    addTransaction(newTransaction);
    toast({ title: type === 'income' ? 'Ingreso registrado' : 'Gasto registrado' });
    setDescription('');
    setAmount('');
    setCategory('');
    setShowForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border p-4 pt-10 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Finanzas</h1>
          <Button onClick={() => setShowForm(true)} variant="warm" size="sm">
            <Plus className="w-4 h-4" />
            Registrar
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-success/20 to-success/5 border-success/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-xs text-muted-foreground">Ingresos</span>
              </div>
              <p className="text-xl font-bold text-success">{settings.currencySymbol}{income.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Gastos</span>
              </div>
              <p className="text-xl font-bold text-destructive">{settings.currencySymbol}{expenses.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-caramel/20 to-accent/20 border-caramel/30">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Ganancia Neta</p>
            <p className={`text-4xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {settings.currencySymbol}{profit.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-2xl p-6 w-full max-w-md"
              >
                <h2 className="text-xl font-bold mb-4 text-foreground">Registrar transacción</h2>

                <div className="space-y-4">
                  {/* Type selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setType('income')}
                      className={`p-3 rounded-xl font-medium transition-all ${
                        type === 'income'
                          ? 'bg-success/20 text-success ring-2 ring-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                      Ingreso
                    </button>
                    <button
                      onClick={() => setType('expense')}
                      className={`p-3 rounded-xl font-medium transition-all ${
                        type === 'expense'
                          ? 'bg-destructive/20 text-destructive ring-2 ring-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                      Gasto
                    </button>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Descripción</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej: Venta de torta"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Monto</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Categoría (opcional)</label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ej: Ventas, Ingredientes"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit} variant="warm" className="flex-1">
                      Guardar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions List */}
        <div>
          <h2 className="font-bold text-foreground mb-3">Historial</h2>
          {transactions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground text-sm">No hay transacciones registradas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.slice().reverse().map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      t.type === 'income' ? 'bg-success/20' : 'bg-destructive/20'
                    }`}>
                      {t.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)} • {t.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {t.type === 'income' ? '+' : '-'}{settings.currencySymbol}{t.amount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
});

FinancesPage.displayName = 'FinancesPage';

export default FinancesPage;

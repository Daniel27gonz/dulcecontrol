import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';

export default function FinancesPage() {
  const { settings, getTotalIncome, getTotalExpenses, getNetProfit } = useApp();
  const income = getTotalIncome();
  const expenses = getTotalExpenses();
  const profit = getNetProfit();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-10 safe-top">
        <h1 className="text-2xl font-bold mb-6">Finanzas</h1>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-success/20 to-success/5 border-success/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold">{settings.currencySymbol}{income.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-2xl font-bold">{settings.currencySymbol}{expenses.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-caramel/20 to-accent/20 border-caramel/30">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Ganancia Neta</p>
              <p className="text-4xl font-bold">{settings.currencySymbol}{profit.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

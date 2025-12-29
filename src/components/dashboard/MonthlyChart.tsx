import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function MonthlyChart() {
  const { transactions, settings } = useApp();

  // Get last 7 days of data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE', { locale: es }),
      income: 0,
      expenses: 0,
    };
  });

  // Aggregate transactions by day
  transactions.forEach(t => {
    const tDate = format(startOfDay(parseISO(t.date)), 'yyyy-MM-dd');
    const day = last7Days.find(d => d.dateStr === tDate);
    if (day) {
      if (t.type === 'income') {
        day.income += t.amount;
      } else {
        day.expenses += t.amount;
      }
    }
  });

  const formatCurrency = (value: number) => {
    return `${settings.currencySymbol}${value.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
  };

  const hasData = transactions.length > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          <p className="text-sm text-success">
            Ingresos: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-sm text-destructive">
            Gastos: {formatCurrency(payload[1]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Últimos 7 días
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {hasData ? (
            <div className="h-[180px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 50%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 50%, 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 65%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 65%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="hsl(142, 50%, 45%)"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(0, 65%, 55%)"
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Sin datos aún
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Gastos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

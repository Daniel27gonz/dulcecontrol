import { useMemo, useState } from 'react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction } from '@/context/AppContext';

interface FinanceChartProps {
  transactions: Transaction[];
  currencySymbol: string;
}

type Period = '7d' | '30d' | 'all';

export function FinanceChart({ transactions, currencySymbol }: FinanceChartProps) {
  const [period, setPeriod] = useState<Period>('30d');

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      default:
        startDate = new Date(0);
    }

    const filtered = transactions.filter((t) =>
      isAfter(new Date(t.date), startOfDay(startDate))
    );

    // Group by date
    const groupedByDate = filtered.reduce((acc, t) => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        acc[dateKey].income += t.amount;
      } else {
        acc[dateKey].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    // Convert to array and sort by date
    return Object.entries(groupedByDate)
      .map(([date, values]) => ({
        date,
        displayDate: format(new Date(date), 'dd MMM', { locale: es }),
        income: values.income,
        expense: values.expense,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Show max 14 days for readability
  }, [transactions, period]);

  const totals = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      default:
        startDate = new Date(0);
    }

    const filtered = transactions.filter((t) =>
      isAfter(new Date(t.date), startOfDay(startDate))
    );

    return filtered.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expense += t.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions, period]);

  const periodLabel = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
    'all': 'Todo el historial',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Movimientos</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs px-2">7d</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-2">30d</TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2">Todo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-xs text-muted-foreground">{periodLabel[period]}</p>
      </CardHeader>
      <CardContent>
        {/* Period Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-success/10">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-bold text-success">
              {currencySymbol}{totals.income.toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-lg font-bold text-destructive">
              {currencySymbol}{totals.expense.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2}>
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${currencySymbol}${value.toFixed(2)}`,
                    name === 'income' ? 'Ingresos' : 'Gastos',
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No hay transacciones en este periodo
          </div>
        )}
      </CardContent>
    </Card>
  );
}

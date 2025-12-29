import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export function TopProductsCard() {
  const { orders, settings } = useApp();

  // Calculate top products from orders
  const productStats = orders.reduce((acc, order) => {
    if (order.status !== 'cancelled') {
      const existing = acc.find(p => p.name === order.recipeName);
      if (existing) {
        existing.sales += order.quantity;
        existing.revenue += order.totalPrice;
      } else {
        acc.push({
          name: order.recipeName,
          sales: order.quantity,
          revenue: order.totalPrice,
        });
      }
    }
    return acc;
  }, [] as TopProduct[]);

  const topProducts = productStats
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
  };

  const medals = ['🥇', '🥈', '🥉'];

  if (topProducts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-caramel" />
              Productos Estrella
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Star className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aún no hay ventas registradas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tus productos más vendidos aparecerán aquí
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-caramel" />
            Productos Estrella
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-caramel/20 to-accent/20 flex items-center justify-center text-xl">
                  {medals[index] || '⭐'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sales} {product.sales === 1 ? 'vendido' : 'vendidos'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">{formatCurrency(product.revenue)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

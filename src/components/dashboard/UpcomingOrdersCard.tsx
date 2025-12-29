import { motion } from 'framer-motion';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function UpcomingOrdersCard() {
  const { orders, settings } = useApp();
  const navigate = useNavigate();

  // Get upcoming orders (pending or in_progress, sorted by delivery date)
  const upcomingOrders = orders
    .filter(o => o.status === 'pending' || o.status === 'in_progress')
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    .slice(0, 4);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
  };

  const getDeliveryLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return { text: 'Hoy', urgent: true };
    if (isTomorrow(date)) return { text: 'Mañana', urgent: true };
    const days = differenceInDays(date, new Date());
    if (days < 0) return { text: 'Vencido', urgent: true };
    if (days <= 3) return { text: `En ${days} días`, urgent: false };
    return { text: format(date, "d 'de' MMM", { locale: es }), urgent: false };
  };

  const statusColors = {
    pending: 'bg-caramel/20 text-caramel border-caramel/30',
    in_progress: 'bg-primary/20 text-primary border-primary/30',
  };

  const statusLabels = {
    pending: 'Pendiente',
    in_progress: 'En proceso',
  };

  if (upcomingOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay pedidos pendientes
              </p>
              <Button 
                variant="link" 
                className="mt-2 text-primary"
                onClick={() => navigate('/orders')}
              >
                Crear nuevo pedido
              </Button>
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
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximos Pedidos
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/orders')}
          >
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {upcomingOrders.map((order, index) => {
              const delivery = getDeliveryLabel(order.deliveryDate);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate('/orders')}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {order.recipeName} x{order.quantity}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <User className="w-3 h-3" />
                        <span className="truncate">{order.clientName}</span>
                      </div>
                    </div>
                    <p className="font-bold text-foreground whitespace-nowrap">
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={statusColors[order.status as 'pending' | 'in_progress']}
                    >
                      {statusLabels[order.status as 'pending' | 'in_progress']}
                    </Badge>
                    <span className={`text-xs font-medium ${delivery.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {delivery.urgent && '⏰ '}{delivery.text}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

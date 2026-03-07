import { useState } from 'react';
import { Order, useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, Package, Trash2, User, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderForm } from './OrderForm';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-100' },
  { value: 'in_progress', label: 'En Proceso', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-100' },
  { value: 'completed', label: 'Completado', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-100' },
  { value: 'paid', label: 'Pagado', color: 'bg-emerald-600', textColor: 'text-emerald-700', bgLight: 'bg-emerald-100' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-100' },
] as const;

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const { updateOrder, deleteOrder, settings } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  const statusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
  const deliveryDate = new Date(order.deliveryDate);
  const isOverdue = deliveryDate < new Date() && order.status !== 'completed' && order.status !== 'paid' && order.status !== 'cancelled';

  const handleStatusChange = (newStatus: string) => {
    updateOrder(order.id, { status: newStatus as Order['status'] });
    toast({
      title: 'Estado actualizado',
      description: `El pedido ahora está ${ORDER_STATUSES.find(s => s.value === newStatus)?.label}`,
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    deleteOrder(order.id);
    toast({
      title: 'Pedido eliminado',
      description: 'El pedido ha sido eliminado correctamente',
    });
    setIsDeleting(false);
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isOverdue && 'border-red-300 bg-red-50/50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Client Name */}
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold truncate">{order.clientName}</h3>
            </div>

            {/* Recipe Name */}
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground truncate">
                {order.recipeName} <span className="font-medium">x{order.quantity}</span>
              </p>
            </div>

            {/* Delivery Date */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className={cn(
                'text-sm',
                isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
              )}>
                {format(deliveryDate, "d 'de' MMMM, yyyy", { locale: es })}
                {isOverdue && ' (Vencido)'}
              </p>
            </div>

            {/* Price */}
            <div className="text-lg font-bold text-primary">
              {settings.currencySymbol}{order.totalPrice.toFixed(2)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn(statusInfo.bgLight, statusInfo.textColor, 'border-0')}>
              <span className={cn('w-2 h-2 rounded-full mr-1.5', statusInfo.color)} />
              {statusInfo.label}
            </Badge>

            <div className="flex items-center gap-1">
              {/* Edit Button */}
              <OrderForm
                order={order}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Pencil className="w-4 h-4" />
                  </Button>
                }
              />

              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El pedido de {order.clientName} será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Status Selector */}
        <div className="mt-3 pt-3 border-t">
          <Select value={order.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', s.color)} />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Order, OrderAdvance, useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Calendar, Package, Trash2, User, Pencil, DollarSign, Plus } from 'lucide-react';
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

  // Payment date dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Advance dialog state
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Delete payment dialog state
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false);

  const statusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
  const deliveryDate = new Date(order.deliveryDate);
  const isOverdue = deliveryDate < new Date() && order.status !== 'completed' && order.status !== 'paid' && order.status !== 'cancelled';

  const totalAdvances = (order.advances || []).reduce((sum, a) => sum + a.amount, 0);
  const remainingBalance = Math.max(0, order.totalPrice - totalAdvances);
  const isPaid = order.status === 'paid';

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'paid') {
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentAmount(remainingBalance);
      setShowPaymentDialog(true);
      return;
    }

    updateOrder(order.id, { status: newStatus as Order['status'] });
    toast({
      title: 'Estado actualizado',
      description: `El pedido ahora está ${ORDER_STATUSES.find(s => s.value === newStatus)?.label}`,
    });
  };

  const handleConfirmPayment = () => {
    if (!paymentDate) {
      toast({ title: 'Error', description: 'La fecha de pago es obligatoria', variant: 'destructive' });
      return;
    }
    if (paymentAmount <= 0) {
      toast({ title: 'Error', description: 'El monto a pagar debe ser mayor a 0', variant: 'destructive' });
      return;
    }

    updateOrder(order.id, {
      status: 'paid',
      paymentDate: new Date(paymentDate + 'T12:00:00').toISOString(),
    });
    setShowPaymentDialog(false);
    toast({
      title: '✅ Pedido marcado como Pagado',
      description: `${settings.currencySymbol}${paymentAmount.toFixed(2)} registrado en Finanzas`,
    });
  };

  const handleDeletePayment = () => {
    updateOrder(order.id, {
      status: 'completed',
      paymentDate: null,
    });
    setShowDeletePaymentDialog(false);
    toast({
      title: 'Pago eliminado',
      description: 'El pedido volvió a estado Completado y el ingreso fue eliminado de Finanzas',
    });
  };

  const handleAddAdvance = () => {
    if (advanceAmount <= 0) {
      toast({ title: 'Error', description: 'El monto del anticipo debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    if (!advanceDate) {
      toast({ title: 'Error', description: 'La fecha del anticipo es obligatoria', variant: 'destructive' });
      return;
    }

    const newAdvance: OrderAdvance = {
      id: crypto.randomUUID(),
      amount: advanceAmount,
      date: new Date(advanceDate + 'T12:00:00').toISOString(),
    };

    const updatedAdvances = [...(order.advances || []), newAdvance];
    updateOrder(order.id, { advances: updatedAdvances });
    setShowAdvanceDialog(false);
    setAdvanceAmount(0);
    setAdvanceDate(new Date().toISOString().split('T')[0]);
    toast({
      title: '✅ Anticipo registrado',
      description: `${settings.currencySymbol}${advanceAmount.toFixed(2)} registrado en Finanzas`,
    });
  };

  const handleDeleteAdvance = (advanceId: string) => {
    const updatedAdvances = (order.advances || []).filter(a => a.id !== advanceId);
    updateOrder(order.id, { advances: updatedAdvances });
    toast({ title: 'Anticipo eliminado' });
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
    <>
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

              {/* Payment date if paid */}
              {order.status === 'paid' && order.paymentDate && (
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-600 flex-1">
                    Pagado: {format(new Date(order.paymentDate), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive/70 hover:text-destructive"
                    onClick={() => setShowDeletePaymentDialog(true)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Price & Balance */}
              <div className="flex items-baseline gap-3">
                <div className="text-lg font-bold text-primary">
                  {settings.currencySymbol}{order.totalPrice.toFixed(2)}
                </div>
                {!isPaid && totalAdvances > 0 && (
                  <div className="text-sm font-semibold text-amber-600">
                    Saldo: {settings.currencySymbol}{remainingBalance.toFixed(2)}
                  </div>
                )}
                {isPaid && (
                  <div className="text-sm font-semibold text-emerald-600">
                    Saldo: {settings.currencySymbol}0.00
                  </div>
                )}
              </div>

              {/* Advances summary */}
              {(order.advances || []).length > 0 && (
                <div className="mt-1 text-sm text-emerald-600 font-medium">
                  Anticipos: {settings.currencySymbol}{totalAdvances.toFixed(2)}
                </div>
              )}
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

          {/* Status Selector + Advance Button */}
          <div className="mt-3 pt-3 border-t flex gap-2">
            <Select value={order.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="flex-1 h-9">
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
            {!isPaid && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                onClick={() => {
                  setAdvanceAmount(0);
                  setAdvanceDate(new Date().toISOString().split('T')[0]);
                  setShowAdvanceDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Anticipo
              </Button>
            )}
          </div>

          {/* Advances list */}
          {(order.advances || []).length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Anticipos registrados:</p>
              {(order.advances || []).map((advance) => (
                <div key={advance.id} className="flex items-center justify-between text-sm bg-emerald-50 rounded-md px-3 py-2">
                  <div>
                    <span className="font-medium text-emerald-700">
                      {settings.currencySymbol}{advance.amount.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(advance.date), "d/MM/yyyy")}
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar anticipo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará el anticipo de {settings.currencySymbol}{advance.amount.toFixed(2)} y su registro en Finanzas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteAdvance(advance.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Date Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentDate">Fecha de pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="paymentAmount">Monto a pagar ({settings.currencySymbol}) *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              <p className="text-muted-foreground">Cliente: <span className="font-medium text-foreground">{order.clientName}</span></p>
              <p className="text-muted-foreground">Total del pedido: <span className="font-medium text-foreground">{settings.currencySymbol}{order.totalPrice.toFixed(2)}</span></p>
              {totalAdvances > 0 && (
                <p className="text-muted-foreground">Anticipos: <span className="font-medium text-emerald-600">-{settings.currencySymbol}{totalAdvances.toFixed(2)}</span></p>
              )}
              <p className="text-muted-foreground font-semibold border-t pt-1 mt-1">Saldo sugerido: <span className="font-bold text-primary">{settings.currencySymbol}{remainingBalance.toFixed(2)}</span></p>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advance Dialog */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Anticipo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="advanceAmount">Monto del anticipo ({settings.currencySymbol}) *</Label>
              <Input
                id="advanceAmount"
                type="number"
                min="0"
                step="0.01"
                value={advanceAmount || ''}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="advanceDate">Fecha del anticipo *</Label>
              <Input
                id="advanceDate"
                type="date"
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground">Cliente: <span className="font-medium text-foreground">{order.clientName}</span></p>
              <p className="text-muted-foreground">Total pedido: <span className="font-medium text-foreground">{settings.currencySymbol}{order.totalPrice.toFixed(2)}</span></p>
              {totalAdvances > 0 && (
                <p className="text-muted-foreground">Anticipos previos: <span className="font-medium text-emerald-600">{settings.currencySymbol}{totalAdvances.toFixed(2)}</span></p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowAdvanceDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleAddAdvance} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              Registrar Anticipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation Dialog */}
      <AlertDialog open={showDeletePaymentDialog} onOpenChange={setShowDeletePaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el registro de pago y el ingreso en Finanzas. El pedido volverá a estado "Completado".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment}>
              Eliminar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
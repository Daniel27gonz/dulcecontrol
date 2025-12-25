import { useState, useEffect } from 'react';
import { Order, useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'En Proceso', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completado', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
] as const;

interface OrderFormProps {
  order?: Order;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function OrderForm({ order, trigger, onClose }: OrderFormProps) {
  const { recipes, addOrder, updateOrder, calculateRecipeCost, settings } = useApp();
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [customPrice, setCustomPrice] = useState<string>('');

  const isEditing = !!order;

  // Load order data when editing
  useEffect(() => {
    if (order && open) {
      setClientName(order.clientName);
      setSelectedRecipeId(order.recipeId);
      setQuantity(order.quantity);
      setStatus(order.status);
      setDeliveryDate(new Date(order.deliveryDate));
      setCustomPrice(order.totalPrice.toString());
    }
  }, [order, open]);

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
  const recipeCost = selectedRecipe ? calculateRecipeCost(selectedRecipe) : null;
  const suggestedTotal = recipeCost ? recipeCost.suggestedPrice * quantity : 0;
  const finalPrice = customPrice ? parseFloat(customPrice) : suggestedTotal;

  const resetForm = () => {
    setClientName('');
    setSelectedRecipeId('');
    setQuantity(1);
    setStatus('pending');
    setDeliveryDate(undefined);
    setCustomPrice('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
      onClose?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast({
        title: 'Error',
        description: 'Ingresa el nombre del cliente',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedRecipeId) {
      toast({
        title: 'Error',
        description: 'Selecciona una receta',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryDate) {
      toast({
        title: 'Error',
        description: 'Selecciona una fecha de entrega',
        variant: 'destructive',
      });
      return;
    }

    if (isEditing) {
      // Update existing order
      updateOrder(order.id, {
        clientName: clientName.trim(),
        recipeId: selectedRecipeId,
        recipeName: selectedRecipe?.name || '',
        quantity,
        totalPrice: finalPrice,
        status,
        deliveryDate: deliveryDate.toISOString(),
      });
      toast({
        title: '¡Pedido actualizado!',
        description: `Pedido de ${clientName} actualizado correctamente`,
      });
    } else {
      // Create new order
      const newOrder = {
        id: crypto.randomUUID(),
        clientName: clientName.trim(),
        recipeId: selectedRecipeId,
        recipeName: selectedRecipe?.name || '',
        quantity,
        totalPrice: finalPrice,
        status,
        deliveryDate: deliveryDate.toISOString(),
        createdAt: new Date().toISOString(),
      };

      addOrder(newOrder);
      toast({
        title: '¡Pedido creado!',
        description: `Pedido para ${clientName} agregado correctamente`,
      });
    }

    resetForm();
    setOpen(false);
    onClose?.();
  };

  const defaultTrigger = (
    <Button className="w-full" size="lg">
      <Plus className="w-5 h-5 mr-2" />
      Nuevo Pedido
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Pedido' : 'Crear Nuevo Pedido'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Nombre del Cliente *</Label>
            <Input
              id="clientName"
              placeholder="Ej: María García"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          {/* Recipe Selection */}
          <div className="space-y-2">
            <Label>Receta *</Label>
            {recipes.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                No tienes recetas. Crea una receta primero.
              </p>
            ) : (
              <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una receta" />
                </SelectTrigger>
                <SelectContent className="bg-background border">
                  {recipes.map((recipe) => {
                    const cost = calculateRecipeCost(recipe);
                    return (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        <span className="flex items-center justify-between w-full gap-2">
                          <span>{recipe.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {settings.currencySymbol}{cost.suggestedPrice.toFixed(2)}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          {/* Price Summary */}
          {selectedRecipe && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precio unitario:</span>
                <span>{settings.currencySymbol}{recipeCost?.suggestedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cantidad:</span>
                <span>x{quantity}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total sugerido:</span>
                <span className="text-primary">{settings.currencySymbol}{suggestedTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Custom Price */}
          <div className="space-y-2">
            <Label htmlFor="customPrice">Precio Final {isEditing ? '*' : '(opcional)'}</Label>
            <Input
              id="customPrice"
              type="number"
              step="0.01"
              min={0}
              placeholder={suggestedTotal ? suggestedTotal.toFixed(2) : 'Precio personalizado'}
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
            />
            {!isEditing && (
              <p className="text-xs text-muted-foreground">
                Deja vacío para usar el precio sugerido
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Estado del Pedido</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
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

          {/* Delivery Date */}
          <div className="space-y-2">
            <Label>Fecha de Entrega *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !deliveryDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  initialFocus
                  className="pointer-events-auto"
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={recipes.length === 0}>
            {isEditing ? 'Guardar Cambios' : 'Crear Pedido'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

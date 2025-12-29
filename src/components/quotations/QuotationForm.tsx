import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { useQuotations } from '@/hooks/useQuotations';
import { QuotationItem, Quotation } from '@/types/quotation';
import { toast } from '@/hooks/use-toast';

interface QuotationFormProps {
  quotation?: Quotation;
  trigger?: React.ReactNode;
  onClose?: () => void;
  onSave?: (quotation: Quotation) => void;
}

export function QuotationForm({ quotation, trigger, onClose, onSave }: QuotationFormProps) {
  const { recipes, calculateRecipeCost, settings } = useApp();
  const { addQuotation, updateQuotation, calculateTotals } = useQuotations();
  const [open, setOpen] = useState(false);
  
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState<Date>(addDays(new Date(), 7));

  const isEditing = !!quotation;

  // Load quotation data when editing
  useEffect(() => {
    if (quotation && open) {
      setClientName(quotation.clientName);
      setClientPhone(quotation.clientPhone || '');
      setItems(quotation.items);
      setDiscount(quotation.discount);
      setDiscountType(quotation.discountType);
      setNotes(quotation.notes || '');
      setValidUntil(new Date(quotation.validUntil));
    }
  }, [quotation, open]);

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setItems([]);
    setDiscount(0);
    setDiscountType('percentage');
    setNotes('');
    setValidUntil(addDays(new Date(), 7));
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
      onClose?.();
    }
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      id: crypto.randomUUID(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const addRecipeAsItem = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const cost = calculateRecipeCost(recipe);
    const newItem: QuotationItem = {
      id: crypto.randomUUID(),
      name: recipe.name,
      description: recipe.category,
      quantity: 1,
      unitPrice: cost.suggestedPrice,
      total: cost.suggestedPrice,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<QuotationItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const { subtotal, total } = calculateTotals(items, discount, discountType);

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

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un producto',
        variant: 'destructive',
      });
      return;
    }

    const quotationData = {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      items,
      subtotal,
      discount,
      discountType,
      total,
      notes: notes.trim() || undefined,
      validUntil: validUntil.toISOString(),
      status: 'draft' as const,
    };

    if (isEditing) {
      updateQuotation(quotation.id, quotationData);
      toast({
        title: '¡Cotización actualizada!',
        description: `Cotización para ${clientName} guardada`,
      });
      onSave?.({ ...quotation, ...quotationData });
    } else {
      const newQuotation = addQuotation(quotationData);
      toast({
        title: '¡Cotización creada!',
        description: `Cotización #${newQuotation.number} lista`,
      });
      onSave?.(newQuotation);
    }

    resetForm();
    setOpen(false);
    onClose?.();
  };

  const defaultTrigger = (
    <Button variant="warm" size="lg" className="w-full">
      <Plus className="w-5 h-5 mr-2" />
      Nueva Cotización
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="clientName">Cliente *</Label>
              <Input
                id="clientName"
                placeholder="Nombre del cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Teléfono</Label>
              <Input
                id="clientPhone"
                placeholder="WhatsApp"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Productos *</Label>
              <div className="flex gap-2">
                {recipes.length > 0 && (
                  <Select onValueChange={addRecipeAsItem}>
                    <SelectTrigger className="w-auto h-8 text-xs">
                      <Package className="w-3 h-3 mr-1" />
                      <SelectValue placeholder="Agregar receta" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border">
                      {recipes.map(recipe => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-muted/50 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Producto {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-destructive/10 rounded text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Input
                    placeholder="Nombre del producto"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Cant.</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Precio</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 flex items-center px-3 bg-background rounded-md border text-sm font-medium">
                        {settings.currencySymbol}{item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm bg-muted/30 rounded-xl">
                Agrega productos a la cotización
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Descuento</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">{settings.currencySymbol}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Válida hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !validUntil && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntil ? format(validUntil, 'dd/MM/yyyy') : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border">
                  <Calendar
                    mode="single"
                    selected={validUntil}
                    onSelect={(date) => date && setValidUntil(date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Descuento:</span>
                  <span>-{settings.currencySymbol}{(subtotal - total).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">{settings.currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Condiciones, métodos de pago, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg">
            {isEditing ? 'Guardar Cambios' : 'Crear Cotización'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

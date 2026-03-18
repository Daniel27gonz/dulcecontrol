import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Package, Gift } from 'lucide-react';
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
import { useIndirectCosts } from '@/context/IndirectCostsContext';
import { useLabor } from '@/context/LaborContext';
import { useBaseIngredients } from '@/context/BaseIngredientsContext';
import { QuotationItem, QuotationExtra, Quotation } from '@/types/quotation';
import { toast } from '@/hooks/use-toast';


interface QuotationFormProps {
  quotation?: Quotation;
  trigger?: React.ReactNode;
  onClose?: () => void;
  onSave?: (quotation: Quotation) => void;
}

export function QuotationForm({ quotation, trigger, onClose, onSave }: QuotationFormProps) {
  const { recipes, settings } = useApp();
  const { addQuotation, updateQuotation, calculateTotals } = useQuotations();
  const { getTotalIndirectCosts } = useIndirectCosts();
  const { getTotalMonthlyHours, getLaborCostPerHour } = useLabor();
  const { getCurrentIngredientCost } = useBaseIngredients();
  const [open, setOpen] = useState(false);
  
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState<Date>(addDays(new Date(), 7));
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);

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
      setDeliveryDate(quotation.deliveryDate ? new Date(quotation.deliveryDate) : undefined);
      
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
    setDeliveryDate(undefined);
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
      total: 0, // quantity * unitPrice redondeado a 2 decimales
    };
    setItems([...items, newItem]);
  };

  const addRecipeAsItem = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const WASTE_PERCENTAGE = 0.05; // merma fija 5%

    // === FUENTE ÚNICA DE VERDAD: costo_total_con_merma ===
    // Usa precios actuales de ingredientes base (MASTER DATA REACTIVA)

    // 1. Costo de ingredientes usando precios actuales
    const ingredientsCost = recipe.ingredients.reduce(
      (sum, ing) => sum + getCurrentIngredientCost(ing),
      0
    );

    // 2. Horas totales del producto (preparación + horneado + decoración + empaque)
    const elaborationTime = recipe.elaborationTime || { preparation: 0, baking: 0, decoration: 0, packaging: 0 };
    const totalElaborationTimeMinutes = elaborationTime.preparation + elaborationTime.baking + elaborationTime.decoration + elaborationTime.packaging;
    const totalProductHours = Math.max(0, totalElaborationTimeMinutes / 60);

    // 3. Obtener costos globales por hora
    const laborCostPerHour = getLaborCostPerHour();
    const totalMonthlyHours = getTotalMonthlyHours();
    const totalIndirectCosts = getTotalIndirectCosts();
    const indirectCostPerHour = totalMonthlyHours > 0 ? totalIndirectCosts / totalMonthlyHours : 0;

    // 4. Mano de obra final (horas reales × costo por hora)
    const laborFinalCost = totalProductHours * laborCostPerHour;

    // 5. Costos indirectos finales (horas reales × costo indirecto por hora)
    const indirectFinalCost = totalProductHours * indirectCostPerHour;

    // 6. Costo de extras (materiales de decoración y empaque)
    const extras = recipe.extras || [];
    const extrasCost = extras.reduce(
      (sum, extra) => sum + (extra.quantity * extra.unitCost),
      0
    );

    // 7. Mano de obra adicional de decoración (horas extra específicas)
    const decorationHours = recipe.decorationHours || 0;
    const laborDecorationCost = decorationHours * laborCostPerHour;

    // 8. COSTO BASE DEL PRODUCTO — consolidación correcta
    const baseCost = ingredientsCost + laborFinalCost + indirectFinalCost + extrasCost + laborDecorationCost;

    // 9. Merma (5%)
    const wasteCost = baseCost * WASTE_PERCENTAGE;

    // 10. COSTO TOTAL CON MERMA — FUENTE ÚNICA DE VERDAD
    const totalCostWithWaste = round2(baseCost + wasteCost);

    // 11. PRECIO SUGERIDO CON MARGEN DE GANANCIA (misma fórmula que RecipesPage)
    // Fórmula de margen real: precio = costo / (1 - margen)
    const marginDecimal = Math.min(Math.max(recipe.marginPercentage || 50, 30), 90) / 100;
    const suggestedPrice = round2(Math.max(0, totalCostWithWaste / (1 - marginDecimal)));

    // Redondear precio unitario a 2 decimales para consistencia
    const roundedUnitPrice = Math.round(suggestedPrice * 100) / 100;
    
    const newItem: QuotationItem = {
      id: crypto.randomUUID(),
      name: recipe.name,
      description: recipe.category,
      quantity: 1,
      unitPrice: roundedUnitPrice,
      total: roundedUnitPrice,
      baseCost: round2(Math.max(0, totalCostWithWaste || 0)), // Guardar costo base real para referencia
    };
    setItems([...items, newItem]);
  };


  const updateItem = (id: string, updates: Partial<QuotationItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Redondear a 2 decimales para consistencia en WhatsApp, PDF y vista
        updated.total = Math.round(updated.quantity * updated.unitPrice * 100) / 100;
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const { subtotal, total } = calculateTotals(items, discount, discountType);

  const handleSubmit = async (e: React.FormEvent) => {
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
      deliveryDate: deliveryDate?.toISOString(),
      
      status: 'draft' as const,
    };

    if (isEditing) {
      await updateQuotation(quotation.id, quotationData);
      toast({
        title: '¡Cotización actualizada!',
        description: `Cotización para ${clientName} guardada`,
      });
      onSave?.({ ...quotation, ...quotationData });
    } else {
      const newQuotation = await addQuotation(quotationData);
      if (newQuotation) {
        toast({
          title: '¡Cotización creada!',
          description: `Cotización #${newQuotation.number} lista`,
        });
        onSave?.(newQuotation);
      }
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

            {/* Help text */}
            <p className="text-xs text-muted-foreground text-center">
              Aquí decides cuánto quieres ganar por este pedido.
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha de entrega</Label>
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
                    {deliveryDate ? format(deliveryDate, 'dd/MM/yyyy') : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border">
                  <Calendar
                    mode="single"
                    selected={deliveryDate}
                    onSelect={setDeliveryDate}
                    locale={es}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Discount */}
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

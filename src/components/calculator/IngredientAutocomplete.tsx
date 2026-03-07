import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Package, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useBaseIngredients, BaseIngredient, INGREDIENT_CATEGORIES, PURCHASE_UNITS, getBaseUnit, calculateCostPerBaseUnit } from '@/context/BaseIngredientsContext';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface IngredientAutocompleteProps {
  value: string;
  onSelect: (ingredient: { 
    id: string; // baseIngredientId for master data reference
    name: string; 
    costPerBaseUnit: number; 
    baseUnit: string;
    presentationInfo: string;
  }) => void;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  harinas: '🌾 Harinas',
  azucares: '🍬 Azúcares',
  lacteos: '🥛 Lácteos',
  huevos: '🥚 Huevos',
  grasas: '🧈 Grasas',
  chocolates: '🍫 Chocolates',
  levaduras: '🧪 Levaduras',
  esencias: '✨ Esencias',
  frutos_secos: '🥜 Frutos Secos',
  colorantes: '🎨 Colorantes',
  rellenos: '🍯 Rellenos',
  coberturas: '🍰 Coberturas',
  otros: '📦 Otros',
};

const CATEGORY_EMOJI: Record<string, string> = {
  harinas: '🌾',
  azucares: '🍬',
  lacteos: '🥛',
  huevos: '🥚',
  grasas: '🧈',
  chocolates: '🍫',
  levaduras: '🧪',
  esencias: '✨',
  colorantes: '🎨',
  rellenos: '🍯',
  coberturas: '🍰',
  frutos_secos: '🥜',
  otros: '📦',
};

interface QuickAddFormData {
  name: string;
  category: string;
  purchaseUnit: string;
  presentationQuantity: string;
  presentationPrice: string;
}

export function IngredientAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = "Buscar o escribir ingrediente..."
}: IngredientAutocompleteProps) {
  const { ingredients: baseIngredients, addIngredient } = useBaseIngredients();
  const { settings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState<QuickAddFormData>({
    name: '',
    category: 'otros',
    purchaseUnit: 'g',
    presentationQuantity: '',
    presentationPrice: '',
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter ingredients based on search - only show configured ones first
  const configuredIngredients = baseIngredients.filter(ing => ing.presentationPrice > 0);
  const filteredIngredients = configuredIngredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered ingredients by category
  const groupedIngredients = filteredIngredients.reduce((acc, ing) => {
    if (!acc[ing.category]) {
      acc[ing.category] = [];
    }
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<string, BaseIngredient[]>);

  const handleInputClick = () => {
    setIsOpen(true);
    setSearchTerm(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectIngredient = (ingredient: BaseIngredient) => {
    const baseUnit = getBaseUnit(ingredient.purchaseUnit);
    const presentationInfo = `${settings.currencySymbol}${ingredient.presentationPrice} por ${ingredient.presentationQuantity} ${ingredient.purchaseUnit}`;
    
    onSelect({
      id: ingredient.id, // Pass baseIngredientId for master data reference
      name: ingredient.name,
      costPerBaseUnit: ingredient.costPerBaseUnit,
      baseUnit,
      presentationInfo,
    });
    setSearchTerm(ingredient.name);
    setIsOpen(false);
  };

  const handleOpenQuickAdd = () => {
    setQuickAddForm({
      name: searchTerm,
      category: 'otros',
      purchaseUnit: 'g',
      presentationQuantity: '',
      presentationPrice: '',
    });
    setShowQuickAdd(true);
    setIsOpen(false);
  };

  const handleSaveQuickAdd = async () => {
    const qty = parseFloat(quickAddForm.presentationQuantity);
    const price = parseFloat(quickAddForm.presentationPrice);

    if (!quickAddForm.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }
    if (!qty || qty <= 0) {
      toast({ title: 'Error', description: 'La cantidad debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    if (!price || price <= 0) {
      toast({ title: 'Error', description: 'El precio debe ser mayor a 0', variant: 'destructive' });
      return;
    }

    const newIngredient = await addIngredient({
      name: quickAddForm.name.trim(),
      category: quickAddForm.category,
      purchaseUnit: quickAddForm.purchaseUnit as any,
      presentationQuantity: qty,
      presentationPrice: price,
      purchaseDate: new Date().toISOString(),
    });

    if (!newIngredient) {
      toast({ title: 'Error', description: 'No se pudo crear el ingrediente', variant: 'destructive' });
      return;
    }

    const baseUnit = getBaseUnit(newIngredient.purchaseUnit);
    const presentationInfo = `${settings.currencySymbol}${newIngredient.presentationPrice} por ${newIngredient.presentationQuantity} ${newIngredient.purchaseUnit}`;
    
    onSelect({
      id: newIngredient.id, // Pass baseIngredientId for master data reference
      name: newIngredient.name,
      costPerBaseUnit: newIngredient.costPerBaseUnit,
      baseUnit,
      presentationInfo,
    });
    
    setSearchTerm(newIngredient.name);
    setShowQuickAdd(false);
    
    toast({
      title: '✅ Ingrediente creado',
      description: `"${newIngredient.name}" se agregó y seleccionó`,
    });
  };

  const categories = Object.keys(groupedIngredients).sort();
  const hasConfiguredIngredients = configuredIngredients.length > 0;
  const previewCost = calculateCostPerBaseUnit(
    parseFloat(quickAddForm.presentationPrice) || 0,
    parseFloat(quickAddForm.presentationQuantity) || 0,
    quickAddForm.purchaseUnit
  );

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onClick={handleInputClick}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-80 overflow-hidden">
            {/* Search header */}
            <div className="sticky top-0 bg-popover border-b border-border p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onChange(e.target.value);
                  }}
                  placeholder="Filtrar ingredientes..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* Ingredient list */}
            <div className="overflow-y-auto max-h-56">
              {!hasConfiguredIngredients && (
                <div className="p-4 text-center">
                  <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay ingredientes con precio configurado
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleOpenQuickAdd}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crear ingrediente nuevo
                  </Button>
                </div>
              )}

              {categories.length === 0 && searchTerm && hasConfiguredIngredients && (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    No se encontró "{searchTerm}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenQuickAdd}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crear "{searchTerm}"
                  </Button>
                </div>
              )}

              {categories.map(category => (
                <div key={category}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[category] || category}
                  </div>
                  {groupedIngredients[category].map(ingredient => (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => handleSelectIngredient(ingredient)}
                      className="w-full px-3 py-3 flex items-center justify-between hover:bg-primary/10 transition-colors text-left border-b border-border/50 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold block truncate">{ingredient.name}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {settings.currencySymbol}{ingredient.presentationPrice} por {ingredient.presentationQuantity} {ingredient.purchaseUnit}
                        </span>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0 bg-primary/10 px-2 py-1 rounded-lg">
                        <span className="text-sm font-bold text-primary block">
                          {settings.currencySymbol}{ingredient.costPerBaseUnit.toFixed(4)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          por {getBaseUnit(ingredient.purchaseUnit)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}

              {/* Create new option at bottom */}
              {hasConfiguredIngredients && (
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={handleOpenQuickAdd}
                    className="w-full px-3 py-3 flex items-center gap-2 text-primary hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Crear ingrediente nuevo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="sticky bottom-0 bg-muted/80 backdrop-blur-sm border-t border-border px-3 py-2">
              <p className="text-xs text-muted-foreground text-center">
                💡 Administra ingredientes en la sección Ingredientes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Crear ingrediente nuevo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre</label>
              <Input
                value={quickAddForm.name}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del ingrediente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Categoría</label>
              <Select
                value={quickAddForm.category}
                onValueChange={(value) => setQuickAddForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{CATEGORY_EMOJI[cat.id]}</span>
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Unidad de compra</label>
                <Select
                  value={quickAddForm.purchaseUnit}
                  onValueChange={(value) => setQuickAddForm(prev => ({ ...prev, purchaseUnit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_UNITS.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cantidad</label>
                <Input
                  type="number"
                  value={quickAddForm.presentationQuantity}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, presentationQuantity: e.target.value }))}
                  placeholder="Ej: 1000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Precio</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {settings.currencySymbol}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={quickAddForm.presentationPrice}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, presentationPrice: e.target.value }))}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>

            {previewCost > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Costo por unidad base</p>
                  <p className="text-xl font-bold text-primary">
                    {settings.currencySymbol}{previewCost.toFixed(4)} / {getBaseUnit(quickAddForm.purchaseUnit)}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowQuickAdd(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveQuickAdd} className="flex-1">
                Crear y usar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

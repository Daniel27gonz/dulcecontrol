import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Pencil, Trash2, Check, X, Search, 
  ChevronDown, ChevronRight, AlertCircle, Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBaseIngredients, INGREDIENT_CATEGORIES, BaseIngredient } from '@/context/BaseIngredientsContext';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const UNITS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'mL', label: 'Mililitros (mL)' },
  { value: 'pza', label: 'Piezas (pza)' },
  { value: 'cda', label: 'Cucharadas (cda)' },
  { value: 'cdta', label: 'Cucharaditas (cdta)' },
];

export function RawMaterialsManager() {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useBaseIngredients();
  const { settings } = useApp();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<BaseIngredient | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('otros');

  // Filter ingredients by search
  const filteredIngredients = useMemo(() => {
    if (!searchTerm.trim()) return ingredients;
    const term = searchTerm.toLowerCase();
    return ingredients.filter(ing => 
      ing.name.toLowerCase().includes(term) ||
      INGREDIENT_CATEGORIES.find(c => c.id === ing.category)?.name.toLowerCase().includes(term)
    );
  }, [ingredients, searchTerm]);

  // Group by category
  const groupedIngredients = useMemo(() => {
    const groups: Record<string, BaseIngredient[]> = {};
    INGREDIENT_CATEGORIES.forEach(cat => {
      groups[cat.id] = filteredIngredients.filter(ing => ing.category === cat.id);
    });
    return groups;
  }, [filteredIngredients]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const resetForm = () => {
    setFormName('');
    setFormUnit('kg');
    setFormPrice('');
    setFormCategory('otros');
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (ingredient: BaseIngredient) => {
    setFormName(ingredient.name);
    setFormUnit(ingredient.unit);
    setFormPrice(ingredient.pricePerUnit.toString());
    setFormCategory(ingredient.category);
    setEditingIngredient(ingredient);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es requerido',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(formPrice) || 0;

    if (editingIngredient) {
      updateIngredient(editingIngredient.id, {
        name: formName.trim(),
        unit: formUnit,
        pricePerUnit: price,
        category: formCategory,
      });
      toast({
        title: '¡Ingrediente actualizado!',
        description: `"${formName}" se ha actualizado correctamente.`,
      });
      setEditingIngredient(null);
    } else {
      addIngredient({
        name: formName.trim(),
        unit: formUnit,
        pricePerUnit: price,
        category: formCategory,
      });
      toast({
        title: '¡Ingrediente agregado!',
        description: `"${formName}" se ha añadido al catálogo.`,
      });
      setIsAddDialogOpen(false);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      const ingredient = ingredients.find(ing => ing.id === deleteConfirmId);
      deleteIngredient(deleteConfirmId);
      toast({
        title: 'Ingrediente eliminado',
        description: `"${ingredient?.name}" se ha eliminado del catálogo.`,
      });
      setDeleteConfirmId(null);
    }
  };

  const handleQuickPriceUpdate = (id: string, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    updateIngredient(id, { pricePerUnit: price });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const categoriesWithIngredients = INGREDIENT_CATEGORIES.filter(
    cat => groupedIngredients[cat.id]?.length > 0
  );

  return (
    <Card className="border-border/50 shadow-warm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-success/10">
              <Package className="w-5 h-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg">Control de Materia Prima</CardTitle>
              <CardDescription>Administra tus ingredientes y precios</CardDescription>
            </div>
          </div>
          <Button onClick={openAddDialog} size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Los precios que configures aquí se cargarán automáticamente al crear nuevas recetas. 
            Las recetas existentes no se modificarán.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ingrediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {categoriesWithIngredients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron ingredientes</p>
            </div>
          ) : (
            categoriesWithIngredients.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategories.includes(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-2">
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                      {groupedIngredients[category.id].length}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    <div className="mt-1 space-y-1 pl-2">
                      {groupedIngredients[category.id].map((ingredient) => (
                        <motion.div
                          key={ingredient.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ingredient.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ingredient.unit} • Actualizado: {formatDate(ingredient.lastUpdated)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground mr-1">{settings.currencySymbol}</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={ingredient.pricePerUnit || ''}
                              onChange={(e) => handleQuickPriceUpdate(ingredient.id, e.target.value)}
                              placeholder="0.00"
                              className="w-20 h-8 text-sm text-right"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(ingredient)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(ingredient.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            {ingredients.length} ingredientes en catálogo • 
            {ingredients.filter(i => i.pricePerUnit > 0).length} con precio configurado
          </p>
        </div>
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar ingrediente</DialogTitle>
            <DialogDescription>
              Añade un nuevo ingrediente a tu catálogo de materia prima.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nombre</Label>
              <Input
                id="add-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Harina de maíz"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-unit">Unidad</Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-price">Precio por {formUnit}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {settings.currencySymbol}
                  </span>
                  <Input
                    id="add-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-category">Categoría</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingIngredient} onOpenChange={(open) => !open && setEditingIngredient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar ingrediente</DialogTitle>
            <DialogDescription>
              Modifica los datos del ingrediente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre del ingrediente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unidad</Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Precio por {formUnit}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {settings.currencySymbol}
                  </span>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIngredient(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              ¿Eliminar ingrediente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el ingrediente del catálogo. Las recetas existentes que usen este ingrediente no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Filter, Pencil, Trash2, Package, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { useBaseIngredients, BaseIngredient, INGREDIENT_CATEGORIES, PURCHASE_UNITS, getBaseUnit, calculateCostPerBaseUnit } from '@/context/BaseIngredientsContext';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

interface IngredientFormData {
  name: string;
  category: string;
  purchaseUnit: string;
  presentationQuantity: string;
  presentationPrice: string;
  quantityPurchased: string;
  purchaseDate: string;
}

const initialFormData: IngredientFormData = {
  name: '',
  category: 'otros',
  purchaseUnit: 'g',
  presentationQuantity: '',
  presentationPrice: '',
  quantityPurchased: '1',
  purchaseDate: new Date().toISOString().split('T')[0],
};

export default function IngredientsPage() {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, findDuplicate } = useBaseIngredients();
  const { settings } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<BaseIngredient | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<IngredientFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchTerm, selectedCategory]);

  const groupedIngredients = useMemo(() => {
    return filteredIngredients.reduce((acc, ing) => {
      if (!acc[ing.category]) {
        acc[ing.category] = [];
      }
      acc[ing.category].push(ing);
      return acc;
    }, {} as Record<string, BaseIngredient[]>);
  }, [filteredIngredients]);

  const sortedCategories = useMemo(() => {
    return Object.keys(groupedIngredients).sort((a, b) => {
      const catA = INGREDIENT_CATEGORIES.find(c => c.id === a);
      const catB = INGREDIENT_CATEGORIES.find(c => c.id === b);
      return (catA?.name || a).localeCompare(catB?.name || b);
    });
  }, [groupedIngredients]);

  const previewCost = useMemo(() => {
    const price = parseFloat(formData.presentationPrice) || 0;
    const qty = parseFloat(formData.presentationQuantity) || 0;
    return calculateCostPerBaseUnit(price, qty, formData.purchaseUnit);
  }, [formData]);

  const previewTotalPaid = useMemo(() => {
    const price = parseFloat(formData.presentationPrice) || 0;
    const qty = parseFloat(formData.presentationQuantity) || 0;
    return price * qty;
  }, [formData.presentationPrice, formData.presentationQuantity]);

  const handleOpenAdd = () => {
    setFormData(initialFormData);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (ingredient: BaseIngredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      purchaseUnit: ingredient.purchaseUnit,
      presentationQuantity: ingredient.presentationQuantity.toString(),
      presentationPrice: ingredient.presentationPrice.toString(),
      quantityPurchased: (ingredient.quantityPurchased || 1).toString(),
      purchaseDate: ingredient.purchaseDate ? new Date(ingredient.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const validateForm = (isEdit: boolean = false): boolean => {
    if (!formData.name.trim()) {
      setFormError('El nombre es requerido');
      return false;
    }
    
    const duplicate = findDuplicate(formData.name, isEdit ? editingIngredient?.id : undefined);
    if (duplicate) {
      setFormError(`Ya existe un ingrediente con ese nombre. ¿Deseas editarlo?`);
      return false;
    }

    const qty = parseFloat(formData.presentationQuantity);
    if (!qty || qty <= 0) {
      setFormError('La cantidad de presentación debe ser mayor a 0');
      return false;
    }

    const price = parseFloat(formData.presentationPrice);
    if (!price || price <= 0) {
      setFormError('El precio debe ser mayor a 0');
      return false;
    }

    if (!formData.purchaseDate) {
      setFormError('La fecha de compra es obligatoria');
      return false;
    }

    return true;
  };

  const handleSaveAdd = async () => {
    if (!validateForm()) return;

    const result = await addIngredient({
      name: formData.name.trim(),
      category: formData.category,
      purchaseUnit: formData.purchaseUnit as any,
      presentationQuantity: parseFloat(formData.presentationQuantity),
      presentationPrice: parseFloat(formData.presentationPrice),
      quantityPurchased: parseFloat(formData.quantityPurchased) || 1,
      purchaseDate: new Date(formData.purchaseDate).toISOString(),
    });

    if (result) {
      toast({
        title: '✅ Ingrediente agregado',
        description: `"${formData.name}" se agregó correctamente`,
      });
      setShowAddModal(false);
      setFormData(initialFormData);
      setFormError(null);
    } else {
      setFormError('Error al guardar el ingrediente. Intenta de nuevo.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingIngredient || !validateForm(true)) return;

    await updateIngredient(editingIngredient.id, {
      name: formData.name.trim(),
      category: formData.category,
      purchaseUnit: formData.purchaseUnit as any,
      presentationQuantity: parseFloat(formData.presentationQuantity),
      presentationPrice: parseFloat(formData.presentationPrice),
      quantityPurchased: parseFloat(formData.quantityPurchased) || 1,
      purchaseDate: new Date(formData.purchaseDate).toISOString(),
    });

    toast({
      title: '✅ Ingrediente actualizado',
      description: `"${formData.name}" se actualizó correctamente`,
    });

    setShowEditModal(false);
    setEditingIngredient(null);
    setFormError(null);
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    
    const ingredient = ingredients.find(i => i.id === deleteConfirmId);
    deleteIngredient(deleteConfirmId);
    
    toast({
      title: '🗑️ Ingrediente eliminado',
      description: ingredient ? `"${ingredient.name}" fue eliminado` : 'Ingrediente eliminado',
    });
    
    setDeleteConfirmId(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Sin fecha';
    }
  };

  const getUnitLabel = (unit: string) => {
    const found = PURCHASE_UNITS.find(u => u.id === unit);
    return found?.name || unit;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Ingredientes" />

      <div className="p-4 space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ingrediente..."
              className="pl-10"
            />
          </div>
          <Button
            variant={selectedCategory !== 'all' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Filter */}
        <AnimatePresence>
          {showCategoryFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedCategory === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  Todos
                </button>
                {INGREDIENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1',
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    )}
                  >
                    <span>{CATEGORY_EMOJI[cat.id]}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredIngredients.length} ingredientes</span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <X className="w-3 h-3" />
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Ingredient List by Category */}
        {sortedCategories.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No se encontraron ingredientes</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer ingrediente'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map(categoryId => {
              const category = INGREDIENT_CATEGORIES.find(c => c.id === categoryId);
              const categoryIngredients = groupedIngredients[categoryId];
              
              return (
                <motion.div
                  key={categoryId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{CATEGORY_EMOJI[categoryId]}</span>
                    <h3 className="font-semibold text-sm">{category?.name || categoryId}</h3>
                    <span className="text-xs text-muted-foreground">({categoryIngredients.length})</span>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryIngredients.map(ingredient => (
                      <Card key={ingredient.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{ingredient.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {settings.currencySymbol}{ingredient.presentationPrice.toFixed(2)} por{' '}
                                {ingredient.presentationQuantity} {ingredient.purchaseUnit}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-semibold text-primary">
                                  {settings.currencySymbol}{ingredient.costPerBaseUnit.toFixed(4)}/{getBaseUnit(ingredient.purchaseUnit)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • Compra: {ingredient.purchaseDate ? formatDate(ingredient.purchaseDate) : formatDate(ingredient.lastUpdated)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(ingredient)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirmId(ingredient.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Add Button */}
      <Button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-30"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar ingrediente
            </DialogTitle>
          </DialogHeader>
          <IngredientForm
            formData={formData}
            setFormData={setFormData}
            formError={formError}
            setFormError={setFormError}
            previewCost={previewCost}
            previewTotalPaid={previewTotalPaid}
            currencySymbol={settings.currencySymbol}
            onSave={handleSaveAdd}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Editar ingrediente
            </DialogTitle>
          </DialogHeader>
          <IngredientForm
            formData={formData}
            setFormData={setFormData}
            formError={formError}
            setFormError={setFormError}
            previewCost={previewCost}
            previewTotalPaid={previewTotalPaid}
            currencySymbol={settings.currencySymbol}
            onSave={handleSaveEdit}
            onCancel={() => setShowEditModal(false)}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ingrediente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ingrediente será eliminado permanentemente.
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

      <BottomNav />
    </div>
  );
}

// Separate form component for reuse
interface IngredientFormProps {
  formData: IngredientFormData;
  setFormData: React.Dispatch<React.SetStateAction<IngredientFormData>>;
  formError: string | null;
  setFormError: React.Dispatch<React.SetStateAction<string | null>>;
  previewCost: number;
  previewTotalPaid: number;
  currencySymbol: string;
  onSave: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function IngredientForm({
  formData,
  setFormData,
  formError,
  setFormError,
  previewCost,
  previewTotalPaid,
  currencySymbol,
  onSave,
  onCancel,
  isEdit = false,
}: IngredientFormProps) {
  const baseUnit = getBaseUnit(formData.purchaseUnit);

  return (
    <div className="space-y-4">
      {formError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {formError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Nombre del ingrediente</label>
        <Input
          value={formData.name}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }));
            setFormError(null);
          }}
          placeholder="Ej: Harina de trigo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Categoría</label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
            value={formData.purchaseUnit}
            onValueChange={(value) => setFormData(prev => ({ ...prev, purchaseUnit: value }))}
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
          <label className="block text-sm font-medium mb-1.5">Cantidad presentación</label>
          <Input
            type="number"
            value={formData.presentationQuantity}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, presentationQuantity: e.target.value }));
              setFormError(null);
            }}
            placeholder="Ej: 1000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Precio de la presentación</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </span>
          <Input
            type="number"
            step="0.01"
            value={formData.presentationPrice}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, presentationPrice: e.target.value }));
              setFormError(null);
            }}
            placeholder="0.00"
            className="pl-8"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Fecha de compra *</label>
        <Input
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, purchaseDate: e.target.value }));
            setFormError(null);
          }}
        />
      </div>

      {/* Preview */}
      {previewCost > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Costo calculado por unidad base</p>
              <p className="text-2xl font-bold text-primary">
                {currencySymbol}{previewCost.toFixed(4)} / {baseUnit}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Este es el costo que se usará en tus recetas
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={onSave} className="flex-1">
          {isEdit ? 'Guardar cambios' : 'Agregar'}
        </Button>
      </div>
    </div>
  );
}

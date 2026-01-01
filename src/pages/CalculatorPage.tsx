import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronRight, Check, Sparkles, HelpCircle, Clock, Utensils, Flame, Palette, Package, Gift, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useApp, Ingredient, IndirectCost, Recipe, RecipeElaborationTime, RecipeExtra } from '@/context/AppContext';
import { useLabor } from '@/context/LaborContext';
import { useIndirectCosts } from '@/context/IndirectCostsContext';
import { BottomNav } from '@/components/BottomNav';
import { toast } from '@/hooks/use-toast';
import { RecipeTutorial } from '@/components/calculator/RecipeTutorial';
import { IngredientAutocomplete } from '@/components/calculator/IngredientAutocomplete';

const CATEGORIES = [
  { id: 'torta', name: 'Torta', emoji: '🎂' },
  { id: 'cupcake', name: 'Cupcake', emoji: '🧁' },
  { id: 'brownie', name: 'Brownie', emoji: '🍫' },
  { id: 'galleta', name: 'Galleta', emoji: '🍪' },
  { id: 'postre_vaso', name: 'Postre en vaso', emoji: '🥛' },
  { id: 'pie', name: 'Pie', emoji: '🥧' },
  { id: 'otro', name: 'Otro', emoji: '🍰' },
];

const UNITS = ['g', 'ml', 'pza'];

const STEPS = ['info', 'ingredients', 'production', 'extras', 'result'];

const WASTE_PERCENTAGE = 0.05; // 5% merma fija

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const { settings, recipes, addRecipe, updateRecipe, calculateRecipeCost, updateSettings } = useApp();
  const { getLaborCostPerHour, getTotalMonthlyHours } = useLabor();
  const { getTotalIndirectCosts } = useIndirectCosts();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Show tutorial for new users
  useEffect(() => {
    if (!editId && !settings.hasCompletedRecipeTutorial && recipes.length === 0) {
      setShowTutorial(true);
    }
  }, [editId, settings.hasCompletedRecipeTutorial, recipes.length]);

  // Form state
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', pricePerUnit: 0, quantityUsed: 0, unit: 'g' },
  ]);
  const [indirectCosts, setIndirectCosts] = useState<IndirectCost>({
    gas: 0,
    electricity: 0,
    packaging: 0,
    labor: 0,
    other: 0,
  });
  const [marginPercentage, setMarginPercentage] = useState(50);
  
  // Estados para porciones y tiempo de elaboración
  const [portions, setPortions] = useState(1);
  const [elaborationTime, setElaborationTime] = useState<RecipeElaborationTime>({
    preparation: 0,
    baking: 0,
    decoration: 0,
    packaging: 0,
  });

  // Estados para extras
  const [extras, setExtras] = useState<RecipeExtra[]>([]);
  const [decorationHours, setDecorationHours] = useState(0);

  // Margen de venta (para el resultado final)
  const [saleMargin, setSaleMargin] = useState(50);

  // Load recipe data when editing
  useEffect(() => {
    if (editId) {
      const recipe = recipes.find(r => r.id === editId);
      if (recipe) {
        setIsEditing(true);
        setRecipeId(recipe.id);
        setRecipeName(recipe.name);
        setCategory(recipe.category);
        setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [
          { id: '1', name: '', pricePerUnit: 0, quantityUsed: 0, unit: 'g' },
        ]);
        setIndirectCosts(recipe.indirectCosts);
        setMarginPercentage(recipe.marginPercentage);
        setPortions(recipe.portions || 1);
        setElaborationTime(recipe.elaborationTime || {
          preparation: 0,
          baking: 0,
          decoration: 0,
          packaging: 0,
        });
        setExtras(recipe.extras || []);
        setDecorationHours(recipe.decorationHours || 0);
      }
    }
  }, [editId, recipes]);

  // Obtener costos globales
  const laborCostPerHour = getLaborCostPerHour();
  const totalMonthlyHours = getTotalMonthlyHours();
  const totalIndirectCosts = getTotalIndirectCosts();
  const indirectCostPerHour = totalMonthlyHours > 0 ? totalIndirectCosts / totalMonthlyHours : 0;

  // Ingredientes
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: '', pricePerUnit: 0, quantityUsed: 0, unit: 'g' },
    ]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const updateIngredientFull = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing))
    );
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  // Extras
  const addExtra = () => {
    setExtras([
      ...extras,
      { id: Date.now().toString(), name: '', quantity: 1, unitCost: 0 },
    ]);
  };

  const updateExtra = (id: string, field: keyof RecipeExtra, value: any) => {
    setExtras(
      extras.map((extra) => (extra.id === id ? { ...extra, [field]: value } : extra))
    );
  };

  const removeExtra = (id: string) => {
    setExtras(extras.filter((extra) => extra.id !== id));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSave = () => {
    const recipeData = {
      name: recipeName,
      category,
      ingredients: ingredients.filter((ing) => ing.name.trim() !== ''),
      indirectCosts,
      marginPercentage: saleMargin,
      portions,
      elaborationTime,
      extras: extras.filter((e) => e.name.trim() !== ''),
      decorationHours,
    };

    if (isEditing && recipeId) {
      updateRecipe(recipeId, recipeData);
      toast({
        title: '¡Receta actualizada!',
        description: `"${recipeName}" ha sido guardada`,
      });
    } else {
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        ...recipeData,
        createdAt: new Date().toISOString(),
      };
      addRecipe(newRecipe);
      toast({
        title: '¡Receta creada!',
        description: `"${recipeName}" ha sido guardada`,
      });
    }
    navigate('/recipes');
  };

  // === CÁLCULOS ===
  
  // Costo de ingredientes
  const ingredientsCost = ingredients.reduce(
    (sum, ing) => sum + (ing.pricePerUnit * ing.quantityUsed),
    0
  );

  // HORAS TOTALES DEL PRODUCTO (inicio a fin)
  // Incluye: preparación + horneado + decoración + empaque
  const totalElaborationTimeMinutes = elaborationTime.preparation + elaborationTime.baking + elaborationTime.decoration + elaborationTime.packaging;
  const totalProductHours = totalElaborationTimeMinutes / 60;

  // Validación: no permitir horas = 0 o negativas para cálculos
  const validProductHours = Math.max(0, totalProductHours);

  // MANO DE OBRA FINAL — calculada con horas reales del producto
  const laborFinalCost = validProductHours * laborCostPerHour;

  // COSTOS INDIRECTOS FINALES — calculados con horas reales del producto
  const indirectFinalCost = validProductHours * indirectCostPerHour;

  // Costo total de extras (materiales de decoración y empaque)
  const extrasCost = extras.reduce(
    (sum, extra) => sum + (extra.quantity * extra.unitCost),
    0
  );

  // Mano de obra adicional de decoración (horas extra específicas)
  const laborDecorationCost = decorationHours * laborCostPerHour;

  // COSTO BASE DEL PRODUCTO — consolidación correcta
  const baseCost = ingredientsCost + laborFinalCost + indirectFinalCost + extrasCost + laborDecorationCost;

  // Merma (5%)
  const wasteCost = baseCost * WASTE_PERCENTAGE;

  // Costo total con merma
  const totalCostWithWaste = baseCost + wasteCost;

  // Precio sugerido con margen real (fórmula: costo / (1 - margen))
  const marginDecimal = Math.min(Math.max(saleMargin, 30), 90) / 100;
  const suggestedPrice = totalCostWithWaste / (1 - marginDecimal);

  // Para el cálculo antiguo (compatibilidad)
  const currentRecipe: Recipe = {
    id: 'preview',
    name: recipeName,
    category,
    ingredients,
    indirectCosts,
    marginPercentage,
    portions,
    elaborationTime,
    extras,
    decorationHours,
    createdAt: '',
  };
  const costs = calculateRecipeCost(currentRecipe);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return recipeName.trim() !== '' && category !== '';
      case 1:
        return ingredients.some((ing) => ing.name.trim() !== '' && ing.pricePerUnit > 0 && ing.quantityUsed > 0);
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleTutorialComplete = () => {
    updateSettings({ hasCompletedRecipeTutorial: true });
    setShowTutorial(false);
  };

  // Redondear a 2 decimales
  const round2 = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Tutorial */}
      <RecipeTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border p-4 safe-top">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">
              {currentStep === 4 ? 'Resultado' : isEditing ? 'Editar Receta' : 'Nueva Receta'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Paso {currentStep + 1} de {STEPS.length}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
              title="Ver tutorial"
            >
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="flex gap-1 mt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= currentStep ? 'bg-caramel' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <span className="text-4xl">🧁</span>
                <h2 className="text-xl font-bold mt-2">
                  {isEditing ? '¿Qué cambios harás?' : '¿Qué vas a preparar?'}
                </h2>
                <p className="text-muted-foreground text-sm">Cuéntanos sobre tu postre</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del postre</label>
                  <Input
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Ej: Torta de chocolate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Categoría</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          category === cat.id
                            ? 'border-caramel bg-secondary'
                            : 'border-transparent bg-muted hover:bg-secondary'
                        }`}
                      >
                        <span className="text-2xl block">{cat.emoji}</span>
                        <span className="text-xs mt-1 block">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Ingredients */}
          {currentStep === 1 && (
            <motion.div
              key="ingredients"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <span className="text-4xl">📝</span>
                <h2 className="text-xl font-bold mt-2">Ingredientes</h2>
                <p className="text-muted-foreground text-sm">
                  Selecciona ingredientes y escribe solo la cantidad usada
                </p>
              </div>

              <div className="space-y-3">
                {ingredients.map((ing, index) => {
                  const ingredientCost = ing.pricePerUnit * ing.quantityUsed;
                  const isSelected = ing.name.trim() !== '' && ing.pricePerUnit > 0;
                  
                  return (
                    <Card key={ing.id} className={isSelected ? 'border-primary/30 bg-primary/5' : ''}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Ingrediente {index + 1}
                          </span>
                          {ingredients.length > 1 && (
                            <button
                              onClick={() => removeIngredient(ing.id)}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <IngredientAutocomplete
                          value={ing.name}
                          onChange={(value) => {
                            if (!value.trim()) {
                              updateIngredientFull(ing.id, {
                                name: '',
                                pricePerUnit: 0,
                                unit: 'g',
                                quantityUsed: 0
                              });
                            } else {
                              updateIngredient(ing.id, 'name', value);
                            }
                          }}
                          onSelect={(selected) => {
                            updateIngredientFull(ing.id, {
                              name: selected.name,
                              pricePerUnit: selected.costPerBaseUnit,
                              unit: selected.baseUnit,
                            });
                            toast({
                              title: '✅ Ingrediente cargado',
                              description: `${selected.name} - ${settings.currencySymbol}${selected.costPerBaseUnit.toFixed(4)}/${selected.baseUnit}`,
                            });
                          }}
                          placeholder="Toca para seleccionar ingrediente..."
                        />

                        {isSelected && (
                          <div className="bg-muted/50 rounded-xl p-3 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Precio por {ing.unit}:</span>
                              <span className="font-semibold text-primary">
                                {settings.currencySymbol}{ing.pricePerUnit.toFixed(4)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium whitespace-nowrap">
                                Cantidad usada:
                              </label>
                              <div className="flex-1 flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={ing.quantityUsed || ''}
                                  onChange={(e) =>
                                    updateIngredient(ing.id, 'quantityUsed', parseFloat(e.target.value) || 0)
                                  }
                                  placeholder="0"
                                  className="flex-1 text-center font-medium"
                                />
                                <span className="text-sm font-medium text-muted-foreground min-w-[30px]">
                                  {ing.unit}
                                </span>
                              </div>
                            </div>

                            {ing.quantityUsed > 0 && (
                              <div className="flex items-center justify-between pt-2 border-t border-border">
                                <span className="text-sm font-medium">Costo del ingrediente:</span>
                                <span className="text-lg font-bold text-primary">
                                  {settings.currencySymbol}{ingredientCost.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {!isSelected && ing.name.trim() === '' && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            👆 Toca el campo para ver los ingredientes disponibles
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                <Button onClick={addIngredient} variant="outline" className="w-full">
                  <Plus className="w-4 h-4" />
                  Agregar otro ingrediente
                </Button>
              </div>

              <Card className="bg-secondary border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total ingredientes:</span>
                    <span className="text-xl font-bold text-primary">
                      {settings.currencySymbol}{round2(ingredientsCost).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ingredients.filter(i => i.name.trim() && i.quantityUsed > 0).length} ingrediente(s) con cantidad
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Production - Porciones y Tiempo */}
          {currentStep === 2 && (
            <motion.div
              key="production"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              {/* Sección: Rendimiento del producto */}
              <div>
                <div className="text-center mb-4">
                  <span className="text-4xl">🍰</span>
                  <h2 className="text-xl font-bold mt-2">Rendimiento del producto</h2>
                  <p className="text-muted-foreground text-sm">
                    Indica cuántas porciones reales obtienes con esta receta
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium block mb-2">
                          Número de porciones
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={portions}
                          onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
                          className="text-center text-lg font-bold"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sección: Tiempo de elaboración */}
              <div>
                <div className="text-center mb-4">
                  <span className="text-4xl">⏱️</span>
                  <h2 className="text-xl font-bold mt-2">Tiempo de elaboración</h2>
                  <p className="text-muted-foreground text-sm">
                    Este tiempo te ayuda a saber cuánto tardas realmente en producir este postre
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'preparation', label: 'Preparación', icon: Utensils, description: 'Mezclar, batir, preparar' },
                    { key: 'baking', label: 'Horneado', icon: Flame, description: 'Tiempo en el horno' },
                    { key: 'decoration', label: 'Decoración', icon: Palette, description: 'Decorar y embellecer' },
                    { key: 'packaging', label: 'Empaque', icon: Package, description: 'Empacar y alistar' },
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Card key={item.key}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium block">{item.label}</label>
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={elaborationTime[item.key as keyof RecipeElaborationTime] || ''}
                                onChange={(e) =>
                                  setElaborationTime({
                                    ...elaborationTime,
                                    [item.key]: Math.max(0, parseInt(e.target.value) || 0),
                                  })
                                }
                                placeholder="0"
                                className="w-20 text-center"
                              />
                              <span className="text-sm text-muted-foreground">min</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Total tiempo */}
                <Card className="bg-primary/10 border-primary/30 mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-primary" />
                        <div>
                          <span className="text-sm font-medium block">Tiempo total de elaboración</span>
                          <span className="text-xs text-muted-foreground">Suma de todas las etapas</span>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {validProductHours.toFixed(1)} horas
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-center mt-4 px-4">
                  Aquí defines tiempos y rendimiento, no precios.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Extras */}
          {currentStep === 3 && (
            <motion.div
              key="extras"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              {/* Sección: Extras materiales */}
              <div>
                <div className="text-center mb-4">
                  <span className="text-4xl">📦</span>
                  <h2 className="text-xl font-bold mt-2">Extras del producto</h2>
                  <p className="text-muted-foreground text-sm">
                    Agrega toppers, cajas, bases, listón, flores, placas, etc.
                  </p>
                </div>

                <div className="space-y-3">
                  {extras.map((extra, index) => {
                    const extraCost = extra.quantity * extra.unitCost;
                    return (
                      <Card key={extra.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Extra {index + 1}
                            </span>
                            <button
                              onClick={() => removeExtra(extra.id)}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <Input
                            value={extra.name}
                            onChange={(e) => updateExtra(extra.id, 'name', e.target.value)}
                            placeholder="Nombre del extra (ej. Topper, Caja)"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">Cantidad</label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={extra.quantity || ''}
                                onChange={(e) => updateExtra(extra.id, 'quantity', Math.max(0, parseInt(e.target.value) || 0))}
                                placeholder="0"
                                className="text-center"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">Costo unitario</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                  {settings.currencySymbol}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={extra.unitCost || ''}
                                  onChange={(e) => updateExtra(extra.id, 'unitCost', Math.max(0, parseFloat(e.target.value) || 0))}
                                  placeholder="0.00"
                                  className="pl-7 text-center"
                                />
                              </div>
                            </div>
                          </div>

                          {extra.quantity > 0 && extra.unitCost > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <span className="text-sm text-muted-foreground">Subtotal:</span>
                              <span className="font-bold text-primary">
                                {settings.currencySymbol}{extraCost.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Button onClick={addExtra} variant="outline" className="w-full">
                    <Plus className="w-4 h-4" />
                    Agregar extra
                  </Button>
                </div>

                {extras.length > 0 && (
                  <Card className="bg-secondary border-2 border-primary/20 mt-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">Costo total de extras:</span>
                        </div>
                        <span className="text-xl font-bold text-primary">
                          {settings.currencySymbol}{round2(extrasCost).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sección: Mano de obra de decoración */}
              <div>
                <div className="text-center mb-4">
                  <span className="text-4xl">🎨</span>
                  <h2 className="text-xl font-bold mt-2">Mano de obra de decoración</h2>
                  <p className="text-muted-foreground text-sm">
                    Esta mano de obra NO se mezcla con la producción
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Horas usadas en decoración
                      </label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={decorationHours || ''}
                          onChange={(e) => setDecorationHours(Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="0"
                          className="text-center text-lg font-bold"
                        />
                        <span className="text-sm text-muted-foreground">horas</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Costo por hora (desde Mano de Obra):</span>
                        <span className="font-medium">
                          {settings.currencySymbol}{laborCostPerHour.toFixed(2)}
                        </span>
                      </div>
                      
                      {laborCostPerHour === 0 && (
                        <div className="flex items-center gap-2 text-amber-600 text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Agrega trabajadores en el módulo Mano de Obra</span>
                        </div>
                      )}
                    </div>

                    {decorationHours > 0 && laborCostPerHour > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="font-medium">Mano de obra de decoración:</span>
                        <span className="text-xl font-bold text-primary">
                          {settings.currencySymbol}{round2(laborDecorationCost).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Step 5: Result */}
          {currentStep === 4 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-success/20 mx-auto flex items-center justify-center mb-4"
                >
                  <Sparkles className="w-10 h-10 text-success" />
                </motion.div>
                <h2 className="text-2xl font-bold">¡Listo!</h2>
                <p className="text-muted-foreground">Resumen completo de costos</p>
              </div>

              {/* Horas totales del producto */}
              <Card className="bg-muted/50 border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Horas totales del producto (inicio a fin)
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Utensils className="w-3 h-3" /> Preparación
                      </span>
                      <span>{elaborationTime.preparation} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Horneado
                      </span>
                      <span>{elaborationTime.baking} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Decoración
                      </span>
                      <span>{elaborationTime.decoration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" /> Empaque
                      </span>
                      <span>{elaborationTime.packaging} min</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t text-lg">
                      <span>Tiempo total</span>
                      <span className="text-primary">{validProductHours.toFixed(2)} horas</span>
                    </div>
                  </div>
                  {validProductHours === 0 && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Agrega tiempos de elaboración para un cálculo preciso</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de costos detallado */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Desglose de costos
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo total de la receta (ingredientes)</span>
                      <span>{settings.currencySymbol}{round2(ingredientsCost).toFixed(2)}</span>
                    </div>

                    {/* Mano de obra */}
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Costo por hora de mano de obra:</span>
                        <span>{settings.currencySymbol}{laborCostPerHour.toFixed(2)}/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mano de obra total ({validProductHours.toFixed(2)}h × {settings.currencySymbol}{laborCostPerHour.toFixed(2)})</span>
                        <span>{settings.currencySymbol}{round2(laborFinalCost).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Gastos indirectos */}
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Costo por hora de gastos indirectos:</span>
                        <span>{settings.currencySymbol}{indirectCostPerHour.toFixed(2)}/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gastos indirectos total ({validProductHours.toFixed(2)}h × {settings.currencySymbol}{indirectCostPerHour.toFixed(2)})</span>
                        <span>{settings.currencySymbol}{round2(indirectFinalCost).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Extras (decoración y empaques)</span>
                      <span>{settings.currencySymbol}{round2(extrasCost).toFixed(2)}</span>
                    </div>
                    {decorationHours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mano de obra extra decoración ({decorationHours}h)</span>
                        <span>{settings.currencySymbol}{round2(laborDecorationCost).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Costo base del producto</span>
                      <span>{settings.currencySymbol}{round2(baseCost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Merma (5%)</span>
                      <span>+{settings.currencySymbol}{round2(wasteCost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t text-lg">
                      <span>Costo total con merma</span>
                      <span className="text-primary">{settings.currencySymbol}{round2(totalCostWithWaste).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Margen y precio sugerido */}
              <Card className="bg-gradient-to-br from-caramel/20 to-accent/20 border-caramel/30">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-caramel" />
                    <h3 className="font-bold">Margen de ganancia</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Margen deseado:</span>
                      <span className="text-2xl font-bold text-caramel">{saleMargin}%</span>
                    </div>
                    
                    <Slider
                      value={[saleMargin]}
                      onValueChange={(value) => setSaleMargin(value[0])}
                      min={30}
                      max={90}
                      step={1}
                      className="my-4"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>30% (mínimo)</span>
                      <span>90% (máximo)</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-caramel/30">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Precio sugerido de venta</p>
                      <p className="text-4xl font-bold text-foreground">
                        {settings.currencySymbol}{round2(suggestedPrice).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Fórmula: Costo ÷ (1 − margen)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de producción */}
              {portions > 1 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Rendimiento por porción
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Porciones</span>
                        <span className="font-medium">{portions} porciones</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Costo por porción</span>
                        <span className="font-bold text-primary">{settings.currencySymbol}{(totalCostWithWaste / portions).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Precio por porción</span>
                        <span className="font-bold text-caramel">{settings.currencySymbol}{(suggestedPrice / portions).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleSave} variant="warm" size="xl" className="w-full">
                <Check className="w-5 h-5" />
                {isEditing ? 'Guardar cambios' : 'Guardar receta'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation for steps */}
      {currentStep < 4 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border">
          <Button
            onClick={handleNext}
            variant="warm"
            size="lg"
            className="w-full"
            disabled={!canProceed()}
          >
            Continuar
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

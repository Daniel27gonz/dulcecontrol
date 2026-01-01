import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronRight, Check, Sparkles, HelpCircle, Clock, Utensils, Flame, Palette, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useApp, Ingredient, IndirectCost, Recipe, RecipeElaborationTime } from '@/context/AppContext';
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

const STEPS = ['info', 'ingredients', 'production', 'result'];

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const { settings, recipes, addRecipe, updateRecipe, calculateRecipeCost, updateSettings } = useApp();
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
  
  // Nuevos estados para porciones y tiempo de elaboración
  const [portions, setPortions] = useState(1);
  const [elaborationTime, setElaborationTime] = useState<RecipeElaborationTime>({
    preparation: 0,
    baking: 0,
    decoration: 0,
    packaging: 0,
  });

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
        // Cargar porciones y tiempo de elaboración
        setPortions(recipe.portions || 1);
        setElaborationTime(recipe.elaborationTime || {
          preparation: 0,
          baking: 0,
          decoration: 0,
          packaging: 0,
        });
      }
    }
  }, [editId, recipes]);

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

  // Actualizar múltiples campos de un ingrediente de forma atómica
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
      marginPercentage,
      portions,
      elaborationTime,
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

  // Calcular tiempo total de elaboración en minutos y convertir a horas
  const totalElaborationTimeMinutes = elaborationTime.preparation + elaborationTime.baking + elaborationTime.decoration + elaborationTime.packaging;
  const totalElaborationTimeHours = totalElaborationTimeMinutes / 60;

  // Calculate current recipe for preview
  const currentRecipe: Recipe = {
    id: 'preview',
    name: recipeName,
    category,
    ingredients,
    indirectCosts,
    marginPercentage,
    portions,
    elaborationTime,
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
      default:
        return true;
    }
  };

  const handleTutorialComplete = () => {
    updateSettings({ hasCompletedRecipeTutorial: true });
    setShowTutorial(false);
  };

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

                        {/* Autocomplete para seleccionar ingrediente */}
                        <IngredientAutocomplete
                          value={ing.name}
                          onChange={(value) => {
                            // Si borra el nombre, limpiar todos los campos
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
                            // ✅ CRÍTICO: Actualizar TODOS los campos de forma atómica
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

                        {/* Mostrar info del ingrediente seleccionado */}
                        {isSelected && (
                          <div className="bg-muted/50 rounded-xl p-3 space-y-3">
                            {/* Info del ingrediente (bloqueada) */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Precio por {ing.unit}:</span>
                              <span className="font-semibold text-primary">
                                {settings.currencySymbol}{ing.pricePerUnit.toFixed(4)}
                              </span>
                            </div>

                            {/* Campo de cantidad (editable) */}
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

                            {/* Costo calculado automáticamente */}
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

                        {/* Mensaje de ayuda si no hay ingrediente seleccionado */}
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

              {/* Running total */}
              <Card className="bg-secondary border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total ingredientes:</span>
                    <span className="text-xl font-bold text-primary">
                      {settings.currencySymbol}{costs.ingredientsCost.toFixed(2)}
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
                                    [item.key]: parseInt(e.target.value) || 0,
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
                        {totalElaborationTimeHours.toFixed(1)} horas
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Texto de ayuda */}
                <p className="text-xs text-muted-foreground text-center mt-4 px-4">
                  Aquí defines tiempos y rendimiento, no precios.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Result */}
          {currentStep === 3 && (
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
                <p className="text-muted-foreground">Este es el precio sugerido para tu postre</p>
              </div>

              <Card className="bg-gradient-to-br from-caramel/20 to-accent/20 border-caramel/30">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{recipeName}</p>
                  <p className="text-4xl font-bold text-foreground">
                    {settings.currencySymbol}{costs.totalCost.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Costo total de producción
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-foreground">Resumen de costos</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingredientes</span>
                      <span>{settings.currencySymbol}{costs.ingredientsCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gastos indirectos</span>
                      <span>{settings.currencySymbol}{costs.indirectCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Costo total</span>
                      <span>{settings.currencySymbol}{costs.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de producción */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Datos de producción
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Porciones</span>
                      <span className="font-medium">{portions} {portions === 1 ? 'porción' : 'porciones'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiempo total</span>
                      <span className="font-medium">{totalElaborationTimeHours.toFixed(1)} horas</span>
                    </div>
                    {portions > 1 && (
                      <div className="flex justify-between pt-2 border-t text-primary">
                        <span className="font-medium">Costo por porción</span>
                        <span className="font-bold">{settings.currencySymbol}{(costs.totalCost / portions).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSave} variant="warm" size="xl" className="w-full">
                <Check className="w-5 h-5" />
                {isEditing ? 'Guardar cambios' : 'Guardar receta'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation for steps */}
      {currentStep < 3 && (
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

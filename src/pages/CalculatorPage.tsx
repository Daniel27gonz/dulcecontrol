import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronRight, Check, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useApp, Ingredient, IndirectCost, Recipe } from '@/context/AppContext';
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

const STEPS = ['info', 'ingredients', 'costs', 'margin', 'result'];

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

  // Calculate current recipe for preview
  const currentRecipe: Recipe = {
    id: 'preview',
    name: recipeName,
    category,
    ingredients,
    indirectCosts,
    marginPercentage,
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
        return marginPercentage > 0;
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
                            updateIngredient(ing.id, 'name', value);
                            // Si borra el nombre, limpiar los demás campos
                            if (!value.trim()) {
                              updateIngredient(ing.id, 'pricePerUnit', 0);
                              updateIngredient(ing.id, 'unit', 'g');
                            }
                          }}
                          onSelect={(selected) => {
                            updateIngredient(ing.id, 'name', selected.name);
                            updateIngredient(ing.id, 'pricePerUnit', selected.costPerBaseUnit);
                            updateIngredient(ing.id, 'unit', selected.baseUnit);
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

          {/* Step 3: Indirect Costs */}
          {currentStep === 2 && (
            <motion.div
              key="costs"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <span className="text-4xl">💡</span>
                <h2 className="text-xl font-bold mt-2">Gastos indirectos</h2>
                <p className="text-muted-foreground text-sm">
                  Estos gastos se suman al costo de tu postre
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'gas', label: 'Gas', emoji: '🔥' },
                  { key: 'electricity', label: 'Luz', emoji: '💡' },
                  { key: 'packaging', label: 'Empaque', emoji: '📦' },
                  { key: 'labor', label: 'Mano de obra', emoji: '👩‍🍳' },
                  { key: 'other', label: 'Otros', emoji: '📋' },
                ].map((item) => (
                  <Card key={item.key}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <label className="text-sm font-medium">{item.label}</label>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          value={indirectCosts[item.key as keyof IndirectCost] || ''}
                          onChange={(e) =>
                            setIndirectCosts({
                              ...indirectCosts,
                              [item.key]: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-secondary/50">
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total gastos indirectos:</span>
                  <span className="font-bold text-foreground">
                    {settings.currencySymbol}{costs.indirectCost.toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Margin */}
          {currentStep === 3 && (
            <motion.div
              key="margin"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <span className="text-4xl">💰</span>
                <h2 className="text-xl font-bold mt-2">¿Cuánto quieres ganar?</h2>
                <p className="text-muted-foreground text-sm">
                  Elige el porcentaje de ganancia sobre tu costo
                </p>
              </div>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-caramel mb-4">
                    {marginPercentage}%
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={marginPercentage}
                    onChange={(e) => setMarginPercentage(parseInt(e.target.value))}
                    className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-caramel"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>10%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-2">
                {[30, 50, 80].map((percent) => (
                  <Button
                    key={percent}
                    variant={marginPercentage === percent ? 'warm' : 'secondary'}
                    onClick={() => setMarginPercentage(percent)}
                    className="flex-col h-auto py-3"
                  >
                    <span className="text-lg font-bold">{percent}%</span>
                    <span className="text-xs opacity-80">
                      {percent <= 30 ? 'Básico' : percent <= 60 ? 'Recomendado' : 'Premium'}
                    </span>
                  </Button>
                ))}
              </div>

              <Card className="bg-secondary/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo total:</span>
                    <span className="font-medium">{settings.currencySymbol}{costs.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tu ganancia:</span>
                    <span className="font-medium text-success">+{settings.currencySymbol}{costs.profit.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
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
                <p className="text-muted-foreground">Este es el precio sugerido para tu postre</p>
              </div>

              <Card className="bg-gradient-to-br from-caramel/20 to-accent/20 border-caramel/30">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{recipeName}</p>
                  <p className="text-4xl font-bold text-foreground">
                    {settings.currencySymbol}{costs.suggestedPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-success font-medium mt-2">
                    Ganancia: {settings.currencySymbol}{costs.profit.toFixed(2)} ({marginPercentage}%)
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

import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useApp, Ingredient, IndirectCost, Recipe } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';

const CATEGORIES = [
  { id: 'torta', name: 'Torta', emoji: '🎂' },
  { id: 'cupcake', name: 'Cupcake', emoji: '🧁' },
  { id: 'brownie', name: 'Brownie', emoji: '🍫' },
  { id: 'galleta', name: 'Galleta', emoji: '🍪' },
  { id: 'postre_vaso', name: 'Postre en vaso', emoji: '🥛' },
  { id: 'pie', name: 'Pie', emoji: '🥧' },
  { id: 'otro', name: 'Otro', emoji: '🍰' },
];

const UNITS = ['g', 'kg', 'ml', 'L', 'unidad', 'cucharada', 'taza'];

const STEPS = ['info', 'ingredients', 'costs', 'margin', 'result'];

const CalculatorPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { settings, addRecipe, calculateRecipeCost } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
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
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: recipeName,
      category,
      ingredients: ingredients.filter((ing) => ing.name.trim() !== ''),
      indirectCosts,
      marginPercentage,
      createdAt: new Date().toISOString(),
    };
    addRecipe(newRecipe);
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
        return ingredients.some((ing) => ing.name.trim() !== '' && ing.pricePerUnit > 0);
      case 2:
        return true;
      case 3:
        return marginPercentage > 0;
      default:
        return true;
    }
  };

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border p-4 safe-top">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">
              {currentStep === 4 ? 'Resultado' : 'Nueva Receta'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Paso {currentStep + 1} de {STEPS.length}
            </p>
          </div>
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
                <h2 className="text-xl font-bold mt-2">¿Qué vas a preparar?</h2>
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
                <p className="text-muted-foreground text-sm">Agrega los ingredientes y sus precios</p>
              </div>

              <div className="space-y-3">
                {ingredients.map((ing, index) => (
                  <Card key={ing.id}>
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

                      <Input
                        value={ing.name}
                        onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                        placeholder="Nombre del ingrediente"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Precio</label>
                          <Input
                            type="number"
                            value={ing.pricePerUnit || ''}
                            onChange={(e) =>
                              updateIngredient(ing.id, 'pricePerUnit', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Cantidad</label>
                          <Input
                            type="number"
                            value={ing.quantityUsed || ''}
                            onChange={(e) =>
                              updateIngredient(ing.id, 'quantityUsed', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Unidad</label>
                          <select
                            value={ing.unit}
                            onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                            className="w-full h-12 rounded-xl border-2 border-input bg-background px-3 text-sm"
                          >
                            {UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={addIngredient} variant="outline" className="w-full">
                  <Plus className="w-4 h-4" />
                  Agregar ingrediente
                </Button>
              </div>

              {/* Running total */}
              <Card className="bg-secondary/50">
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal ingredientes:</span>
                  <span className="font-bold text-foreground">
                    {settings.currencySymbol}{costs.ingredientsCost.toFixed(2)}
                  </span>
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
                Guardar receta
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
});

CalculatorPage.displayName = 'CalculatorPage';

export default CalculatorPage;

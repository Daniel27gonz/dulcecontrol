import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Search, 
  ChefHat, 
  DollarSign, 
  TrendingUp,
  Eye,
  MoreVertical,
  Pencil,
  Copy,
  Package,
  Zap,
  Clock,
  Utensils,
  Flame,
  Palette,
  Percent,
  AlertTriangle,
  Gift
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useApp, Recipe } from '@/context/AppContext';
import { useLabor } from '@/context/LaborContext';
import { useIndirectCosts } from '@/context/IndirectCostsContext';

import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { toast } from '@/hooks/use-toast';

export default function RecipesPage() {
  const navigate = useNavigate();
  const { recipes, settings, deleteRecipe, addRecipe } = useApp();
  const { getLastMonthLaborCostPerHour, getLastMonthTotalHours } = useLabor();
  const { getTotalIndirectCostsLastMonth } = useIndirectCosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  // Fuente única del costo mostrado aquí: costo_total_con_merma (mismo criterio que calculadora/cotización)
  // AHORA USA PRECIOS ACTUALES DE INGREDIENTES BASE (MASTER DATA REACTIVA)
  const calculateRecipeCost = (recipe: Recipe) => {
    const WASTE_PERCENTAGE = 0.05;

    // Usar misma lógica que CalculatorPage: pricePerUnit guardado en la receta
    const ingredientsCost = recipe.ingredients.reduce(
      (sum, ing) => sum + (ing.pricePerUnit * ing.quantityUsed),
      0
    );

    const elaborationTime = recipe.elaborationTime || { preparation: 0, baking: 0, decoration: 0, packaging: 0 };
    const totalElaborationTimeMinutes =
      elaborationTime.preparation +
      elaborationTime.baking +
      elaborationTime.decoration +
      elaborationTime.packaging;

    const totalProductHours = Math.max(0, totalElaborationTimeMinutes / 60);

    const laborCostPerHour = getLastMonthLaborCostPerHour();
    const totalMonthlyHours = getLastMonthTotalHours();
    const totalIndirectCosts = getTotalIndirectCostsLastMonth();
    const indirectCostPerHour = totalMonthlyHours > 0 ? totalIndirectCosts / totalMonthlyHours : 0;

    const laborFinalCost = totalProductHours * laborCostPerHour;
    const indirectFinalCost = totalProductHours * indirectCostPerHour;

    const extras = recipe.extras || [];
    const extrasCost = extras.reduce((sum, extra) => sum + extra.quantity * extra.unitCost, 0);

    const decorationHours = recipe.decorationHours || 0;
    const laborDecorationCost = decorationHours * laborCostPerHour;

    const baseCost = ingredientsCost + laborFinalCost + indirectFinalCost + extrasCost + laborDecorationCost;
    const wasteCost = baseCost * WASTE_PERCENTAGE;

    const totalCostWithWaste = round2(Math.max(0, baseCost + wasteCost));

    // Fórmula de margen real (misma que calculadora): precio = costo / (1 - margen)
    const marginDecimal = Math.min(Math.max(recipe.marginPercentage || 50, 30), 90) / 100;
    const suggestedPrice = round2(Math.max(0, totalCostWithWaste / (1 - marginDecimal)));
    const profit = round2(Math.max(0, suggestedPrice - totalCostWithWaste));

    return {
      // Ingredientes
      ingredientsCost: round2(Math.max(0, ingredientsCost)),
      // Mano de obra
      laborCostPerHour: round2(laborCostPerHour),
      totalProductHours: round2(totalProductHours),
      laborFinalCost: round2(laborFinalCost),
      // Gastos indirectos
      indirectCostPerHour: round2(indirectCostPerHour),
      indirectFinalCost: round2(indirectFinalCost),
      // Extras
      extrasCost: round2(extrasCost),
      decorationHours,
      laborDecorationCost: round2(laborDecorationCost),
      // Totales
      baseCost: round2(baseCost),
      wasteCost: round2(wasteCost),
      totalCost: totalCostWithWaste,
      suggestedPrice,
      profit,
      marginPercentage: recipe.marginPercentage || 50,
      // Tiempo de elaboración
      elaborationTime,
    };
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const handleDelete = () => {
    if (recipeToDelete) {
      deleteRecipe(recipeToDelete.id);
      toast({
        title: 'Receta eliminada',
        description: `"${recipeToDelete.name}" ha sido eliminada`,
      });
      setRecipeToDelete(null);
      setSelectedRecipe(null);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const categoryMap: Record<string, string> = {
      'pasteles': '🎂',
      'cupcakes': '🧁',
      'galletas': '🍪',
      'postres': '🍮',
      'pan': '🥖',
      'tartas': '🥧',
      'dulces': '🍬',
    };
    const lowerCategory = category.toLowerCase();
    return categoryMap[lowerCategory] || '🧁';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Mis Recetas" />

      <div className="p-4 space-y-4">
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar receta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => navigate('/calculator')} variant="warm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Summary */}
        {recipes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{recipes.length}</p>
                <p className="text-xs text-muted-foreground">Recetas</p>
              </CardContent>
            </Card>
            <Card className="bg-success/5 border-success/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(
                    recipes.reduce((sum, r) => sum + calculateRecipeCost(r).profit, 0) / recipes.length
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Ganancia prom.</p>
              </CardContent>
            </Card>
            <Card className="bg-caramel/5 border-caramel/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-caramel">
                  {Math.round(recipes.reduce((sum, r) => sum + r.marginPercentage, 0) / recipes.length)}%
                </p>
                <p className="text-xs text-muted-foreground">Margen prom.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recipes List */}
        {recipes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Sin recetas aún</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crea tu primera receta para calcular precios correctos
              </p>
              <Button onClick={() => navigate('/calculator')} variant="warm">
                <Plus className="w-4 h-4 mr-2" />
                Crear primera receta
              </Button>
            </CardContent>
          </Card>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron recetas</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredRecipes.map((recipe, index) => {
                const costs = calculateRecipeCost(recipe);
                return (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card 
                      className="overflow-hidden hover:shadow-card transition-all cursor-pointer"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          {/* Icon Section */}
                          <div className="w-20 gradient-warm flex items-center justify-center">
                            <span className="text-3xl">{getCategoryEmoji(recipe.category)}</span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-foreground truncate">{recipe.name}</h3>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {recipe.category}
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background border">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecipe(recipe);
                                  }}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/calculator?edit=${recipe.id}`);
                                  }}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar receta
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRecipeToDelete(recipe);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {/* Price Info */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <DollarSign className="w-3 h-3" />
                                  <span>{formatCurrency(costs.totalCost)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-caramel">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>{recipe.marginPercentage}%</span>
                                </div>
                              </div>
                              <p className="text-lg font-bold text-success">
                                {formatCurrency(costs.suggestedPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (() => {
            const costs = calculateRecipeCost(selectedRecipe);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl gradient-warm flex items-center justify-center">
                      <span className="text-2xl">{getCategoryEmoji(selectedRecipe.category)}</span>
                    </div>
                    <div>
                      <DialogTitle className="text-xl">{selectedRecipe.name}</DialogTitle>
                      <Badge variant="secondary" className="mt-1">{selectedRecipe.category}</Badge>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
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
                          <span>{costs.elaborationTime.preparation} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Horneado
                          </span>
                          <span>{costs.elaborationTime.baking} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Palette className="w-3 h-3" /> Decoración
                          </span>
                          <span>{costs.elaborationTime.decoration} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Package className="w-3 h-3" /> Empaque
                          </span>
                          <span>{costs.elaborationTime.packaging} min</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t text-lg">
                          <span>Tiempo total</span>
                          <span className="text-primary">{costs.totalProductHours.toFixed(2)} horas</span>
                        </div>
                      </div>
                      {costs.totalProductHours === 0 && (
                        <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Agrega tiempos de elaboración para un cálculo preciso</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Desglose de costos */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Desglose de costos
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Costo total de la receta (ingredientes)</span>
                          <span>{formatCurrency(costs.ingredientsCost)}</span>
                        </div>

                        {/* Mano de obra */}
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Costo por hora de mano de obra:</span>
                            <span>{formatCurrency(costs.laborCostPerHour)}/h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mano de obra total ({costs.totalProductHours.toFixed(2)}h × {formatCurrency(costs.laborCostPerHour)})</span>
                            <span>{formatCurrency(costs.laborFinalCost)}</span>
                          </div>
                        </div>

                        {/* Gastos indirectos */}
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Costo por hora de gastos indirectos:</span>
                            <span>{formatCurrency(costs.indirectCostPerHour)}/h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gastos indirectos total ({costs.totalProductHours.toFixed(2)}h × {formatCurrency(costs.indirectCostPerHour)})</span>
                            <span>{formatCurrency(costs.indirectFinalCost)}</span>
                          </div>
                        </div>

                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Extra del producto</span>
                          <span>{formatCurrency(costs.extrasCost)}</span>
                        </div>
                        {costs.decorationHours > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mano de obra extra decoración ({costs.decorationHours}h)</span>
                            <span>{formatCurrency(costs.laborDecorationCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Costo base del producto</span>
                          <span>{formatCurrency(costs.baseCost)}</span>
                        </div>
                        <div className="flex justify-between text-amber-600">
                          <span>Merma (5%)</span>
                          <span>+{formatCurrency(costs.wasteCost)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t text-lg">
                          <span>Costo total con merma</span>
                          <span className="text-primary">{formatCurrency(costs.totalCost)}</span>
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
                          <span className="text-sm text-muted-foreground">Margen configurado:</span>
                          <span className="text-2xl font-bold text-caramel">{costs.marginPercentage}%</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-caramel/30">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Precio sugerido de venta</p>
                          <p className="text-4xl font-bold text-foreground">
                            {formatCurrency(costs.suggestedPrice)}
                          </p>
                          <p className="text-sm text-success mt-2">
                            Ganancia: {formatCurrency(costs.profit)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Fórmula: Costo ÷ (1 − margen)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRecipe(null);
                        navigate(`/calculator?edit=${selectedRecipe.id}`);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="warm"
                      className="flex-1"
                      onClick={() => setSelectedRecipe(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!recipeToDelete} onOpenChange={() => setRecipeToDelete(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará "{recipeToDelete?.name}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}

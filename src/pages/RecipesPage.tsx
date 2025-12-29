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
  X,
  Flame,
  Package,
  Zap
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
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { toast } from '@/hooks/use-toast';

export default function RecipesPage() {
  const navigate = useNavigate();
  const { recipes, settings, calculateRecipeCost, deleteRecipe } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

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
                  {/* Price Summary */}
                  <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Precio sugerido</p>
                        <p className="text-3xl font-bold text-success mt-1">
                          {formatCurrency(costs.suggestedPrice)}
                        </p>
                        <p className="text-sm text-success mt-1">
                          Ganancia: {formatCurrency(costs.profit)} ({selectedRecipe.marginPercentage}%)
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Desglose de costos
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-caramel" />
                          Ingredientes
                        </span>
                        <span className="font-medium">{formatCurrency(costs.ingredientsCost)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-primary" />
                          Gastos indirectos
                        </span>
                        <span className="font-medium">{formatCurrency(costs.indirectCost)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-primary/10 rounded-lg font-bold">
                        <span>Costo total</span>
                        <span>{formatCurrency(costs.totalCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients List */}
                  {selectedRecipe.ingredients.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        Ingredientes ({selectedRecipe.ingredients.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedRecipe.ingredients.map((ing) => (
                          <div key={ing.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">
                              {ing.name} ({ing.quantityUsed} {ing.unit})
                            </span>
                            <span>{formatCurrency(ing.pricePerUnit * ing.quantityUsed)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indirect Costs */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4" />
                      Gastos indirectos
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedRecipe.indirectCosts.gas > 0 && (
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Gas</span>
                          <span>{formatCurrency(selectedRecipe.indirectCosts.gas)}</span>
                        </div>
                      )}
                      {selectedRecipe.indirectCosts.electricity > 0 && (
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Luz</span>
                          <span>{formatCurrency(selectedRecipe.indirectCosts.electricity)}</span>
                        </div>
                      )}
                      {selectedRecipe.indirectCosts.packaging > 0 && (
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Empaque</span>
                          <span>{formatCurrency(selectedRecipe.indirectCosts.packaging)}</span>
                        </div>
                      )}
                      {selectedRecipe.indirectCosts.labor > 0 && (
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Mano de obra</span>
                          <span>{formatCurrency(selectedRecipe.indirectCosts.labor)}</span>
                        </div>
                      )}
                      {selectedRecipe.indirectCosts.other > 0 && (
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Otros</span>
                          <span>{formatCurrency(selectedRecipe.indirectCosts.other)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setRecipeToDelete(selectedRecipe)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
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

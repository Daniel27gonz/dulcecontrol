import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';

const RecipesPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { recipes, settings, calculateRecipeCost, deleteRecipe } = useApp();
  const { toast } = useToast();

  const handleDelete = (id: string, name: string) => {
    deleteRecipe(id);
    toast({ title: 'Receta eliminada', description: `"${name}" ha sido eliminada` });
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      torta: '🎂',
      cupcake: '🧁',
      brownie: '🍫',
      galleta: '🍪',
      postre_vaso: '🥛',
      pie: '🥧',
      otro: '🍰',
    };
    return emojis[category] || '🍰';
  };

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border p-4 pt-10 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Recetas</h1>
            <p className="text-sm text-muted-foreground">{recipes.length} recetas guardadas</p>
          </div>
          <Button onClick={() => navigate('/calculator')} size="sm" variant="warm">
            <Plus className="w-4 h-4" />
            Nueva
          </Button>
        </div>
      </div>

      <div className="p-4">
        {recipes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <span className="text-4xl block mb-4">📝</span>
              <h3 className="font-bold text-foreground mb-2">Sin recetas</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Crea tu primera receta para calcular costos y precios
              </p>
              <Button onClick={() => navigate('/calculator')} variant="warm">
                <Plus className="w-4 h-4" />
                Crear primera receta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe, i) => {
              const costs = calculateRecipeCost(recipe);
              return (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Category emoji */}
                        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                          {getCategoryEmoji(recipe.category)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate">{recipe.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {recipe.category.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {recipe.ingredients.length} ingredientes • {recipe.marginPercentage}% margen
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-success">
                            {settings.currencySymbol}{costs.suggestedPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Costo: {settings.currencySymbol}{costs.totalCost.toFixed(2)}
                          </p>
                          <p className="text-xs text-caramel font-medium">
                            +{settings.currencySymbol}{costs.profit.toFixed(2)} ganancia
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          onClick={() => handleDelete(recipe.id, recipe.name)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
});

RecipesPage.displayName = 'RecipesPage';

export default RecipesPage;

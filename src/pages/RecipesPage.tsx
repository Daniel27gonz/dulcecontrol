import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';

export default function RecipesPage() {
  const navigate = useNavigate();
  const { recipes, settings, calculateRecipeCost, deleteRecipe } = useApp();

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Mis Recetas" />

      <div className="p-4">
        <div className="flex items-center justify-end mb-4">
          <Button onClick={() => navigate('/calculator')} size="sm" variant="warm">
            <Plus className="w-4 h-4 mr-1" />
            Nueva receta
          </Button>
        </div>

        {recipes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <span className="text-4xl block mb-4">📝</span>
              <p className="text-muted-foreground mb-4">Aún no tienes recetas</p>
              <Button onClick={() => navigate('/calculator')} variant="warm">
                <Plus className="w-4 h-4" /> Crear primera receta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe, i) => {
              const costs = calculateRecipeCost(recipe);
              return (
                <motion.div key={recipe.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{recipe.name}</p>
                          <p className="text-sm text-muted-foreground">{recipe.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success">{settings.currencySymbol}{costs.suggestedPrice}</p>
                          <p className="text-xs text-muted-foreground">Costo: {settings.currencySymbol}{costs.totalCost}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteRecipe(recipe.id)} className="mt-2 text-xs text-destructive flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
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
}

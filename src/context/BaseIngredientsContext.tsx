import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp, Ingredient } from './AppContext';
import { syncTransaction, deleteTransactionBySource } from '@/lib/transactionSync';

// Types
export interface BaseIngredient {
  id: string;
  name: string;
  category: string;
  purchaseUnit: 'kg' | 'g' | 'lb' | 'oz' | 'L' | 'ml' | 'pza' | 'paquete' | 'caja';
  presentationQuantity: number; // quantity bought in purchase unit
  presentationPrice: number;    // total paid
  quantityPurchased: number;    // legacy, always 1 for new records
  costPerBaseUnit: number;
  purchaseDate: string | null;
  lastUpdated: string;
}

export type IngredientCategory = 
  | 'harinas'
  | 'azucares'
  | 'lacteos'
  | 'huevos'
  | 'grasas'
  | 'chocolates'
  | 'levaduras'
  | 'esencias'
  | 'colorantes'
  | 'rellenos'
  | 'coberturas'
  | 'frutos_secos'
  | 'otros';

export const INGREDIENT_CATEGORIES: { id: IngredientCategory; name: string }[] = [
  { id: 'harinas', name: 'Harinas y Almidones' },
  { id: 'azucares', name: 'Azúcares y Endulzantes' },
  { id: 'lacteos', name: 'Lácteos' },
  { id: 'huevos', name: 'Huevos' },
  { id: 'grasas', name: 'Grasas y Aceites' },
  { id: 'chocolates', name: 'Chocolates y Cacao' },
  { id: 'levaduras', name: 'Levaduras y Polvos' },
  { id: 'esencias', name: 'Esencias y Saborizantes' },
  { id: 'colorantes', name: 'Colorantes' },
  { id: 'rellenos', name: 'Rellenos' },
  { id: 'coberturas', name: 'Coberturas y Decoración' },
  { id: 'frutos_secos', name: 'Frutos Secos' },
  { id: 'otros', name: 'Otros' },
];

export const PURCHASE_UNITS = [
  { id: 'kg', name: 'Kilogramo (kg)', baseUnit: 'g', multiplier: 1000 },
  { id: 'g', name: 'Gramo (g)', baseUnit: 'g', multiplier: 1 },
  { id: 'lb', name: 'Libra (lb)', baseUnit: 'g', multiplier: 453.592 },
  { id: 'oz', name: 'Onza (oz)', baseUnit: 'g', multiplier: 28.3495 },
  { id: 'L', name: 'Litro (L)', baseUnit: 'ml', multiplier: 1000 },
  { id: 'ml', name: 'Mililitro (ml)', baseUnit: 'ml', multiplier: 1 },
  { id: 'pza', name: 'Pieza', baseUnit: 'pieza', multiplier: 1 },
  { id: 'paquete', name: 'Paquete', baseUnit: 'paquete', multiplier: 1 },
  { id: 'caja', name: 'Caja', baseUnit: 'caja', multiplier: 1 },
] as const;

export type PurchaseUnit = typeof PURCHASE_UNITS[number]['id'];

export function getBaseUnit(purchaseUnit: string): string {
  const unit = PURCHASE_UNITS.find(u => u.id === purchaseUnit);
  return unit?.baseUnit || 'g';
}

export function getMultiplier(purchaseUnit: string): number {
  const unit = PURCHASE_UNITS.find(u => u.id === purchaseUnit);
  return unit?.multiplier || 1;
}

/**
 * Calculate cost per base unit.
 * Formula: totalPaid / (quantity × multiplier)
 * Examples:
 *   2 kg, $50 → 50 / (2 × 1000) = $0.025/g
 *   500 g, $28 → 28 / (500 × 1) = $0.056/g
 *   30 pza, $90 → 90 / (30 × 1) = $3/pza
 */
export function calculateCostPerBaseUnit(
  totalPaid: number,
  quantity: number,
  purchaseUnit: string
): number {
  if (totalPaid <= 0 || quantity <= 0) return 0;
  const multiplier = getMultiplier(purchaseUnit);
  return totalPaid / (quantity * multiplier);
}

// Default ingredients for new users
const DEFAULT_INGREDIENTS: Omit<BaseIngredient, 'id' | 'lastUpdated' | 'costPerBaseUnit' | 'purchaseDate'>[] = [
  { name: 'Harina de trigo', category: 'harinas', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 25, quantityPurchased: 1 },
  { name: 'Harina integral', category: 'harinas', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 35, quantityPurchased: 1 },
  { name: 'Maicena', category: 'harinas', purchaseUnit: 'g', presentationQuantity: 400, presentationPrice: 28, quantityPurchased: 1 },
  { name: 'Harina de almendra', category: 'harinas', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 180, quantityPurchased: 1 },
  { name: 'Azúcar blanca', category: 'azucares', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 30, quantityPurchased: 1 },
  { name: 'Azúcar glass', category: 'azucares', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 35, quantityPurchased: 1 },
  { name: 'Azúcar morena', category: 'azucares', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 40, quantityPurchased: 1 },
  { name: 'Miel', category: 'azucares', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 85, quantityPurchased: 1 },
  { name: 'Leche entera', category: 'lacteos', purchaseUnit: 'L', presentationQuantity: 1, presentationPrice: 28, quantityPurchased: 1 },
  { name: 'Leche condensada', category: 'lacteos', purchaseUnit: 'g', presentationQuantity: 397, presentationPrice: 45, quantityPurchased: 1 },
  { name: 'Crema de leche', category: 'lacteos', purchaseUnit: 'ml', presentationQuantity: 500, presentationPrice: 65, quantityPurchased: 1 },
  { name: 'Queso crema', category: 'lacteos', purchaseUnit: 'g', presentationQuantity: 190, presentationPrice: 48, quantityPurchased: 1 },
  { name: 'Huevo', category: 'huevos', purchaseUnit: 'pza', presentationQuantity: 30, presentationPrice: 90, quantityPurchased: 1 },
  { name: 'Mantequilla', category: 'grasas', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 55, quantityPurchased: 1 },
  { name: 'Aceite vegetal', category: 'grasas', purchaseUnit: 'L', presentationQuantity: 1, presentationPrice: 42, quantityPurchased: 1 },
  { name: 'Cacao en polvo', category: 'chocolates', purchaseUnit: 'g', presentationQuantity: 250, presentationPrice: 65, quantityPurchased: 1 },
  { name: 'Chocolate amargo', category: 'chocolates', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 120, quantityPurchased: 1 },
  { name: 'Polvo para hornear', category: 'levaduras', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 25, quantityPurchased: 1 },
  { name: 'Esencia de vainilla', category: 'esencias', purchaseUnit: 'ml', presentationQuantity: 120, presentationPrice: 45, quantityPurchased: 1 },
  { name: 'Dulce de leche', category: 'rellenos', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 75, quantityPurchased: 1 },
  { name: 'Fondant', category: 'coberturas', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 85, quantityPurchased: 1 },
  { name: 'Almendras', category: 'frutos_secos', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 95, quantityPurchased: 1 },
  { name: 'Sal', category: 'otros', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 15, quantityPurchased: 1 },
];

interface BaseIngredientsContextType {
  ingredients: BaseIngredient[];
  isLoading: boolean;
  addIngredient: (ingredient: Omit<BaseIngredient, 'id' | 'lastUpdated' | 'costPerBaseUnit'>) => Promise<BaseIngredient | null>;
  updateIngredient: (id: string, updates: Partial<Omit<BaseIngredient, 'costPerBaseUnit'>>) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  getIngredientsByCategory: (category: string) => BaseIngredient[];
  getIngredientById: (id: string) => BaseIngredient | undefined;
  findDuplicate: (name: string, excludeId?: string) => BaseIngredient | undefined;
  refreshIngredients: () => Promise<void>;
  getCurrentIngredientCost: (recipeIngredient: Ingredient) => number;
  calculateIngredientsWithCurrentPrices: (recipeIngredients: Ingredient[]) => { ingredient: Ingredient; currentCost: number }[];
}

const BaseIngredientsContext = createContext<BaseIngredientsContextType | undefined>(undefined);

export function BaseIngredientsProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<BaseIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useApp();

  const mapDbToIngredient = (ing: any): BaseIngredient => ({
    id: ing.id,
    name: ing.name,
    category: ing.category,
    purchaseUnit: ing.purchase_unit as BaseIngredient['purchaseUnit'],
    presentationQuantity: Number(ing.presentation_quantity),
    presentationPrice: Number(ing.presentation_price),
    quantityPurchased: Number(ing.quantity_purchased) || 1,
    // Use stored cost_per_base_unit from DB to preserve backward compatibility
    costPerBaseUnit: Number(ing.cost_per_base_unit),
    purchaseDate: ing.purchase_date || null,
    lastUpdated: ing.last_updated,
  });

  const loadIngredients = useCallback(async () => {
    if (!session?.user) {
      setIngredients([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('base_ingredients')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading ingredients:', error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setIngredients(data.map(mapDbToIngredient));
    } else {
      // Initialize with default ingredients for new users
      const defaultsToInsert = DEFAULT_INGREDIENTS.map(ing => {
        const costPerBaseUnit = calculateCostPerBaseUnit(ing.presentationPrice, ing.presentationQuantity, ing.purchaseUnit);
        return {
          user_id: session.user.id,
          name: ing.name,
          category: ing.category,
          purchase_unit: ing.purchaseUnit,
          presentation_quantity: ing.presentationQuantity,
          presentation_price: ing.presentationPrice,
          cost_per_base_unit: costPerBaseUnit,
          quantity_purchased: ing.quantityPurchased,
        };
      });

      const { data: insertedData, error: insertError } = await supabase
        .from('base_ingredients')
        .insert(defaultsToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting default ingredients:', insertError);
      } else if (insertedData) {
        setIngredients(insertedData.map(mapDbToIngredient));
      }
    }
    setIsLoading(false);
  }, [session?.user]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const addIngredient = useCallback(async (ingredient: Omit<BaseIngredient, 'id' | 'lastUpdated' | 'costPerBaseUnit'>): Promise<BaseIngredient | null> => {
    if (!session?.user) return null;

    // New formula: totalPaid / (quantity × multiplier)
    const costPerBaseUnit = calculateCostPerBaseUnit(
      ingredient.presentationPrice, // totalPaid
      ingredient.presentationQuantity, // quantity
      ingredient.purchaseUnit
    );

    const { data, error } = await supabase
      .from('base_ingredients')
      .insert([{
        user_id: session.user.id,
        name: ingredient.name,
        category: ingredient.category,
        purchase_unit: ingredient.purchaseUnit,
        presentation_quantity: ingredient.presentationQuantity,
        presentation_price: ingredient.presentationPrice,
        cost_per_base_unit: costPerBaseUnit,
        purchase_date: ingredient.purchaseDate || null,
        quantity_purchased: ingredient.quantityPurchased || 1,
      } as any])
      .select()
      .single();

    if (error) {
      console.error('Error adding ingredient:', error);
      return null;
    }

    const newIngredient = mapDbToIngredient(data);

    setIngredients(prev => [...prev, newIngredient].sort((a, b) => a.name.localeCompare(b.name)));

    // Sync with transactions - total paid is presentationPrice
    const totalAmount = ingredient.presentationPrice * (ingredient.quantityPurchased || 1);
    await syncTransaction({
      userId: session.user.id,
      sourceId: data.id,
      sourceType: 'ingredient',
      type: 'expense',
      description: ingredient.name,
      amount: totalAmount,
      category: 'ingredientes',
      date: ingredient.purchaseDate || new Date().toISOString(),
    });

    return newIngredient;
  }, [session?.user]);

  const updateIngredient = useCallback(async (id: string, updates: Partial<Omit<BaseIngredient, 'costPerBaseUnit'>>) => {
    if (!session?.user) return;

    const existing = ingredients.find(i => i.id === id);
    if (!existing) return;

    const updatedIng = { ...existing, ...updates };
    // Recalculate cost with new formula
    const costPerBaseUnit = calculateCostPerBaseUnit(
      updatedIng.presentationPrice,
      updatedIng.presentationQuantity,
      updatedIng.purchaseUnit
    );

    const { error } = await supabase
      .from('base_ingredients')
      .update({
        name: updatedIng.name,
        category: updatedIng.category,
        purchase_unit: updatedIng.purchaseUnit,
        presentation_quantity: updatedIng.presentationQuantity,
        presentation_price: updatedIng.presentationPrice,
        cost_per_base_unit: costPerBaseUnit,
        purchase_date: updatedIng.purchaseDate || null,
        quantity_purchased: updatedIng.quantityPurchased || 1,
        last_updated: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating ingredient:', error);
      return;
    }

    setIngredients(prev =>
      prev.map(ing => {
        if (ing.id !== id) return ing;
        return {
          ...updatedIng,
          costPerBaseUnit,
          lastUpdated: new Date().toISOString(),
        };
      }).sort((a, b) => a.name.localeCompare(b.name))
    );

    // Sync with transactions
    const totalAmount = updatedIng.presentationPrice * (updatedIng.quantityPurchased || 1);
    await syncTransaction({
      userId: session.user.id,
      sourceId: id,
      sourceType: 'ingredient',
      type: 'expense',
      description: updatedIng.name,
      amount: totalAmount,
      category: 'ingredientes',
      date: updatedIng.purchaseDate || new Date().toISOString(),
    });
  }, [session?.user, ingredients]);

  const deleteIngredient = useCallback(async (id: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('base_ingredients')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting ingredient:', error);
      return;
    }

    setIngredients(prev => prev.filter(ing => ing.id !== id));

    // Delete linked transaction
    await deleteTransactionBySource(session.user.id, id, 'ingredient');
  }, [session?.user]);

  const getIngredientsByCategory = useCallback((category: string) => {
    return ingredients.filter(ing => ing.category === category);
  }, [ingredients]);

  const getIngredientById = useCallback((id: string) => {
    return ingredients.find(ing => ing.id === id);
  }, [ingredients]);

  const findDuplicate = useCallback((name: string, excludeId?: string) => {
    const normalizedName = name.toLowerCase().trim();
    return ingredients.find(ing => 
      ing.name.toLowerCase().trim() === normalizedName && ing.id !== excludeId
    );
  }, [ingredients]);

  const refreshIngredients = useCallback(async () => {
    await loadIngredients();
  }, [loadIngredients]);

  const getCurrentIngredientCost = useCallback((recipeIngredient: Ingredient): number => {
    if (recipeIngredient.baseIngredientId) {
      const baseIngredient = ingredients.find(ing => ing.id === recipeIngredient.baseIngredientId);
      if (baseIngredient) {
        return baseIngredient.costPerBaseUnit * recipeIngredient.quantityUsed;
      }
    }
    const byName = ingredients.find(ing => 
      ing.name.toLowerCase().trim() === recipeIngredient.name.toLowerCase().trim()
    );
    if (byName) {
      return byName.costPerBaseUnit * recipeIngredient.quantityUsed;
    }
    return recipeIngredient.pricePerUnit * recipeIngredient.quantityUsed;
  }, [ingredients]);

  const calculateIngredientsWithCurrentPrices = useCallback((recipeIngredients: Ingredient[]) => {
    return recipeIngredients.map(ing => ({
      ingredient: ing,
      currentCost: getCurrentIngredientCost(ing),
    }));
  }, [getCurrentIngredientCost]);

  const value: BaseIngredientsContextType = {
    ingredients,
    isLoading,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientsByCategory,
    getIngredientById,
    findDuplicate,
    refreshIngredients,
    getCurrentIngredientCost,
    calculateIngredientsWithCurrentPrices,
  };

  return (
    <BaseIngredientsContext.Provider value={value}>
      {children}
    </BaseIngredientsContext.Provider>
  );
}

export function useBaseIngredients() {
  const context = useContext(BaseIngredientsContext);
  if (context === undefined) {
    throw new Error('useBaseIngredients must be used within a BaseIngredientsProvider');
  }
  return context;
}

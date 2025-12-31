import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Types
export interface BaseIngredient {
  id: string;
  name: string;
  category: string;
  purchaseUnit: 'kg' | 'g' | 'lb' | 'oz' | 'L' | 'ml' | 'pza' | 'paquete' | 'caja';
  presentationQuantity: number;
  presentationPrice: number;
  costPerBaseUnit: number; // Auto-calculated
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
  { id: 'pza', name: 'Pieza', baseUnit: 'pza', multiplier: 1 },
  { id: 'paquete', name: 'Paquete', baseUnit: 'pza', multiplier: 1 },
  { id: 'caja', name: 'Caja', baseUnit: 'pza', multiplier: 1 },
] as const;

export type PurchaseUnit = typeof PURCHASE_UNITS[number]['id'];

// Get base unit for a purchase unit
export function getBaseUnit(purchaseUnit: string): string {
  const unit = PURCHASE_UNITS.find(u => u.id === purchaseUnit);
  return unit?.baseUnit || 'g';
}

// Get multiplier for conversion to base unit
export function getMultiplier(purchaseUnit: string): number {
  const unit = PURCHASE_UNITS.find(u => u.id === purchaseUnit);
  return unit?.multiplier || 1;
}

// Calculate cost per base unit
export function calculateCostPerBaseUnit(
  presentationPrice: number,
  presentationQuantity: number,
  purchaseUnit: string
): number {
  if (presentationQuantity <= 0 || presentationPrice <= 0) return 0;
  
  const multiplier = getMultiplier(purchaseUnit);
  const totalBaseUnits = presentationQuantity * multiplier;
  
  return presentationPrice / totalBaseUnits;
}

// Default ingredients catalog with real prices
const DEFAULT_INGREDIENTS: BaseIngredient[] = [
  // Harinas
  { id: 'harina_trigo', name: 'Harina de trigo', category: 'harinas', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 25, costPerBaseUnit: 0.025, lastUpdated: new Date().toISOString() },
  { id: 'harina_integral', name: 'Harina integral', category: 'harinas', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 35, costPerBaseUnit: 0.035, lastUpdated: new Date().toISOString() },
  { id: 'maicena', name: 'Maicena', category: 'harinas', purchaseUnit: 'g', presentationQuantity: 400, presentationPrice: 28, costPerBaseUnit: 0.07, lastUpdated: new Date().toISOString() },
  { id: 'harina_almendra', name: 'Harina de almendra', category: 'harinas', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 180, costPerBaseUnit: 0.36, lastUpdated: new Date().toISOString() },
  
  // Azúcares
  { id: 'azucar_blanca', name: 'Azúcar blanca', category: 'azucares', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 30, costPerBaseUnit: 0.03, lastUpdated: new Date().toISOString() },
  { id: 'azucar_glass', name: 'Azúcar glass', category: 'azucares', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 35, costPerBaseUnit: 0.07, lastUpdated: new Date().toISOString() },
  { id: 'azucar_morena', name: 'Azúcar morena', category: 'azucares', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 40, costPerBaseUnit: 0.04, lastUpdated: new Date().toISOString() },
  { id: 'miel', name: 'Miel', category: 'azucares', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 85, costPerBaseUnit: 0.17, lastUpdated: new Date().toISOString() },
  { id: 'jarabe_maple', name: 'Jarabe de maple', category: 'azucares', purchaseUnit: 'ml', presentationQuantity: 250, presentationPrice: 120, costPerBaseUnit: 0.48, lastUpdated: new Date().toISOString() },
  
  // Lácteos
  { id: 'leche', name: 'Leche entera', category: 'lacteos', purchaseUnit: 'L', presentationQuantity: 1, presentationPrice: 28, costPerBaseUnit: 0.028, lastUpdated: new Date().toISOString() },
  { id: 'leche_condensada', name: 'Leche condensada', category: 'lacteos', purchaseUnit: 'g', presentationQuantity: 397, presentationPrice: 45, costPerBaseUnit: 0.113, lastUpdated: new Date().toISOString() },
  { id: 'crema_leche', name: 'Crema de leche', category: 'lacteos', purchaseUnit: 'ml', presentationQuantity: 500, presentationPrice: 65, costPerBaseUnit: 0.13, lastUpdated: new Date().toISOString() },
  { id: 'queso_crema', name: 'Queso crema', category: 'lacteos', purchaseUnit: 'g', presentationQuantity: 190, presentationPrice: 48, costPerBaseUnit: 0.253, lastUpdated: new Date().toISOString() },
  { id: 'leche_polvo', name: 'Leche en polvo', category: 'lacteos', purchaseUnit: 'g', presentationQuantity: 400, presentationPrice: 75, costPerBaseUnit: 0.188, lastUpdated: new Date().toISOString() },
  
  // Huevos
  { id: 'huevo', name: 'Huevo', category: 'huevos', purchaseUnit: 'pza', presentationQuantity: 30, presentationPrice: 90, costPerBaseUnit: 3, lastUpdated: new Date().toISOString() },
  { id: 'clara_huevo', name: 'Clara de huevo (líquida)', category: 'huevos', purchaseUnit: 'ml', presentationQuantity: 500, presentationPrice: 65, costPerBaseUnit: 0.13, lastUpdated: new Date().toISOString() },
  
  // Grasas
  { id: 'mantequilla', name: 'Mantequilla', category: 'grasas', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 55, costPerBaseUnit: 0.275, lastUpdated: new Date().toISOString() },
  { id: 'margarina', name: 'Margarina', category: 'grasas', purchaseUnit: 'g', presentationQuantity: 400, presentationPrice: 45, costPerBaseUnit: 0.113, lastUpdated: new Date().toISOString() },
  { id: 'aceite_vegetal', name: 'Aceite vegetal', category: 'grasas', purchaseUnit: 'L', presentationQuantity: 1, presentationPrice: 42, costPerBaseUnit: 0.042, lastUpdated: new Date().toISOString() },
  { id: 'manteca', name: 'Manteca vegetal', category: 'grasas', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 38, costPerBaseUnit: 0.076, lastUpdated: new Date().toISOString() },
  
  // Chocolates
  { id: 'cacao_polvo', name: 'Cacao en polvo', category: 'chocolates', purchaseUnit: 'g', presentationQuantity: 250, presentationPrice: 65, costPerBaseUnit: 0.26, lastUpdated: new Date().toISOString() },
  { id: 'chocolate_amargo', name: 'Chocolate amargo', category: 'chocolates', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 120, costPerBaseUnit: 0.24, lastUpdated: new Date().toISOString() },
  { id: 'chocolate_leche', name: 'Chocolate con leche', category: 'chocolates', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 95, costPerBaseUnit: 0.19, lastUpdated: new Date().toISOString() },
  { id: 'chocolate_blanco', name: 'Chocolate blanco', category: 'chocolates', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 100, costPerBaseUnit: 0.2, lastUpdated: new Date().toISOString() },
  { id: 'chispas_chocolate', name: 'Chispas de chocolate', category: 'chocolates', purchaseUnit: 'g', presentationQuantity: 300, presentationPrice: 55, costPerBaseUnit: 0.183, lastUpdated: new Date().toISOString() },
  
  // Levaduras
  { id: 'levadura_seca', name: 'Levadura seca', category: 'levaduras', purchaseUnit: 'g', presentationQuantity: 125, presentationPrice: 35, costPerBaseUnit: 0.28, lastUpdated: new Date().toISOString() },
  { id: 'polvo_hornear', name: 'Polvo para hornear', category: 'levaduras', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 25, costPerBaseUnit: 0.125, lastUpdated: new Date().toISOString() },
  { id: 'bicarbonato', name: 'Bicarbonato de sodio', category: 'levaduras', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 18, costPerBaseUnit: 0.09, lastUpdated: new Date().toISOString() },
  
  // Esencias
  { id: 'vainilla', name: 'Esencia de vainilla', category: 'esencias', purchaseUnit: 'ml', presentationQuantity: 120, presentationPrice: 45, costPerBaseUnit: 0.375, lastUpdated: new Date().toISOString() },
  { id: 'extracto_almendra', name: 'Extracto de almendra', category: 'esencias', purchaseUnit: 'ml', presentationQuantity: 60, presentationPrice: 55, costPerBaseUnit: 0.917, lastUpdated: new Date().toISOString() },
  
  // Colorantes
  { id: 'colorante_rojo', name: 'Colorante rojo', category: 'colorantes', purchaseUnit: 'ml', presentationQuantity: 30, presentationPrice: 35, costPerBaseUnit: 1.167, lastUpdated: new Date().toISOString() },
  { id: 'colorante_azul', name: 'Colorante azul', category: 'colorantes', purchaseUnit: 'ml', presentationQuantity: 30, presentationPrice: 35, costPerBaseUnit: 1.167, lastUpdated: new Date().toISOString() },
  { id: 'colorante_amarillo', name: 'Colorante amarillo', category: 'colorantes', purchaseUnit: 'ml', presentationQuantity: 30, presentationPrice: 35, costPerBaseUnit: 1.167, lastUpdated: new Date().toISOString() },
  
  // Rellenos
  { id: 'dulce_leche', name: 'Dulce de leche', category: 'rellenos', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 75, costPerBaseUnit: 0.15, lastUpdated: new Date().toISOString() },
  { id: 'mermelada', name: 'Mermelada', category: 'rellenos', purchaseUnit: 'g', presentationQuantity: 350, presentationPrice: 45, costPerBaseUnit: 0.129, lastUpdated: new Date().toISOString() },
  { id: 'nutella', name: 'Crema de avellanas', category: 'rellenos', purchaseUnit: 'g', presentationQuantity: 350, presentationPrice: 110, costPerBaseUnit: 0.314, lastUpdated: new Date().toISOString() },
  
  // Coberturas
  { id: 'fondant', name: 'Fondant', category: 'coberturas', purchaseUnit: 'g', presentationQuantity: 500, presentationPrice: 85, costPerBaseUnit: 0.17, lastUpdated: new Date().toISOString() },
  { id: 'sprinkles', name: 'Sprinkles', category: 'coberturas', purchaseUnit: 'g', presentationQuantity: 100, presentationPrice: 35, costPerBaseUnit: 0.35, lastUpdated: new Date().toISOString() },
  
  // Frutos secos
  { id: 'almendras', name: 'Almendras', category: 'frutos_secos', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 95, costPerBaseUnit: 0.475, lastUpdated: new Date().toISOString() },
  { id: 'nueces', name: 'Nueces', category: 'frutos_secos', purchaseUnit: 'g', presentationQuantity: 200, presentationPrice: 85, costPerBaseUnit: 0.425, lastUpdated: new Date().toISOString() },
  { id: 'coco_rallado', name: 'Coco rallado', category: 'frutos_secos', purchaseUnit: 'g', presentationQuantity: 150, presentationPrice: 35, costPerBaseUnit: 0.233, lastUpdated: new Date().toISOString() },
  
  // Otros
  { id: 'sal', name: 'Sal', category: 'otros', purchaseUnit: 'kg', presentationQuantity: 1, presentationPrice: 15, costPerBaseUnit: 0.015, lastUpdated: new Date().toISOString() },
  { id: 'gelatina', name: 'Gelatina sin sabor', category: 'otros', purchaseUnit: 'g', presentationQuantity: 30, presentationPrice: 25, costPerBaseUnit: 0.833, lastUpdated: new Date().toISOString() },
  { id: 'canela', name: 'Canela molida', category: 'otros', purchaseUnit: 'g', presentationQuantity: 50, presentationPrice: 28, costPerBaseUnit: 0.56, lastUpdated: new Date().toISOString() },
];

const STORAGE_KEY = 'dessert_app_base_ingredients_v2';

interface BaseIngredientsContextType {
  ingredients: BaseIngredient[];
  addIngredient: (ingredient: Omit<BaseIngredient, 'id' | 'lastUpdated' | 'costPerBaseUnit'>) => BaseIngredient;
  updateIngredient: (id: string, updates: Partial<Omit<BaseIngredient, 'costPerBaseUnit'>>) => void;
  deleteIngredient: (id: string) => void;
  getIngredientsByCategory: (category: string) => BaseIngredient[];
  getIngredientById: (id: string) => BaseIngredient | undefined;
  findDuplicate: (name: string, excludeId?: string) => BaseIngredient | undefined;
}

const BaseIngredientsContext = createContext<BaseIngredientsContextType | undefined>(undefined);

// Helper functions
const recalculateCostPerBaseUnit = (ingredient: Omit<BaseIngredient, 'costPerBaseUnit'>): BaseIngredient => {
  return {
    ...ingredient,
    costPerBaseUnit: calculateCostPerBaseUnit(
      ingredient.presentationPrice,
      ingredient.presentationQuantity,
      ingredient.purchaseUnit
    ),
  };
};

const loadIngredients = (): BaseIngredient[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all ingredients have correct structure and recalculate costs
        return parsed.map((ing: any) => {
          // Handle old format migration
          if (ing.pricePerUnit !== undefined && ing.presentationPrice === undefined) {
            return recalculateCostPerBaseUnit({
              id: ing.id,
              name: ing.name,
              category: ing.category,
              purchaseUnit: ing.unit === 'L' ? 'L' : ing.unit === 'ml' ? 'ml' : ing.unit === 'pza' ? 'pza' : 'g',
              presentationQuantity: 1000,
              presentationPrice: ing.pricePerUnit * 1000,
              lastUpdated: ing.lastUpdated || new Date().toISOString(),
            });
          }
          return recalculateCostPerBaseUnit(ing);
        });
      }
    }
    // If no stored data or empty, return defaults with recalculated costs
    return DEFAULT_INGREDIENTS.map(ing => recalculateCostPerBaseUnit(ing));
  } catch (error) {
    console.error('Error loading base ingredients:', error);
    return DEFAULT_INGREDIENTS.map(ing => recalculateCostPerBaseUnit(ing));
  }
};

const saveIngredients = (ingredients: BaseIngredient[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
  } catch (error) {
    console.error('Error saving base ingredients:', error);
  }
};

export function BaseIngredientsProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<BaseIngredient[]>(() => loadIngredients());

  // Save to localStorage whenever ingredients change
  useEffect(() => {
    saveIngredients(ingredients);
  }, [ingredients]);

  const addIngredient = useCallback((ingredient: Omit<BaseIngredient, 'id' | 'lastUpdated' | 'costPerBaseUnit'>): BaseIngredient => {
    const newIngredient = recalculateCostPerBaseUnit({
      ...ingredient,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date().toISOString(),
    });
    setIngredients(prev => [...prev, newIngredient]);
    return newIngredient;
  }, []);

  const updateIngredient = useCallback((id: string, updates: Partial<Omit<BaseIngredient, 'costPerBaseUnit'>>) => {
    setIngredients(prev =>
      prev.map(ing => {
        if (ing.id !== id) return ing;
        const updatedIng = { 
          ...ing, 
          ...updates, 
          lastUpdated: new Date().toISOString() 
        };
        return recalculateCostPerBaseUnit(updatedIng);
      })
    );
  }, []);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  }, []);

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

  const value: BaseIngredientsContextType = {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientsByCategory,
    getIngredientById,
    findDuplicate,
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

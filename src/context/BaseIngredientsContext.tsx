import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Types
export interface BaseIngredient {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string;
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

// Default ingredients catalog
const DEFAULT_INGREDIENTS: BaseIngredient[] = [
  // Harinas
  { id: 'harina_trigo', name: 'Harina de trigo', unit: 'kg', pricePerUnit: 0, category: 'harinas', lastUpdated: new Date().toISOString() },
  { id: 'harina_integral', name: 'Harina integral', unit: 'kg', pricePerUnit: 0, category: 'harinas', lastUpdated: new Date().toISOString() },
  { id: 'maicena', name: 'Maicena', unit: 'kg', pricePerUnit: 0, category: 'harinas', lastUpdated: new Date().toISOString() },
  { id: 'harina_almendra', name: 'Harina de almendra', unit: 'kg', pricePerUnit: 0, category: 'harinas', lastUpdated: new Date().toISOString() },
  
  // Azúcares
  { id: 'azucar_blanca', name: 'Azúcar blanca', unit: 'kg', pricePerUnit: 0, category: 'azucares', lastUpdated: new Date().toISOString() },
  { id: 'azucar_glass', name: 'Azúcar glass', unit: 'kg', pricePerUnit: 0, category: 'azucares', lastUpdated: new Date().toISOString() },
  { id: 'azucar_morena', name: 'Azúcar morena', unit: 'kg', pricePerUnit: 0, category: 'azucares', lastUpdated: new Date().toISOString() },
  { id: 'miel', name: 'Miel', unit: 'kg', pricePerUnit: 0, category: 'azucares', lastUpdated: new Date().toISOString() },
  { id: 'jarabe_maple', name: 'Jarabe de maple', unit: 'L', pricePerUnit: 0, category: 'azucares', lastUpdated: new Date().toISOString() },
  
  // Lácteos
  { id: 'leche', name: 'Leche entera', unit: 'L', pricePerUnit: 0, category: 'lacteos', lastUpdated: new Date().toISOString() },
  { id: 'leche_condensada', name: 'Leche condensada', unit: 'kg', pricePerUnit: 0, category: 'lacteos', lastUpdated: new Date().toISOString() },
  { id: 'crema_leche', name: 'Crema de leche', unit: 'L', pricePerUnit: 0, category: 'lacteos', lastUpdated: new Date().toISOString() },
  { id: 'queso_crema', name: 'Queso crema', unit: 'kg', pricePerUnit: 0, category: 'lacteos', lastUpdated: new Date().toISOString() },
  { id: 'leche_polvo', name: 'Leche en polvo', unit: 'kg', pricePerUnit: 0, category: 'lacteos', lastUpdated: new Date().toISOString() },
  
  // Huevos
  { id: 'huevo', name: 'Huevo', unit: 'pza', pricePerUnit: 0, category: 'huevos', lastUpdated: new Date().toISOString() },
  { id: 'clara_huevo', name: 'Clara de huevo', unit: 'kg', pricePerUnit: 0, category: 'huevos', lastUpdated: new Date().toISOString() },
  { id: 'yema_huevo', name: 'Yema de huevo', unit: 'kg', pricePerUnit: 0, category: 'huevos', lastUpdated: new Date().toISOString() },
  
  // Grasas
  { id: 'mantequilla', name: 'Mantequilla', unit: 'kg', pricePerUnit: 0, category: 'grasas', lastUpdated: new Date().toISOString() },
  { id: 'margarina', name: 'Margarina', unit: 'kg', pricePerUnit: 0, category: 'grasas', lastUpdated: new Date().toISOString() },
  { id: 'aceite_vegetal', name: 'Aceite vegetal', unit: 'L', pricePerUnit: 0, category: 'grasas', lastUpdated: new Date().toISOString() },
  { id: 'manteca', name: 'Manteca', unit: 'kg', pricePerUnit: 0, category: 'grasas', lastUpdated: new Date().toISOString() },
  
  // Chocolates
  { id: 'cacao_polvo', name: 'Cacao en polvo', unit: 'kg', pricePerUnit: 0, category: 'chocolates', lastUpdated: new Date().toISOString() },
  { id: 'chocolate_amargo', name: 'Chocolate amargo', unit: 'kg', pricePerUnit: 0, category: 'chocolates', lastUpdated: new Date().toISOString() },
  { id: 'chocolate_leche', name: 'Chocolate con leche', unit: 'kg', pricePerUnit: 0, category: 'chocolates', lastUpdated: new Date().toISOString() },
  { id: 'chocolate_blanco', name: 'Chocolate blanco', unit: 'kg', pricePerUnit: 0, category: 'chocolates', lastUpdated: new Date().toISOString() },
  { id: 'chispas_chocolate', name: 'Chispas de chocolate', unit: 'kg', pricePerUnit: 0, category: 'chocolates', lastUpdated: new Date().toISOString() },
  
  // Levaduras
  { id: 'levadura_seca', name: 'Levadura seca', unit: 'kg', pricePerUnit: 0, category: 'levaduras', lastUpdated: new Date().toISOString() },
  { id: 'levadura_fresca', name: 'Levadura fresca', unit: 'kg', pricePerUnit: 0, category: 'levaduras', lastUpdated: new Date().toISOString() },
  { id: 'polvo_hornear', name: 'Polvo para hornear', unit: 'kg', pricePerUnit: 0, category: 'levaduras', lastUpdated: new Date().toISOString() },
  { id: 'bicarbonato', name: 'Bicarbonato de sodio', unit: 'kg', pricePerUnit: 0, category: 'levaduras', lastUpdated: new Date().toISOString() },
  
  // Esencias
  { id: 'vainilla', name: 'Esencia de vainilla', unit: 'L', pricePerUnit: 0, category: 'esencias', lastUpdated: new Date().toISOString() },
  { id: 'extracto_almendra', name: 'Extracto de almendra', unit: 'L', pricePerUnit: 0, category: 'esencias', lastUpdated: new Date().toISOString() },
  { id: 'ralladura_limon', name: 'Ralladura de limón', unit: 'kg', pricePerUnit: 0, category: 'esencias', lastUpdated: new Date().toISOString() },
  { id: 'ralladura_naranja', name: 'Ralladura de naranja', unit: 'kg', pricePerUnit: 0, category: 'esencias', lastUpdated: new Date().toISOString() },
  
  // Colorantes
  { id: 'colorante_rojo', name: 'Colorante rojo', unit: 'mL', pricePerUnit: 0, category: 'colorantes', lastUpdated: new Date().toISOString() },
  { id: 'colorante_azul', name: 'Colorante azul', unit: 'mL', pricePerUnit: 0, category: 'colorantes', lastUpdated: new Date().toISOString() },
  { id: 'colorante_amarillo', name: 'Colorante amarillo', unit: 'mL', pricePerUnit: 0, category: 'colorantes', lastUpdated: new Date().toISOString() },
  { id: 'colorante_verde', name: 'Colorante verde', unit: 'mL', pricePerUnit: 0, category: 'colorantes', lastUpdated: new Date().toISOString() },
  
  // Rellenos
  { id: 'dulce_leche', name: 'Dulce de leche', unit: 'kg', pricePerUnit: 0, category: 'rellenos', lastUpdated: new Date().toISOString() },
  { id: 'mermelada', name: 'Mermelada', unit: 'kg', pricePerUnit: 0, category: 'rellenos', lastUpdated: new Date().toISOString() },
  { id: 'nutella', name: 'Crema de avellanas', unit: 'kg', pricePerUnit: 0, category: 'rellenos', lastUpdated: new Date().toISOString() },
  { id: 'crema_pastelera', name: 'Crema pastelera (polvo)', unit: 'kg', pricePerUnit: 0, category: 'rellenos', lastUpdated: new Date().toISOString() },
  
  // Coberturas
  { id: 'fondant', name: 'Fondant', unit: 'kg', pricePerUnit: 0, category: 'coberturas', lastUpdated: new Date().toISOString() },
  { id: 'glase_real', name: 'Glasé real (polvo)', unit: 'kg', pricePerUnit: 0, category: 'coberturas', lastUpdated: new Date().toISOString() },
  { id: 'sprinkles', name: 'Sprinkles', unit: 'kg', pricePerUnit: 0, category: 'coberturas', lastUpdated: new Date().toISOString() },
  { id: 'perlas_azucar', name: 'Perlas de azúcar', unit: 'kg', pricePerUnit: 0, category: 'coberturas', lastUpdated: new Date().toISOString() },
  
  // Frutos secos
  { id: 'almendras', name: 'Almendras', unit: 'kg', pricePerUnit: 0, category: 'frutos_secos', lastUpdated: new Date().toISOString() },
  { id: 'nueces', name: 'Nueces', unit: 'kg', pricePerUnit: 0, category: 'frutos_secos', lastUpdated: new Date().toISOString() },
  { id: 'avellanas', name: 'Avellanas', unit: 'kg', pricePerUnit: 0, category: 'frutos_secos', lastUpdated: new Date().toISOString() },
  { id: 'pistachos', name: 'Pistachos', unit: 'kg', pricePerUnit: 0, category: 'frutos_secos', lastUpdated: new Date().toISOString() },
  { id: 'coco_rallado', name: 'Coco rallado', unit: 'kg', pricePerUnit: 0, category: 'frutos_secos', lastUpdated: new Date().toISOString() },
  
  // Otros
  { id: 'sal', name: 'Sal', unit: 'kg', pricePerUnit: 0, category: 'otros', lastUpdated: new Date().toISOString() },
  { id: 'gelatina', name: 'Gelatina sin sabor', unit: 'kg', pricePerUnit: 0, category: 'otros', lastUpdated: new Date().toISOString() },
  { id: 'canela', name: 'Canela molida', unit: 'kg', pricePerUnit: 0, category: 'otros', lastUpdated: new Date().toISOString() },
];

const STORAGE_KEY = 'dessert_app_base_ingredients';

interface BaseIngredientsContextType {
  ingredients: BaseIngredient[];
  addIngredient: (ingredient: Omit<BaseIngredient, 'id' | 'lastUpdated'>) => void;
  updateIngredient: (id: string, updates: Partial<BaseIngredient>) => void;
  deleteIngredient: (id: string) => void;
  getIngredientsByCategory: (category: string) => BaseIngredient[];
  getIngredientById: (id: string) => BaseIngredient | undefined;
}

const BaseIngredientsContext = createContext<BaseIngredientsContextType | undefined>(undefined);

// Helper functions
const loadIngredients = (): BaseIngredient[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // If no stored data or empty, return defaults
    return DEFAULT_INGREDIENTS;
  } catch (error) {
    console.error('Error loading base ingredients:', error);
    return DEFAULT_INGREDIENTS;
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

  const addIngredient = useCallback((ingredient: Omit<BaseIngredient, 'id' | 'lastUpdated'>) => {
    const newIngredient: BaseIngredient = {
      ...ingredient,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date().toISOString(),
    };
    setIngredients(prev => [...prev, newIngredient]);
  }, []);

  const updateIngredient = useCallback((id: string, updates: Partial<BaseIngredient>) => {
    setIngredients(prev =>
      prev.map(ing =>
        ing.id === id
          ? { ...ing, ...updates, lastUpdated: new Date().toISOString() }
          : ing
      )
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

  const value: BaseIngredientsContextType = {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientsByCategory,
    getIngredientById,
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

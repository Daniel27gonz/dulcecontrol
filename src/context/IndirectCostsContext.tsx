import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  lastUpdated: string;
}

export interface Equipment {
  id: string;
  name: string;
  purchaseCost: number;
  usefulLifeMonths: number;
  lastUpdated: string;
}

interface IndirectCostsContextType {
  fixedExpenses: Expense[];
  variableExpenses: Expense[];
  equipment: Equipment[];
  addFixedExpense: (expense: Omit<Expense, 'id' | 'lastUpdated'>) => void;
  updateFixedExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => void;
  deleteFixedExpense: (id: string) => void;
  addVariableExpense: (expense: Omit<Expense, 'id' | 'lastUpdated'>) => void;
  updateVariableExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => void;
  deleteVariableExpense: (id: string) => void;
  addEquipment: (equip: Omit<Equipment, 'id' | 'lastUpdated'>) => void;
  updateEquipment: (id: string, updates: Partial<Omit<Equipment, 'id' | 'lastUpdated'>>) => void;
  deleteEquipment: (id: string) => void;
  getEquipmentDepreciation: (equip: Equipment) => number;
  getTotalDepreciation: () => number;
  getTotalFixedExpenses: () => number;
  getTotalFixedWithDepreciation: () => number;
  getTotalVariableExpenses: () => number;
  getTotalIndirectCosts: () => number;
}

const IndirectCostsContext = createContext<IndirectCostsContextType | undefined>(undefined);

// Gastos fijos precargados
const DEFAULT_FIXED_EXPENSES: Expense[] = [
  { id: '1', concept: 'Renta del local', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '2', concept: 'Parte proporcional de renta de casa', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '3', concept: 'Internet', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '4', concept: 'Teléfono', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '5', concept: 'Seguro', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '6', concept: 'Papelería administrativa', amount: 0, lastUpdated: new Date().toISOString() },
];

// Gastos variables precargados
const DEFAULT_VARIABLE_EXPENSES: Expense[] = [
  { id: '1', concept: 'Gas (uso del horno)', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '2', concept: 'Luz por producción', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '3', concept: 'Agua por producción', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '4', concept: 'Envíos / mensajería', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '5', concept: 'Gasolina para entregas', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '6', concept: 'Publicidad', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '7', concept: 'Empaques adicionales', amount: 0, lastUpdated: new Date().toISOString() },
  { id: '8', concept: 'Insumos de limpieza ligados a producción', amount: 0, lastUpdated: new Date().toISOString() },
];

const STORAGE_KEY_FIXED = 'dolce-calcolo-fixed-expenses';
const STORAGE_KEY_VARIABLE = 'dolce-calcolo-variable-expenses';
const STORAGE_KEY_EQUIPMENT = 'dolce-calcolo-equipment';

export function IndirectCostsProvider({ children }: { children: ReactNode }) {
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_FIXED);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_FIXED_EXPENSES;
      }
    }
    return DEFAULT_FIXED_EXPENSES;
  });

  const [variableExpenses, setVariableExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_VARIABLE);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_VARIABLE_EXPENSES;
      }
    }
    return DEFAULT_VARIABLE_EXPENSES;
  });

  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FIXED, JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VARIABLE, JSON.stringify(variableExpenses));
  }, [variableExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(equipment));
  }, [equipment]);

  // Funciones para gastos fijos
  const addFixedExpense = (expense: Omit<Expense, 'id' | 'lastUpdated'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString(),
    };
    setFixedExpenses(prev => [...prev, newExpense]);
  };

  const updateFixedExpense = (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => {
    setFixedExpenses(prev => prev.map(exp => 
      exp.id === id 
        ? { ...exp, ...updates, lastUpdated: new Date().toISOString() } 
        : exp
    ));
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // Funciones para gastos variables
  const addVariableExpense = (expense: Omit<Expense, 'id' | 'lastUpdated'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString(),
    };
    setVariableExpenses(prev => [...prev, newExpense]);
  };

  const updateVariableExpense = (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => {
    setVariableExpenses(prev => prev.map(exp => 
      exp.id === id 
        ? { ...exp, ...updates, lastUpdated: new Date().toISOString() } 
        : exp
    ));
  };

  const deleteVariableExpense = (id: string) => {
    setVariableExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // Funciones para equipos (depreciación)
  const addEquipment = (equip: Omit<Equipment, 'id' | 'lastUpdated'>) => {
    const newEquipment: Equipment = {
      ...equip,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString(),
    };
    setEquipment(prev => [...prev, newEquipment]);
  };

  const updateEquipment = (id: string, updates: Partial<Omit<Equipment, 'id' | 'lastUpdated'>>) => {
    setEquipment(prev => prev.map(eq => 
      eq.id === id 
        ? { ...eq, ...updates, lastUpdated: new Date().toISOString() } 
        : eq
    ));
  };

  const deleteEquipment = (id: string) => {
    setEquipment(prev => prev.filter(eq => eq.id !== id));
  };

  // Calcular depreciación de un equipo
  const getEquipmentDepreciation = (equip: Equipment): number => {
    if (equip.usefulLifeMonths <= 0 || equip.purchaseCost <= 0) return 0;
    return Math.round((equip.purchaseCost / equip.usefulLifeMonths) * 100) / 100;
  };

  // Total de depreciación mensual
  const getTotalDepreciation = (): number => {
    return Math.round(equipment.reduce((sum, eq) => sum + getEquipmentDepreciation(eq), 0) * 100) / 100;
  };

  // Cálculos totales
  const getTotalFixedExpenses = (): number => {
    return Math.round(fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) * 100) / 100;
  };

  // Gastos fijos + depreciación
  const getTotalFixedWithDepreciation = (): number => {
    return Math.round((getTotalFixedExpenses() + getTotalDepreciation()) * 100) / 100;
  };

  const getTotalVariableExpenses = (): number => {
    return Math.round(variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) * 100) / 100;
  };

  const getTotalIndirectCosts = (): number => {
    return Math.round((getTotalFixedWithDepreciation() + getTotalVariableExpenses()) * 100) / 100;
  };

  return (
    <IndirectCostsContext.Provider value={{
      fixedExpenses,
      variableExpenses,
      equipment,
      addFixedExpense,
      updateFixedExpense,
      deleteFixedExpense,
      addVariableExpense,
      updateVariableExpense,
      deleteVariableExpense,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      getEquipmentDepreciation,
      getTotalDepreciation,
      getTotalFixedExpenses,
      getTotalFixedWithDepreciation,
      getTotalVariableExpenses,
      getTotalIndirectCosts,
    }}>
      {children}
    </IndirectCostsContext.Provider>
  );
}

export function useIndirectCosts() {
  const context = useContext(IndirectCostsContext);
  if (!context) {
    throw new Error('useIndirectCosts must be used within an IndirectCostsProvider');
  }
  return context;
}

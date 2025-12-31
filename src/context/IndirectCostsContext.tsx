import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  lastUpdated: string;
}

interface IndirectCostsContextType {
  fixedExpenses: Expense[];
  variableExpenses: Expense[];
  addFixedExpense: (expense: Omit<Expense, 'id' | 'lastUpdated'>) => void;
  updateFixedExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => void;
  deleteFixedExpense: (id: string) => void;
  addVariableExpense: (expense: Omit<Expense, 'id' | 'lastUpdated'>) => void;
  updateVariableExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => void;
  deleteVariableExpense: (id: string) => void;
  getTotalFixedExpenses: () => number;
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

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FIXED, JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VARIABLE, JSON.stringify(variableExpenses));
  }, [variableExpenses]);

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

  // Cálculos totales
  const getTotalFixedExpenses = () => {
    return fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getTotalVariableExpenses = () => {
    return variableExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getTotalIndirectCosts = () => {
    return getTotalFixedExpenses() + getTotalVariableExpenses();
  };

  return (
    <IndirectCostsContext.Provider value={{
      fixedExpenses,
      variableExpenses,
      addFixedExpense,
      updateFixedExpense,
      deleteFixedExpense,
      addVariableExpense,
      updateVariableExpense,
      deleteVariableExpense,
      getTotalFixedExpenses,
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

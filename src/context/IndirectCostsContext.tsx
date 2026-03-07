import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';
import { syncTransaction, deleteTransactionBySource } from '@/lib/transactionSync';

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  paymentDate: string | null;
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
  isLoading: boolean;
  addFixedExpense: (expense: Omit<Expense, 'id' | 'lastUpdated'>) => Promise<void>;
  updateFixedExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  addVariableExpense: (expense: Omit<Expense, 'id' | 'lastUpdated'>) => Promise<void>;
  updateVariableExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => Promise<void>;
  deleteVariableExpense: (id: string) => Promise<void>;
  addEquipment: (equip: Omit<Equipment, 'id' | 'lastUpdated'>) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Omit<Equipment, 'id' | 'lastUpdated'>>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  getEquipmentDepreciation: (equip: Equipment) => number;
  getTotalDepreciation: () => number;
  getTotalFixedExpenses: () => number;
  getTotalFixedWithDepreciation: () => number;
  getTotalVariableExpenses: () => number;
  getTotalIndirectCosts: () => number;
  getTotalIndirectCostsLastMonth: () => number;
  refreshCosts: () => Promise<void>;
}

const IndirectCostsContext = createContext<IndirectCostsContextType | undefined>(undefined);

const DEFAULT_FIXED_EXPENSES = [
  'Renta del local',
  'Parte proporcional de renta de casa',
  'Internet',
  'Teléfono',
  'Seguro',
  'Papelería administrativa',
];

const DEFAULT_VARIABLE_EXPENSES = [
  'Gas (uso del horno)',
  'Luz por producción',
  'Agua por producción',
  'Envíos / mensajería',
  'Gasolina para entregas',
  'Publicidad',
  'Empaques adicionales',
  'Insumos de limpieza ligados a producción',
];

export function IndirectCostsProvider({ children }: { children: ReactNode }) {
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<Expense[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useApp();

  const loadCosts = useCallback(async () => {
    if (!session?.user) {
      setFixedExpenses([]);
      setVariableExpenses([]);
      setEquipment([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('indirect_costs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('concept', { ascending: true });

    if (error) {
      console.error('Error loading indirect costs:', error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const fixed: Expense[] = [];
      const variable: Expense[] = [];
      const equip: Equipment[] = [];

      data.forEach(item => {
        if (item.cost_type === 'fixed') {
          fixed.push({
            id: item.id,
            concept: item.concept,
            amount: Number(item.amount),
            paymentDate: item.payment_date || null,
            lastUpdated: item.last_updated,
          });
        } else if (item.cost_type === 'variable') {
          variable.push({
            id: item.id,
            concept: item.concept,
            amount: Number(item.amount),
            paymentDate: item.payment_date || null,
            lastUpdated: item.last_updated,
          });
        } else if (item.cost_type === 'equipment') {
          equip.push({
            id: item.id,
            name: item.concept,
            purchaseCost: Number(item.purchase_cost || 0),
            usefulLifeMonths: Number(item.useful_life_months || 0),
            lastUpdated: item.last_updated,
          });
        }
      });

      setFixedExpenses(fixed);
      setVariableExpenses(variable);
      setEquipment(equip);
    } else {
      const defaultsToInsert = [
        ...DEFAULT_FIXED_EXPENSES.map(concept => ({
          user_id: session.user.id,
          cost_type: 'fixed',
          concept,
          amount: 0,
        })),
        ...DEFAULT_VARIABLE_EXPENSES.map(concept => ({
          user_id: session.user.id,
          cost_type: 'variable',
          concept,
          amount: 0,
        })),
      ];

      const { data: insertedData, error: insertError } = await supabase
        .from('indirect_costs')
        .insert(defaultsToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting default costs:', insertError);
      } else if (insertedData) {
        const fixed: Expense[] = [];
        const variable: Expense[] = [];

        insertedData.forEach(item => {
          if (item.cost_type === 'fixed') {
            fixed.push({
              id: item.id,
              concept: item.concept,
              amount: Number(item.amount),
              paymentDate: item.payment_date || null,
              lastUpdated: item.last_updated,
            });
          } else if (item.cost_type === 'variable') {
            variable.push({
              id: item.id,
              concept: item.concept,
              amount: Number(item.amount),
              paymentDate: item.payment_date || null,
              lastUpdated: item.last_updated,
            });
          }
        });

        setFixedExpenses(fixed);
        setVariableExpenses(variable);
      }
    }
    setIsLoading(false);
  }, [session?.user]);

  useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  // Helper to sync expense with transactions
  const syncExpenseTransaction = useCallback(async (expense: { id: string; concept: string; amount: number; paymentDate: string | null }, costType: string) => {
    if (!session?.user || expense.amount <= 0) return;
    await syncTransaction({
      userId: session.user.id,
      sourceId: expense.id,
      sourceType: 'indirect_cost',
      type: 'expense',
      description: `Gasto: ${expense.concept}`,
      amount: expense.amount,
      category: costType === 'fixed' ? 'gasto fijo' : 'gasto variable',
      date: expense.paymentDate || new Date().toISOString(),
    });
  }, [session?.user]);

  // Fixed Expenses
  const addFixedExpense = useCallback(async (expense: Omit<Expense, 'id' | 'lastUpdated'>) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('indirect_costs')
      .insert([{
        user_id: session.user.id,
        cost_type: 'fixed',
        concept: expense.concept,
        amount: expense.amount,
        payment_date: expense.paymentDate || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding fixed expense:', error);
      return;
    }

    setFixedExpenses(prev => [...prev, {
      id: data.id,
      concept: data.concept,
      amount: Number(data.amount),
      paymentDate: data.payment_date || null,
      lastUpdated: data.last_updated,
    }]);

    await syncExpenseTransaction({ id: data.id, concept: data.concept, amount: Number(data.amount), paymentDate: data.payment_date || null }, 'fixed');
  }, [session?.user, syncExpenseTransaction]);

  const updateFixedExpense = useCallback(async (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => {
    if (!session?.user) return;

    const updateData: Record<string, unknown> = { last_updated: new Date().toISOString() };
    if (updates.concept !== undefined) updateData.concept = updates.concept;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;

    const { error } = await supabase
      .from('indirect_costs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating fixed expense:', error);
      return;
    }

    const existing = fixedExpenses.find(e => e.id === id);
    const updated = { ...existing!, ...updates };

    setFixedExpenses(prev => prev.map(exp =>
      exp.id === id ? { ...exp, ...updates, lastUpdated: new Date().toISOString() } : exp
    ));

    await syncExpenseTransaction({ id, concept: updated.concept, amount: updated.amount, paymentDate: updated.paymentDate }, 'fixed');
  }, [session?.user, fixedExpenses, syncExpenseTransaction]);

  const deleteFixedExpense = useCallback(async (id: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('indirect_costs')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting fixed expense:', error);
      return;
    }

    setFixedExpenses(prev => prev.filter(exp => exp.id !== id));
    await deleteTransactionBySource(session.user.id, id, 'indirect_cost');
  }, [session?.user]);

  // Variable Expenses
  const addVariableExpense = useCallback(async (expense: Omit<Expense, 'id' | 'lastUpdated'>) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('indirect_costs')
      .insert([{
        user_id: session.user.id,
        cost_type: 'variable',
        concept: expense.concept,
        amount: expense.amount,
        payment_date: expense.paymentDate || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding variable expense:', error);
      return;
    }

    setVariableExpenses(prev => [...prev, {
      id: data.id,
      concept: data.concept,
      amount: Number(data.amount),
      paymentDate: data.payment_date || null,
      lastUpdated: data.last_updated,
    }]);

    await syncExpenseTransaction({ id: data.id, concept: data.concept, amount: Number(data.amount), paymentDate: data.payment_date || null }, 'variable');
  }, [session?.user, syncExpenseTransaction]);

  const updateVariableExpense = useCallback(async (id: string, updates: Partial<Omit<Expense, 'id' | 'lastUpdated'>>) => {
    if (!session?.user) return;

    const updateData: Record<string, unknown> = { last_updated: new Date().toISOString() };
    if (updates.concept !== undefined) updateData.concept = updates.concept;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;

    const { error } = await supabase
      .from('indirect_costs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating variable expense:', error);
      return;
    }

    const existing = variableExpenses.find(e => e.id === id);
    const updated = { ...existing!, ...updates };

    setVariableExpenses(prev => prev.map(exp =>
      exp.id === id ? { ...exp, ...updates, lastUpdated: new Date().toISOString() } : exp
    ));

    await syncExpenseTransaction({ id, concept: updated.concept, amount: updated.amount, paymentDate: updated.paymentDate }, 'variable');
  }, [session?.user, variableExpenses, syncExpenseTransaction]);

  const deleteVariableExpense = useCallback(async (id: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('indirect_costs')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting variable expense:', error);
      return;
    }

    setVariableExpenses(prev => prev.filter(exp => exp.id !== id));
    await deleteTransactionBySource(session.user.id, id, 'indirect_cost');
  }, [session?.user]);

  // Equipment
  const addEquipment = useCallback(async (equip: Omit<Equipment, 'id' | 'lastUpdated'>) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('indirect_costs')
      .insert([{
        user_id: session.user.id,
        cost_type: 'equipment',
        concept: equip.name,
        amount: 0,
        purchase_cost: equip.purchaseCost,
        useful_life_months: equip.usefulLifeMonths,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding equipment:', error);
      return;
    }

    setEquipment(prev => [...prev, {
      id: data.id,
      name: data.concept,
      purchaseCost: Number(data.purchase_cost || 0),
      usefulLifeMonths: Number(data.useful_life_months || 0),
      lastUpdated: data.last_updated,
    }]);
  }, [session?.user]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Omit<Equipment, 'id' | 'lastUpdated'>>) => {
    if (!session?.user) return;

    const updateData: Record<string, unknown> = { last_updated: new Date().toISOString() };
    if (updates.name !== undefined) updateData.concept = updates.name;
    if (updates.purchaseCost !== undefined) updateData.purchase_cost = updates.purchaseCost;
    if (updates.usefulLifeMonths !== undefined) updateData.useful_life_months = updates.usefulLifeMonths;

    const { error } = await supabase
      .from('indirect_costs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating equipment:', error);
      return;
    }

    setEquipment(prev => prev.map(eq =>
      eq.id === id ? { ...eq, ...updates, lastUpdated: new Date().toISOString() } : eq
    ));
  }, [session?.user]);

  const deleteEquipment = useCallback(async (id: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('indirect_costs')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting equipment:', error);
      return;
    }

    setEquipment(prev => prev.filter(eq => eq.id !== id));
  }, [session?.user]);

  // Calculations
  const getEquipmentDepreciation = useCallback((equip: Equipment): number => {
    if (equip.usefulLifeMonths <= 0 || equip.purchaseCost <= 0) return 0;
    return Math.round((equip.purchaseCost / equip.usefulLifeMonths) * 100) / 100;
  }, []);

  const getTotalDepreciation = useCallback((): number => {
    return Math.round(equipment.reduce((sum, eq) => sum + getEquipmentDepreciation(eq), 0) * 100) / 100;
  }, [equipment, getEquipmentDepreciation]);

  const getTotalFixedExpenses = useCallback((): number => {
    return Math.round(fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) * 100) / 100;
  }, [fixedExpenses]);

  const getTotalFixedWithDepreciation = useCallback((): number => {
    return Math.round((getTotalFixedExpenses() + getTotalDepreciation()) * 100) / 100;
  }, [getTotalFixedExpenses, getTotalDepreciation]);

  const getTotalVariableExpenses = useCallback((): number => {
    return Math.round(variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) * 100) / 100;
  }, [variableExpenses]);

  const getTotalIndirectCosts = useCallback((): number => {
    return Math.round((getTotalFixedWithDepreciation() + getTotalVariableExpenses()) * 100) / 100;
  }, [getTotalFixedWithDepreciation, getTotalVariableExpenses]);

  // Filter expenses by the last registered month (based on paymentDate)
  const getTotalIndirectCostsLastMonth = useCallback((): number => {
    const allExpenses = [...fixedExpenses, ...variableExpenses];
    const withDate = allExpenses.filter(e => e.paymentDate);
    
    if (withDate.length === 0) {
      // No dates, fallback to all + depreciation
      return getTotalIndirectCosts();
    }
    
    // Find the latest payment date
    const latestDate = withDate.reduce((latest, e) => {
      const d = new Date(e.paymentDate!);
      return d > latest ? d : latest;
    }, new Date(0));
    
    const latestYear = latestDate.getFullYear();
    const latestMonth = latestDate.getMonth();
    
    // Filter expenses to that month
    const filteredTotal = withDate
      .filter(e => {
        const d = new Date(e.paymentDate!);
        return d.getFullYear() === latestYear && d.getMonth() === latestMonth;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Add equipment depreciation (always applies monthly)
    return Math.round((filteredTotal + getTotalDepreciation()) * 100) / 100;
  }, [fixedExpenses, variableExpenses, getTotalIndirectCosts, getTotalDepreciation]);

  const refreshCosts = useCallback(async () => {
    await loadCosts();
  }, [loadCosts]);

  return (
    <IndirectCostsContext.Provider value={{
      fixedExpenses,
      variableExpenses,
      equipment,
      isLoading,
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
      getTotalIndirectCostsLastMonth,
      refreshCosts,
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

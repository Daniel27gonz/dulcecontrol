import { useMemo } from 'react';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useApp, Transaction } from '@/context/AppContext';
import { useBaseIngredients, INGREDIENT_CATEGORIES } from '@/context/BaseIngredientsContext';
import { useIndirectCosts } from '@/context/IndirectCostsContext';
import { useQuotations } from '@/context/QuotationsContext';

export interface MonthlyFinancials {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  monthOrders: any[];
  completedOrders: any[];
  monthQuotations: any[];
  incomeTransactions: Transaction[];
  expenseTransactions: Transaction[];
  monthTransactions: Transaction[];
  totalLaborCost: number;
  totalAnticipos: number;
  ingredientsByCategory: Record<string, number>;
  indirectByCategory: Record<string, number>;
  depreciationByEquipment: Record<string, number>;
  totalDepreciation: number;
  otherExpenses: Transaction[];
  totalOtherIncome: number;
}

export function useMonthlyFinancials(selectedMonth: Date): MonthlyFinancials {
  const { transactions, orders } = useApp();
  const { ingredients: baseIngredients } = useBaseIngredients();
  const { equipment, getEquipmentDepreciation, getTotalDepreciation } = useIndirectCosts();
  const { quotations } = useQuotations();

  return useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const isInMonth = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      } catch { return false; }
    };

    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => isInMonth(t.date));
    const incomeTransactions = monthTransactions.filter(t => t.type === 'income');
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpensesRaw = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Orders & quotations this month
    const monthOrders = orders.filter(o => isInMonth(o.createdAt));
    const completedOrders = monthOrders.filter(o => o.status === 'completed');
    const monthQuotations = quotations.filter(q => isInMonth(q.createdAt));

    // === GROUPED DATA ===

    // 1. Ingredients grouped by category
    const ingredientTransactions = expenseTransactions.filter(t => t.sourceType === 'ingredient');
    const ingredientsByCategory: Record<string, number> = {};
    ingredientTransactions.forEach(t => {
      const ingredient = baseIngredients.find(ing => ing.id === t.sourceId);
      const catId = ingredient?.category || 'otros';
      const catLabel = INGREDIENT_CATEGORIES.find(c => c.id === catId)?.name || catId;
      ingredientsByCategory[catLabel] = (ingredientsByCategory[catLabel] || 0) + t.amount;
    });

    // 2. Labor total
    const laborTransactions = expenseTransactions.filter(t => t.sourceType === 'worker');
    const totalLaborCost = laborTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 3. Indirect costs grouped by description (exclude depreciation)
    const indirectTransactions = expenseTransactions.filter(t => t.sourceType === 'indirect_cost' && t.category !== 'depreciación');
    const indirectByCategory: Record<string, number> = {};
    indirectTransactions.forEach(t => {
      indirectByCategory[t.description] = (indirectByCategory[t.description] || 0) + t.amount;
    });

    // 4. Equipment depreciation (recurring monthly, computed directly)
    const totalDepreciation = getTotalDepreciation();
    const depreciationByEquipment: Record<string, number> = {};
    equipment.forEach(eq => {
      const dep = getEquipmentDepreciation(eq);
      if (dep > 0) depreciationByEquipment[`Depreciación: ${eq.name}`] = dep;
    });

    // 5. Other manual transactions (no source)
    const otherExpenses = expenseTransactions.filter(t => !t.sourceType);

    // Combined expenses = transaction-based expenses + recurring depreciation (not in transactions)
    const depreciationAlreadyInTransactions = expenseTransactions
      .filter(t => t.category === 'depreciación')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = totalExpensesRaw - depreciationAlreadyInTransactions + totalDepreciation;

    // Profit
    const profit = totalIncome - totalExpenses;

    // Anticipos
    const anticipos = incomeTransactions.filter(t => t.description.toLowerCase().includes('anticipo'));
    const totalAnticipos = anticipos.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      profit,
      monthOrders,
      completedOrders,
      monthQuotations,
      incomeTransactions,
      expenseTransactions,
      monthTransactions,
      totalLaborCost,
      totalAnticipos,
      ingredientsByCategory,
      indirectByCategory,
      depreciationByEquipment,
      totalDepreciation,
      otherExpenses,
    };
  }, [transactions, orders, quotations, baseIngredients, selectedMonth, equipment, getEquipmentDepreciation, getTotalDepreciation]);
}

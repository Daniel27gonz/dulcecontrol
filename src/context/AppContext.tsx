import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Types
export interface Ingredient {
  id: string;
  baseIngredientId?: string; // Reference to master ingredient
  name: string;
  pricePerUnit: number;
  quantityUsed: number;
  unit: string;
}

export interface IndirectCost {
  gas: number;
  electricity: number;
  packaging: number;
  labor: number;
  other: number;
}

export interface RecipeElaborationTime {
  preparation: number; // minutos
  baking: number; // minutos
  decoration: number; // minutos
  packaging: number; // minutos
}

export interface RecipeExtra {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  image?: string;
  ingredients: Ingredient[];
  indirectCosts: IndirectCost;
  marginPercentage: number;
  portions?: number; // número de porciones
  elaborationTime?: RecipeElaborationTime; // tiempo de elaboración
  extras?: RecipeExtra[]; // extras del producto
  decorationHours?: number; // horas de mano de obra de decoración
  createdAt: string;
}

export interface OrderAdvance {
  id: string;
  amount: number;
  date: string;
}

export interface Order {
  id: string;
  clientName: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'in_progress' | 'completed' | 'paid' | 'cancelled';
  deliveryDate: string;
  paymentDate: string | null;
  advances: OrderAdvance[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  sourceId?: string | null;
  sourceType?: string | null;
}

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  hasCompletedOnboarding: boolean;
  hasCompletedRecipeTutorial: boolean;
  userName?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface AppContextType {
  // Auth
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // Data
  recipes: Recipe[];
  orders: Order[];
  transactions: Transaction[];
  settings: UserSettings;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Promise<void>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  calculateRecipeCost: (recipe: Recipe) => { ingredientsCost: number; indirectCost: number; totalCost: number; suggestedPrice: number; profit: number };
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getNetProfit: () => number;
  refreshData: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
  currency: 'USD',
  currencySymbol: '$',
  hasCompletedOnboarding: false,
  hasCompletedRecipeTutorial: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load user profile from database
  const loadUserProfile = async (userId: string, email: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      setUser({
        id: userId,
        name: profile.name,
        email: email,
      });
    }
  };

  // Load all user data from database
  const loadUserData = async (userId: string) => {
    // Load settings
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsData) {
      setSettings({
        currency: settingsData.currency,
        currencySymbol: settingsData.currency_symbol,
        hasCompletedOnboarding: settingsData.has_completed_onboarding,
        hasCompletedRecipeTutorial: settingsData.has_completed_recipe_tutorial,
        userName: user?.name,
      });
    }

    // Load recipes
    const { data: recipesData } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (recipesData) {
      setRecipes(recipesData.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        image: r.image || undefined,
        ingredients: (r.ingredients as unknown) as Ingredient[],
        indirectCosts: (r.indirect_costs as unknown) as IndirectCost,
        marginPercentage: Number(r.margin_percentage),
        portions: r.portions ?? 1,
        elaborationTime: (r.elaboration_time as unknown) as RecipeElaborationTime ?? { preparation: 0, baking: 0, decoration: 0, packaging: 0 },
        extras: (r.extras as unknown) as RecipeExtra[] ?? [],
        decorationHours: Number(r.decoration_hours ?? 0),
        createdAt: r.created_at,
      })));
    }

    // Load orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersData) {
      setOrders(ordersData.map(o => ({
        id: o.id,
        clientName: o.client_name,
        recipeId: o.recipe_id || '',
        recipeName: o.recipe_name,
        quantity: o.quantity,
        totalPrice: Number(o.total_price),
        status: o.status as Order['status'],
        deliveryDate: o.delivery_date,
        paymentDate: (o as any).payment_date || null,
        advances: ((o as any).advances || []) as OrderAdvance[],
        createdAt: o.created_at,
      })));
    }

    // Load transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (transactionsData) {
      // Build sets of valid source IDs for each source type
      const validSourceIds = new Set<string>();

      // Ingredients
      const { data: ingredientsData } = await supabase
        .from('base_ingredients')
        .select('id')
        .eq('user_id', userId);
      ingredientsData?.forEach(i => validSourceIds.add(`ingredient:${i.id}`));

      // Workers
      const { data: workersData } = await supabase
        .from('workers')
        .select('id')
        .eq('user_id', userId);
      workersData?.forEach(w => validSourceIds.add(`worker:${w.id}`));

      // Indirect costs (includes equipment)
      const { data: costsData } = await supabase
        .from('indirect_costs')
        .select('id')
        .eq('user_id', userId);
      costsData?.forEach(c => validSourceIds.add(`indirect_cost:${c.id}`));

      // Orders - only paid orders should have income transactions
      const validOrderIds = new Set<string>();
      const { data: ordersSourceData } = await supabase
        .from('orders')
        .select('id, advances, status')
        .eq('user_id', userId);
      ordersSourceData?.forEach(o => {
        validOrderIds.add(o.id);
        // Only paid orders should have payment transactions
        if (o.status === 'paid') {
          validSourceIds.add(`order:${o.id}`);
        }
        // Advances are valid regardless of status (unless order is cancelled)
        if (o.status !== 'cancelled') {
          const advances = (o.advances as any[]) || [];
          advances.forEach((a: any) => {
            if (a.id) validSourceIds.add(`order_advance:${a.id}`);
          });
        }
      });

      // Filter: keep only valid transactions
      const orphanIds: string[] = [];
      const validTransactions = transactionsData.filter(t => {
        // Transactions without source: these are either truly manual or legacy auto-generated
        // Remove legacy auto-generated ones (pattern: "Pedido:" or old system entries without source tracking)
        if (!t.source_id || !t.source_type) {
          const desc = (t.description || '').toLowerCase();
          // Remove legacy auto-generated entries that should have had source tracking
          if (desc.startsWith('pedido') || desc.startsWith('anticipo')) {
            orphanIds.push(t.id);
            return false;
          }
          return true; // keep truly manual transactions
        }
        const key = `${t.source_type}:${t.source_id}`;
        if (validSourceIds.has(key)) return true;
        orphanIds.push(t.id);
        return false;
      });

      // Delete orphans from DB in background
      if (orphanIds.length > 0) {
        console.log(`Cleaning up ${orphanIds.length} orphan transaction(s)`);
        for (const oid of orphanIds) {
          supabase.from('transactions').delete().eq('id', oid).eq('user_id', userId).then();
        }
      }

      setTransactions(validTransactions.map(t => ({
        id: t.id,
        type: t.type as Transaction['type'],
        description: t.description,
        amount: Number(t.amount),
        category: t.category,
        date: t.date,
        sourceId: t.source_id,
        sourceType: t.source_type,
      })));
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        
        if (newSession?.user) {
          // Defer data loading to avoid deadlock
          setTimeout(() => {
            loadUserProfile(newSession.user.id, newSession.user.email || '');
            loadUserData(newSession.user.id);
          }, 0);
        } else {
          setUser(null);
          setRecipes([]);
          setOrders([]);
          setTransactions([]);
          setSettings(defaultSettings);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        loadUserProfile(existingSession.user.id, existingSession.user.email || '');
        loadUserData(existingSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = async () => {
    if (session?.user) {
      await loadUserData(session.user.id);
    }
  };

  // Lightweight refresh that only reloads transactions from DB
  const refreshTransactions = async () => {
    if (!session?.user) return;
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false });

    if (transactionsData) {
      setTransactions(transactionsData.map(t => ({
        id: t.id,
        type: t.type as Transaction['type'],
        description: t.description,
        amount: Number(t.amount),
        category: t.category,
        date: t.date,
        sourceId: t.source_id,
        sourceType: t.source_type,
      })));
    }
  };

  // Auth functions
  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'Este correo ya está registrado' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Credenciales incorrectas' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Logout error (clearing locally):', error);
    }
  };

  // Recipe functions
  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('recipes')
      .insert([{
        user_id: session.user.id,
        name: recipe.name,
        category: recipe.category,
        image: recipe.image,
        ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
        indirect_costs: JSON.parse(JSON.stringify(recipe.indirectCosts)),
        margin_percentage: recipe.marginPercentage,
        portions: recipe.portions ?? 1,
        elaboration_time: JSON.parse(JSON.stringify(recipe.elaborationTime ?? { preparation: 0, baking: 0, decoration: 0, packaging: 0 })),
        extras: JSON.parse(JSON.stringify(recipe.extras ?? [])),
        decoration_hours: recipe.decorationHours ?? 0,
      }])
      .select()
      .single();

    if (data) {
      setRecipes(prev => [{
        id: data.id,
        name: data.name,
        category: data.category,
        image: data.image || undefined,
        ingredients: (data.ingredients as unknown) as Ingredient[],
        indirectCosts: (data.indirect_costs as unknown) as IndirectCost,
        marginPercentage: Number(data.margin_percentage),
        portions: data.portions ?? 1,
        elaborationTime: (data.elaboration_time as unknown) as RecipeElaborationTime ?? { preparation: 0, baking: 0, decoration: 0, packaging: 0 },
        extras: (data.extras as unknown) as RecipeExtra[] ?? [],
        decorationHours: Number(data.decoration_hours ?? 0),
        createdAt: data.created_at,
      }, ...prev]);
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    if (!session?.user) return;

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
    if (updates.indirectCosts !== undefined) updateData.indirect_costs = updates.indirectCosts;
    if (updates.marginPercentage !== undefined) updateData.margin_percentage = updates.marginPercentage;
    if (updates.portions !== undefined) updateData.portions = updates.portions;
    if (updates.elaborationTime !== undefined) updateData.elaboration_time = updates.elaborationTime;
    if (updates.extras !== undefined) updateData.extras = updates.extras;
    if (updates.decorationHours !== undefined) updateData.decoration_hours = updates.decorationHours;

    await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    setRecipes(prev =>
      prev.map(recipe => (recipe.id === id ? { ...recipe, ...updates } : recipe))
    );
  };

  const deleteRecipe = async (id: string) => {
    if (!session?.user) return;

    await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  // Order functions
  const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        client_name: order.clientName,
        recipe_id: order.recipeId || null,
        recipe_name: order.recipeName,
        quantity: order.quantity,
        total_price: order.totalPrice,
        status: order.status,
        delivery_date: order.deliveryDate,
      })
      .select()
      .single();

    if (data) {
      const newOrder: Order = {
        id: data.id,
        clientName: data.client_name,
        recipeId: data.recipe_id || '',
        recipeName: data.recipe_name,
        quantity: data.quantity,
        totalPrice: Number(data.total_price),
        status: data.status as Order['status'],
        deliveryDate: data.delivery_date,
        paymentDate: (data as any).payment_date || null,
        advances: ((data as any).advances || []) as OrderAdvance[],
        createdAt: data.created_at,
      };
      
      setOrders(prev => [newOrder, ...prev]);

      // Orders always start as 'pending' - income is registered when status changes to 'paid'
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    if (!session?.user) return;

    const existingOrder = orders.find(o => o.id === id);
    const updateData: Record<string, unknown> = {};
    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.recipeId !== undefined) updateData.recipe_id = updates.recipeId || null;
    if (updates.recipeName !== undefined) updateData.recipe_name = updates.recipeName;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.totalPrice !== undefined) updateData.total_price = updates.totalPrice;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.deliveryDate !== undefined) updateData.delivery_date = updates.deliveryDate;
    if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;
    if (updates.advances !== undefined) updateData.advances = updates.advances;

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    const updatedOrder = { ...existingOrder!, ...updates };

    setOrders(prev =>
      prev.map(order => (order.id === id ? { ...order, ...updates } : order))
    );

    // If status changed to paid, register the remaining balance as income
    if (updates.status === 'paid' && existingOrder?.status !== 'paid') {
      const { syncTransaction } = await import('@/lib/transactionSync');
      const paymentDate = updates.paymentDate || updatedOrder.paymentDate || new Date().toISOString();
      const totalAdvances = (updatedOrder.advances || []).reduce((sum: number, a: OrderAdvance) => sum + a.amount, 0);
      const remainingBalance = Math.max(0, updatedOrder.totalPrice - totalAdvances);

      if (remainingBalance > 0) {
        await syncTransaction({
          userId: session.user.id,
          sourceId: id,
          sourceType: 'order',
          type: 'income',
          description: `Pago de pedido: ${updatedOrder.recipeName} x${updatedOrder.quantity} - ${updatedOrder.clientName}`,
          amount: remainingBalance,
          category: 'pago de pedido',
          date: paymentDate,
        });
      }
    }

    // If status changed away from paid OR to cancelled, remove the payment transaction and advance transactions
    if (updates.status && (updates.status !== 'paid' && existingOrder?.status === 'paid') || updates.status === 'cancelled') {
      const { deleteTransactionBySource } = await import('@/lib/transactionSync');
      await deleteTransactionBySource(session.user.id, id, 'order');
      // If cancelled, also remove advance transactions
      if (updates.status === 'cancelled') {
        for (const advance of (updatedOrder.advances || [])) {
          await deleteTransactionBySource(session.user.id, advance.id, 'order_advance');
        }
      }
    }

    // If order is paid and amount changed, update the payment transaction
    if (updatedOrder.status === 'paid' && updates.totalPrice !== undefined && existingOrder?.status === 'paid') {
      const { syncTransaction } = await import('@/lib/transactionSync');
      const totalAdvances = (updatedOrder.advances || []).reduce((sum: number, a: OrderAdvance) => sum + a.amount, 0);
      const remainingBalance = Math.max(0, updatedOrder.totalPrice - totalAdvances);

      if (remainingBalance > 0) {
        await syncTransaction({
          userId: session.user.id,
          sourceId: id,
          sourceType: 'order',
          type: 'income',
          description: `Pago de pedido: ${updatedOrder.recipeName} x${updatedOrder.quantity} - ${updatedOrder.clientName}`,
          amount: remainingBalance,
          category: 'pago de pedido',
          date: updatedOrder.paymentDate || new Date().toISOString(),
        });
      }
    }

    // Sync advances with transactions
    if (updates.advances !== undefined) {
      const { syncTransaction, deleteTransactionBySource } = await import('@/lib/transactionSync');
      const previousAdvances = existingOrder?.advances || [];
      const newAdvances = updates.advances;

      // Delete removed advances
      for (const prev of previousAdvances) {
        if (!newAdvances.find(a => a.id === prev.id)) {
          await deleteTransactionBySource(session.user.id, prev.id, 'order_advance');
        }
      }

      // Sync current advances
      for (const advance of newAdvances) {
        await syncTransaction({
          userId: session.user.id,
          sourceId: advance.id,
          sourceType: 'order_advance' as any,
          type: 'income',
          description: `Anticipo: ${updatedOrder.recipeName} - ${updatedOrder.clientName}`,
          amount: advance.amount,
          category: 'anticipo de pedido',
          date: advance.date,
        });
      }
    }
  };

  const deleteOrder = async (id: string) => {
    if (!session?.user) return;

    const existingOrder = orders.find(o => o.id === id);

    await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    // Delete linked transaction if it was a paid order
    const { deleteTransactionBySource } = await import('@/lib/transactionSync');
    await deleteTransactionBySource(session.user.id, id, 'order');

    // Delete advance transactions
    if (existingOrder?.advances) {
      for (const advance of existingOrder.advances) {
        await deleteTransactionBySource(session.user.id, advance.id, 'order_advance');
      }
    }

    setOrders(prev => prev.filter(order => order.id !== id));
  };

  // Transaction functions
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
      })
      .select()
      .single();

    if (data) {
      setTransactions(prev => [{
        id: data.id,
        type: data.type as Transaction['type'],
        description: data.description,
        amount: Number(data.amount),
        category: data.category,
        date: data.date,
        sourceId: data.source_id,
        sourceType: data.source_type,
      }, ...prev]);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!session?.user) return;

    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Settings functions
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!session?.user) return;

    const updateData: Record<string, unknown> = {};
    if (newSettings.currency !== undefined) updateData.currency = newSettings.currency;
    if (newSettings.currencySymbol !== undefined) updateData.currency_symbol = newSettings.currencySymbol;
    if (newSettings.hasCompletedOnboarding !== undefined) updateData.has_completed_onboarding = newSettings.hasCompletedOnboarding;
    if (newSettings.hasCompletedRecipeTutorial !== undefined) updateData.has_completed_recipe_tutorial = newSettings.hasCompletedRecipeTutorial;

    // Update user_settings table
    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', session.user.id);
    }

    // If userName is being updated, also update the profiles table
    if (newSettings.userName !== undefined) {
      await supabase
        .from('profiles')
        .update({ name: newSettings.userName })
        .eq('user_id', session.user.id);

      // Update local user state
      setUser(prev => prev ? { ...prev, name: newSettings.userName! } : null);
    }

    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const calculateRecipeCost = (recipe: Recipe) => {
    const ingredientsCost = recipe.ingredients.reduce(
      (sum, ing) => sum + ing.pricePerUnit * ing.quantityUsed,
      0
    );

    const indirectCost = Object.values(recipe.indirectCosts).reduce((sum, cost) => sum + cost, 0);

    const totalCost = ingredientsCost + indirectCost;
    const marginMultiplier = 1 + recipe.marginPercentage / 100;
    const suggestedPrice = totalCost * marginMultiplier;
    const profit = suggestedPrice - totalCost;

    return {
      ingredientsCost: Math.round(ingredientsCost * 100) / 100,
      indirectCost: Math.round(indirectCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      profit: Math.round(profit * 100) / 100,
    };
  };

  const getTotalIncome = () => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getNetProfit = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isLoading,
        login,
        register,
        logout,
        recipes,
        orders,
        transactions,
        settings,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addOrder,
        updateOrder,
        deleteOrder,
        addTransaction,
        deleteTransaction,
        updateSettings,
        calculateRecipeCost,
        getTotalIncome,
        getTotalExpenses,
        getNetProfit,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

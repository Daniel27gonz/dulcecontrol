import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Types
export interface Ingredient {
  id: string;
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
  createdAt: string;
}

export interface Order {
  id: string;
  clientName: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deliveryDate: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
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
      setTransactions(transactionsData.map(t => ({
        id: t.id,
        type: t.type as Transaction['type'],
        description: t.description,
        amount: Number(t.amount),
        category: t.category,
        date: t.date,
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
    await supabase.auth.signOut();
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
        createdAt: data.created_at,
      };
      
      setOrders(prev => [newOrder, ...prev]);

      // Auto-add transaction for order income
      await addTransaction({
        type: 'income',
        description: `Pedido: ${order.recipeName} x${order.quantity}`,
        amount: order.totalPrice,
        category: 'ventas',
        date: new Date().toISOString(),
      });
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    if (!session?.user) return;

    const updateData: Record<string, unknown> = {};
    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.recipeId !== undefined) updateData.recipe_id = updates.recipeId || null;
    if (updates.recipeName !== undefined) updateData.recipe_name = updates.recipeName;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.totalPrice !== undefined) updateData.total_price = updates.totalPrice;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.deliveryDate !== undefined) updateData.delivery_date = updates.deliveryDate;

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    setOrders(prev =>
      prev.map(order => (order.id === id ? { ...order, ...updates } : order))
    );
  };

  const deleteOrder = async (id: string) => {
    if (!session?.user) return;

    await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

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

    await supabase
      .from('user_settings')
      .update(updateData)
      .eq('user_id', session.user.id);

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

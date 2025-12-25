import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In production, this would be hashed
  createdAt: string;
}

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

export interface Recipe {
  id: string;
  name: string;
  category: string;
  image?: string;
  ingredients: Ingredient[];
  indirectCosts: IndirectCost;
  marginPercentage: number;
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
  userName?: string;
}

interface AppContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  // Data
  recipes: Recipe[];
  orders: Order[];
  transactions: Transaction[];
  settings: UserSettings;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  calculateRecipeCost: (recipe: Recipe) => { ingredientsCost: number; indirectCost: number; totalCost: number; suggestedPrice: number; profit: number };
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getNetProfit: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  users: 'dessert_calc_users',
  currentUser: 'dessert_calc_current_user',
  recipes: 'dessert_calc_recipes',
  orders: 'dessert_calc_orders',
  transactions: 'dessert_calc_transactions',
  settings: 'dessert_calc_settings',
};

const defaultSettings: UserSettings = {
  currency: 'USD',
  currencySymbol: '$',
  hasCompletedOnboarding: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load data from localStorage on mount
  useEffect(() => {
    // Load current user session
    const currentUserEmail = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (currentUserEmail) {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]') as User[];
      const foundUser = users.find(u => u.email === currentUserEmail);
      if (foundUser) {
        setUser(foundUser);
        console.log('[Auth] Session restored for:', foundUser.email);
      }
    }

    const loadedRecipes = localStorage.getItem(STORAGE_KEYS.recipes);
    const loadedOrders = localStorage.getItem(STORAGE_KEYS.orders);
    const loadedTransactions = localStorage.getItem(STORAGE_KEYS.transactions);
    const loadedSettings = localStorage.getItem(STORAGE_KEYS.settings);

    if (loadedRecipes) setRecipes(JSON.parse(loadedRecipes));
    if (loadedOrders) setOrders(JSON.parse(loadedOrders));
    if (loadedTransactions) setTransactions(JSON.parse(loadedTransactions));
    if (loadedSettings) setSettings({ ...defaultSettings, ...JSON.parse(loadedSettings) });
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  // Auth functions
  const register = (name: string, email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]') as User[];
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      console.log('[Auth] Registration failed: Email already exists');
      return false;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      password, // In production, this would be hashed
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.currentUser, newUser.email);
    setUser(newUser);
    
    console.log('[Auth] User registered successfully:', newUser.email);
    return true;
  };

  const login = (email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]') as User[];
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      localStorage.setItem(STORAGE_KEYS.currentUser, foundUser.email);
      setUser(foundUser);
      console.log('[Auth] Login successful:', foundUser.email);
      return true;
    }

    console.log('[Auth] Login failed: Invalid credentials');
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    setUser(null);
    console.log('[Auth] User logged out');
  };

  const addRecipe = (recipe: Recipe) => {
    setRecipes((prev) => [...prev, recipe]);
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes((prev) =>
      prev.map((recipe) => (recipe.id === id ? { ...recipe, ...updates } : recipe))
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => [...prev, order]);
    // Auto-add transaction for order income
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'income',
      description: `Pedido: ${order.recipeName} x${order.quantity}`,
      amount: order.totalPrice,
      category: 'ventas',
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, transaction]);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, ...updates } : order))
    );
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  };

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
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
        isAuthenticated: !!user,
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

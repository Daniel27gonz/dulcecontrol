import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Quotation, QuotationItem } from '@/types/quotation';

const STORAGE_KEY = 'dessert_calc_quotations';

interface QuotationsContextType {
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'number' | 'createdAt'>) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  duplicateQuotation: (id: string) => Quotation | null;
  getQuotation: (id: string) => Quotation | undefined;
  calculateTotals: (items: QuotationItem[], discount: number, discountType: 'percentage' | 'fixed') => { subtotal: number; total: number };
  generateQuotationNumber: () => string;
}

const QuotationsContext = createContext<QuotationsContextType | undefined>(undefined);

// Helper to safely read from localStorage
const loadQuotations = (): Quotation[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading quotations from localStorage:', error);
  }
  return [];
};

// Helper to safely save to localStorage
const saveQuotations = (quotations: Quotation[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
    return true;
  } catch (error) {
    console.error('Error saving quotations to localStorage:', error);
    return false;
  }
};

export function QuotationsProvider({ children }: { children: ReactNode }) {
  const [quotations, setQuotations] = useState<Quotation[]>(() => loadQuotations());

  // Save to localStorage whenever quotations change
  useEffect(() => {
    saveQuotations(quotations);
  }, [quotations]);

  const generateQuotationNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Get current quotations to find the next number
    const currentQuotations = loadQuotations();
    const todayPrefix = `COT-${year}${month}${day}`;
    const todayQuotations = currentQuotations.filter(q => q.number.startsWith(todayPrefix));
    const nextNumber = todayQuotations.length + 1;
    
    return `${todayPrefix}-${nextNumber.toString().padStart(3, '0')}`;
  }, []);

  const addQuotation = useCallback((quotation: Omit<Quotation, 'id' | 'number' | 'createdAt'>): Quotation => {
    const newQuotation: Quotation = {
      ...quotation,
      id: crypto.randomUUID(),
      number: generateQuotationNumber(),
      createdAt: new Date().toISOString(),
    };
    
    setQuotations(prev => {
      const updated = [newQuotation, ...prev];
      // Immediately persist to ensure data is saved
      saveQuotations(updated);
      return updated;
    });
    
    return newQuotation;
  }, [generateQuotationNumber]);

  const updateQuotation = useCallback((id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => {
      const updated = prev.map(q => q.id === id ? { ...q, ...updates } : q);
      saveQuotations(updated);
      return updated;
    });
  }, []);

  const deleteQuotation = useCallback((id: string) => {
    setQuotations(prev => {
      const updated = prev.filter(q => q.id !== id);
      saveQuotations(updated);
      return updated;
    });
  }, []);

  const duplicateQuotation = useCallback((id: string): Quotation | null => {
    const original = quotations.find(q => q.id === id);
    if (!original) return null;

    const newQuotation: Quotation = {
      ...original,
      id: crypto.randomUUID(),
      number: generateQuotationNumber(),
      createdAt: new Date().toISOString(),
      status: 'draft',
      convertedToOrderId: undefined,
    };
    
    setQuotations(prev => {
      const updated = [newQuotation, ...prev];
      saveQuotations(updated);
      return updated;
    });
    
    return newQuotation;
  }, [quotations, generateQuotationNumber]);

  const getQuotation = useCallback((id: string) => {
    return quotations.find(q => q.id === id);
  }, [quotations]);

  const calculateTotals = useCallback((
    items: QuotationItem[], 
    discount: number, 
    discountType: 'percentage' | 'fixed'
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = discountType === 'percentage' 
      ? subtotal * (discount / 100) 
      : discount;
    const total = Math.max(0, subtotal - discountAmount);
    return { subtotal, total };
  }, []);

  return (
    <QuotationsContext.Provider value={{
      quotations,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      duplicateQuotation,
      getQuotation,
      calculateTotals,
      generateQuotationNumber,
    }}>
      {children}
    </QuotationsContext.Provider>
  );
}

export function useQuotations() {
  const context = useContext(QuotationsContext);
  if (context === undefined) {
    throw new Error('useQuotations must be used within a QuotationsProvider');
  }
  return context;
}

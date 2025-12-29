import { useState, useEffect, useCallback } from 'react';
import { Quotation, QuotationItem } from '@/types/quotation';

const STORAGE_KEY = 'dessert_calc_quotations';

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setQuotations(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
  }, [quotations]);

  const generateQuotationNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const count = quotations.filter(q => 
      q.createdAt.startsWith(now.toISOString().slice(0, 7))
    ).length + 1;
    return `COT-${year}${month}-${count.toString().padStart(3, '0')}`;
  }, [quotations]);

  const addQuotation = useCallback((quotation: Omit<Quotation, 'id' | 'number' | 'createdAt'>) => {
    const newQuotation: Quotation = {
      ...quotation,
      id: crypto.randomUUID(),
      number: generateQuotationNumber(),
      createdAt: new Date().toISOString(),
    };
    setQuotations(prev => [newQuotation, ...prev]);
    return newQuotation;
  }, [generateQuotationNumber]);

  const updateQuotation = useCallback((id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => 
      prev.map(q => q.id === id ? { ...q, ...updates } : q)
    );
  }, []);

  const deleteQuotation = useCallback((id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  }, []);

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

  return {
    quotations,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotation,
    calculateTotals,
    generateQuotationNumber,
  };
}

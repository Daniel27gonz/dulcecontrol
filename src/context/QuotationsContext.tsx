import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Quotation, QuotationItem, QuotationExtra } from '@/types/quotation';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';

interface QuotationsContextType {
  quotations: Quotation[];
  isLoading: boolean;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'number' | 'createdAt'>) => Promise<Quotation | null>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  duplicateQuotation: (id: string) => Promise<Quotation | null>;
  getQuotation: (id: string) => Quotation | undefined;
  calculateTotals: (items: QuotationItem[], discount: number, discountType: 'percentage' | 'fixed', extras?: QuotationExtra[]) => { subtotal: number; total: number };
  generateQuotationNumber: () => string;
  refreshQuotations: () => Promise<void>;
}

const QuotationsContext = createContext<QuotationsContextType | undefined>(undefined);

export function QuotationsProvider({ children }: { children: ReactNode }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useApp();

  const loadQuotations = useCallback(async () => {
    if (!session?.user) {
      setQuotations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading quotations:', error);
      setIsLoading(false);
      return;
    }

    if (data) {
      setQuotations(data.map(q => {
        const rawItems = (q.items as unknown) as any;
        // Support extras stored inside the items JSON payload
        let items: QuotationItem[] = [];
        let extras: QuotationExtra[] | undefined;
        if (rawItems && typeof rawItems === 'object' && !Array.isArray(rawItems) && rawItems._items) {
          items = rawItems._items as QuotationItem[];
          extras = rawItems._extras as QuotationExtra[] | undefined;
        } else {
          items = rawItems as QuotationItem[];
        }
        return {
          id: q.id,
          number: q.number,
          clientName: q.client_name,
          clientPhone: q.client_phone || undefined,
          clientEmail: q.client_email || undefined,
          notes: q.notes || undefined,
          items,
          extras,
          discount: Number(q.discount),
          discountType: q.discount_type as 'percentage' | 'fixed',
          subtotal: Number(q.subtotal),
          total: Number(q.total),
          status: q.status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted',
          validUntil: q.valid_until || undefined,
          deliveryDate: q.delivery_date || undefined,
          referenceImage: q.reference_image || undefined,
          convertedToOrderId: q.converted_to_order_id || undefined,
          createdAt: q.created_at,
        };
      }));
    }
    setIsLoading(false);
  }, [session?.user]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const generateQuotationNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    const todayPrefix = `COT-${year}${month}${day}`;
    const todayQuotations = quotations.filter(q => q.number.startsWith(todayPrefix));
    const nextNumber = todayQuotations.length + 1;
    
    return `${todayPrefix}-${nextNumber.toString().padStart(3, '0')}`;
  }, [quotations]);

  const addQuotation = useCallback(async (quotation: Omit<Quotation, 'id' | 'number' | 'createdAt'>): Promise<Quotation | null> => {
    if (!session?.user) return null;

    const number = generateQuotationNumber();

    const { data, error } = await supabase
      .from('quotations')
      .insert([{
        user_id: session.user.id,
        number,
        client_name: quotation.clientName,
        client_phone: quotation.clientPhone,
        client_email: quotation.clientEmail,
        notes: quotation.notes,
        items: JSON.parse(JSON.stringify(
          quotation.extras && quotation.extras.length > 0
            ? { _items: quotation.items, _extras: quotation.extras }
            : quotation.items
        )),
        discount: quotation.discount,
        discount_type: quotation.discountType,
        subtotal: quotation.subtotal,
        total: quotation.total,
        status: quotation.status,
        valid_until: quotation.validUntil,
        delivery_date: quotation.deliveryDate,
        reference_image: quotation.referenceImage,
        converted_to_order_id: quotation.convertedToOrderId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding quotation:', error);
      return null;
    }

    const rawReturnItems = (data.items as unknown) as any;
    let returnItems: QuotationItem[] = [];
    let returnExtras: QuotationExtra[] | undefined;
    if (rawReturnItems && typeof rawReturnItems === 'object' && !Array.isArray(rawReturnItems) && rawReturnItems._items) {
      returnItems = rawReturnItems._items as QuotationItem[];
      returnExtras = rawReturnItems._extras as QuotationExtra[] | undefined;
    } else {
      returnItems = rawReturnItems as QuotationItem[];
    }

    const newQuotation: Quotation = {
      id: data.id,
      number: data.number,
      clientName: data.client_name,
      clientPhone: data.client_phone || undefined,
      clientEmail: data.client_email || undefined,
      notes: data.notes || undefined,
      items: returnItems,
      extras: returnExtras,
      discount: Number(data.discount),
      discountType: data.discount_type as 'percentage' | 'fixed',
      subtotal: Number(data.subtotal),
      total: Number(data.total),
      status: data.status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted',
      validUntil: data.valid_until || undefined,
      deliveryDate: data.delivery_date || undefined,
      referenceImage: data.reference_image || undefined,
      convertedToOrderId: data.converted_to_order_id || undefined,
      createdAt: data.created_at,
    };

    setQuotations(prev => [newQuotation, ...prev]);
    return newQuotation;
  }, [session?.user, generateQuotationNumber]);

  const updateQuotation = useCallback(async (id: string, updates: Partial<Quotation>) => {
    if (!session?.user) return;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone;
    if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.items !== undefined || updates.extras !== undefined) {
      const currentQ = quotations.find(q => q.id === id);
      const finalItems = updates.items ?? currentQ?.items ?? [];
      const finalExtras = updates.extras ?? currentQ?.extras ?? [];
      updateData.items = JSON.parse(JSON.stringify(
        finalExtras.length > 0
          ? { _items: finalItems, _extras: finalExtras }
          : finalItems
      ));
    }
    if (updates.discount !== undefined) updateData.discount = updates.discount;
    if (updates.discountType !== undefined) updateData.discount_type = updates.discountType;
    if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
    if (updates.total !== undefined) updateData.total = updates.total;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil;
    if (updates.deliveryDate !== undefined) updateData.delivery_date = updates.deliveryDate;
    if (updates.referenceImage !== undefined) updateData.reference_image = updates.referenceImage;
    if (updates.convertedToOrderId !== undefined) updateData.converted_to_order_id = updates.convertedToOrderId;

    const { error } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating quotation:', error);
      return;
    }

    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, [session?.user]);

  const deleteQuotation = useCallback(async (id: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting quotation:', error);
      return;
    }

    setQuotations(prev => prev.filter(q => q.id !== id));
  }, [session?.user]);

  const duplicateQuotation = useCallback(async (id: string): Promise<Quotation | null> => {
    const original = quotations.find(q => q.id === id);
    if (!original) return null;

    return addQuotation({
      clientName: original.clientName,
      clientPhone: original.clientPhone,
      clientEmail: original.clientEmail,
      notes: original.notes,
      items: original.items,
      discount: original.discount,
      discountType: original.discountType,
      subtotal: original.subtotal,
      total: original.total,
      status: 'draft',
      validUntil: original.validUntil,
      deliveryDate: original.deliveryDate,
      referenceImage: original.referenceImage,
    });
  }, [quotations, addQuotation]);

  const getQuotation = useCallback((id: string) => {
    return quotations.find(q => q.id === id);
  }, [quotations]);

  const calculateTotals = useCallback((
    items: QuotationItem[], 
    discount: number, 
    discountType: 'percentage' | 'fixed',
    extras?: QuotationExtra[]
  ) => {
    // Redondear subtotal a 2 decimales para consistencia con WhatsApp y PDF
    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
    const extrasTotal = (extras || []).reduce((sum, e) => sum + (e.quantity * e.unitCost), 0);
    const subtotal = Math.round((itemsTotal + extrasTotal) * 100) / 100;
    const discountAmount = discountType === 'percentage' 
      ? subtotal * (discount / 100) 
      : discount;
    // Redondear total a 2 decimales
    const total = Math.round(Math.max(0, subtotal - discountAmount) * 100) / 100;
    return { subtotal, total };
  }, []);

  const refreshQuotations = useCallback(async () => {
    await loadQuotations();
  }, [loadQuotations]);

  return (
    <QuotationsContext.Provider value={{
      quotations,
      isLoading,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      duplicateQuotation,
      getQuotation,
      calculateTotals,
      generateQuotationNumber,
      refreshQuotations,
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

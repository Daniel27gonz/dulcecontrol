export interface QuotationItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  baseCost?: number; // Original cost from recipe, used for margin calculation
}

export interface Quotation {
  id: string;
  number: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  notes?: string;
  validUntil: string;
  deliveryDate?: string;
  referenceImage?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  createdAt: string;
  convertedToOrderId?: string;
}

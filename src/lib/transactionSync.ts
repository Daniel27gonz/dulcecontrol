import { supabase } from '@/integrations/supabase/client';

interface SyncTransactionParams {
  userId: string;
  sourceId: string;
  sourceType: 'ingredient' | 'indirect_cost' | 'worker' | 'order' | 'order_advance' | 'other_income';
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
}

export async function syncTransaction(params: SyncTransactionParams) {
  const { data: existing, error: lookupError } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', params.userId)
    .eq('source_id', params.sourceId)
    .eq('source_type', params.sourceType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const payload = {
    user_id: params.userId,
    source_id: params.sourceId,
    source_type: params.sourceType,
    type: params.type,
    description: params.description,
    amount: params.amount,
    category: params.category,
    date: params.date,
  };

  if (existing) {
    const { error } = await supabase
      .from('transactions')
      .update({
        description: payload.description,
        amount: payload.amount,
        category: payload.category,
        date: payload.date,
      })
      .eq('id', existing.id)
      .eq('user_id', params.userId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('transactions').insert(payload);
  if (error) throw error;
}

export async function deleteTransactionBySource(userId: string, sourceId: string, sourceType: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .eq('source_id', sourceId)
    .eq('source_type', sourceType);

  if (error) throw error;
}

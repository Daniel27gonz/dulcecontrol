import { supabase } from '@/integrations/supabase/client';

interface SyncTransactionParams {
  userId: string;
  sourceId: string;
  sourceType: 'ingredient' | 'indirect_cost' | 'worker' | 'order';
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
}

export async function syncTransaction(params: SyncTransactionParams) {
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', params.userId)
    .eq('source_id' as any, params.sourceId)
    .eq('source_type' as any, params.sourceType)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('transactions')
      .update({
        description: params.description,
        amount: params.amount,
        category: params.category,
        date: params.date,
      } as any)
      .eq('id', existing.id)
      .eq('user_id', params.userId);
  } else {
    await supabase
      .from('transactions')
      .insert({
        user_id: params.userId,
        source_id: params.sourceId,
        source_type: params.sourceType,
        type: params.type,
        description: params.description,
        amount: params.amount,
        category: params.category,
        date: params.date,
      } as any);
  }
}

export async function deleteTransactionBySource(userId: string, sourceId: string, sourceType: string) {
  await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .eq('source_id' as any, sourceId)
    .eq('source_type' as any, sourceType);
}

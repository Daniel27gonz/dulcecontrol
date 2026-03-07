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
  // Check if transaction already exists for this source
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', params.userId);

  const existing = allTransactions?.find(
    (t: any) => t.source_id === params.sourceId && t.source_type === params.sourceType
  );

  if (existing) {
    await supabase
      .from('transactions')
      .update({
        description: params.description,
        amount: params.amount,
        category: params.category,
        date: params.date,
      })
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
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  const toDelete = allTransactions?.filter(
    (t: any) => t.source_id === sourceId && t.source_type === sourceType
  );

  if (toDelete && toDelete.length > 0) {
    for (const t of toDelete) {
      await supabase
        .from('transactions')
        .delete()
        .eq('id', t.id)
        .eq('user_id', userId);
    }
  }
}

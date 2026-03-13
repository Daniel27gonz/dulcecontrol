import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, DollarSign, StickyNote, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { syncTransaction, deleteTransactionBySource } from '@/lib/transactionSync';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface OtherIncomeRecord {
  id: string;
  concept: string;
  amount: number;
  date: string;
  note: string | null;
}

export default function OtherIncomePage() {
  const { user, settings, refreshData } = useApp();
  const [records, setRecords] = useState<OtherIncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OtherIncomeRecord | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  // Form state
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const cs = settings.currencySymbol;

  const prevMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const loadRecords = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('other_income')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (data) {
      setRecords(data.map((r: any) => ({
        id: r.id,
        concept: r.concept,
        amount: Number(r.amount),
        date: r.date,
        note: r.note,
      })));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Filter records by selected month
  const filteredRecords = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return records.filter(r => {
      const d = new Date(r.date);
      return d >= monthStart && d <= monthEnd;
    });
  }, [records, selectedMonth]);

  const totalMonthIncome = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRecords]);

  const resetForm = () => {
    setConcept('');
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNote('');
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (record: OtherIncomeRecord) => {
    setEditingRecord(record);
    setConcept(record.concept);
    setAmount(record.amount.toString());
    setDate(record.date.split('T')[0]);
    setNote(record.note || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedAmount = parseFloat(amount);
    if (!concept.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (editingRecord) {
      // Update existing
      const { error } = await supabase
        .from('other_income')
        .update({
          concept: concept.trim(),
          amount: parsedAmount,
          date,
          note: note.trim() || null,
        })
        .eq('id', editingRecord.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Error al actualizar');
        return;
      }

      // Re-sync transaction
      await syncTransaction({
        userId: user.id,
        sourceId: editingRecord.id,
        sourceType: 'other_income' as any,
        type: 'income',
        description: `Otro ingreso: ${concept.trim()}`,
        amount: parsedAmount,
        category: 'otros_ingresos',
        date,
      });

      toast.success('Ingreso actualizado correctamente');
    } else {
      // Insert new
      const { data, error } = await (supabase as any)
        .from('other_income')
        .insert({
          user_id: user.id,
          concept: concept.trim(),
          amount: parsedAmount,
          date,
          note: note.trim() || null,
        } as any)
        .select()
        .single();

      if (error) {
        toast.error('Error al guardar');
        return;
      }

      // Sync to transactions
      await syncTransaction({
        userId: user.id,
        sourceId: (data as any).id,
        sourceType: 'other_income' as any,
        type: 'income',
        description: `Otro ingreso: ${concept.trim()}`,
        amount: parsedAmount,
        category: 'otros_ingresos',
        date,
      });

      toast.success('Ingreso registrado correctamente');
    }

    await refreshData();
    await loadRecords();
    resetForm();
  };

  const handleDelete = async (record: OtherIncomeRecord) => {
    if (!user) return;

    await (supabase as any)
      .from('other_income')
      .delete()
      .eq('id', record.id)
      .eq('user_id', user.id);

    await deleteTransactionBySource(user.id, record.id, 'other_income');
    await refreshData();
    await loadRecords();
    toast.success('Ingreso eliminado');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Otros Ingresos</h1>
            <p className="text-sm text-muted-foreground">Registra ingresos que no provienen de pedidos</p>
          </motion.div>

          {/* Month Selector */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="bg-card border border-border/50 rounded-xl px-5 py-2 min-w-[180px] text-center">
              <p className="text-base font-semibold text-foreground capitalize">
                {format(selectedMonth, 'MMMM yyyy', { locale: es })}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-full">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Summary Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-success/15 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total del mes</p>
                    <p className="text-2xl font-bold text-success">{cs}{totalMonthIncome.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Add Button */}
          <motion.div variants={itemVariants}>
            <Button
              onClick={() => showForm && !editingRecord ? resetForm() : handleOpenAdd()}
              className="w-full gap-2"
              variant={showForm && !editingRecord ? 'secondary' : 'default'}
            >
              <Plus className="w-4 h-4" />
              {showForm && !editingRecord ? 'Cancelar' : 'Registrar nuevo ingreso'}
            </Button>
          </motion.div>

          {/* Form */}
          {showForm && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {editingRecord ? 'Editar ingreso' : 'Nuevo ingreso'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="concept">Concepto *</Label>
                      <Input
                        id="concept"
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="Ej: Venta en bazar, Clase de repostería"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Nota (opcional)</Label>
                      <Textarea
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Detalle adicional..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingRecord && (
                        <Button type="button" variant="secondary" className="flex-1" onClick={resetForm}>
                          Cancelar
                        </Button>
                      )}
                      <Button type="submit" className="flex-1">
                        {editingRecord ? 'Actualizar' : 'Guardar ingreso'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Records List */}
          <motion.div variants={itemVariants} className="space-y-3">
            {isLoading ? (
              <p className="text-center text-muted-foreground text-sm py-8">Cargando...</p>
            ) : filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No hay ingresos registrados en este mes</p>
                </CardContent>
              </Card>
            ) : (
              filteredRecords.map((record) => (
                <Card key={record.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{record.concept}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(record.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </div>
                        {record.note && (
                          <div className="flex items-start gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{record.note}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-success whitespace-nowrap">
                          {cs}{record.amount.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                          onClick={() => handleOpenEdit(record)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(record)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

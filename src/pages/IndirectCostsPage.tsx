import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Building2, Zap, HelpCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useIndirectCosts, Expense } from '@/context/IndirectCostsContext';
import { useApp } from '@/context/AppContext';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';

type ExpenseType = 'fixed' | 'variable';

interface ExpenseFormData {
  concept: string;
  amount: number;
}

const initialFormData: ExpenseFormData = {
  concept: '',
  amount: 0,
};

export default function IndirectCostsPage() {
  const {
    fixedExpenses,
    variableExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addVariableExpense,
    updateVariableExpense,
    deleteVariableExpense,
    getTotalFixedExpenses,
    getTotalVariableExpenses,
    getTotalIndirectCosts,
  } = useIndirectCosts();
  const { settings } = useApp();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ExpenseType>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleOpenAdd = (type: ExpenseType) => {
    setModalType(type);
    setEditingExpense(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (expense: Expense, type: ExpenseType) => {
    setModalType(type);
    setEditingExpense(expense);
    setFormData({
      concept: expense.concept,
      amount: expense.amount,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.concept.trim()) {
      toast({ title: 'Error', description: 'Ingresa el concepto del gasto', variant: 'destructive' });
      return;
    }

    if (editingExpense) {
      if (modalType === 'fixed') {
        updateFixedExpense(editingExpense.id, formData);
      } else {
        updateVariableExpense(editingExpense.id, formData);
      }
      toast({ title: '✅ Gasto actualizado', description: formData.concept });
    } else {
      if (modalType === 'fixed') {
        addFixedExpense(formData);
      } else {
        addVariableExpense(formData);
      }
      toast({ title: '✅ Gasto agregado', description: formData.concept });
    }

    setShowModal(false);
    setFormData(initialFormData);
  };

  const handleDelete = (expense: Expense, type: ExpenseType) => {
    if (type === 'fixed') {
      deleteFixedExpense(expense.id);
    } else {
      deleteVariableExpense(expense.id);
    }
    toast({ title: 'Gasto eliminado', description: expense.concept });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const ExpenseCard = ({ expense, type }: { expense: Expense; type: ExpenseType }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{expense.concept}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{formatCurrency(expense.amount)}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(expense, type)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará "{expense.concept}" de la lista.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(expense, type)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Gastos Indirectos" showBack />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Info Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex gap-3">
              <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Aquí calculas lo que cuesta tu negocio aunque no estés horneando.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <Card className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <Building2 className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Gastos Fijos</p>
              <p className="font-bold text-foreground">{formatCurrency(getTotalFixedExpenses())}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <Zap className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Gastos Variables</p>
              <p className="font-bold text-foreground">{formatCurrency(getTotalVariableExpenses())}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total */}
        <motion.div variants={itemVariants}>
          <Card className="bg-warm/10 border-warm/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gastos Indirectos</p>
                  <p className="text-2xl font-bold text-warm">{formatCurrency(getTotalIndirectCosts())}</p>
                </div>
                <Receipt className="w-10 h-10 text-warm/50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Mensuales</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fixed Expenses Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Gastos Fijos</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenAdd('fixed')}>
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estos gastos existen aunque no tengas pedidos.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {fixedExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin gastos fijos registrados
                </p>
              ) : (
                <div className="divide-y">
                  {fixedExpenses.map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} type="fixed" />
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Subtotal:</span>
                <span className="font-bold text-foreground">{formatCurrency(getTotalFixedExpenses())}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Variable Expenses Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-base">Gastos Variables</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenAdd('variable')}>
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estos gastos solo aparecen cuando produces o vendes.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {variableExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin gastos variables registrados
                </p>
              ) : (
                <div className="divide-y">
                  {variableExpenses.map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} type="variable" />
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Subtotal:</span>
                <span className="font-bold text-foreground">{formatCurrency(getTotalVariableExpenses())}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Modal for Add/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar gasto' : 'Agregar gasto'} {modalType === 'fixed' ? 'fijo' : 'variable'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="concept">Concepto</Label>
              <Input
                id="concept"
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                placeholder="Ej: Renta del local"
              />
            </div>

            <div>
              <Label htmlFor="amount">Monto mensual ({settings.currencySymbol})</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="warm" onClick={handleSave}>
              {editingExpense ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Building2, Zap, HelpCircle, Receipt, Clock, AlertCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useIndirectCosts, Expense, Equipment } from '@/context/IndirectCostsContext';
import { useLabor } from '@/context/LaborContext';
import { useApp } from '@/context/AppContext';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { ScrollArea } from '@/components/ui/scroll-area';

type ExpenseType = 'fixed' | 'variable';
type ModalMode = 'expense' | 'equipment';

interface ExpenseFormData {
  concept: string;
  amount: number;
  paymentDate: string;
}

interface EquipmentFormData {
  name: string;
  purchaseCost: number;
  usefulLifeMonths: number;
}

const initialExpenseFormData: ExpenseFormData = {
  concept: '',
  amount: 0,
  paymentDate: '',
};

const initialEquipmentFormData: EquipmentFormData = {
  name: '',
  purchaseCost: 0,
  usefulLifeMonths: 12,
};

export default function IndirectCostsPage() {
  const {
    fixedExpenses,
    variableExpenses,
    equipment,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addVariableExpense,
    updateVariableExpense,
    deleteVariableExpense,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentDepreciation,
    getTotalDepreciation,
    getTotalFixedWithDepreciation,
    getTotalIndirectCostsLastMonth,
    getTotalFixedWithDepreciationLastMonth,
    getTotalVariableExpensesLastMonth,
    getLastMonthLabel,
  } = useIndirectCosts();
  const { getTotalMonthlyHours } = useLabor();
  const { settings } = useApp();
  const { toast } = useToast();

  // Cálculo del costo indirecto por hora - solo último mes registrado
  const totalMonthlyHours = getTotalMonthlyHours();
  const totalIndirectCosts = getTotalIndirectCostsLastMonth();
  const indirectCostPerHour = totalMonthlyHours > 0 ? Math.round((totalIndirectCosts / totalMonthlyHours) * 100) / 100 : 0;
  const lastMonthLabel = getLastMonthLabel();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('expense');
  const [modalType, setModalType] = useState<ExpenseType>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>(initialExpenseFormData);
  const [equipmentFormData, setEquipmentFormData] = useState<EquipmentFormData>(initialEquipmentFormData);

  const formatCurrency = (amount: number) => {
    const safeAmount = isNaN(amount) || amount < 0 ? 0 : amount;
    return `${settings.currencySymbol}${safeAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleOpenAddExpense = (type: ExpenseType) => {
    setModalMode('expense');
    setModalType(type);
    setEditingExpense(null);
    setExpenseFormData(initialExpenseFormData);
    setShowModal(true);
  };

  const handleOpenEditExpense = (expense: Expense, type: ExpenseType) => {
    setModalMode('expense');
    setModalType(type);
    setEditingExpense(expense);
    setExpenseFormData({
      concept: expense.concept,
      amount: expense.amount,
      paymentDate: expense.paymentDate || '',
    });
    setShowModal(true);
  };

  const handleOpenAddEquipment = () => {
    setModalMode('equipment');
    setEditingEquipment(null);
    setEquipmentFormData(initialEquipmentFormData);
    setShowModal(true);
  };

  const handleOpenEditEquipment = (equip: Equipment) => {
    setModalMode('equipment');
    setEditingEquipment(equip);
    setEquipmentFormData({
      name: equip.name,
      purchaseCost: equip.purchaseCost,
      usefulLifeMonths: equip.usefulLifeMonths,
    });
    setShowModal(true);
  };

  const handleSaveExpense = () => {
    if (!expenseFormData.concept.trim()) {
      toast({ title: 'Error', description: 'Ingresa el concepto del gasto', variant: 'destructive' });
      return;
    }

    const amount = Math.max(0, Math.round((expenseFormData.amount || 0) * 100) / 100);

    if (amount <= 0) {
      toast({ title: 'Error', description: 'El monto debe ser mayor a 0', variant: 'destructive' });
      return;
    }

    if (!expenseFormData.paymentDate) {
      toast({ title: 'Error', description: 'La fecha de pago es obligatoria', variant: 'destructive' });
      return;
    }

    if (editingExpense) {
      if (modalType === 'fixed') {
        updateFixedExpense(editingExpense.id, { concept: expenseFormData.concept, amount, paymentDate: expenseFormData.paymentDate });
      } else {
        updateVariableExpense(editingExpense.id, { concept: expenseFormData.concept, amount, paymentDate: expenseFormData.paymentDate });
      }
      toast({ title: '✅ Gasto actualizado', description: expenseFormData.concept });
    } else {
      if (modalType === 'fixed') {
        addFixedExpense({ concept: expenseFormData.concept, amount, paymentDate: expenseFormData.paymentDate });
      } else {
        addVariableExpense({ concept: expenseFormData.concept, amount, paymentDate: expenseFormData.paymentDate });
      }
      toast({ title: '✅ Gasto agregado', description: expenseFormData.concept });
    }

    setShowModal(false);
    setExpenseFormData(initialExpenseFormData);
  };

  const handleSaveEquipment = () => {
    if (!equipmentFormData.name.trim()) {
      toast({ title: 'Error', description: 'Ingresa el nombre del equipo', variant: 'destructive' });
      return;
    }

    if (equipmentFormData.purchaseCost <= 0) {
      toast({ title: 'Error', description: 'El costo de compra debe ser mayor a 0', variant: 'destructive' });
      return;
    }

    if (equipmentFormData.usefulLifeMonths <= 0) {
      toast({ title: 'Error', description: 'La vida útil debe ser mayor a 0 meses', variant: 'destructive' });
      return;
    }

    const purchaseCost = Math.round((equipmentFormData.purchaseCost || 0) * 100) / 100;
    const usefulLifeMonths = Math.max(1, Math.round(equipmentFormData.usefulLifeMonths || 1));

    if (editingEquipment) {
      updateEquipment(editingEquipment.id, { 
        name: equipmentFormData.name, 
        purchaseCost,
        usefulLifeMonths
      });
      toast({ title: '✅ Equipo actualizado', description: equipmentFormData.name });
    } else {
      addEquipment({ 
        name: equipmentFormData.name, 
        purchaseCost,
        usefulLifeMonths
      });
      toast({ title: '✅ Equipo agregado', description: equipmentFormData.name });
    }

    setShowModal(false);
    setEquipmentFormData(initialEquipmentFormData);
  };

  const handleSave = () => {
    if (modalMode === 'expense') {
      handleSaveExpense();
    } else {
      handleSaveEquipment();
    }
  };

  const handleDeleteExpense = (expense: Expense, type: ExpenseType) => {
    if (type === 'fixed') {
      deleteFixedExpense(expense.id);
    } else {
      deleteVariableExpense(expense.id);
    }
    toast({ title: 'Gasto eliminado', description: expense.concept });
  };

  const handleDeleteEquipment = (equip: Equipment) => {
    deleteEquipment(equip.id);
    toast({ title: 'Equipo eliminado', description: equip.name });
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-foreground text-sm">{expense.concept}</p>
          <span className="font-semibold text-foreground text-sm sm:hidden">{formatCurrency(expense.amount)}</span>
        </div>
        {expense.paymentDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Fecha de pago: {new Date(expense.paymentDate).toLocaleDateString('es-MX')}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2 shrink-0">
        <span className="font-semibold text-foreground text-sm hidden sm:block">{formatCurrency(expense.amount)}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" onClick={() => handleOpenEditExpense(expense, type)}>
            <Edit2 className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará "{expense.concept}" de la lista.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteExpense(expense, type)} className="w-full sm:w-auto">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );

  const EquipmentCard = ({ equip }: { equip: Equipment }) => {
    const depreciation = getEquipmentDepreciation(equip);
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
        <div className="flex items-center justify-between sm:flex-1 sm:min-w-0 gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm">{equip.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(equip.purchaseCost)} / {equip.usefulLifeMonths} meses
            </p>
          </div>
          <div className="text-right sm:hidden">
            <span className="font-semibold text-foreground text-sm">{formatCurrency(depreciation)}</span>
            <p className="text-xs text-muted-foreground">/mes</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="font-semibold text-foreground text-sm">{formatCurrency(depreciation)}</span>
            <p className="text-xs text-muted-foreground">/mes</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" onClick={() => handleOpenEditEquipment(equip)}>
              <Edit2 className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Eliminar</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará "{equip.name}" de la lista de depreciación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteEquipment(equip)} className="w-full sm:w-auto">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Gastos del Mes" showBack />

      <ScrollArea className="h-[calc(100vh-140px)]">
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
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Fijos + Deprec.</p>
                <p className="font-bold text-foreground text-sm sm:text-base">{formatCurrency(getTotalFixedWithDepreciationLastMonth())}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Variables</p>
                <p className="font-bold text-foreground text-sm sm:text-base">{formatCurrency(getTotalVariableExpensesLastMonth())}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total */}
          <motion.div variants={itemVariants}>
            <Card className="bg-warm/10 border-warm/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Total Gastos del Mes</p>
                    <p className="text-xl sm:text-2xl font-bold text-warm">{formatCurrency(totalIndirectCosts)}</p>
                  </div>
                  <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-warm/50 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Mensuales</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Costo Indirecto por Hora */}
          <motion.div variants={itemVariants}>
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-sm font-medium text-foreground">Costo Indirecto por Hora</p>
                    </div>
                    {totalMonthlyHours > 0 ? (
                      <>
                        <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(indirectCostPerHour)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Basado en {totalMonthlyHours.toLocaleString('es-MX')} horas mensuales
                        </p>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 mt-2 text-amber-600">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-sm">Agrega horas de trabajo para calcular</p>
                      </div>
                    )}
                  </div>
                </div>
                {totalMonthlyHours > 0 && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/20">
                    Este valor indica cuánto cuesta tu negocio por cada hora de trabajo.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Fixed Expenses Section */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-5 h-5 text-primary shrink-0" />
                    <CardTitle className="text-base truncate">Gastos Fijos</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOpenAddExpense('fixed')} className="shrink-0">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Agregar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Existen aunque no tengas pedidos.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {fixedExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin gastos fijos registrados
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {fixedExpenses.map((expense) => (
                      <ExpenseCard key={expense.id} expense={expense} type="fixed" />
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-medium text-muted-foreground text-sm">Subtotal:</span>
                  <span className="font-bold text-foreground">{formatCurrency(getTotalFixedExpensesLastMonth())}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Depreciation Section - Inside Fixed Expenses concept */}
          <motion.div variants={itemVariants}>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wrench className="w-5 h-5 text-amber-600 shrink-0" />
                    <CardTitle className="text-base truncate">Depreciación de Equipos</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleOpenAddEquipment} className="shrink-0 border-amber-500/50 text-amber-700 hover:bg-amber-500/10">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Agregar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Divide el costo de tus equipos entre su vida útil para incluirlo como gasto fijo.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {equipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin equipos registrados
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {equipment.map((equip) => (
                      <EquipmentCard key={equip.id} equip={equip} />
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-amber-500/30 flex justify-between items-center">
                  <span className="font-medium text-amber-700 text-sm">Depreciación mensual:</span>
                  <span className="font-bold text-amber-700">{formatCurrency(getTotalDepreciation())}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Fixed with Depreciation */}
          <motion.div variants={itemVariants}>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gastos Fijos</p>
                    <p className="text-xs text-muted-foreground">(incluye depreciación)</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(getTotalFixedWithDepreciation())}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Variable Expenses Section */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                    <CardTitle className="text-base truncate">Gastos Variables</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOpenAddExpense('variable')} className="shrink-0">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Agregar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo cuando produces o vendes.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {variableExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin gastos variables registrados
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {variableExpenses.map((expense) => (
                      <ExpenseCard key={expense.id} expense={expense} type="variable" />
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-medium text-muted-foreground text-sm">Subtotal:</span>
                  <span className="font-bold text-foreground">{formatCurrency(getTotalVariableExpensesLastMonth())}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </ScrollArea>

      {/* Modal for Add/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'expense' 
                ? `${editingExpense ? 'Editar' : 'Agregar'} gasto ${modalType === 'fixed' ? 'fijo' : 'variable'}`
                : `${editingEquipment ? 'Editar' : 'Agregar'} equipo`
              }
            </DialogTitle>
          </DialogHeader>

          {modalMode === 'expense' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="concept">Concepto</Label>
                <Input
                  id="concept"
                  value={expenseFormData.concept}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, concept: e.target.value })}
                  placeholder="Ej: Renta del local"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="amount">Monto mensual ({settings.currencySymbol})</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={expenseFormData.amount || ''}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paymentDate">Fecha de pago</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={expenseFormData.paymentDate || ''}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, paymentDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipName">Nombre del equipo</Label>
                <Input
                  id="equipName"
                  value={equipmentFormData.name}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
                  placeholder="Ej: Horno, Batidora, Refrigeradora"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="purchaseCost">Costo de compra ({settings.currencySymbol})</Label>
                <Input
                  id="purchaseCost"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={equipmentFormData.purchaseCost || ''}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, purchaseCost: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="usefulLife">Vida útil (meses)</Label>
                <Input
                  id="usefulLife"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={equipmentFormData.usefulLifeMonths || ''}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, usefulLifeMonths: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                  placeholder="12"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ej: 36 meses = 3 años, 60 meses = 5 años
                </p>
              </div>

              {equipmentFormData.purchaseCost > 0 && equipmentFormData.usefulLifeMonths > 0 && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <p className="text-sm text-amber-700">
                    <strong>Depreciación mensual:</strong> {formatCurrency(Math.round((equipmentFormData.purchaseCost / equipmentFormData.usefulLifeMonths) * 100) / 100)}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button variant="warm" onClick={handleSave} className="w-full sm:w-auto">
              {modalMode === 'expense'
                ? (editingExpense ? 'Guardar cambios' : 'Agregar')
                : (editingEquipment ? 'Guardar cambios' : 'Agregar')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

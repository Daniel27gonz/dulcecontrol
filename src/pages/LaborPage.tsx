import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Edit2, Trash2, Clock, DollarSign, Calendar, HelpCircle, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLabor, Worker } from '@/context/LaborContext';
import { useApp } from '@/context/AppContext';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';

interface WorkerFormData {
  name: string;
  hoursPerDay: number;
  daysPerMonth: number;
  monthlySalary: number;
  paymentDate: string;
}

const initialFormData: WorkerFormData = {
  name: '',
  hoursPerDay: 8,
  daysPerMonth: 24,
  monthlySalary: 0,
  paymentDate: new Date().toISOString().split('T')[0],
};

export default function LaborPage() {
  const { workers, addWorker, updateWorker, deleteWorker, getLastMonthLaborCostPerHour, getLastMonthLabel } = useLabor();
  const { settings } = useApp();
  const { toast } = useToast();
  
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);

  // Month filter
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const handlePrevMonth = () => {
    if (filterMonth === 0) { setFilterMonth(11); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (filterMonth === 11) { setFilterMonth(0); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const pDate = w.paymentDate ? new Date(w.paymentDate) : new Date(w.lastUpdated);
      return pDate.getMonth() === filterMonth && pDate.getFullYear() === filterYear;
    });
  }, [workers, filterMonth, filterYear]);

  const monthlyTotal = useMemo(() => {
    return filteredWorkers.reduce((sum, w) => sum + w.monthlySalary, 0);
  }, [filteredWorkers]);

  const previewMonthlyHours = formData.hoursPerDay * formData.daysPerMonth;
  const previewDailySalary = formData.daysPerMonth > 0 ? formData.monthlySalary / formData.daysPerMonth : 0;
  const previewHourlyRate = previewMonthlyHours > 0 ? formData.monthlySalary / previewMonthlyHours : 0;

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      hoursPerDay: worker.hoursPerDay,
      daysPerMonth: worker.daysPerMonth,
      monthlySalary: worker.monthlySalary,
      paymentDate: worker.paymentDate ? new Date(worker.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Ingresa el nombre del trabajador', variant: 'destructive' });
      return;
    }
    if (formData.hoursPerDay <= 0 || formData.daysPerMonth <= 0) {
      toast({ title: 'Error', description: 'Las horas y días deben ser mayores a 0', variant: 'destructive' });
      return;
    }
    if (!formData.paymentDate) {
      toast({ title: 'Error', description: 'La fecha de pago es obligatoria', variant: 'destructive' });
      return;
    }

    const workerPayload = {
      name: formData.name,
      hoursPerDay: formData.hoursPerDay,
      daysPerMonth: formData.daysPerMonth,
      monthlySalary: formData.monthlySalary,
      paymentDate: new Date(formData.paymentDate).toISOString(),
    };

    if (editingWorker) {
      updateWorker(editingWorker.id, workerPayload);
      toast({ title: '✅ Trabajador actualizado', description: formData.name });
    } else {
      addWorker(workerPayload);
      toast({ title: '✅ Trabajador agregado', description: formData.name });
    }
    
    setShowModal(false);
    setFormData(initialFormData);
  };

  const handleDelete = (worker: Worker) => {
    deleteWorker(worker.id);
    toast({ title: 'Trabajador eliminado', description: worker.name });
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
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Mano de Obra" showBack />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Month Selector */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="w-4 h-4 text-primary" />
              {MONTH_NAMES[filterMonth]} {filterYear}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Monthly Total Banner */}
        <motion.div variants={itemVariants}>
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Total pagado — {MONTH_NAMES[filterMonth]} {filterYear}
            </p>
            <p className="text-lg font-bold text-primary mt-0.5">
              {formatCurrency(monthlyTotal)}
            </p>
          </div>
        </motion.div>

        {/* Summary */}
        {workers.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="bg-warm/10 border-warm/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Costo promedio por hora</p>
                    <p className="text-lg font-bold text-warm">{formatCurrency(getLastMonthLaborCostPerHour())}</p>
                  </div>
                  <Users className="w-8 h-8 text-warm/50" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getLastMonthLabel() ? `Mes: ${getLastMonthLabel()}` : 'Mensuales'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Add Button */}
        <motion.div variants={itemVariants}>
          <Button onClick={handleOpenAdd} variant="warm" className="w-full" size="lg">
            <Plus className="w-5 h-5" />
            Agregar pago
          </Button>
        </motion.div>

        {/* Workers List */}
        {filteredWorkers.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Sin trabajadores</h3>
                <p className="text-sm text-muted-foreground">
                  Agrega trabajadores para calcular el costo real de la mano de obra
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="space-y-3">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{worker.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Fecha de pago: {worker.paymentDate ? new Date(worker.paymentDate).toLocaleDateString('es-MX') : 'Sin fecha'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />{worker.monthlyHours}h mensuales
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(worker)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar trabajador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(worker)} className="w-full sm:w-auto">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Modal for Add/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? 'Editar trabajador' : 'Agregar pago'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del trabajador</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: María García"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hoursPerDay">Horas por día</Label>
                <Input
                  id="hoursPerDay"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.hoursPerDay}
                  onChange={(e) => setFormData({ ...formData, hoursPerDay: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="daysPerMonth">Días por mes</Label>
                <Input
                  id="daysPerMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.daysPerMonth}
                  onChange={(e) => setFormData({ ...formData, daysPerMonth: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="monthlySalary">Sueldo mensual ({settings.currencySymbol})</Label>
              <Input
                id="monthlySalary"
                type="number"
                min="0"
                value={formData.monthlySalary}
                onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="paymentDate">Fecha de pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>

            {/* Preview calculations - only show when key fields are filled */}
            {formData.name.trim() && formData.paymentDate && previewMonthlyHours > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Cálculos automáticos:</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Horas/mes</p>
                      <p className="font-semibold">{previewMonthlyHours}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Por día</p>
                      <p className="font-semibold">{formatCurrency(previewDailySalary)}</p>
                    </div>
                    <div className="bg-primary/10 rounded p-1">
                      <p className="text-xs text-primary">Por hora</p>
                      <p className="font-bold text-primary">{formatCurrency(previewHourlyRate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button variant="warm" onClick={handleSave} className="w-full sm:w-auto">
              {editingWorker ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

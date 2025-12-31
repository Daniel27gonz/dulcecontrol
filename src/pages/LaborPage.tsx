import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Edit2, Trash2, Clock, DollarSign, Calendar, HelpCircle } from 'lucide-react';
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
}

const initialFormData: WorkerFormData = {
  name: '',
  hoursPerDay: 8,
  daysPerMonth: 24,
  monthlySalary: 0,
};

export default function LaborPage() {
  const { workers, addWorker, updateWorker, deleteWorker, getAverageHourlyRate } = useLabor();
  const { settings } = useApp();
  const { toast } = useToast();
  
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);

  // Cálculos en tiempo real del formulario
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

    if (editingWorker) {
      updateWorker(editingWorker.id, formData);
      toast({ title: '✅ Trabajador actualizado', description: formData.name });
    } else {
      addWorker(formData);
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
        {/* Info Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex gap-3">
              <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Este cálculo te permite saber cuánto cuesta realmente cada hora de trabajo en tu negocio.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary */}
        {workers.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="bg-warm/10 border-warm/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Costo promedio por hora</p>
                    <p className="text-2xl font-bold text-warm">{formatCurrency(getAverageHourlyRate())}</p>
                  </div>
                  <Users className="w-10 h-10 text-warm/50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {workers.length} trabajador{workers.length !== 1 ? 'es' : ''} registrado{workers.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Add Button */}
        <motion.div variants={itemVariants}>
          <Button onClick={handleOpenAdd} variant="warm" className="w-full" size="lg">
            <Plus className="w-5 h-5" />
            Agregar trabajador
          </Button>
        </motion.div>

        {/* Workers List */}
        {workers.length === 0 ? (
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
            {workers.map((worker) => (
              <Card key={worker.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{worker.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Actualizado: {new Date(worker.lastUpdated).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(worker)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar trabajador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(worker)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Worker details grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{worker.hoursPerDay}h/día × {worker.daysPerMonth} días</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{worker.monthlyHours}h mensuales</span>
                    </div>
                  </div>

                  {/* Salary breakdown */}
                  <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Mensual</p>
                      <p className="font-semibold text-foreground">{formatCurrency(worker.monthlySalary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Diario</p>
                      <p className="font-semibold text-foreground">{formatCurrency(worker.dailySalary)}</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-1">
                      <p className="text-xs text-primary">Por hora</p>
                      <p className="font-bold text-primary">{formatCurrency(worker.hourlyRate)}</p>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? 'Editar trabajador' : 'Agregar trabajador'}
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

            {/* Preview calculations */}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="warm" onClick={handleSave}>
              {editingWorker ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

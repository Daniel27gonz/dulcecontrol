import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApp, Transaction } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const expenseCategories = [
  { value: 'ingredientes', label: 'Ingredientes' },
  { value: 'empaques', label: 'Empaques' },
  { value: 'gas', label: 'Gas' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'mano_obra', label: 'Mano de obra' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'otros', label: 'Otros' },
];

const incomeCategories = [
  { value: 'ventas', label: 'Ventas' },
  { value: 'otros', label: 'Otros ingresos' },
];

export function TransactionForm() {
  const { addTransaction } = useApp();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const resetForm = () => {
    setType('expense');
    setDescription('');
    setAmount('');
    setCategory('');
    setDate(new Date());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || !category) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos',
        variant: 'destructive',
      });
      return;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date: date.toISOString(),
    };

    addTransaction(transaction);
    toast({
      title: type === 'income' ? 'Ingreso registrado' : 'Gasto registrado',
      description: `${description} - $${parseFloat(amount).toFixed(2)}`,
    });
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="warm" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar transacción
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva transacción</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={cn(
                type === 'income' && 'bg-success hover:bg-success/90'
              )}
              onClick={() => {
                setType('income');
                setCategory('');
              }}
            >
              Ingreso
            </Button>
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={cn(
                type === 'expense' && 'bg-destructive hover:bg-destructive/90'
              )}
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
            >
              Gasto
            </Button>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra de harina"
              maxLength={100}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="warm" className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

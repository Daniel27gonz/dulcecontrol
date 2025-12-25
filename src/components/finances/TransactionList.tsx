import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Transaction } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  currencySymbol: string;
  onDelete: (id: string) => void;
}

const categoryLabels: Record<string, string> = {
  ventas: 'Ventas',
  ingredientes: 'Ingredientes',
  empaques: 'Empaques',
  gas: 'Gas',
  electricidad: 'Electricidad',
  mano_obra: 'Mano de obra',
  equipo: 'Equipo',
  otros: 'Otros',
};

export function TransactionList({ transactions, currencySymbol, onDelete }: TransactionListProps) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">💰</span>
          </div>
          <h3 className="font-bold text-foreground mb-2">Sin transacciones</h3>
          <p className="text-sm text-muted-foreground">
            Agrega tu primer ingreso o gasto para comenzar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Historial</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="divide-y divide-border">
            {sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      transaction.type === 'income'
                        ? 'bg-success/20'
                        : 'bg-destructive/20'
                    )}
                  >
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground line-clamp-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabels[transaction.category] || transaction.category} •{' '}
                      {format(new Date(transaction.date), 'dd MMM', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'font-bold text-sm',
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {currencySymbol}{transaction.amount.toFixed(2)}
                  </p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará el registro de{' '}
                          <strong>{transaction.description}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(transaction.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

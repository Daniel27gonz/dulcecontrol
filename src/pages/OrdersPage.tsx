import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';

export default function OrdersPage() {
  const { orders } = useApp();

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Pedidos" />

      <div className="p-4">
        {orders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <span className="text-4xl block mb-4">📋</span>
              <p className="text-muted-foreground">Aún no tienes pedidos registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <p className="font-bold">{order.clientName}</p>
                  <p className="text-sm text-muted-foreground">{order.recipeName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

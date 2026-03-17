import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { OrderForm } from '@/components/orders/OrderForm';
import { OrderCard } from '@/components/orders/OrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList } from 'lucide-react';

export default function OrdersPage() {
  const { orders } = useApp();
  const [activeTab, setActiveTab] = useState('all');

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Pedidos" />

      <div className="p-4 space-y-4">
        {/* New Order Form */}
        <OrderForm />


        {/* Tabs Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="all" className="text-[10px] px-1">Todos</TabsTrigger>
            <TabsTrigger value="pending" className="text-[10px] px-1">Pendiente</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-[10px] px-1">Proceso</TabsTrigger>
            <TabsTrigger value="completed" className="text-[10px] px-1">Completado</TabsTrigger>
            <TabsTrigger value="paid" className="text-[10px] px-1">Pagado</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-[10px] px-1">Cancelado</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredOrders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? 'Aún no tienes pedidos registrados'
                      : 'No hay pedidos en esta categoría'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}

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

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Pedidos" />

      <div className="p-4 space-y-4">
        {/* New Order Form */}
        <OrderForm />

        {/* Stats */}
        {orders.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                <p className="text-xs text-yellow-600">Pendientes</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
                <p className="text-xs text-blue-600">En Proceso</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{completedCount}</p>
                <p className="text-xs text-green-600">Completados</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pendiente</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs">Proceso</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Listo</TabsTrigger>
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

import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Calendar, User, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp, Order } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-700' },
  { value: 'in_progress', label: 'En proceso', color: 'bg-blue-500/20 text-blue-700' },
  { value: 'completed', label: 'Completado', color: 'bg-green-500/20 text-green-700' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500/20 text-red-700' },
];

const OrdersPage = forwardRef<HTMLDivElement>((_, ref) => {
  const { orders, recipes, addOrder, updateOrder, deleteOrder, settings, calculateRecipeCost } = useApp();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [clientName, setClientName] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState<Order['status']>('pending');

  const resetForm = () => {
    setClientName('');
    setSelectedRecipeId('');
    setQuantity(1);
    setDeliveryDate('');
    setStatus('pending');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!clientName.trim()) {
      toast({ title: 'Error', description: 'Ingresa el nombre del cliente', variant: 'destructive' });
      return;
    }
    if (!selectedRecipeId) {
      toast({ title: 'Error', description: 'Selecciona una receta', variant: 'destructive' });
      return;
    }
    if (quantity < 1) {
      toast({ title: 'Error', description: 'La cantidad debe ser al menos 1', variant: 'destructive' });
      return;
    }
    if (!deliveryDate) {
      toast({ title: 'Error', description: 'Selecciona una fecha de entrega', variant: 'destructive' });
      return;
    }

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
    if (!selectedRecipe) return;

    const recipeCost = calculateRecipeCost(selectedRecipe);
    const totalPrice = recipeCost.suggestedPrice * quantity;

    if (editingId) {
      // Actualizar pedido existente
      updateOrder(editingId, {
        clientName,
        recipeId: selectedRecipeId,
        recipeName: selectedRecipe.name,
        quantity,
        totalPrice,
        deliveryDate,
        status,
      });
      toast({ title: 'Pedido actualizado', description: 'El pedido se ha actualizado correctamente' });
    } else {
      // Crear nuevo pedido
      const newOrder: Order = {
        id: Date.now().toString(),
        clientName,
        recipeId: selectedRecipeId,
        recipeName: selectedRecipe.name,
        quantity,
        totalPrice,
        status,
        deliveryDate,
        createdAt: new Date().toISOString(),
      };
      addOrder(newOrder);
      toast({ title: 'Pedido creado', description: 'El pedido se ha creado correctamente' });
    }

    resetForm();
  };

  const handleEdit = (order: Order) => {
    setClientName(order.clientName);
    setSelectedRecipeId(order.recipeId);
    setQuantity(order.quantity);
    setDeliveryDate(order.deliveryDate);
    setStatus(order.status);
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    toast({ title: 'Pedido eliminado', description: 'El pedido se ha eliminado correctamente' });
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrder(orderId, { status: newStatus });
    toast({ title: 'Estado actualizado' });
  };

  const getStatusConfig = (status: Order['status']) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border p-4 pt-10 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-sm text-muted-foreground">{orders.length} pedidos registrados</p>
          </div>
          <Button onClick={() => setShowForm(true)} variant="warm" size="sm">
            <Plus className="w-4 h-4" />
            Nuevo
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && resetForm()}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    {editingId ? 'Editar Pedido' : 'Nuevo Pedido'}
                  </h2>
                  <button onClick={resetForm} className="p-2 hover:bg-muted rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Cliente */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      <User className="w-4 h-4 inline mr-2" />
                      Nombre del cliente
                    </label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej: María García"
                    />
                  </div>

                  {/* Receta */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      <Package className="w-4 h-4 inline mr-2" />
                      Receta
                    </label>
                    {recipes.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded-xl">
                        No hay recetas. Crea una primero.
                      </p>
                    ) : (
                      <select
                        value={selectedRecipeId}
                        onChange={(e) => setSelectedRecipeId(e.target.value)}
                        className="w-full h-12 rounded-xl border-2 border-input bg-background px-3 text-sm"
                      >
                        <option value="">Selecciona una receta</option>
                        {recipes.map((recipe) => {
                          const cost = calculateRecipeCost(recipe);
                          return (
                            <option key={recipe.id} value={recipe.id}>
                              {recipe.name} - {settings.currencySymbol}{cost.suggestedPrice.toFixed(2)}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Cantidad
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Fecha de entrega */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Fecha de entrega
                    </label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Estado
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(opt.value as Order['status'])}
                          className={`p-2 rounded-xl text-sm font-medium transition-all ${
                            status === opt.value
                              ? opt.color + ' ring-2 ring-offset-2 ring-caramel'
                              : 'bg-muted text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview del precio */}
                  {selectedRecipeId && (
                    <Card className="bg-secondary/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Precio total:</span>
                          <span className="text-xl font-bold text-caramel">
                            {settings.currencySymbol}
                            {(() => {
                              const recipe = recipes.find(r => r.id === selectedRecipeId);
                              if (!recipe) return '0.00';
                              return (calculateRecipeCost(recipe).suggestedPrice * quantity).toFixed(2);
                            })()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button onClick={resetForm} variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit} variant="warm" className="flex-1">
                      <Check className="w-4 h-4" />
                      {editingId ? 'Actualizar' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <span className="text-4xl block mb-4">📋</span>
              <h3 className="font-bold text-foreground mb-2">Sin pedidos</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Aún no tienes pedidos registrados
              </p>
              <Button onClick={() => setShowForm(true)} variant="warm">
                <Plus className="w-4 h-4" />
                Crear primer pedido
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-foreground">{order.clientName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.recipeName} × {order.quantity}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.deliveryDate)}
                        </div>
                        <span className="text-lg font-bold text-caramel">
                          {settings.currencySymbol}{order.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Status selector */}
                      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(order.id, opt.value as Order['status'])}
                            className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                              order.status === opt.value
                                ? opt.color
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          onClick={() => handleEdit(order)}
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDelete(order.id)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
});

OrdersPage.displayName = 'OrdersPage';

export default OrdersPage;

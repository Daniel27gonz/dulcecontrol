import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Package, CheckCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function QuickStats() {
  const { recipes, orders } = useApp();

  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalOrders = orders.length;

  const stats = [
    {
      icon: <ChefHat className="w-5 h-5" />,
      value: recipes.length,
      label: 'Recetas',
      color: 'text-caramel',
      bg: 'bg-caramel/10',
    },
    {
      icon: <Package className="w-5 h-5" />,
      value: totalOrders,
      label: 'Pedidos',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      value: completedOrders,
      label: 'Entregados',
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-border text-center shadow-soft"
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
            {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-4 h-4 sm:w-5 sm:h-5' })}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  variant = 'default',
  size = 'md' 
}: MetricCardProps) {
  const variants = {
    default: 'bg-card border-border',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-caramel/10 border-caramel/20',
    primary: 'gradient-warm border-0 text-primary-foreground',
  };

  const iconVariants = {
    default: 'bg-muted text-foreground',
    success: 'bg-success/20 text-success',
    warning: 'bg-caramel/20 text-caramel',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
  };

  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(variants[variant], 'overflow-hidden')}>
        <CardContent className={sizes[size]}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm truncate',
                variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
                {title}
              </p>
              <p className={cn(
                'font-bold mt-1 truncate',
                size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'
              )}>
                {value}
              </p>
              {subtitle && (
                <p className={cn(
                  'text-xs mt-0.5',
                  variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}>
                  {subtitle}
                </p>
              )}
              {trend && (
                <div className={cn(
                  'flex items-center gap-1 mt-1 text-xs font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}>
                  <span>{trend.isPositive ? '↑' : '↓'}</span>
                  <span>{Math.abs(trend.value)}% vs mes anterior</span>
                </div>
              )}
            </div>
            <div className={cn(
              'rounded-xl flex items-center justify-center flex-shrink-0',
              iconSizes[size],
              iconVariants[variant]
            )}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';
import { syncTransaction, deleteTransactionBySource } from '@/lib/transactionSync';

export interface Worker {
  id: string;
  name: string;
  hoursPerDay: number;
  daysPerMonth: number;
  monthlyHours: number;
  monthlySalary: number;
  dailySalary: number;
  hourlyRate: number;
  paymentDate: string | null;
  lastUpdated: string;
}

interface LaborContextType {
  workers: Worker[];
  isLoading: boolean;
  addWorker: (worker: Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>) => Promise<void>;
  updateWorker: (id: string, updates: Partial<Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  getTotalHourlyRate: () => number;
  getAverageHourlyRate: () => number;
  getTotalMonthlyHours: () => number;
  getLaborCostPerHour: () => number;
  getLastMonthLaborCostPerHour: () => number;
  getLastMonthTotalHours: () => number;
  getLastMonthLabel: () => string;
  refreshWorkers: () => Promise<void>;
}

const LaborContext = createContext<LaborContextType | undefined>(undefined);

function calculateWorkerValues(worker: Omit<Worker, 'monthlyHours' | 'dailySalary' | 'hourlyRate'>): Worker {
  const monthlyHours = worker.hoursPerDay * worker.daysPerMonth;
  const dailySalary = worker.daysPerMonth > 0 ? worker.monthlySalary / worker.daysPerMonth : 0;
  const hourlyRate = monthlyHours > 0 ? worker.monthlySalary / monthlyHours : 0;
  
  return {
    ...worker,
    monthlyHours,
    dailySalary,
    hourlyRate,
  };
}

export function LaborProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useApp();

  const loadWorkers = useCallback(async () => {
    if (!session?.user) {
      setWorkers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading workers:', error);
      setIsLoading(false);
      return;
    }

    if (data) {
      setWorkers(data.map(w => ({
        id: w.id,
        name: w.name,
        hoursPerDay: Number(w.hours_per_day),
        daysPerMonth: Number(w.days_per_month),
        monthlySalary: Number(w.monthly_salary),
        monthlyHours: Number(w.monthly_hours),
        dailySalary: Number(w.daily_salary),
        hourlyRate: Number(w.hourly_rate),
        paymentDate: (w as any).payment_date || null,
        lastUpdated: w.last_updated,
      })));
    }
    setIsLoading(false);
  }, [session?.user]);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const addWorker = useCallback(async (workerData: Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>) => {
    if (!session?.user) return;

    const calculated = calculateWorkerValues({
      ...workerData,
      id: '',
      lastUpdated: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('workers')
      .insert([{
        user_id: session.user.id,
        name: workerData.name,
        hours_per_day: workerData.hoursPerDay,
        days_per_month: workerData.daysPerMonth,
        monthly_salary: workerData.monthlySalary,
        monthly_hours: calculated.monthlyHours,
        daily_salary: calculated.dailySalary,
        hourly_rate: calculated.hourlyRate,
        payment_date: workerData.paymentDate || null,
      } as any])
      .select()
      .single();

    if (error) {
      console.error('Error adding worker:', error);
      return;
    }

    const newWorker: Worker = {
      id: data.id,
      name: data.name,
      hoursPerDay: Number(data.hours_per_day),
      daysPerMonth: Number(data.days_per_month),
      monthlySalary: Number(data.monthly_salary),
      monthlyHours: Number(data.monthly_hours),
      dailySalary: Number(data.daily_salary),
      hourlyRate: Number(data.hourly_rate),
      paymentDate: (data as any).payment_date || null,
      lastUpdated: data.last_updated,
    };

    setWorkers(prev => [...prev, newWorker].sort((a, b) => a.name.localeCompare(b.name)));

    // Sync with transactions
    await syncTransaction({
      userId: session.user.id,
      sourceId: data.id,
      sourceType: 'worker',
      type: 'expense',
      description: `Mano de obra: ${workerData.name}`,
      amount: workerData.monthlySalary,
      category: 'mano de obra',
      date: workerData.paymentDate || new Date().toISOString(),
    });
  }, [session?.user]);

  const updateWorker = useCallback(async (id: string, updates: Partial<Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>>) => {
    if (!session?.user) return;

    const existing = workers.find(w => w.id === id);
    if (!existing) return;

    const updatedBase = { ...existing, ...updates };
    const calculated = calculateWorkerValues(updatedBase);

    const { error } = await supabase
      .from('workers')
      .update({
        name: calculated.name,
        hours_per_day: calculated.hoursPerDay,
        days_per_month: calculated.daysPerMonth,
        monthly_salary: calculated.monthlySalary,
        monthly_hours: calculated.monthlyHours,
        daily_salary: calculated.dailySalary,
        hourly_rate: calculated.hourlyRate,
        payment_date: calculated.paymentDate || null,
        last_updated: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating worker:', error);
      return;
    }

    setWorkers(prev => prev.map(worker => {
      if (worker.id !== id) return worker;
      return { ...calculated, lastUpdated: new Date().toISOString() };
    }));

    // Sync with transactions
    await syncTransaction({
      userId: session.user.id,
      sourceId: id,
      sourceType: 'worker',
      type: 'expense',
      description: `Mano de obra: ${calculated.name}`,
      amount: calculated.monthlySalary,
      category: 'mano de obra',
      date: calculated.paymentDate || new Date().toISOString(),
    });
  }, [session?.user, workers]);

  const deleteWorker = useCallback(async (id: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting worker:', error);
      return;
    }

    setWorkers(prev => prev.filter(w => w.id !== id));
    await deleteTransactionBySource(session.user.id, id, 'worker');
  }, [session?.user]);

  const getTotalHourlyRate = useCallback(() => {
    return workers.reduce((sum, w) => sum + w.hourlyRate, 0);
  }, [workers]);

  const getAverageHourlyRate = useCallback(() => {
    if (workers.length === 0) return 0;
    return getTotalHourlyRate() / workers.length;
  }, [workers, getTotalHourlyRate]);

  const getTotalMonthlyHours = useCallback(() => {
    return workers.reduce((sum, w) => sum + w.monthlyHours, 0);
  }, [workers]);

  const getLaborCostPerHour = useCallback(() => {
    return getAverageHourlyRate();
  }, [getAverageHourlyRate]);

  // Filter workers by the last registered month (based on paymentDate)
  const getLastMonthWorkers = useCallback(() => {
    const workersWithDate = workers.filter(w => w.paymentDate);
    if (workersWithDate.length === 0) return workers; // fallback to all
    
    // Find the latest payment date
    const latestDate = workersWithDate.reduce((latest, w) => {
      const d = new Date(w.paymentDate!);
      return d > latest ? d : latest;
    }, new Date(0));
    
    const latestYear = latestDate.getFullYear();
    const latestMonth = latestDate.getMonth();
    
    // Filter workers whose paymentDate falls in that month
    return workersWithDate.filter(w => {
      const d = new Date(w.paymentDate!);
      return d.getFullYear() === latestYear && d.getMonth() === latestMonth;
    });
  }, [workers]);

  const getLastMonthLaborCostPerHour = useCallback(() => {
    const filtered = getLastMonthWorkers();
    if (filtered.length === 0) return 0;
    const totalSalary = filtered.reduce((sum, w) => sum + w.monthlySalary, 0);
    const totalHours = filtered.reduce((sum, w) => sum + w.monthlyHours, 0);
    return totalHours > 0 ? totalSalary / totalHours : 0;
  }, [getLastMonthWorkers]);

  const getLastMonthTotalHours = useCallback(() => {
    const filtered = getLastMonthWorkers();
    return filtered.reduce((sum, w) => sum + w.monthlyHours, 0);
  }, [getLastMonthWorkers]);

  const getLastMonthLabel = useCallback(() => {
    const workersWithDate = workers.filter(w => w.paymentDate);
    if (workersWithDate.length === 0) return '';
    
    const latestDate = workersWithDate.reduce((latest, w) => {
      const d = new Date(w.paymentDate!);
      return d > latest ? d : latest;
    }, new Date(0));
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${monthNames[latestDate.getMonth()]} ${latestDate.getFullYear()}`;
  }, [workers]);

  const refreshWorkers = useCallback(async () => {
    await loadWorkers();
  }, [loadWorkers]);

  return (
    <LaborContext.Provider value={{
      workers,
      isLoading,
      addWorker,
      updateWorker,
      deleteWorker,
      getTotalHourlyRate,
      getAverageHourlyRate,
      getTotalMonthlyHours,
      getLaborCostPerHour,
      getLastMonthLaborCostPerHour,
      getLastMonthTotalHours,
      getLastMonthLabel,
      refreshWorkers,
    }}>
      {children}
    </LaborContext.Provider>
  );
}

export function useLabor() {
  const context = useContext(LaborContext);
  if (!context) {
    throw new Error('useLabor must be used within a LaborProvider');
  }
  return context;
}

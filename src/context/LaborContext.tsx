import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Worker {
  id: string;
  name: string;
  hoursPerDay: number;
  daysPerMonth: number;
  monthlyHours: number; // Autocalculado
  monthlySalary: number;
  dailySalary: number; // Autocalculado
  hourlyRate: number; // Autocalculado
  lastUpdated: string;
}

interface LaborContextType {
  workers: Worker[];
  addWorker: (worker: Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>) => void;
  updateWorker: (id: string, updates: Partial<Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>>) => void;
  deleteWorker: (id: string) => void;
  getTotalHourlyRate: () => number;
  getAverageHourlyRate: () => number;
  getTotalMonthlyHours: () => number;
}

const LaborContext = createContext<LaborContextType | undefined>(undefined);

// Función para calcular los valores derivados
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

const STORAGE_KEY = 'dolce-calcolo-workers';

export function LaborProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
  }, [workers]);

  const addWorker = (workerData: Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>) => {
    const newWorker = calculateWorkerValues({
      ...workerData,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString(),
    });
    setWorkers(prev => [...prev, newWorker]);
  };

  const updateWorker = (id: string, updates: Partial<Omit<Worker, 'id' | 'monthlyHours' | 'dailySalary' | 'hourlyRate' | 'lastUpdated'>>) => {
    setWorkers(prev => prev.map(worker => {
      if (worker.id !== id) return worker;
      const updatedBase = {
        ...worker,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      return calculateWorkerValues(updatedBase);
    }));
  };

  const deleteWorker = (id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
  };

  const getTotalHourlyRate = () => {
    return workers.reduce((sum, w) => sum + w.hourlyRate, 0);
  };

  const getAverageHourlyRate = () => {
    if (workers.length === 0) return 0;
    return getTotalHourlyRate() / workers.length;
  };

  const getTotalMonthlyHours = () => {
    return workers.reduce((sum, w) => sum + w.monthlyHours, 0);
  };

  return (
    <LaborContext.Provider value={{
      workers,
      addWorker,
      updateWorker,
      deleteWorker,
      getTotalHourlyRate,
      getAverageHourlyRate,
      getTotalMonthlyHours,
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

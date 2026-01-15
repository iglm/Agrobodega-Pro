
import React, { createContext, useContext, useMemo } from 'react';
import { BudgetPlan, Sale, FinanceLog } from '../types';
import { useData } from './DataContext';

interface FinanceContextType {
  budgets: BudgetPlan[];
  sales: Sale[];
  financeLogs: FinanceLog[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data } = useData();

  const value = useMemo(() => ({
    budgets: data.budgets,
    sales: data.sales,
    financeLogs: data.financeLogs
  }), [data.budgets, data.sales, data.financeLogs]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

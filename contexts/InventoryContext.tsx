
import React, { createContext, useContext, useMemo } from 'react';
import { InventoryItem, Movement, Supplier } from '../types';
import { useData } from './DataContext';

interface InventoryContextType {
  inventory: InventoryItem[];
  movements: Movement[];
  suppliers: Supplier[];
  // Specific Actions could be exposed here
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data } = useData();

  const value = useMemo(() => ({
    inventory: data.inventory,
    movements: data.movements,
    suppliers: data.suppliers
  }), [data.inventory, data.movements, data.suppliers]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
};


import React, { createContext, useContext, useMemo } from 'react';
import { CostCenter, LaborLog, Personnel, Activity, RainLog, PhenologyLog, PestLog, SoilAnalysis } from '../types';
import { useData } from './DataContext';

interface FarmContextType {
  costCenters: CostCenter[];
  laborLogs: LaborLog[];
  personnel: Personnel[];
  activities: Activity[];
  rainLogs: RainLog[];
  phenologyLogs: PhenologyLog[];
  pestLogs: PestLog[];
  soilAnalyses: SoilAnalysis[];
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data } = useData();

  const value = useMemo(() => ({
    costCenters: data.costCenters,
    laborLogs: data.laborLogs,
    personnel: data.personnel,
    activities: data.activities,
    rainLogs: data.rainLogs,
    phenologyLogs: data.phenologyLogs,
    pestLogs: data.pestLogs,
    soilAnalyses: data.soilAnalyses
  }), [data]);

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) throw new Error('useFarm must be used within a FarmProvider');
  return context;
};

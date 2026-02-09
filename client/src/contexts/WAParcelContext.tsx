import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface WAParcelData {
  countyName: string;
  features: any[];
  bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
  parcelCount: number;
  loadedAt: Date;
}

interface WAParcelContextType {
  loadedParcels: WAParcelData | null;
  setLoadedParcels: (data: WAParcelData | null) => void;
  clearLoadedParcels: () => void;
}

const WAParcelContext = createContext<WAParcelContextType | undefined>(undefined);

export function WAParcelProvider({ children }: { children: ReactNode }) {
  const [loadedParcels, setLoadedParcels] = useState<WAParcelData | null>(null);

  const clearLoadedParcels = () => setLoadedParcels(null);

  return (
    <WAParcelContext.Provider value={{ loadedParcels, setLoadedParcels, clearLoadedParcels }}>
      {children}
    </WAParcelContext.Provider>
  );
}

export function useWAParcels() {
  const context = useContext(WAParcelContext);
  if (context === undefined) {
    throw new Error('useWAParcels must be used within a WAParcelProvider');
  }
  return context;
}

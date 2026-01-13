import { createContext, useContext, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface GlobalSimulationContextType {
  isRevalRunning: boolean;
  startReval: () => void;
  revalProgress: number;
  totalParcelsProcessed: number;
  systemResonance: number;
  ingestData: (data: any[]) => void;
  realData: any[];
  hasRealData: boolean;
}

const GlobalSimulationContext = createContext<GlobalSimulationContextType | undefined>(undefined);

export function GlobalSimulationProvider({ children }: { children: ReactNode }) {
  const [isRevalRunning, setIsRevalRunning] = useState(false);
  const [revalProgress, setRevalProgress] = useState(0);
  const [totalParcelsProcessed, setTotalParcelsProcessed] = useState(0);
  const [systemResonance, setSystemResonance] = useState(12.000);
  const [realData, setRealData] = useState<any[]>([]);

  const bulkCreateParcelsMutation = trpc.parcels.bulkCreate.useMutation();
  const deleteAllParcelsMutation = trpc.parcels.deleteAll.useMutation();
  const { data: backendParcels, refetch: refetchParcels } = trpc.parcels.list.useQuery();

  const ingestData = async (data: any[]) => {
    // Clear existing data first
    await deleteAllParcelsMutation.mutateAsync();
    
    // Transform and upload data in bulk
    const parcelsToUpload = data.map(parcel => ({
      parcelId: parcel.parcelId || parcel.id || String(Math.random()),
      address: parcel.address,
      latitude: String(parcel.latitude || parcel.lat || 0),
      longitude: String(parcel.longitude || parcel.lng || 0),
      landValue: parcel.landValue || parcel.land_value,
      buildingValue: parcel.buildingValue || parcel.building_value,
      totalValue: parcel.totalValue || parcel.total_value,
      squareFeet: parcel.squareFeet || parcel.square_feet,
      yearBuilt: parcel.yearBuilt || parcel.year_built,
      propertyType: parcel.propertyType || parcel.property_type,
      neighborhood: parcel.neighborhood,
      cluster: parcel.cluster,
    }));
    
    await bulkCreateParcelsMutation.mutateAsync({ parcels: parcelsToUpload });
    
    // Refresh data from backend
    await refetchParcels();
    setRealData(data);
    setTotalParcelsProcessed(data.length);
    const qualityScore = Math.min(12, 9 + (data.length > 0 ? 3 : 0));
    setSystemResonance(qualityScore);
  };

  const startReval = () => {
    setIsRevalRunning(true);
    setRevalProgress(0);
    
    // Simulate revaluation process
    const interval = setInterval(() => {
      setRevalProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRevalRunning(false);
          setTotalParcelsProcessed(prevTotal => prevTotal + 50000);
          setSystemResonance(12.000); // Reset to perfect balance
          return 100;
        }
        // Randomly fluctuate resonance during processing
        setSystemResonance(11.8 + Math.random() * 0.4);
        return prev + 2;
      });
    }, 100);
  };

  return (
    <GlobalSimulationContext.Provider value={{ 
      isRevalRunning, 
      startReval, 
      revalProgress, 
      totalParcelsProcessed,
      systemResonance,
      ingestData,
      realData,
      hasRealData: realData.length > 0
    }}>
      {children}
    </GlobalSimulationContext.Provider>
  );
}

export function useGlobalSimulation() {
  const context = useContext(GlobalSimulationContext);
  if (context === undefined) {
    throw new Error("useGlobalSimulation must be used within a GlobalSimulationProvider");
  }
  return context;
}

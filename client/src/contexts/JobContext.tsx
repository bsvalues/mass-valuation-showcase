import React, { createContext, useContext, useState, ReactNode } from 'react';

interface JobContextType {
  isDrawerOpen: boolean;
  activeJobId: number | null;
  openDrawer: (jobId?: number) => void;
  closeDrawer: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);

  const openDrawer = (jobId?: number) => {
    if (jobId) setActiveJobId(jobId);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // Don't clear activeJobId immediately to allow smooth closing animation
    setTimeout(() => setActiveJobId(null), 300);
  };

  return (
    <JobContext.Provider value={{ isDrawerOpen, activeJobId, openDrawer, closeDrawer }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobDrawer() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobDrawer must be used within a JobProvider');
  }
  return context;
}

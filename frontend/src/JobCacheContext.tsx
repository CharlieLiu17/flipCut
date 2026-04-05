import { createContext, useContext, useRef } from "react";

interface JobData {
  status: string;
  url?: string;
}

const JobCacheContext = createContext<React.MutableRefObject<Map<string, JobData>> | null>(null);

export function JobCacheProvider({ children }: { children: React.ReactNode }) {
  const cache = useRef(new Map<string, JobData>());
  return <JobCacheContext.Provider value={cache}>{children}</JobCacheContext.Provider>;
}

export function useJobCache() {
  const cache = useContext(JobCacheContext)!;
  return {
    get: (jobId: string) => cache.current.get(jobId),
    set: (jobId: string, data: JobData) => cache.current.set(jobId, data),
  };
}

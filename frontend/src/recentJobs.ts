const STORAGE_KEY = "flipcut-recent-jobs";
const MAX_JOBS = 20;

export interface RecentJob {
  jobId: string;
  createdAt: string;
  thumbnail?: string;
}

export function getRecentJobs(): RecentJob[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addRecentJob(jobId: string, thumbnail?: string): void {
  const jobs = getRecentJobs().filter((j) => j.jobId !== jobId);
  jobs.unshift({ jobId, createdAt: new Date().toISOString(), thumbnail });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, MAX_JOBS)));
}

export function removeRecentJob(jobId: string): void {
  const jobs = getRecentJobs().filter((j) => j.jobId !== jobId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function createThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const h = 40;
      const w = Math.round((img.width / img.height) * h);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.src = dataUrl;
  });
}

const STORAGE_KEY = "flipcut-recent-jobs";

export interface RecentJob {
  jobId: string;
  createdAt: string;
  thumbnail?: string;
  filename?: string;
}

export function getRecentJobs(): RecentJob[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addRecentJob(jobId: string, thumbnail?: string, filename?: string): void {
  const jobs = getRecentJobs().filter((j) => j.jobId !== jobId);
  jobs.unshift({ jobId, createdAt: new Date().toISOString(), thumbnail, filename });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function updateRecentJobThumbnail(jobId: string, thumbnail: string): void {
  const jobs = getRecentJobs();
  const job = jobs.find((j) => j.jobId === jobId);
  if (job) {
    job.thumbnail = thumbnail;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }
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
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

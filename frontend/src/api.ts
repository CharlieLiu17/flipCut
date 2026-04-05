import { API_BASE } from "./constants";

export async function uploadImage(file: File): Promise<{ jobId: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch(`${API_BASE}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, mimeType: file.type, filename: file.name }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
  return res.json();
}

export async function getJob(jobId: string): Promise<{ status: string; url?: string }> {
  const res = await fetch(`${API_BASE}/images?jobId=${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/images?jobId=${jobId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

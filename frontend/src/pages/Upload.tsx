import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { uploadImage, deleteJob } from "../api";
import { addRecentJob, getRecentJobs, removeRecentJob, createThumbnail } from "../recentJobs";
import { HiOutlineTrash } from "react-icons/hi";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider";
import { ConfirmModal } from "../components/ConfirmModal";
import { JobRow } from "../components/JobRow";
import beforeImg from "../assets/before.jpg";
import afterImg from "../assets/after.png";

const MAX_FILES = 10;

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface ActiveJob { jobId: string; filename: string; thumbnail?: string; }

export function Upload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [successMsgs, setSuccessMsgs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentJobs, setRecentJobs] = useState(getRecentJobs);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const allDone = activeJobs.length > 0 && doneIds.size === activeJobs.length;

  async function deleteRecent(jobId: string) {
    setConfirmDeleteId(null);
    try { await deleteJob(jobId); } catch { /* ignore */ }
    removeRecentJob(jobId);
    setRecentJobs(getRecentJobs());
  }

  function handleJobDone(jobId: string) {
    setDoneIds((prev) => new Set(prev).add(jobId));
    const job = activeJobs.find((j) => j.jobId === jobId);
    const name = job?.filename ?? jobId.slice(0, 8);
    setSuccessMsgs((prev) => [...prev, `✓ ${name} processed successfully!`]);
    setTimeout(() => setSuccessMsgs((prev) => prev.slice(1)), 10000);
    setRecentJobs(getRecentJobs());
  }

  async function processFiles(files: File[]) {
    const valid = files.filter((f) =>
      ["image/png", "image/jpeg", "image/webp"].includes(f.type) && f.size <= 10 * 1024 * 1024
    );
    if (valid.length === 0) { setError("No valid images selected (PNG/JPG/WebP, max 10 MB)"); return; }
    if (valid.length > MAX_FILES) { setError(`Max ${MAX_FILES} files at a time`); return; }

    setUploading(true);
    setError("");
    setActiveJobs([]);
    setDoneIds(new Set());

    const jobs: ActiveJob[] = [];
    await Promise.all(valid.map(async (file) => {
      try {
        const { jobId } = await uploadImage(file);
        const thumbnail = await createThumbnail(await readDataUrl(file));
        addRecentJob(jobId, thumbnail, file.name);
        const job = { jobId, filename: file.name, thumbnail };
        jobs.push(job);
        setActiveJobs((prev) => [...prev, job]);
      } catch {
        setError((prev) => prev ? prev : `Failed to upload ${file.name}`);
      }
    }));

    setRecentJobs(getRecentJobs());
    setUploading(false);
  }

  function readDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target?.result as string);
      r.readAsDataURL(file);
    });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) processFiles(Array.from(e.target.files));
  }

  function resetToUpload() {
    setActiveJobs([]);
    setDoneIds(new Set());
    setSuccessMsgs([]);
    setUploading(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    setRecentJobs(getRecentJobs());
  }

  return (
    <>
      {error && <div className="error-banner visible">{error}</div>}
      {successMsgs.map((msg, i) => (
        <div key={i} className="success-banner">
          {msg}
          <button className="success-dismiss" onClick={() => setSuccessMsgs((prev) => prev.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}

      {confirmDeleteId && (
        <ConfirmModal
          message="Are you sure? This will permanently delete the image."
          onConfirm={() => deleteRecent(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {activeJobs.length === 0 && (
        <p className="value-body" style={{ marginBottom: "1.5rem" }}>
          Drop your images — we'll remove the background, flip them right, and hand them back in seconds. Ready for your listing, your socials, or your portfolio.
        </p>
      )}

      {activeJobs.length > 0 ? (
        <>
          <div className="recent-jobs">
            <div className="recent-jobs-title">{allDone ? "Processed" : "Processing"}</div>
            {activeJobs.map((job) => (
              <JobRow key={job.jobId} jobId={job.jobId} filename={job.filename} thumbnail={job.thumbnail} onDone={handleJobDone} />
            ))}
          </div>
          {allDone && (
            <button className="btn-upload visible" onClick={resetToUpload} style={{ marginTop: "1rem" }}>
              Want to upload more?
            </button>
          )}
        </>
      ) : (
        <div
          className={`upload-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onChange} style={{ display: "none" }} />
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="upload-label">
            <strong>Drop your images here</strong>
            or click to browse
          </div>
          <div className="file-types">PNG · JPG · WEBP · Up to {MAX_FILES} files</div>
          {uploading && <div style={{ marginTop: 8, color: "#999" }}>Uploading…</div>}
        </div>
      )}

      {recentJobs.length > 0 && (
        <div className="recent-jobs">
          <div className="recent-jobs-title">Your Images</div>
          {recentJobs.map((job) => (
            <div key={job.jobId} className="recent-job">
              <Link to={`/job/${job.jobId}`} className="recent-job-link">
                {job.thumbnail && <img className="recent-job-thumb" src={job.thumbnail} alt="" />}
                <div className="recent-job-info">
                  <span className="recent-job-id">{job.filename ?? job.jobId.slice(0, 8) + "…"}</span>
                  <span className="recent-job-date">{timeAgo(job.createdAt)}</span>
                </div>
              </Link>
              <button className="btn-delete-recent" onClick={() => setConfirmDeleteId(job.jobId)} title="Delete from server"><HiOutlineTrash /></button>
            </div>
          ))}
        </div>
      )}

      <div className="value-card">
        <p className="value-headline">Great photos shouldn't need Photoshop.</p>
      </div>

      <div className="how-it-works">
        <div className="how-it-works-title">How it works</div>
        <div className="how-it-works-steps">
          <div className="how-step">
            <span className="how-step-num">1</span>
            <span>Upload your product photos</span>
          </div>
          <div className="how-step">
            <span className="how-step-num">2</span>
            <span>We remove the background and flip each image</span>
          </div>
          <div className="how-step">
            <span className="how-step-num">3</span>
            <span>Download, copy, or share — done in seconds</span>
          </div>
        </div>
        <p className="how-note">
          Accepts PNG, JPG, and WebP up to 10 MB each. Output is always a transparent PNG — perfect for e-commerce listings, social media, and print.
        </p>
      </div>

      <BeforeAfterSlider before={beforeImg} after={afterImg} />
    </>
  );
}

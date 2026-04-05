import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { uploadImage, deleteJob } from "../api";
import { addRecentJob, getRecentJobs, removeRecentJob, createThumbnail } from "../recentJobs";
import { HiOutlineTrash } from "react-icons/hi";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider";
import { ConfirmModal } from "../components/ConfirmModal";
import beforeImg from "../assets/before.jpg";
import afterImg from "../assets/after.png";

function formatBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return Math.round(b / 1024) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState(getRecentJobs);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function removeRecent(jobId: string) {
    removeRecentJob(jobId);
    setRecentJobs(getRecentJobs());
  }

  async function deleteRecent(jobId: string) {
    setConfirmDeleteId(null);
    try {
      await deleteJob(jobId);
    } catch { /* ignore if already deleted */ }
    removeRecentJob(jobId);
    setRecentJobs(getRecentJobs());
  }

  function onFile(f: File) {
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setThumb(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) onFile(e.target.files[0]);
  }

  function clear() {
    setFile(null);
    setThumb("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { jobId } = await uploadImage(file);
      const thumbnail = thumb ? await createThumbnail(thumb) : undefined;
      addRecentJob(jobId, thumbnail);
      navigate(`/job/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  return (
    <>
      {error && <div className="error-banner visible">{error}</div>}

      {confirmDeleteId && (
        <ConfirmModal
          message="Are you sure? This will permanently delete the image from our servers."
          onConfirm={() => deleteRecent(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {!file ? (
        <div
          className={`upload-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onChange} style={{ display: "none" }} />
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="upload-label">
            <strong>Drop your image here</strong>
            or click to browse
          </div>
          <div className="file-types">PNG · JPG · WEBP</div>
        </div>
      ) : (
        <>
          <div className="selected-file visible">
            <img className="file-thumb" src={thumb} alt="" />
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatBytes(file.size)}</div>
            </div>
            <button className="btn-clear" onClick={clear} disabled={uploading}>×</button>
          </div>
          <button className="btn-upload visible" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading…" : "Process image →"}
          </button>
        </>
      )}
      {recentJobs.length > 0 && (
        <div className="recent-jobs">
          <div className="recent-jobs-title">Recent</div>
          {recentJobs.map((job) => (
            <div key={job.jobId} className="recent-job">
              <Link to={`/job/${job.jobId}`} className="recent-job-link">
                {job.thumbnail && <img className="recent-job-thumb" src={job.thumbnail} alt="" />}
                <div className="recent-job-info">
                  <span className="recent-job-id">{job.jobId.slice(0, 8)}…</span>
                  <span className="recent-job-date">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
              <button className="btn-delete-recent" onClick={() => setConfirmDeleteId(job.jobId)} title="Delete from server"><HiOutlineTrash /></button>
              <button className="btn-clear-recent" onClick={() => removeRecent(job.jobId)} title="Remove from history">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="value-card">
        <p className="value-headline">Great photos shouldn't need Photoshop.</p>
        <p className="value-body">
          Drop your image — we'll remove the background, flip it right, and hand it back in seconds. Ready for your listing, your socials, or your portfolio.
        </p>
      </div>

      <div className="how-it-works">
        <div className="how-it-works-title">How it works</div>
        <div className="how-it-works-steps">
          <div className="how-step">
            <span className="how-step-num">1</span>
            <span>Upload a product photo</span>
          </div>
          <div className="how-step">
            <span className="how-step-num">2</span>
            <span>We remove the background and flip the image</span>
          </div>
          <div className="how-step">
            <span className="how-step-num">3</span>
            <span>Download, copy, or share — done in seconds</span>
          </div>
        </div>
        <p className="how-note">
          Accepts PNG, JPG, and WebP up to 10 MB. Output is always a transparent PNG — perfect for e-commerce listings, social media, and print.
        </p>
      </div>

      <BeforeAfterSlider
        before={beforeImg}
        after={afterImg}
      />
    </>
  );
}

import { useEffect, useState, useRef } from "react";
import { getJob, deleteJob } from "../api";
import { ProgressBar } from "./ProgressBar";
import { ConfirmModal } from "./ConfirmModal";
import { ErrorBanner, type ErrorType } from "./ErrorBanner";
import { POLL_INTERVAL_MS, MAX_POLLS, STATUS_LABELS, APP_BASE, COPIED_FEEDBACK_MS } from "../constants";
import { HiOutlineDownload, HiOutlineClipboardCopy, HiOutlineTrash, HiOutlineShare } from "react-icons/hi";
import { useJobCache } from "../JobCacheContext";
import { removeRecentJob, updateRecentJobThumbnail, getRecentJobs } from "../recentJobs";

interface Props {
  jobId: string;
  onDeleted?: () => void;
  onDone?: () => void;
}

export function ResultPanel({ jobId, onDeleted, onDone }: Props) {
  const cache = useJobCache();
  const cached = cache.get(jobId);
  const [status, setStatus] = useState(cached?.status ?? "uploaded");
  const [imageUrl, setImageUrl] = useState(cached?.url ?? "");
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    if (status === "done") return;
    pollCount.current = 0;
    const interval = setInterval(async () => {
      pollCount.current++;

      if (pollCount.current > MAX_POLLS) {
        clearInterval(interval);
        setError({ type: "timeout", message: "Processing timed out. Please try again." });
        return;
      }

      try {
        const data = await getJob(jobId);
        setStatus(data.status);
        cache.set(jobId, data);
        if (data.status === "done" && data.url) {
          clearInterval(interval);
          setImageUrl(data.url);
          onDone?.();
        }
      } catch {
        /* keep polling */
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [jobId]);

  async function handleDelete() {
    setShowConfirm(false);
    try {
      await deleteJob(jobId);
      removeRecentJob(jobId);
      onDeleted?.();
    } catch {
      setError({ type: "delete", message: "Delete failed. Please try again." });
    }
  }

  async function handleDownload() {
    if (!imageUrl) return;
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `flipcut-${jobId}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleCopy() {
    if (!imageUrl) return;
    try {
      const data = await fetch(imageUrl);
      const blob = await data.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
    } catch {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  const label = STATUS_LABELS[status] ?? status;

  const filename = getRecentJobs().find((j) => j.jobId === jobId)?.filename;
  const originalThumb = getRecentJobs().find((j) => j.jobId === jobId)?.thumbnail;
  const shareUrl = `${APP_BASE}/#/job/${jobId}`;

  return (
    <>
      {error && <ErrorBanner type={error.type} message={error.message} onDismiss={() => setError(null)} />}

      {showConfirm && (
        <ConfirmModal
          message="Are you sure? This will permanently delete the image."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="result-panel visible">
        {filename && <div className="result-filename">{filename}</div>}
        <div className={`result-image-wrap${status === "done" ? " checkered" : ""}`}>
          {status !== "done" && (
            <div className="result-loading">
              {originalThumb && <img className="result-img result-img-blur" src={originalThumb} alt="Processing preview" />}
              <div className="result-loading-overlay">
                <div className="result-loading-label">{label}</div>
                <ProgressBar status={status} />
              </div>
            </div>
          )}
          {status === "done" && <img className="result-img result-img-reveal" src={imageUrl} alt="Processed result" onLoad={() => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const h = 80;
              const w = Math.round((img.naturalWidth / img.naturalHeight) * h);
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
              updateRecentJobThumbnail(jobId, canvas.toDataURL("image/png"));
            };
            img.src = imageUrl;
          }} />}
        </div>
        <div className="result-footer">
          <button className="btn-share" onClick={() => { setShowShare(true); setLinkCopied(false); }} disabled={status !== "done"}>
            <HiOutlineShare /> <span>Share</span>
          </button>
          <button className="btn-download" onClick={handleDownload} disabled={status !== "done"}>
            <HiOutlineDownload /> <span>Download</span>
          </button>
          <button className="btn-copy" onClick={handleCopy} disabled={status !== "done"}>
            <HiOutlineClipboardCopy /> <span>{copied ? "Copied!" : "Copy Image"}</span>
          </button>
          <button className="btn-delete" onClick={() => setShowConfirm(true)}>
            <HiOutlineTrash /> <span>Delete</span>
          </button>
        </div>
      </div>

      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)} role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-label="Share link" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") setShowShare(false); }}>
            <button className="modal-x" onClick={() => setShowShare(false)} aria-label="Close">×</button>
            <div className="modal-title">Share link</div>
            <div className="share-field">
              <input className="share-input" readOnly value={shareUrl} aria-label="Share URL" autoFocus />
              <button className="share-copy-btn" onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), COPIED_FEEDBACK_MS);
              }}>{linkCopied ? "Copied!" : "Copy"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useState, useRef } from "react";
import { getJob, deleteJob } from "../api";
import { ProgressBar } from "./ProgressBar";
import { ConfirmModal } from "./ConfirmModal";
import { POLL_INTERVAL_MS, MAX_POLLS, STATUS_LABELS } from "../constants";
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
  const [error, setError] = useState("");
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
        setError("Processing timed out. Please try again.");
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
      setError("Delete failed. Please try again.");
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
    setTimeout(() => setCopied(false), 1500);
  }

  const label = STATUS_LABELS[status] ?? status;

  const filename = getRecentJobs().find((j) => j.jobId === jobId)?.filename;

  return (
    <>
      {error && <div className="error-banner visible">{error}</div>}

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
              <div className="result-loading-label">{label}</div>
              <ProgressBar status={status} />
            </div>
          )}
          {status === "done" && <img className="result-img" src={imageUrl} alt="Processed result" onLoad={() => {
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
            <HiOutlineShare /> Share
          </button>
          <button className="btn-download" onClick={handleDownload} disabled={status !== "done"}>
            <HiOutlineDownload /> Download
          </button>
          <button className="btn-copy" onClick={handleCopy} disabled={status !== "done"}>
            <HiOutlineClipboardCopy /> {copied ? "Copied!" : "Copy Image"}
          </button>
          <button className="btn-delete" onClick={() => setShowConfirm(true)}>
            <HiOutlineTrash /> Delete
          </button>
        </div>
      </div>

      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setShowShare(false)}>×</button>
            <div className="modal-title">Share link</div>
            <div className="share-field">
              <input className="share-input" readOnly value={imageUrl} />
              <button className="share-copy-btn" onClick={async () => {
                await navigator.clipboard.writeText(imageUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}>{linkCopied ? "Copied!" : "Copy"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

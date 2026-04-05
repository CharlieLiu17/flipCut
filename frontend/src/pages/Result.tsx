import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJob, deleteJob } from "../api";
import { Spinner } from "../components/Spinner";
import { ConfirmModal } from "../components/ConfirmModal";
import { POLL_INTERVAL_MS, MAX_POLLS, STATUS_LABELS } from "../constants";
import { HiOutlineDownload, HiOutlineClipboardCopy, HiOutlineTrash } from "react-icons/hi";
import { useJobCache } from "../JobCacheContext";
import { removeRecentJob } from "../recentJobs";

export function Result() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const cache = useJobCache();
  const cached = jobId ? cache.get(jobId) : undefined;
  const [status, setStatus] = useState(cached?.status ?? "uploaded");
  const [imageUrl, setImageUrl] = useState(cached?.url ?? "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!jobId || status === "done") return;
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
        }
      } catch {
        /* keep polling */
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [jobId]);

  async function handleDelete() {
    if (!jobId) return;
    setShowConfirm(false);
    try {
      await deleteJob(jobId);
      removeRecentJob(jobId);
      navigate("/");
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

  return (
    <>
      {error && <div className="error-banner visible">{error}</div>}

      {showConfirm && (
        <ConfirmModal
          message="Are you sure? This will permanently delete the image from our servers."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="result-panel visible">
        <div className="result-image-wrap checkered">
          {status !== "done" && <Spinner label={label} />}
          {status === "done" && <img className="result-img" src={imageUrl} alt="Processed result" />}
        </div>
        <div className="result-footer">
          <div className="result-url">{status === "done" ? imageUrl : label}</div>
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
    </>
  );
}

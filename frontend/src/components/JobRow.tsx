import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getJob } from "../api";
import { useJobCache } from "../JobCacheContext";
import { updateRecentJobThumbnail } from "../recentJobs";
import { POLL_INTERVAL_MS, MAX_POLLS, STATUS_LABELS } from "../constants";
import { ProgressBar } from "./ProgressBar";

interface Props {
  jobId: string;
  filename: string;
  thumbnail?: string;
  onDone: (jobId: string) => void;
}

export function JobRow({ jobId, filename, thumbnail, onDone }: Props) {
  const cache = useJobCache();
  const cached = cache.get(jobId);
  const [status, setStatus] = useState(cached?.status ?? "uploaded");
  const [error, setError] = useState("");
  const [showBar, setShowBar] = useState(true);
  const pollCount = useRef(0);
  const done = status === "done";

  useEffect(() => {
    if (done) return;
    const interval = setInterval(async () => {
      pollCount.current++;
      if (pollCount.current > MAX_POLLS) {
        clearInterval(interval);
        setError("Timed out");
        return;
      }
      try {
        const data = await getJob(jobId);
        setStatus(data.status);
        cache.set(jobId, data);
        if (data.status === "done" && data.url) {
          clearInterval(interval);
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const h = 80;
            const w = Math.round((img.naturalWidth / img.naturalHeight) * h);
            const c = document.createElement("canvas");
            c.width = w; c.height = h;
            c.getContext("2d")!.drawImage(img, 0, 0, w, h);
            updateRecentJobThumbnail(jobId, c.toDataURL("image/png"));
          };
          img.src = data.url;
          onDone(jobId);
          setTimeout(() => setShowBar(false), 600);
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [jobId, done]);

  return (
    <div className="recent-job">
      <Link to={`/job/${jobId}`} target="_blank" className="recent-job-link">
        {thumbnail && <img className="recent-job-thumb" src={thumbnail} alt="" />}
        <div className="recent-job-info" style={{ flex: 1 }}>
          <div className="recent-job-id-row">
            <span className="recent-job-id">{filename}</span>
            <span className="recent-job-date">{error || (STATUS_LABELS[status] ?? status)}</span>
          </div>
          {(!done || showBar) && !error && <ProgressBar status={status} />}
        </div>
        <div className="job-row-status">
          {error ? <span className="job-row-error">✕</span> :
           (done && !showBar) ? <span className="job-row-check">✓</span> : null}
        </div>
      </Link>
    </div>
  );
}

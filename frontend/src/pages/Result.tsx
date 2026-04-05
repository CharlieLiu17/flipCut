import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJob, deleteJob } from "../api";
import { Spinner } from "../components/Spinner";
import { POLL_INTERVAL_MS, MAX_POLLS, POLL_LABELS } from "../constants";

export function Result() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "done" | "error">("processing");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [labelIdx, setLabelIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      pollCount.current++;
      if (pollCount.current % 4 === 0) setLabelIdx((i) => (i + 1) % POLL_LABELS.length);

      if (pollCount.current > MAX_POLLS) {
        clearInterval(interval);
        setStatus("error");
        setError("Processing timed out. Please try again.");
        return;
      }

      try {
        const data = await getJob(jobId);
        if (data.status === "done" && data.url) {
          clearInterval(interval);
          setImageUrl(data.url);
          setStatus("done");
        }
      } catch {
        /* keep polling */
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [jobId]);

  async function handleDelete() {
    if (!jobId) return;
    try {
      await deleteJob(jobId);
      navigate("/");
    } catch {
      setError("Delete failed. Please try again.");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(imageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      {error && <div className="error-banner visible">{error}</div>}

      <div className="result-panel visible">
        <div className="result-image-wrap checkered">
          {status === "processing" && <Spinner label={POLL_LABELS[labelIdx]} />}
          {status === "done" && <img className="result-img" src={imageUrl} alt="Processed result" />}
        </div>
        <div className="result-footer">
          <div className="result-url">{status === "done" ? imageUrl : "Processing…"}</div>
          <button className="btn-copy" onClick={handleCopy} disabled={status !== "done"}>
            {copied ? "Copied!" : "Copy URL"}
          </button>
          <button className="btn-delete" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </>
  );
}

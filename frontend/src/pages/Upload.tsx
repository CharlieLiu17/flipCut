import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../api";

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
      navigate(`/job/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  return (
    <>
      {error && <div className="error-banner visible">{error}</div>}

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
    </>
  );
}

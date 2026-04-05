export const API_BASE = "https://api.flipcut.org";
export const POLL_INTERVAL_MS = 2000;
export const MAX_POLLS = 30;

export const STATUS_LABELS: Record<string, string> = {
  uploaded: "Image uploaded…",
  finding_input: "Locating file…",
  downloading: "Preparing image…",
  removing_background: "Removing background…",
  flipping: "Flipping image…",
  uploading_result: "Saving to cloud…",
  done: "Done!",
};

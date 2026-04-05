export const API_BASE = "https://api.flipcut.org";
export const POLL_INTERVAL_MS = 2000;
export const MAX_POLLS = 30;

export const STATUS_LABELS: Record<string, string> = {
  uploaded: "Loading…",
  finding_input: "Locating file…",
  downloading: "Preparing image…",
  removing_background: "Removing background…",
  flipping: "Flipping image…",
  uploading_result: "Saving to cloud…",
  done: "Done!",
};

export const STATUS_PROGRESS: Record<string, number> = {
  uploaded: 5,
  finding_input: 15,
  downloading: 30,
  removing_background: 55,
  flipping: 75,
  uploading_result: 90,
  done: 100,
};

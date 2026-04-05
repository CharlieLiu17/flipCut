import { useParams, useNavigate } from "react-router-dom";
import { ResultPanel } from "../components/ResultPanel";

export function Result() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  if (!jobId) return null;

  return <ResultPanel jobId={jobId} onDeleted={() => navigate("/")} />;
}

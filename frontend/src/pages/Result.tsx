import { useParams, useNavigate, Link } from "react-router-dom";
import { ResultPanel } from "../components/ResultPanel";

export function Result() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  if (!jobId) return null;

  return (
    <>
      <Link to="/" className="back-link">← <span>Back</span></Link>
      <ResultPanel jobId={jobId} onDeleted={() => navigate("/?deleted=1")} />
    </>
  );
}

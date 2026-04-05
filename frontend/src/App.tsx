import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { Upload } from "./pages/Upload";
import { Result } from "./pages/Result";
import { JobCacheProvider } from "./JobCacheContext";

export function App() {
  return (
    <HashRouter>
      <JobCacheProvider>
        <div className="app-wrap">
          <header className="header">
            <Link to="/" className="header-link">
              <div className="wordmark">Flip<em>Cut</em></div>
            </Link>
            <div className="tagline">Remove background. Flip. Share. Done.</div>
          </header>
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/job/:jobId" element={<Result />} />
          </Routes>
        </div>
      </JobCacheProvider>
    </HashRouter>
  );
}

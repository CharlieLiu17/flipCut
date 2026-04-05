import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { Upload } from "./pages/Upload";
import { Result } from "./pages/Result";
import { JobCacheProvider } from "./JobCacheContext";
import favicon from "./assets/favicon.png";

export function App() {
  return (
    <HashRouter>
      <JobCacheProvider>
        <nav className="navbar">
          <Link to="/" className="navbar-link">
            <img className="navbar-icon" src={favicon} alt="FlipCut" />
          </Link>
        </nav>
        <div className="app-wrap">
          <header className="header">
            <div className="wordmark">Flip<em>Cut</em></div>
            <div className="tagline">Mirror. Remove background. Share. Done.</div>
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

import { HashRouter, Routes, Route } from "react-router-dom";
import { Upload } from "./pages/Upload";
import { Result } from "./pages/Result";

export function App() {
  return (
    <HashRouter>
      <div className="app-wrap">
        <header className="header">
          <div className="wordmark">Flip<em>Cut</em></div>
          <div className="tagline">Remove background. Flip. Share. Done.</div>
        </header>
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/job/:jobId" element={<Result />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

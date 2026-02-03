import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PollPage from "./pages/PollPage";
import MatchesPage from "./pages/MatchesPage";
import RankingPage from "./pages/RankingPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/poll/:pollId" element={<PollPage />} />
        <Route path="/poll/:pollId/matches" element={<MatchesPage />} />
        <Route path="/poll/:pollId/ranking" element={<RankingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

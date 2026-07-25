import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Upload from './pages/Upload';
import StoryMemory from './pages/StoryMemory';
import Review from './pages/Review';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-verse-black">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/memory" element={<StoryMemory />} />
            <Route path="/review" element={<Review />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

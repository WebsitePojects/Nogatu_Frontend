import { Routes, Route } from 'react-router-dom';
import LandingLayout from './LandingLayout';
import Home from './pages/Home';
import About from './pages/About';
import Opportunities from './pages/Opportunities';
import News from './pages/News';
import Contact from './pages/Contact';

export default function LandingApp() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/news" element={<News />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

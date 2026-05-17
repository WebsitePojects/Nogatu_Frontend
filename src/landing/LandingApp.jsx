import { Routes, Route } from 'react-router-dom';
import LandingLayout from './LandingLayout';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import News from './pages/News';
import Organizations from './pages/Organizations';
import Certifications from './pages/Certifications';
import Contact from './pages/Contact';
import Join from './pages/Join';

export default function LandingApp() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/news" element={<News />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/certifications" element={<Certifications />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/join/:token" element={<Join />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

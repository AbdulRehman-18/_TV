import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import LogoTicker from './components/LogoTicker';
import Solutions from './components/Solutions';
import HowItWorks from './components/HowItWorks';
import CTA from './components/CTA';
import Footer from './components/Footer';
import FadeIn from './components/ui/FadeIn';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-brand-purple selection:text-white">
      <Navbar />
      <main>
        <FadeIn><Hero /></FadeIn>
        <FadeIn><LogoTicker /></FadeIn>
        <FadeIn><Features /></FadeIn>
        <FadeIn><HowItWorks /></FadeIn>
        <FadeIn><Solutions /></FadeIn>
        <FadeIn><CTA /></FadeIn>
      </main>
      <FadeIn><Footer /></FadeIn>
    </div>
  );
};

export default App;
import React from 'react';
import Navbar from '@/Landing/components/Navbar';
import Hero from '@/Landing/components/Hero';
import Features from '@/Landing/components/Features';
import LogoTicker from '@/Landing/components/LogoTicker';
import Solutions from '@/Landing/components/Solutions';
import HowItWorks from '@/Landing/components/HowItWorks';
import CTA from '@/Landing/components/CTA';
import Footer from '@/Landing/components/Footer';
import FadeIn from '@/Landing/components/ui/FadeIn';

export function Landing() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-gray-900 font-sans selection:bg-purple-300 selection:text-white">
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
}

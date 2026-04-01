import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from './ui/Icons';
import { useAuth } from '@/hooks/useAuth';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="w-full bg-[#FFFDF9] py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 transition-all duration-300 border-b border-transparent shadow-sm">
      <a href="#" className="hover:opacity-80 transition">
        <Logo />
      </a>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-8 font-medium text-sm text-gray-800">
        <a href="#features" className="hover:text-black transition">Features</a>
        <a href="#how-it-works" className="hover:text-black transition">How it works</a>
        <a href="#solutions" className="hover:text-black transition">Use Cases</a>
        <a href="#contact" className="hover:text-black transition">Support</a>
      </div>

      <div className="hidden lg:flex items-center gap-4">
        {user ? (
          <a href={`/${user.role}`} className="bg-black text-white rounded px-5 py-2 text-sm font-bold hover:bg-gray-800 transition-colors">
            Dashboard
          </a>
        ) : (
          <>
            <a href="/login" className="font-bold text-sm hover:underline">Login</a>
            <a href="/login?signup=true" className="border-2 border-black rounded px-5 py-2 text-sm font-bold hover:bg-black hover:text-white transition-colors">
              Get Started
            </a>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-xl flex flex-col p-6 gap-4 lg:hidden border-b-2 border-gray-100 z-50">
           <a href="#features" className="font-medium" onClick={() => setIsOpen(false)}>Features</a>
           <a href="#how-it-works" className="font-medium" onClick={() => setIsOpen(false)}>How it works</a>
           <a href="#solutions" className="font-medium" onClick={() => setIsOpen(false)}>Use Cases</a>
           <a href="#contact" className="font-medium" onClick={() => setIsOpen(false)}>Support</a>
           <hr className="my-2"/>
           {user ? (
             <a href={`/${user.role}`} className="bg-black text-white rounded px-5 py-3 text-sm font-bold text-center" onClick={() => setIsOpen(false)}>
               Dashboard
             </a>
           ) : (
             <>
               <a href="/login" className="font-bold text-left">Login</a>
               <a href="/login?signup=true" className="bg-black text-white rounded px-5 py-3 text-sm font-bold text-center" onClick={() => setIsOpen(false)}>
                 Get Started
               </a>
             </>
           )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
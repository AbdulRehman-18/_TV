import React from 'react';
import { Logo } from './ui/Icons';
import { Twitter, Instagram, Linkedin, ArrowUpRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white pt-24 pb-12 relative overflow-hidden" id="contact">
      
      {/* Tech Accent: Top Gradient Border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-24">
          
          {/* Brand Column */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="mb-8">
                <Logo className="h-7 w-auto text-black" /> 
            </div>
            
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-10 font-normal tracking-wide">
              SignSphere reimagines digital signage. 
              <span className="block mt-2 text-gray-400 font-mono text-xs">
                // CLOUD_NATIVE // HARDWARE_AGNOSTIC
              </span>
            </p>

            <div className="flex gap-2">
                <SocialLink href="#" icon={<Twitter size={16} />} />
                <SocialLink href="#" icon={<Instagram size={16} />} />
                <SocialLink href="#" icon={<Linkedin size={16} />} />
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Links Column 1 */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[11px] text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-100 pb-2 inline-block">System</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#solutions">Compatibility</FooterLink>
              <FooterLink href="#solutions">Templates</FooterLink>
              <FooterLink href="#changelog" isNew>Changelog</FooterLink>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[11px] text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-100 pb-2 inline-block">Docs</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <FooterLink href="#">Setup Guide</FooterLink>
              <FooterLink href="#">Hardware List</FooterLink>
              <FooterLink href="#">API Access</FooterLink>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[11px] text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-100 pb-2 inline-block">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <FooterLink href="#">About</FooterLink>
              <FooterLink href="#contact">Contact</FooterLink>
              <FooterLink href="#">Privacy</FooterLink>
              <FooterLink href="#">Terms</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-mono text-gray-400 uppercase tracking-tight">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-gray-600">All Systems Operational</span>
            </div>
            
            <div className="flex gap-8 items-center">
                <span>© {new Date().getFullYear()} SignSphere.Inc</span>
                <span className="hidden md:block w-px h-3 bg-gray-200"></span>
                <span className="hover:text-black transition-colors cursor-pointer">Build 2.0.4</span>
            </div>
        </div>
      </div>
    </footer>
  );
};

// --- Sub Components ---

const FooterLink = ({ href, children, isNew }: { href: string; children: React.ReactNode, isNew?: boolean }) => (
  <li className="group">
    <a 
      href={href} 
      className="flex items-center hover:text-black transition-all duration-200 group-hover:translate-x-1"
    >
      {children}
      {/* Arrow appears and slides in on hover */}
      <ArrowUpRight size={12} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-gray-400" />
      
      {isNew && (
        <span className="ml-2 px-1.5 py-0.5 rounded-[2px] text-[9px] bg-gray-100 text-gray-600 font-mono border border-gray-200 uppercase tracking-wide">
          New
        </span>
      )}
    </a>
  </li>
);

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
  <a 
    href={href} 
    className="w-9 h-9 flex items-center justify-center text-gray-400 bg-white border border-gray-200 rounded-md hover:bg-black hover:text-white hover:border-black transition-all duration-300"
  >
    {icon}
  </a>
);

export default Footer;
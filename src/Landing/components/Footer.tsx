import React from 'react';
import { Logo } from './ui/Icons';
import { Twitter, Instagram, Linkedin, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-gray-100" id="contact">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          
          {/* Brand Column */}
          <div className="col-span-2">
            <Logo className="mb-6 scale-110 origin-left" />
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              SignSphere is the easiest way for colleges and schools to manage corridor digital signage. 
              Ditch the USB sticks and go cloud-native today.
            </p>
            <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <Linkedin size={18} />
                </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-black transition">Features</a></li>
              <li><a href="#solutions" className="hover:text-black transition">Compatibility</a></li>
              <li><a href="#solutions" className="hover:text-black transition">Templates</a></li>
              <li><a href="#get-started" className="hover:text-black transition">Pricing</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black transition">Setup Guide</a></li>
              <li><a href="#" className="hover:text-black transition">Hardware List</a></li>
              <li><a href="#" className="hover:text-black transition">Help Center</a></li>
              <li><a href="#" className="hover:text-black transition">API Docs</a></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black transition">About Us</a></li>
              <li><a href="#contact" className="hover:text-black transition">Contact</a></li>
              <li><a href="#" className="hover:text-black transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-black transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <p>© 2024 SignSphere Systems. Built for Campus Life.</p>
            <div className="flex gap-6">
                <span>Made with ♥ for easier announcements</span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
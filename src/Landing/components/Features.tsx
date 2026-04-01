import React from 'react';
import { WorkspaceMockup } from './ui/Mockups';
import { ArrowRight, Monitor } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-white scroll-mt-28" id="features">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <div className="space-y-8">
            <span className="inline-block bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded text-xs tracking-wide">
                #RemoteControl
            </span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Manage every corridor screen from one place
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
                Whether it's the Main Hall, Canteen, or Library, control what plays where. 
                Group screens by location and update specific content for specific departments without leaving your desk.
            </p>
            <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                         <Monitor size={16} />
                     </div>
                     <span className="font-bold text-gray-800">Main Building Displays</span>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                         <Monitor size={16} />
                     </div>
                     <span className="font-bold text-gray-800">Science Block TVs</span>
                 </div>
            </div>
            <button className="flex items-center gap-2 border-2 border-black rounded px-6 py-3 font-bold text-sm hover:bg-black hover:text-white transition group mt-4">
                View all features
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </button>
        </div>

        {/* Right Visual */}
        <div className="bg-[#D4AAFF] rounded-xl p-8 md:p-12 relative shadow-card overflow-hidden min-h-[400px] flex items-center justify-center">
             {/* Decorative abstract elements */}
             <div className="absolute top-4 right-4 text-black opacity-50">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
             </div>
             <div className="absolute bottom-8 left-8 font-mono text-2xl font-bold tracking-widest opacity-20 rotate-90">
                 TV+
             </div>

             {/* Mockup */}
             <div className="w-full relative z-10 transform transition hover:scale-105 duration-300">
                <WorkspaceMockup />
             </div>
        </div>

      </div>
    </section>
  );
};

export default Features;
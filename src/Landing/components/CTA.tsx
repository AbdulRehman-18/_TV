import React from 'react';
import { ArrowRight } from 'lucide-react';

const CTA: React.FC = () => {
  return (
    <section className="py-24 bg-[#FFF6D1] border-t-2 border-black scroll-mt-28" id="get-started">
      <div className="max-w-4xl mx-auto px-6 text-center">
        
        <div className="mb-8 relative inline-block">
             <div className="absolute -top-6 -right-8 transform rotate-12 hidden md:block">
                <div className="bg-white border-2 border-black px-3 py-1 rounded-lg text-xs font-bold shadow-hard">
                    No credit card required
                </div>
             </div>
             <h2 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Ready to throw away <br/> your pen drives?
            </h2>
        </div>

        <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join the corridor revolution. Upload content from your dorm, the library, or the cafeteria. 
          Update your department's TV instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="bg-black text-white px-8 py-4 rounded-lg font-bold text-lg shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 group border-2 border-transparent">
            Get Started for Free
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 rounded-lg font-bold text-lg border-2 border-black hover:bg-white transition-colors">
            Book a Demo
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500 font-medium">
            Compatible with any TV connected to a Raspberry Pi or Mini PC.
        </p>
      </div>
    </section>
  );
};

export default CTA;
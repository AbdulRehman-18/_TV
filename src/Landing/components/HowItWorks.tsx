import React from 'react';
import { Upload, Calendar, Tv } from 'lucide-react';

const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50 scroll-mt-28" id="how-it-works">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">3 Steps to Live Display</h2>
          <p className="text-gray-600">It really is that simple. No IT degree required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gray-200 -z-10 border-t-2 border-dashed border-gray-300"></div>

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-white rounded-full border-2 border-black flex items-center justify-center mb-6 shadow-card group-hover:-translate-y-2 transition-transform duration-300">
               <div className="bg-purple-100 p-3 rounded-full">
                  <Upload size={32} className="text-purple-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold mb-2">1. Upload</h3>
            <p className="text-gray-500 text-sm max-w-[250px]">
              Drag and drop your poster, video, or announcement text into the dashboard.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-white rounded-full border-2 border-black flex items-center justify-center mb-6 shadow-card group-hover:-translate-y-2 transition-transform duration-300 delay-100">
               <div className="bg-yellow-100 p-3 rounded-full">
                  <Calendar size={32} className="text-yellow-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold mb-2">2. Schedule</h3>
            <p className="text-gray-500 text-sm max-w-[250px]">
              Choose which screen to play it on and for how long. Set start and end dates.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-white rounded-full border-2 border-black flex items-center justify-center mb-6 shadow-card group-hover:-translate-y-2 transition-transform duration-300 delay-200">
               <div className="bg-blue-100 p-3 rounded-full">
                  <Tv size={32} className="text-blue-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold mb-2">3. Go Live</h3>
            <p className="text-gray-500 text-sm max-w-[250px]">
              The content instantly syncs to your corridor TV. No refresh needed.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
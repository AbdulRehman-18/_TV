import React from 'react';
import { MediaFormatsMockup, BroadcastMockup } from './ui/Mockups';
import { Layers, Zap } from 'lucide-react';

const Solutions: React.FC = () => {
  return (
    <section className="py-24 bg-white scroll-mt-28" id="solutions">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
            <span className="inline-block bg-[#FFF6D1] text-yellow-800 font-bold px-4 py-1 rounded text-sm mb-6">
                #AnythingPlays
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">One Platform, Any Media</h2>
            <p className="max-w-2xl mx-auto text-gray-600">
                Stop converting files or worrying about compatibility. SignSphere handles almost everything you throw at it.
            </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-1 gap-8">
            
            {/* Pink Card - Media Types */}
            <div className="bg-[#FDEAF6] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                    <div className="w-12 h-12 bg-pink-300 rounded-lg flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Layers className="text-black" size={24} />
                    </div>
                    <h3 className="text-3xl font-bold">Images, Videos, PDFs & Audio</h3>
                    <p className="text-gray-700 leading-relaxed">
                        Need to show a poster for the Cultural Fest? A teaser video? Or just a PDF of the exam seating arrangement? 
                        Just drag and drop. We optimize it for the TV automatically.
                    </p>
                     <ul className="grid grid-cols-2 gap-2 text-sm font-medium text-gray-600">
                        <li className="flex items-center gap-2">✓ MP4 Videos</li>
                        <li className="flex items-center gap-2">✓ JPG/PNG Posters</li>
                        <li className="flex items-center gap-2">✓ PDF Notices</li>
                        <li className="flex items-center gap-2">✓ Background Music</li>
                     </ul>
                </div>
                <div className="flex-1 w-full flex justify-center bg-white/50 rounded-xl p-4 md:p-8">
                     <MediaFormatsMockup />
                </div>
            </div>

            {/* Yellow Card - Urgent Alerts */}
            <div className="bg-[#FFF6D1] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center mt-8">
                <div className="flex-1 space-y-6 md:order-last">
                     <div className="hidden md:block">
                         {/* Content spacer for desktop order flip */}
                     </div>
                </div>
                
                 <div className="flex-1 space-y-6">
                    <div className="w-12 h-12 bg-yellow-300 rounded-lg flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Zap className="text-black" size={24} />
                    </div>
                    <h3 className="text-3xl font-bold">Instant Emergency Broadcasts</h3>
                    <p className="text-gray-700 leading-relaxed">
                        Rain holiday declared? Guest speaker arriving early? Override all screens instantly with a breaking news ticker or full-screen announcement. 
                        Directly from your phone.
                    </p>
                     <button className="bg-transparent border-2 border-black text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-white transition">
                        See it in action
                    </button>
                </div>

                <div className="flex-1 w-full flex justify-center bg-white/50 rounded-xl p-4 md:p-8 relative">
                     <div className="absolute top-4 right-4 bg-white border border-black rounded-lg p-2 shadow-hard z-20">
                         <div className="text-[10px] font-bold text-red-500 flex items-center gap-1">● LIVE</div>
                         <div className="text-[10px] text-gray-500">Broadcasting to 12 screens</div>
                     </div>
                     <BroadcastMockup />
                </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default Solutions;
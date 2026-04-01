import React from 'react';
import { MainDashboardMockup } from './ui/Mockups';
import { AvatarFace1, AvatarFace2, AvatarFace3 } from './ui/Icons';

const Hero: React.FC = () => {
  return (
    <section className="relative w-full pt-16 pb-32 overflow-hidden bg-[#FFFDF9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Floating Shapes - Left */}
        <div className="absolute top-0 left-[5%] lg:left-[10%] hidden md:block animate-bounce" style={{ animationDuration: '3s' }}>
             <div className="w-24 h-12 bg-red-400 rounded-b-full relative overflow-hidden flex items-end justify-center">
                 <AvatarFace1 className="w-16 h-16 relative top-2" />
             </div>
        </div>
        <div className="absolute top-28 left-[15%] hidden md:block animate-pulse">
            <div className="w-16 h-16 bg-yellow-300 rotate-45 flex items-center justify-center border-2 border-transparent">
               <AvatarFace2 className="w-12 h-12 -rotate-45" />
            </div>
        </div>

        {/* Floating Shapes - Right */}
        <div className="absolute top-0 right-[10%] hidden md:block animate-bounce" style={{ animationDuration: '4s' }}>
             <div className="w-0 h-0 border-l-[30px] border-l-transparent border-b-[50px] border-b-brand-blue border-r-[30px] border-r-transparent relative">
                  <AvatarFace3 className="w-10 h-10 absolute -left-5 top-2" />
             </div>
        </div>
         <div className="absolute top-32 right-[15%] hidden md:block animate-pulse">
             <div className="w-20 h-10 bg-brand-purple rounded-t-full relative flex justify-center">
                <AvatarFace1 className="w-12 h-12 relative -top-2" />
             </div>
        </div>


        {/* Text Content */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          Update Corridor TVs <br/>
          <span className="inline-block bg-[#FFF6D1] border-2 border-black rounded-full px-4 py-1 relative -rotate-1 mx-2">Instantly</span>
          Without Pen Drives
        </h1>
        
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload announcements, event videos, or exam schedules from your phone or laptop. 
          Display them on any college corridor TV in seconds. No more running around with USB sticks.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button className="bg-black text-white px-8 py-3.5 rounded font-bold text-sm shadow-lg hover:bg-gray-800 transition transform hover:-translate-y-0.5">
            Start free for your college
          </button>
          <button className="bg-transparent border-2 border-black text-black px-8 py-3.5 rounded font-bold text-sm hover:bg-gray-50 transition">
            See how it works
          </button>
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto">
             <div className="relative z-10 transform md:rotate-1 hover:rotate-0 transition duration-500 ease-out">
                <MainDashboardMockup />
             </div>
             
             {/* Floating Badge on Dashboard */}
             <div className="absolute -right-4 top-1/3 z-20 hidden lg:block">
                 <div className="bg-brand-orange w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-lg animate-bounce border-2 border-white">
                     <span className="text-[10px] font-bold">LIVE</span>
                     <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                 </div>
             </div>
        </div>
      </div>

      {/* Background divider */}
      <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </section>
  );
};

export default Hero;
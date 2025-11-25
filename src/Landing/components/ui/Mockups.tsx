import React from 'react';
import { Image, Play, Clock, Monitor, Bell, Settings, Upload, FileVideo, FileImage, Mic } from 'lucide-react';

export const MainDashboardMockup = () => (
  <div className="w-full bg-white rounded-xl border-2 border-gray-900 shadow-card overflow-hidden select-none">
    {/* Browser Header */}
    <div className="bg-white border-b-2 border-gray-100 p-3 flex items-center justify-between">
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="flex-1 mx-4 bg-gray-50 rounded-md h-6 border border-gray-200 flex items-center px-2 text-xs text-gray-400">
        admin.signsphere.edu/dashboard
      </div>
    </div>
    
    {/* Toolbar */}
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg">Main Corridor TV</h3>
            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online
            </span>
        </div>
        <div className="flex gap-3 text-gray-400">
            <Upload size={16} className="text-black" />
            <Bell size={16} />
            <Settings size={16} />
            <button className="text-xs bg-black text-white rounded-md px-3 py-1 font-bold">Update TV</button>
        </div>
    </div>

    {/* Content Area */}
    <div className="flex h-[350px]">
        {/* Sidebar - Playlist */}
        <div className="w-64 border-r border-gray-100 p-4 flex flex-col gap-3 bg-gray-50/50">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Playlist</h4>
            
            {/* Playing Now */}
            <div className="bg-white p-3 rounded-lg border-l-4 border-l-green-500 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><Play size={8}/> PLAYING NOW</span>
                    <span className="text-[10px] text-gray-400">02:30</span>
                </div>
                <div className="font-bold text-xs text-gray-800">Welcome Freshers 2024</div>
                <div className="text-[10px] text-gray-500">Video • 1080p</div>
            </div>

            {/* Up Next */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 opacity-60">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500">UP NEXT</span>
                    <span className="text-[10px] text-gray-400">15 sec</span>
                </div>
                <div className="font-bold text-xs text-gray-800">Exam Schedule - Sem 4</div>
                <div className="text-[10px] text-gray-500">Image • JPG</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 opacity-60">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500">IN QUEUE</span>
                    <span className="text-[10px] text-gray-400">05:00</span>
                </div>
                <div className="font-bold text-xs text-gray-800">Campus Tour Guide</div>
                <div className="text-[10px] text-gray-500">Video • MP4</div>
            </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center relative overflow-hidden">
             {/* TV Frame */}
             <div className="bg-black p-2 rounded-xl shadow-2xl w-full max-w-md relative">
                <div className="bg-gray-800 aspect-video rounded-lg overflow-hidden relative group">
                    {/* Simulated Content */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-purple to-brand-blue opacity-20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h1 className="text-white text-2xl font-bold drop-shadow-md text-center">WELCOME<br/>CLASS OF 2028</h1>
                    </div>
                    {/* TV UI Overlay */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <div className="bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">HD</div>
                    </div>
                </div>
                <div className="h-1 w-12 bg-gray-700 mx-auto mt-1 rounded-full"></div>
             </div>
        </div>

        {/* Right Panel - Stats */}
        <div className="w-56 border-l border-gray-100 p-4 bg-white">
            <h4 className="text-xs font-bold mb-3">Device Stats</h4>
            <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                    <div className="text-[10px] text-blue-600 font-bold mb-1">STORAGE</div>
                    <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-3/4"></div>
                    </div>
                    <div className="text-[10px] text-blue-400 mt-1 text-right">75% Full</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-50 p-2 rounded border border-purple-100 text-center">
                        <div className="text-lg font-bold text-purple-600">24°C</div>
                        <div className="text-[8px] text-purple-400">TEMP</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded border border-orange-100 text-center">
                        <div className="text-lg font-bold text-orange-600">98%</div>
                        <div className="text-[8px] text-orange-400">UPTIME</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
);

export const WorkspaceMockup = () => (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-900 w-full max-w-sm mx-auto overflow-hidden">
        <div className="bg-gray-100 p-2 flex items-center gap-2 border-b border-gray-200">
             <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
             </div>
             <div className="flex-1 bg-white h-5 rounded border border-gray-300"></div>
        </div>
        <div className="flex h-64">
             {/* Sidebar */}
             <div className="w-14 border-r border-gray-100 flex flex-col items-center py-3 gap-3 bg-gray-50">
                 <div className="w-8 h-8 rounded bg-brand-blue border border-blue-300 flex items-center justify-center">
                    <Monitor size={16} className="text-white"/>
                 </div>
                 <div className="w-8 h-8 rounded bg-white border border-gray-200"></div>
                 <div className="w-8 h-8 rounded bg-white border border-gray-200"></div>
             </div>
             {/* Content */}
             <div className="flex-1 p-4 bg-white relative">
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-gray-400">TV Locations</span>
                      <div className="w-5 h-5 bg-brand-blue rounded-full flex items-center justify-center text-white text-[10px]">+</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2 flex justify-between items-center">
                      <div className="text-[10px] font-bold text-gray-500">Main Corridor</div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                   <div className="bg-gray-800 p-3 rounded-lg border border-gray-900 mb-2 flex justify-between items-center transform scale-105 shadow-md">
                      <div>
                          <div className="text-[10px] font-bold text-white">Canteen Hall</div>
                          <div className="text-[8px] text-gray-400">Playing: Lunch Menu</div>
                      </div>
                       <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2 flex justify-between items-center">
                      <div className="text-[10px] font-bold text-gray-500">Library Entrance</div>
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  </div>

                  {/* Absolute character */}
                  <div className="absolute -right-6 bottom-8 w-20 h-20 bg-yellow-300 border-2 border-black rounded-full p-1 rotate-[-10deg] shadow-lg flex items-center justify-center z-10">
                       <span className="text-[10px] font-bold text-center leading-tight">Control<br/>Any TV!</span>
                  </div>
             </div>
        </div>
    </div>
);

export const MediaFormatsMockup = () => (
    <div className="flex gap-4 h-48 items-center p-4">
        {/* Video Card */}
        <div className="w-28 h-32 bg-white rounded-lg shadow-card border border-gray-200 p-3 flex flex-col gap-2 rotate-[-6deg] hover:rotate-0 transition-all duration-300">
             <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                <FileVideo size={16} />
             </div>
             <div className="h-1 w-12 bg-gray-200 rounded"></div>
             <div className="text-[10px] text-gray-500 mt-auto">MP4, MOV</div>
        </div>
        
        {/* Image Card */}
        <div className="w-28 h-36 bg-white rounded-lg shadow-card border border-gray-200 p-3 flex flex-col gap-2 z-10 hover:-translate-y-2 transition-all duration-300">
             <div className="w-full h-20 bg-blue-50 rounded border border-blue-100 overflow-hidden relative">
                <Image className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-300" size={24}/>
             </div>
             <div className="flex justify-between items-center">
                <div className="h-1 w-8 bg-gray-200 rounded"></div>
                <div className="text-[8px] font-bold text-blue-600 bg-blue-100 px-1 rounded">JPG</div>
             </div>
        </div>
        
        {/* Audio/Other Card */}
        <div className="w-28 h-32 bg-white rounded-lg shadow-card border border-gray-200 p-3 flex flex-col gap-2 rotate-[6deg] hover:rotate-0 transition-all duration-300">
             <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                <Mic size={16} />
             </div>
             <div className="h-1 w-10 bg-gray-200 rounded"></div>
             <div className="text-[10px] text-gray-500 mt-auto">Audio & PDF</div>
        </div>
    </div>
);

export const BroadcastMockup = () => (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-[280px] mx-auto p-4 rotate-[2deg]">
        <div className="bg-red-50 border border-red-100 p-2 rounded mb-4 flex items-start gap-2">
            <Bell size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
                <div className="text-[10px] font-bold text-red-700">Urgent Broadcast</div>
                <div className="text-[9px] text-red-500">Overrides current playlist</div>
            </div>
        </div>
        
        <div className="space-y-3">
             <div className="bg-gray-100 p-2 rounded-lg rounded-tr-none ml-auto w-[90%]">
                 <div className="text-[10px] text-gray-700">
                    <span className="font-bold">Principal:</span> Heavy rains expected. Classes suspended after 2 PM.
                 </div>
             </div>
             
             <div className="flex justify-end">
                 <button className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 hover:bg-red-600 transition">
                    Broadcast Now <Upload size={10} />
                 </button>
             </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] text-gray-400">Active on 3 screens</span>
             </div>
        </div>
    </div>
);
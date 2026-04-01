import React from 'react';

export const AvatarFace1: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="white" stroke="black" strokeWidth="3"/>
    <path d="M30 65 Q50 80 70 65" stroke="black" strokeWidth="3" fill="none"/>
    <circle cx="35" cy="45" r="4" fill="black"/>
    <circle cx="65" cy="45" r="4" fill="black"/>
    <path d="M30 35 Q50 25 70 35" stroke="black" strokeWidth="3" fill="none"/>
    <path d="M20 50 L10 55" stroke="black" strokeWidth="3"/> 
    <path d="M80 50 L90 55" stroke="black" strokeWidth="3"/>
  </svg>
);

export const AvatarFace2: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="white" stroke="black" strokeWidth="3"/>
    <path d="M35 70 Q50 60 65 70" stroke="black" strokeWidth="3" fill="none"/>
    <circle cx="40" cy="45" r="5" fill="black"/>
    <circle cx="60" cy="45" r="5" fill="black"/>
    <path d="M35 30 L65 30" stroke="black" strokeWidth="3"/>
    <rect x="35" y="30" width="30" height="10" fill="black" opacity="0.1"/>
  </svg>
);

export const AvatarFace3: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
     <circle cx="50" cy="50" r="45" fill="white" stroke="black" strokeWidth="3"/>
     <path d="M30 60 Q50 85 70 60" stroke="black" strokeWidth="3" fill="none"/>
     <path d="M25 40 Q35 30 45 40" stroke="black" strokeWidth="3" fill="none"/>
     <path d="M55 40 Q65 30 75 40" stroke="black" strokeWidth="3" fill="none"/>
     <circle cx="35" cy="45" r="3" fill="black"/>
     <circle cx="65" cy="45" r="3" fill="black"/>
  </svg>
);

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center gap-2 font-bold text-xl tracking-tight ${className}`}>
    <div className="relative w-8 h-8">
      <div className="absolute top-0 left-0 w-4 h-4 bg-brand-orange rounded-full mix-blend-multiply"></div>
      <div className="absolute top-0 right-0 w-4 h-4 bg-brand-blue rounded-full mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-1.5 w-4 h-4 bg-brand-purple rounded-full mix-blend-multiply"></div>
    </div>
    <span>SignSphere</span>
  </div>
);

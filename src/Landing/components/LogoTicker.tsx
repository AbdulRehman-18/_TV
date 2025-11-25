import React from 'react';

const logos = [
  "TESCO", "SONY", "Raiffeisen BANK", "Ogilvy", "O₂", "IKEA"
];

const LogoTicker: React.FC = () => {
  return (
    <section className="py-12 border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition duration-500">
         {logos.map((logo, index) => (
             <div key={index} className="font-bold text-xl md:text-2xl font-serif text-gray-800">
                 {logo}
             </div>
         ))}
      </div>
    </section>
  );
};

export default LogoTicker;
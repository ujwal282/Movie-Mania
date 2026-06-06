import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-zinc-900 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-white opacity-40 font-mono text-[10px] tracking-widest uppercase">
        <div>
          &copy; {new Date().getFullYear()} MOVIES MANIA. ALL RIGHTS RESERVED.
        </div>
        <div className="mt-4 md:mt-0 flex space-x-6">
          <span className="text-white opacity-50">COLLEGE PROJECT</span>
          <span className="text-white opacity-20">|</span>
          <span className="text-white opacity-50">Dynamic Pricing</span>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

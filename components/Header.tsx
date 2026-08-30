
import React from 'react';
import CapybaraLogo from './CapybaraLogo';

interface HeaderProps {
  onShowDocs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowDocs }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-40">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-zinc-950 text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl shadow-lg flex-shrink-0 overflow-hidden">
            <CapybaraLogo size={24} className="text-white" />
          </div>
          <h1 className="text-[32px] md:text-[40px] font-black tracking-tighter md:whitespace-normal pr-2 flex items-center">
            <span className="text-zinc-950">Digit</span><span className="text-indigo-500 font-bold">A11y</span>
          </h1>
        </div>
        
        <nav className="hidden sm:flex items-center gap-4 md:gap-8 text-[11px] md:text-sm font-black text-zinc-400 uppercase tracking-widest flex-shrink-0">
          <button onClick={onShowDocs} className="inline-flex items-center text-[12px] md:text-[15px] hover:text-indigo-500 transition-colors">How to Use</button>
          <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-indigo-500 transition-colors">WCAG 2.2 AA</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;

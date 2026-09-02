import React from 'react';

interface FooterProps {
  isReadingMode?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isReadingMode }) => {
  if (isReadingMode) return null;

  return (
    <footer className="w-full py-6 border-t border-zinc-200/60 mt-auto flex items-center justify-center select-none">
      <div className="text-[11px] font-mono text-zinc-400 tracking-wider flex items-center gap-2">
        <span className="uppercase tracking-[0.25em]">© 2026 K. CHEN</span>
        <span className="text-zinc-300" aria-hidden="true">•</span>
        <span className="text-zinc-500 font-mono" title="Julian Date">v{typeof __JULIAN_VERSION__ !== 'undefined' ? __JULIAN_VERSION__ : '2461284.02'}</span>
      </div>
    </footer>
  );
};

export default Footer;


import React from 'react';

interface FooterProps {
  isReadingMode?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isReadingMode }) => {
  if (isReadingMode) return null;

  return (
    <footer className="w-full py-6 border-t border-zinc-200/60 mt-auto flex items-center justify-center select-none">
      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.25em]">
        © 2026 K. CHEN
      </div>
    </footer>
  );
};

export default Footer;


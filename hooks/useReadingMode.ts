import { useState, useEffect } from 'react';

export function useReadingMode() {
  const [isReadingMode, setIsReadingMode] = useState<boolean>(() => {
    return localStorage.getItem('readingMode') === 'true';
  });
  const [highContrastTheme, setHighContrastTheme] = useState<string>(() => {
    return localStorage.getItem('highContrastTheme') || 'default';
  });
  const [textSize, setTextSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('readingTextSize') || '100');
  });
  const [fontPreference, setFontPreference] = useState<string>(() => {
    const saved = localStorage.getItem('readingFont');
    if (!saved || saved === 'sans') return 'inter';
    // If previously defaulted to atkinson without the user actively selecting it, migrate to inter
    if (saved === 'atkinson' && !localStorage.getItem('readingFont_user_selected')) {
      return 'inter';
    }
    return saved;
  });
  const [lineHeight, setLineHeight] = useState<string>(() => {
    return localStorage.getItem('readingLineHeight') || 'normal';
  });

  // Persist accessibility selections
  useEffect(() => {
    localStorage.setItem('readingMode', String(isReadingMode));
  }, [isReadingMode]);

  useEffect(() => {
    localStorage.setItem('highContrastTheme', highContrastTheme);
  }, [highContrastTheme]);

  useEffect(() => {
    localStorage.setItem('readingTextSize', String(textSize));
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('readingFont', fontPreference);
  }, [fontPreference]);

  useEffect(() => {
    localStorage.setItem('readingLineHeight', lineHeight);
  }, [lineHeight]);

  // Escape key to exit reading view
  useEffect(() => {
    if (!isReadingMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsReadingMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadingMode]);

  return {
    isReadingMode,
    setIsReadingMode,
    highContrastTheme,
    setHighContrastTheme,
    textSize,
    setTextSize,
    fontPreference,
    setFontPreference,
    lineHeight,
    setLineHeight
  };
}

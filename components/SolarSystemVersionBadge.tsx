import React, { useState, useMemo } from 'react';
import { getHeliocentricPlanets, getPlanetaryAlignmentSummary } from '../utils/astronomy';
import { formatJulianToGregorian } from '../utils/date';
import { SolarSystemOrreryModal } from './SolarSystemOrreryModal';

interface SolarSystemVersionBadgeProps {
  julianVersion?: string | number;
}

export const SolarSystemVersionBadge: React.FC<SolarSystemVersionBadgeProps> = ({
  julianVersion = typeof __JULIAN_VERSION__ !== 'undefined' ? __JULIAN_VERSION__ : '2461284.02',
}) => {
  const [showModal, setShowModal] = useState(false);

  const numericJD = useMemo(() => {
    const parsed = typeof julianVersion === 'number' ? julianVersion : parseFloat(String(julianVersion));
    return isNaN(parsed) ? 2461284.02 : parsed;
  }, [julianVersion]);

  const planets = useMemo(() => getHeliocentricPlanets(numericJD), [numericJD]);
  const gregorianDate = useMemo(() => formatJulianToGregorian(numericJD), [numericJD]);
  const alignmentSummary = useMemo(() => getPlanetaryAlignmentSummary(numericJD), [numericJD]);

  const tooltipText = `Planetary Alignment Version
Gregorian Date: ${gregorianDate || 'September 3, 2026'}
Alignment: ${alignmentSummary}
Julian Date: ${numericJD.toFixed(2)}
(Click to open interactive solar system orrery)`;

  // Scaled radii for the micro-glyph (24x24 SVG)
  const center = 12;
  const microRadii = [3.2, 5.2, 7.2, 9.2]; // Inner planets: Mercury, Venus, Earth, Mars

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title={tooltipText}
        aria-label={`Version: Gregorian Date ${gregorianDate}, Julian Date ${numericJD.toFixed(2)}, planetary alignment`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 transition-all text-zinc-600 hover:text-zinc-900 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        {/* Micro-Orrery Vector Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          className="shrink-0 transition-transform group-hover:scale-110"
          aria-hidden="true"
        >
          {/* Central Sun */}
          <circle cx={center} cy={center} r="1.8" fill="#f59e0b" />

          {/* Faint Orbit Lines */}
          {microRadii.map((r, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="#a1a1aa"
              strokeWidth="0.6"
              strokeDasharray="1.2 1.2"
              opacity="0.6"
            />
          ))}

          {/* Planet Dots at actual heliocentric angles */}
          {planets.slice(0, 4).map((p, i) => {
            const r = microRadii[i];
            const rad = (p.longitudeDeg * Math.PI) / 180;
            const px = center + r * Math.cos(rad);
            const py = center - r * Math.sin(rad);
            return (
              <circle
                key={p.name}
                cx={px}
                cy={py}
                r={i === 2 ? 1.2 : i === 3 ? 1.0 : 0.9}
                fill={p.color}
              />
            );
          })}
        </svg>

        {/* Planetary glyphs + version */}
        <span className="font-mono text-[11px] tracking-tight text-zinc-500 group-hover:text-zinc-700 flex items-center gap-1">
          <span className="hidden sm:inline opacity-75 font-sans font-medium">
            ☿ ♀ 🜨 ♂
          </span>
          <span className="font-bold font-mono">v{numericJD.toFixed(2)}</span>
        </span>
      </button>

      {/* Interactive Solar System Orrery Modal */}
      {showModal && (
        <SolarSystemOrreryModal
          julianDate={numericJD}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

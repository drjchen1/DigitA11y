import React, { useState, useEffect, useMemo } from 'react';
import { Orbit, X, Copy, Check, Play, Pause, RotateCcw, Info, Sparkles } from 'lucide-react';
import { getHeliocentricPlanets, PlanetPosition } from '../utils/astronomy';
import { formatJulianToGregorian } from '../utils/date';

interface SolarSystemOrreryModalProps {
  julianDate: number;
  onClose: () => void;
}

export const SolarSystemOrreryModal: React.FC<SolarSystemOrreryModalProps> = ({
  julianDate,
  onClose,
}) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedDaysOffset, setSimulatedDaysOffset] = useState(0);
  const [copied, setCopied] = useState(false);

  // Esc key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Simulation timer loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimulatedDaysOffset((prev) => prev + 1.5); // Advance ~1.5 earth days per tick
    }, 50);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const activeJulianDate = julianDate + simulatedDaysOffset;
  const planets = useMemo(() => getHeliocentricPlanets(activeJulianDate), [activeJulianDate]);
  const gregorianDate = formatJulianToGregorian(activeJulianDate);

  // Select Earth by default on first load
  useEffect(() => {
    if (!selectedPlanet && planets.length > 2) {
      setSelectedPlanet(planets[2]); // Earth
    }
  }, [planets, selectedPlanet]);

  // SVG dimensions & radius mapping
  const center = 200;
  // Aesthetic scaled radii so both inner and outer planets are comfortably visible
  const orbitRadii = [34, 58, 84, 114, 146, 174];

  const handleCopyStamp = () => {
    const alignmentText = planets
      .map((p) => `${p.symbol} ${Math.round(p.longitudeDeg)}° (${p.constellation})`)
      .join(' · ');
    const stamp = `DigitA11y Build Epoch: ${gregorianDate} (JD ${activeJulianDate.toFixed(2)}) | Solar Alignment: ${alignmentText}`;
    navigator.clipboard.writeText(stamp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-zinc-950/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="orrery-title"
    >
      <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Orbit className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="orrery-title" className="text-base font-bold text-white tracking-tight">
                  Cosmic Version Orrery
                </h2>
                <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                  Ephemeris Epoch
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Heliocentric planetary alignment recorded at build timestamp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close orrery dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-center lg:items-start">
          {/* Left / Orrery Canvas */}
          <div className="w-full lg:w-[440px] shrink-0 flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[400px] rounded-3xl bg-zinc-950 border border-zinc-800/80 p-3 shadow-inner overflow-hidden select-none">
              {/* Deep space radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />

              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
                role="img"
                aria-label="Interactive 2D top-down map of the solar system showing planetary orbital positions"
              >
                <defs>
                  {/* Sun Glow Filter */}
                  <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <radialGradient id="sun-radial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </radialGradient>
                </defs>

                {/* Ecliptic Reference Coordinate Rays */}
                <line x1={center} y1={20} x2={center} y2={380} stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                <line x1={20} y1={center} x2={380} y2={center} stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                <text x="375" y={center - 6} fill="#71717a" fontSize="10" fontFamily="monospace" textAnchor="end">
                  0° ♈
                </text>
                <text x={center + 6} y="32" fill="#71717a" fontSize="10" fontFamily="monospace">
                  90° ♋
                </text>
                <text x="25" y={center - 6} fill="#71717a" fontSize="10" fontFamily="monospace">
                  180° ♎
                </text>
                <text x={center + 6} y="375" fill="#71717a" fontSize="10" fontFamily="monospace">
                  270° ♑
                </text>

                {/* Orbit Rings */}
                {orbitRadii.map((r, i) => {
                  const planet = planets[i];
                  const isSelected = selectedPlanet?.name === planet?.name;
                  return (
                    <circle
                      key={`orbit-${i}`}
                      cx={center}
                      cy={center}
                      r={r}
                      fill="none"
                      stroke={isSelected ? '#6366f1' : '#3f3f46'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                      strokeDasharray={isSelected ? 'none' : '3 4'}
                      opacity={isSelected ? 0.9 : 0.45}
                      className="transition-colors duration-300"
                    />
                  );
                })}

                {/* Central Sun */}
                <circle
                  cx={center}
                  cy={center}
                  r="11"
                  fill="url(#sun-radial)"
                  filter="url(#sun-glow)"
                  className="cursor-pointer"
                  onClick={() => setSelectedPlanet(null)}
                />
                <circle cx={center} cy={center} r="4" fill="#ffffff" />
                <text
                  x={center}
                  y={center + 24}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="9"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  letterSpacing="1"
                >
                  SOL
                </text>

                {/* Planetary Nodes */}
                {planets.map((planet, index) => {
                  const r = orbitRadii[index];
                  // In math: 0 deg = +X axis (vernal equinox), counter-clockwise
                  const rad = (planet.longitudeDeg * Math.PI) / 180;
                  const px = center + r * Math.cos(rad);
                  const py = center - r * Math.sin(rad); // SVG Y is inverted
                  const isSelected = selectedPlanet?.name === planet.name;

                  // Planet node size
                  const nodeRadius = index === 4 ? 6 : index === 5 ? 5.5 : index === 2 ? 4.5 : index === 1 ? 4.2 : 3.5;

                  return (
                    <g
                      key={planet.name}
                      className="cursor-pointer transition-transform duration-150"
                      onClick={() => setSelectedPlanet(planet)}
                      onMouseEnter={() => setSelectedPlanet(planet)}
                    >
                      {/* Radial Vector Line to Sun for active planet */}
                      {isSelected && (
                        <line
                          x1={center}
                          y1={center}
                          x2={px}
                          y2={py}
                          stroke={planet.color}
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                          opacity="0.75"
                        />
                      )}

                      {/* Selection Pulse Ring */}
                      {isSelected && (
                        <circle
                          cx={px}
                          cy={py}
                          r={nodeRadius + 6}
                          fill="none"
                          stroke={planet.color}
                          strokeWidth="1.5"
                          opacity="0.8"
                        />
                      )}

                      {/* Planet Body */}
                      <circle
                        cx={px}
                        cy={py}
                        r={nodeRadius}
                        fill={planet.color}
                        stroke="#18181b"
                        strokeWidth="1.5"
                      />

                      {/* Planet Symbol Label */}
                      <text
                        x={px + (px > center ? 9 : -9)}
                        y={py + (py > center ? 9 : -6)}
                        textAnchor={px > center ? 'start' : 'end'}
                        fill={isSelected ? '#ffffff' : '#a1a1aa'}
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {planet.symbol} {planet.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Angle orientation indicator */}
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-zinc-500">
                Ecliptic Vernal Equinox 0° → East
              </div>
            </div>

            {/* Canvas controls */}
            <div className="flex items-center gap-2 mt-3 w-full justify-center">
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSimulating
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800'
                }`}
                title={isSimulating ? 'Pause orbital motion' : 'Simulate Keplerian orbital motion'}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'Pause Motion' : 'Simulate Motion'}</span>
              </button>

              {simulatedDaysOffset !== 0 && (
                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimulatedDaysOffset(0);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60 hover:text-zinc-200 transition-colors"
                  title="Reset to build timestamp"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Build</span>
                </button>
              )}
            </div>
          </div>

          {/* Right / Ephemeris Details */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* Timestamp Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Gregorian Timestamp
                </div>
                <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{gregorianDate || 'Unknown Date'}</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Epoch: UTC</div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Julian Date (JD)
                </div>
                <div className="text-sm font-mono font-bold text-indigo-400">
                  {activeJulianDate.toFixed(2)}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {simulatedDaysOffset !== 0
                    ? `+${simulatedDaysOffset.toFixed(1)} days from build`
                    : 'J2000.0 Reference Datum'}
                </div>
              </div>
            </div>

            {/* Selected Planet Card */}
            {selectedPlanet ? (
              <div
                className="p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: `${selectedPlanet.color}10`,
                  borderColor: `${selectedPlanet.color}40`,
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" role="img" aria-label={selectedPlanet.name}>
                      {selectedPlanet.symbol}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{selectedPlanet.name}</span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                          style={{
                            backgroundColor: `${selectedPlanet.color}30`,
                            color: selectedPlanet.accent,
                          }}
                        >
                          {selectedPlanet.constellation}
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-400">{selectedPlanet.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/80">
                    <div className="text-[10px] font-mono text-zinc-400">Ecliptic Longitude</div>
                    <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5">
                      {selectedPlanet.longitudeDeg.toFixed(1)}°
                    </div>
                  </div>
                  <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/80">
                    <div className="text-[10px] font-mono text-zinc-400">Distance (a)</div>
                    <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5">
                      {selectedPlanet.a.toFixed(2)} AU
                    </div>
                  </div>
                  <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/80">
                    <div className="text-[10px] font-mono text-zinc-400">Orbital Period</div>
                    <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5">
                      {selectedPlanet.periodDays >= 365
                        ? `${(selectedPlanet.periodDays / 365.25).toFixed(1)} yr`
                        : `${Math.round(selectedPlanet.periodDays)} d`}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-center text-xs text-zinc-400">
                Click any planet on the orrery map or list below to view its orbital ephemeris.
              </div>
            )}

            {/* Planetary Alignment Chips */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
                <span>Planetary Heliocentric Ephemeris</span>
                <span className="text-[10px] text-zinc-600 font-sans">Click to inspect</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {planets.map((p) => {
                  const isSelected = selectedPlanet?.name === p.name;
                  return (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPlanet(p)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-zinc-800 border-indigo-500/60 ring-1 ring-indigo-500/40'
                          : 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800/60'
                      }`}
                    >
                      <span className="text-base" style={{ color: p.color }}>
                        {p.symbol}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-200 truncate">{p.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {Math.round(p.longitudeDeg)}° · {p.constellation.split(' ')[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions & Explanatory Accordion */}
            <div className="mt-auto pt-2 flex flex-col gap-2">
              <button
                onClick={handleCopyStamp}
                className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Celestial Timestamp!' : 'Copy Cosmic Version Stamp'}</span>
              </button>

              <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-[11px] text-zinc-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <p>
                  Because every planet orbits at a unique rate, this exact heliocentric arrangement
                  repeats only once every thousands of years, forming a permanent astronomical
                  watermark for this application release.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

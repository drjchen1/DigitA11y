/**
 * Astronomical utilities for calculating planetary heliocentric ecliptic longitudes.
 * Grounded in standard NASA/JPL Keplerian orbital elements relative to J2000.0 (JD 2451545.0).
 */

export interface PlanetPosition {
  name: string;
  symbol: string;
  color: string;
  accent: string;
  a: number; // Semi-major axis in Astronomical Units (AU)
  e: number; // Orbital eccentricity
  periodDays: number;
  longitudeDeg: number; // Heliocentric ecliptic longitude in degrees [0, 360)
  constellation: string;
  description: string;
}

interface PlanetKeplerianData {
  name: string;
  symbol: string;
  color: string;
  accent: string;
  a: number;
  e: number;
  L0: number;
  Lrate: number;
  w0: number;
  wrate: number;
  periodDays: number;
  description: string;
}

const PLANETS_DATA: PlanetKeplerianData[] = [
  {
    name: 'Mercury',
    symbol: '☿',
    color: '#94a3b8',
    accent: '#cbd5e1',
    a: 0.38709927,
    e: 0.20563593,
    L0: 252.2503235,
    Lrate: 149472.67411175,
    w0: 77.45779628,
    wrate: 1.55647766,
    periodDays: 87.97,
    description: 'Innermost terrestrial planet with the fastest orbital velocity (~47 km/s).',
  },
  {
    name: 'Venus',
    symbol: '♀',
    color: '#f59e0b',
    accent: '#fef3c7',
    a: 0.72333566,
    e: 0.00677672,
    L0: 181.9790995,
    Lrate: 58517.81538729,
    w0: 131.60246718,
    wrate: 1.40226411,
    periodDays: 224.7,
    description: 'Nearest planetary neighbor with an almost perfectly circular orbit (e ≈ 0.007).',
  },
  {
    name: 'Earth',
    symbol: '🜨',
    color: '#0284c7',
    accent: '#bae6fd',
    a: 1.00000261,
    e: 0.01671123,
    L0: 100.46457166,
    Lrate: 35999.37244981,
    w0: 102.93768193,
    wrate: 1.02119476,
    periodDays: 365.26,
    description: 'Our home world, anchoring the 1.00 AU astronomical distance benchmark.',
  },
  {
    name: 'Mars',
    symbol: '♂',
    color: '#ef4444',
    accent: '#fecaca',
    a: 1.52371034,
    e: 0.0933941,
    L0: 355.4332746,
    Lrate: 19140.30268499,
    w0: 336.05637041,
    wrate: 1.84104494,
    periodDays: 686.98,
    description: 'The Red Planet, possessing a noticeably eccentric orbit across 1.52 AU.',
  },
  {
    name: 'Jupiter',
    symbol: '♃',
    color: '#ea580c',
    accent: '#ffedd5',
    a: 5.202887,
    e: 0.04838624,
    L0: 34.39644051,
    Lrate: 3034.74612775,
    w0: 14.72847983,
    wrate: 1.61917173,
    periodDays: 4332.59,
    description: 'Gas giant commanding the outer solar system across an 11.86-year orbital period.',
  },
  {
    name: 'Saturn',
    symbol: '♄',
    color: '#d97706',
    accent: '#fef3c7',
    a: 9.55490959,
    e: 0.05554814,
    L0: 50.07747146,
    Lrate: 1222.11379404,
    w0: 92.83172858,
    wrate: 1.95841584,
    periodDays: 10759.22,
    description: 'Ringed gas giant tracing a serene 29.5-year cycle around the Sun.',
  },
];

const ZODIAC_SIGNS = [
  { name: 'Aries ♈', min: 0, max: 30 },
  { name: 'Taurus ♉', min: 30, max: 60 },
  { name: 'Gemini ♊', min: 60, max: 90 },
  { name: 'Cancer ♋', min: 90, max: 120 },
  { name: 'Leo ♌', min: 120, max: 150 },
  { name: 'Virgo ♍', min: 150, max: 180 },
  { name: 'Libra ♎', min: 180, max: 210 },
  { name: 'Scorpio ♏', min: 210, max: 240 },
  { name: 'Sagittarius ♐', min: 240, max: 270 },
  { name: 'Capricorn ♑', min: 270, max: 300 },
  { name: 'Aquarius ♒', min: 300, max: 330 },
  { name: 'Pisces ♓', min: 330, max: 360 },
];

function getZodiacConstellation(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const match = ZODIAC_SIGNS.find((z) => norm >= z.min && norm < z.max);
  return match ? match.name : 'Aries ♈';
}

/**
 * Computes heliocentric ecliptic longitude for all major planets at a given Julian Date.
 */
export function getHeliocentricPlanets(julianDate: number): PlanetPosition[] {
  // Julian centuries since J2000.0
  const T = (julianDate - 2451545.0) / 36525.0;

  return PLANETS_DATA.map((p) => {
    const L = (p.L0 + p.Lrate * T) % 360;
    const w = (p.w0 + p.wrate * T) % 360;
    let M = (L - w) % 360;
    if (M < 0) M += 360;

    const Mrad = (M * Math.PI) / 180;
    const e = p.e;

    // Equation of the center (Kepler expansion up to 2nd order)
    const C = (2 * e - Math.pow(e, 3) / 4) * Math.sin(Mrad) + (1.25 * e * e) * Math.sin(2 * Mrad);
    const Cdeg = (C * 180) / Math.PI;

    let trueLon = (L + Cdeg) % 360;
    if (trueLon < 0) trueLon += 360;

    const longitudeDeg = Number(trueLon.toFixed(1));

    return {
      name: p.name,
      symbol: p.symbol,
      color: p.color,
      accent: p.accent,
      a: p.a,
      e: p.e,
      periodDays: p.periodDays,
      longitudeDeg,
      constellation: getZodiacConstellation(longitudeDeg),
      description: p.description,
    };
  });
}

/**
 * Returns a compact alignment summary string for tooltips and badges.
 * e.g., "☿ 184° · ♀ 310° · 🜨 341° · ♂ 71° · ♃ 129° · ♄ 10°"
 */
export function getPlanetaryAlignmentSummary(julianDate: number): string {
  const planets = getHeliocentricPlanets(julianDate);
  return planets.map((p) => `${p.symbol} ${Math.round(p.longitudeDeg)}°`).join(' · ');
}

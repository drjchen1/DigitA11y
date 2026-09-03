/**
 * Date utility functions for converting and formatting dates.
 */

/**
 * Converts a Julian Date number or string into a formatted Gregorian Date string.
 * Julian Date 2440587.5 corresponds to the Unix epoch (1970-01-01 00:00:00 UTC).
 *
 * @param julianInput Julian date string or number (e.g., "2461284.02" or 2461284.02)
 * @returns Formatted Gregorian date (e.g., "August 31, 2026")
 */
export function formatJulianToGregorian(julianInput: string | number): string {
  const jd = typeof julianInput === 'number' ? julianInput : parseFloat(String(julianInput).replace(/[^0-9.]/g, ''));
  if (isNaN(jd)) return '';

  const timeMs = (jd - 2440587.5) * 86400000;
  const date = new Date(timeMs);

  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

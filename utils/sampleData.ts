import { ConversionResult } from '../types';

/**
 * Creates a sample math note file that can be processed directly via the standard conversion pipeline.
 */
export const createSampleMathNoteFile = (): File => {
  // Generate a clean Canvas image with realistic handwritten/typed calculus notes
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Crisp off-white notebook background with subtle grid lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle graph paper grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Title / Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
    ctx.fillText('Lecture 4: Exponential Growth & Population Models', 80, 110);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('MATH 2400 · Differential Equations & Mathematical Modeling', 80, 150);

    // Divider
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 175);
    ctx.lineTo(1120, 175);
    ctx.stroke();

    // Section 1: Differential Equation Formulation
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('1. The Standard Malthusian Growth Model', 80, 230);

    ctx.fillStyle = '#334155';
    ctx.font = '20px serif';
    ctx.fillText('If the rate of growth of a population P(t) is directly proportional to the current population size:', 80, 275);

    // Formula Box
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 310, 1040, 130, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#09090b';
    ctx.font = 'italic bold 28px serif';
    ctx.fillText('dP / dt = k · P(t)', 450, 380);

    // Annotations text under the equation
    ctx.fillStyle = '#475569';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('where  k > 0  is the intrinsic growth rate parameter.', 80, 480);

    // Section 2: Separation of Variables & Analytical Solution
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('2. Analytical Solution via Separation of Variables', 80, 550);

    ctx.fillStyle = '#334155';
    ctx.font = '20px serif';
    ctx.fillText('Step 1: Separate variables and integrate both sides:', 80, 600);

    ctx.font = 'italic 24px serif';
    ctx.fillText('∫ (1 / P) dP = ∫ k dt', 120, 650);
    ctx.fillText('ln |P| = k t + C₁', 120, 700);

    ctx.fillStyle = '#334155';
    ctx.font = '20px serif';
    ctx.fillText('Step 2: Exponentiate to isolate P(t):', 80, 760);

    ctx.font = 'italic 24px serif';
    ctx.fillText('P(t) = e^(k t + C₁) = e^(C₁) · e^(k t) = P₀ · e^(k t)', 120, 810);

    // Highlighted Final Box
    ctx.fillStyle = '#eef2ff';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 860, 1040, 90, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#312e81';
    ctx.font = 'bold 24px serif';
    ctx.fillText('General Solution:   P(t) = P₀ · e^(k t)   where P₀ = P(0)', 300, 915);

    // Section 3: Doubling Time
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('3. Doubling Time Characteristic', 80, 1010);

    ctx.fillStyle = '#334155';
    ctx.font = '20px serif';
    ctx.fillText('Setting P(t_d) = 2 P₀ yields the doubling period:', 80, 1055);

    ctx.font = 'italic bold 24px serif';
    ctx.fillText('2 P₀ = P₀ · e^(k · t_d)  ==>  t_d = ln(2) / k ≈ 0.693 / k', 120, 1105);

    // Mini Diagram / Sketch of Exponential Curve
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    // Axes
    ctx.beginPath();
    ctx.moveTo(120, 1400);
    ctx.lineTo(600, 1400); // t axis
    ctx.moveTo(120, 1400);
    ctx.lineTo(120, 1200); // P axis
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('t (Time)', 560, 1425);
    ctx.fillText('P(t)', 85, 1210);
    ctx.fillText('P₀', 95, 1370);

    // Exponential Curve
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(120, 1365);
    ctx.bezierCurveTo(280, 1360, 420, 1320, 550, 1220);
    ctx.stroke();

    // Diagram Callout
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('P(t) = P₀ e^{kt}', 450, 1210);
  }

  // Convert canvas to Blob -> File
  const dataUrl = canvas.toDataURL('image/png');
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/png' });
  return new File([blob], 'sample_calculus_lecture_notes.png', { type: 'image/png' });
};

import { MASS_SCALE } from '../config.js';

// ---- Game mass ↔ kilograms (display only; see MASS_SCALE in config.js) ----

function interpolate(x, points, xi, yi) {
  // Piecewise-linear in log space, extrapolating the end segments.
  let i = 0;
  while (i < points.length - 2 && x > points[i + 1][xi]) i++;
  const a = points[i];
  const b = points[i + 1];
  const t = (x - a[xi]) / (b[xi] - a[xi]);
  return a[yi] + t * (b[yi] - a[yi]);
}

const SCALE_LOG = MASS_SCALE.map(([m, logKg]) => [Math.log10(m), logKg]);

export function massToKg(mass) {
  if (mass <= 0) return 0;
  return 10 ** interpolate(Math.log10(mass), SCALE_LOG, 0, 1);
}

export function kgToMass(kg) {
  return 10 ** interpolate(Math.log10(kg), SCALE_LOG, 1, 0);
}

// ---- Scientific notation ----

/** @returns {{mantissa: string, exponent: number}} e.g. 4.2e22 → { '4.20', 22 } */
export function splitSci(value, decimals = 2) {
  if (!(value > 0)) return { mantissa: (0).toFixed(decimals), exponent: 0 };
  let exponent = Math.floor(Math.log10(value));
  let mantissa = (value / 10 ** exponent).toFixed(decimals);
  if (parseFloat(mantissa) >= 10) {
    exponent += 1;
    mantissa = (value / 10 ** exponent).toFixed(decimals);
  }
  return { mantissa, exponent };
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export function superscript(n) {
  return String(n)
    .split('')
    .map((c) => (c === '-' ? '⁻' : SUPERSCRIPT[+c] ?? c))
    .join('');
}

/** Plain text: "4.20 × 10²² kg" */
export function kgText(kg, decimals = 2) {
  const { mantissa, exponent } = splitSci(kg, decimals);
  return `${mantissa} × 10${superscript(exponent)} kg`;
}

/** HTML with a real <sup> exponent (fonts may lack superscript digits). */
export function kgHtml(kg, decimals = 2, { unit = true, sign = '' } = {}) {
  const { mantissa, exponent } = splitSci(kg, decimals);
  return `${sign}${mantissa}<span class="sci-x">×</span>10<sup>${exponent}</sup>${unit ? '<span class="sci-unit">kg</span>' : ''}`;
}

// ---- Time and numbers ----

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatTimePrecise(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${String(m).padStart(2, '0')}:${rest.toFixed(2).padStart(5, '0')}`;
}

export function formatInt(n) {
  return Math.floor(n).toLocaleString('en-US');
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

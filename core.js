export const COLORS = [
  { name: 'Preto', hex: '#17191d', digit: 0, multiplier: 1, tolerance: null, tempco: null },
  { name: 'Marrom', hex: '#795035', digit: 1, multiplier: 10, tolerance: 1, tempco: 100 },
  { name: 'Vermelho', hex: '#e3423b', digit: 2, multiplier: 100, tolerance: 2, tempco: 50 },
  { name: 'Laranja', hex: '#f08a24', digit: 3, multiplier: 1e3, tolerance: null, tempco: 15 },
  { name: 'Amarelo', hex: '#f4d342', digit: 4, multiplier: 1e4, tolerance: null, tempco: 25 },
  { name: 'Verde', hex: '#43b879', digit: 5, multiplier: 1e5, tolerance: 0.5, tempco: 20 },
  { name: 'Azul', hex: '#4387f5', digit: 6, multiplier: 1e6, tolerance: 0.25, tempco: 10 },
  { name: 'Violeta', hex: '#a875dd', digit: 7, multiplier: 1e7, tolerance: 0.1, tempco: 5 },
  { name: 'Cinza', hex: '#aeb6c2', digit: 8, multiplier: 1e8, tolerance: 0.05, tempco: 1 },
  { name: 'Branco', hex: '#f3f4f5', digit: 9, multiplier: 1e9, tolerance: null, tempco: null },
  { name: 'Ouro', hex: '#d5a841', digit: null, multiplier: 0.1, tolerance: 5, tempco: null },
  { name: 'Prata', hex: '#a5adb8', digit: null, multiplier: 0.01, tolerance: 10, tempco: null }
];

export const TOLERANCE_COLORS = COLORS.filter(color => color.tolerance !== null);

export function decodeResistor(bands) {
  const count = bands.length;
  if (![4, 5, 6].includes(count)) throw new Error('Use 4, 5 ou 6 faixas.');
  const digits = count === 4 ? 2 : 3;
  const significant = bands.slice(0, digits);
  const multiplier = bands[digits];
  const tolerance = bands[digits + 1];
  if (significant.some(color => !color || color.digit === null) || significant[0].digit === 0 || !multiplier || multiplier.multiplier == null || !tolerance || tolerance.tolerance == null || (count === 6 && bands[5]?.tempco == null)) {
    throw new Error('Combinação de faixas inválida.');
  }
  const raw = Number(`${significant.map(color => color.digit).join('')}`) * multiplier.multiplier;
  return { ohms: raw, tolerance: tolerance.tolerance, tempco: count === 6 ? bands[5]?.tempco ?? null : null };
}

export function reverseResistor(ohms, bandCount = 4, toleranceValue = 5) {
  if (!Number.isFinite(ohms) || ohms <= 0 || ![4, 5, 6].includes(bandCount)) return null;
  const significantCount = bandCount === 4 ? 2 : 3;
  const significant = Math.round(ohms.toPrecision(3) * 10 ** (significantCount - 1 - Math.floor(Math.log10(ohms))));
  const normalizedDigits = String(significant).padStart(significantCount, '0');
  const digits = [...normalizedDigits].map(Number);
  const multiplierPower = Math.floor(Math.log10(ohms)) - significantCount + 1;
  const multiplier = COLORS.find(color => Math.abs(color.multiplier - 10 ** multiplierPower) < Math.max(1e-12, 10 ** multiplierPower * 1e-10));
  const digitColors = digits.map(digit => COLORS.find(color => color.digit === digit));
  const tolerance = TOLERANCE_COLORS.find(color => color.tolerance === toleranceValue) ?? TOLERANCE_COLORS.find(color => color.tolerance === 5);
  if (!multiplier || digitColors.some(color => !color)) return null;
  return [...digitColors, multiplier, tolerance];
}

export function decodeCapacitorCode(code) {
  const normalized = String(code).trim().toUpperCase();
  if (!/^\d{3}$/.test(normalized)) return null;
  const digits = Number(normalized.slice(0, 2));
  const exponent = Number(normalized[2]);
  return digits * 10 ** exponent;
}

export function formatCapacitance(picoFarads) {
  if (!Number.isFinite(picoFarads) || picoFarads < 0) return '—';
  if (picoFarads >= 1e6) return `${trimNumber(picoFarads / 1e6)} µF`;
  if (picoFarads >= 1e3) return `${trimNumber(picoFarads / 1e3)} nF`;
  return `${trimNumber(picoFarads)} pF`;
}

export function trimNumber(value) {
  return Number(value.toPrecision(6)).toLocaleString('pt-BR', { maximumFractionDigits: 6 });
}

export const SERIES = {
  E12: [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82],
  E24: [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91],
  E96: [100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154, 158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287, 294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412, 422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976]
};

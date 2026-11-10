import { COLORS, TOLERANCE_COLORS, SERIES, decodeResistor, reverseResistor, decodeCapacitorCode, formatCapacitance, trimNumber } from './core.js';
import { TRANSISTORS } from './transistor-data.js';

const $ = selector => document.querySelector(selector);
const bandCountControl = $('#band-count');
let activeBandCount = 4;
let activeSeries = 'E12';
let activeFilter = 'todos';
let selectedBands = [];

function formatOhms(value) {
  if (value >= 1e6) return `${trimNumber(value / 1e6)} MΩ`;
  if (value >= 1e3) return `${trimNumber(value / 1e3)} kΩ`;
  return `${trimNumber(value)} Ω`;
}

function optionColors(index, total) {
  const digits = total === 4 ? 2 : 3;
  if (index < digits) return COLORS.filter(color => color.digit !== null && (index !== 0 || color.digit !== 0));
  if (index === digits) return COLORS.filter(color => color.multiplier !== null);
  if (index === digits + 1) return TOLERANCE_COLORS;
  return COLORS.filter(color => color.tempco !== null);
}

function bandName(index, total) {
  const digits = total === 4 ? 2 : 3;
  if (index < digits) return `Faixa ${index + 1} · dígito`;
  if (index === digits) return 'Multiplicador';
  if (index === digits + 1) return 'Tolerância';
  return 'Coef. tempco';
}

function updateResistor() {
  const selectors = [...$('#band-selectors').querySelectorAll('select')];
  selectedBands = selectors.map(select => COLORS.find(color => color.name === select.value));
  try {
    const result = decodeResistor(selectedBands);
    $('#resistor-result').textContent = formatOhms(result.ohms);
    $('#resistor-detail').textContent = result.tempco === null
      ? `Tolerância ±${trimNumber(result.tolerance)}%`
      : `Tolerância ±${trimNumber(result.tolerance)}% · ${result.tempco} ppm/°C`;
  } catch {
    $('#resistor-result').textContent = 'Combinação inválida';
    $('#resistor-detail').textContent = 'Confira se cada faixa pode ocupar essa posição.';
  }
}

function buildBandInputs() {
  const digits = activeBandCount === 4 ? 2 : 3;
  const indexes = Array.from({ length: activeBandCount }, (_, index) => index);
  $('#band-selectors').innerHTML = indexes.map(index => {
    const choices = optionColors(index, activeBandCount);
    const defaultColor = index < digits ? COLORS[index === 0 ? 4 : index === 1 ? 7 : 0].name
      : index === digits ? 'Amarelo'
        : index === digits + 1 ? (activeBandCount === 4 ? 'Ouro' : 'Marrom') : 'Marrom';
    return `<label class="band-field"><span class="field-label">${bandName(index, activeBandCount)}</span><span class="color-select-wrap"><span class="color-dot" aria-hidden="true"></span><select aria-label="${bandName(index, activeBandCount)}">${choices.map(color => `<option value="${color.name}"${color.name === defaultColor ? ' selected' : ''}>${color.name}</option>`).join('')}</select></span></label>`;
  }).join('');
  $('#band-selectors').querySelectorAll('select').forEach(select => {
    select.addEventListener('change', () => {
      select.closest('.color-select-wrap').style.setProperty('--band-color', COLORS.find(color => color.name === select.value).hex);
      updateResistor();
    });
    select.closest('.color-select-wrap').style.setProperty('--band-color', COLORS.find(color => color.name === select.value).hex);
  });
  updateResistor();
}

function renderReverse() {
  const value = Number($('#reverse-value').value);
  const tolerance = Number($('#reverse-tolerance').value);
  const colors = reverseResistor(value, 4, tolerance);
  if (!colors) {
    $('#reverse-bands').innerHTML = '';
    $('#reverse-label').textContent = 'Informe um valor positivo representável.';
    return;
  }
  $('#reverse-bands').innerHTML = colors.map(color => `<span class="visual-band" style="--band-color:${color.hex}" title="${color.name}" aria-label="${color.name}"></span>`).join('');
  $('#reverse-label').textContent = `${colors.map(color => color.name).join(' · ')} · ${formatOhms(decodeResistor(colors).ohms)} ±${trimNumber(tolerance)}%`;
}

function seriesBaseValue(value) {
  return activeSeries === 'E96' ? value / 10 : value;
}

function renderSeries() {
  const values = SERIES[activeSeries];
  $('#series-grid').innerHTML = values.map(value => {
    const base = seriesBaseValue(value);
    const colors = reverseResistor(base, 4, activeSeries === 'E12' ? 10 : activeSeries === 'E24' ? 5 : 1);
    const swatches = colors ? colors.map(color => `<i style="--band-color:${color.hex}" title="${color.name}"></i>`).join('') : '';
    return `<div class="series-item"><span>${trimNumber(base)} Ω</span><span class="swatch-row" aria-label="Faixas: ${colors?.map(color => color.name).join(', ') ?? ''}">${swatches}</span></div>`;
  }).join('');
}

const CAP_TOLERANCES = { F: '±1%', G: '±2%', J: '±5%', K: '±10%', M: '±20%', Z: '+80/−20%' };
function renderCapacitorCode() {
  const code = $('#capacitor-code').value.trim();
  const value = decodeCapacitorCode(code);
  if (value === null) {
    $('#capacitor-result').textContent = 'Código inválido';
    $('#capacitor-detail').textContent = 'Informe exatamente 3 dígitos, por exemplo 104.';
    return;
  }
  const toleranceCode = $('#capacitor-tolerance').value;
  $('#capacitor-result').textContent = formatCapacitance(value);
  $('#capacitor-detail').textContent = `${code} = ${trimNumber(value)} pF${toleranceCode ? ` · tolerância ${CAP_TOLERANCES[toleranceCode]}` : ''}`;
}

const UNIT_TO_PF = { pF: 1, nF: 1e3, 'µF': 1e6 };
function renderConversion() {
  const value = Number($('#cap-value').value);
  const sourceUnit = $('#cap-unit').value;
  if (!Number.isFinite(value) || value < 0) {
    $('#converter-results').innerHTML = '<p class="validation-message">Informe um valor válido (zero ou maior).</p>';
    return;
  }
  const picoFarads = value * UNIT_TO_PF[sourceUnit];
  $('#converter-results').innerHTML = Object.entries(UNIT_TO_PF).map(([unit, scale]) => `<div><span>${unit}</span><strong>${trimNumber(picoFarads / scale)}</strong></div>`).join('');
}

const CAPACITOR_TYPES = [
  { name: 'Cerâmico', tag: 'C0G / X7R / Y5V', detail: 'Compacto, não polarizado; ampla faixa de valores. C0G é estável, X7R varia mais com temperatura e tensão.' },
  { name: 'Eletrolítico', tag: 'Alumínio', detail: 'Alta capacitância e polarizado; atenção à polaridade, tensão nominal, ESR e vida útil.' },
  { name: 'Filme', tag: 'Poliéster / polipropileno', detail: 'Não polarizado e estável; comum em acoplamento, temporização e filtros.' },
  { name: 'Tântalo', tag: 'Polarizado', detail: 'Alta capacitância por volume; exige respeito à polaridade e derating de tensão.' }
];
function renderCapacitorTypes() {
  $('#capacitor-types').innerHTML = CAPACITOR_TYPES.map(item => `<div class="type-row"><div class="type-icon">${item.name[0]}</div><div><h4>${item.name}<span>${item.tag}</span></h4><p>${item.detail}</p></div></div>`).join('');
}

function renderTransistors() {
  const query = $('#transistor-search').value.trim().toLowerCase();
  const parts = TRANSISTORS.filter(item => (activeFilter === 'todos' || (activeFilter === 'MOSFET' ? item.type.startsWith('MOSFET') : item.type.startsWith(activeFilter)))
    && `${item.part} ${item.type} ${item.package} ${item.pinout}`.toLowerCase().includes(query));
  $('#transistor-count').textContent = `${parts.length} ${parts.length === 1 ? 'componente' : 'componentes'}`;
  $('#transistor-list').innerHTML = parts.length ? parts.map(item => `<article class="transistor-card"><div class="transistor-title"><h3>${item.part}</h3><span class="type-pill ${item.type.startsWith('MOSFET') ? 'mosfet' : item.type.startsWith('PNP') ? 'pnp' : 'npn'}">${item.type}</span></div><dl class="spec-grid"><div><dt>Encapsulamento</dt><dd>${item.package}</dd></div><div><dt>Pinagem</dt><dd>${item.pinout}</dd></div><div><dt>VCEO / VDS</dt><dd>${item.voltage}</dd></div><div><dt>IC máx.</dt><dd>${item.current}</dd></div><div><dt>hFE</dt><dd>${item.gain}</dd></div><div><dt>Ptot</dt><dd>${item.power}</dd></div></dl><p class="source-line">Referência: ${item.ref}</p></article>`).join('') : '<div class="empty-state">Nenhuma peça encontrada. Tente outro termo ou filtro.</div>';
}

bandCountControl.addEventListener('click', event => {
  const button = event.target.closest('[data-bands]');
  if (!button) return;
  activeBandCount = Number(button.dataset.bands);
  bandCountControl.querySelectorAll('button').forEach(item => item.classList.toggle('selected', item === button));
  buildBandInputs();
});
$('#reverse-value').addEventListener('input', renderReverse);
$('#reverse-tolerance').addEventListener('change', renderReverse);
$('#series-grid').addEventListener('click', () => {});
document.querySelectorAll('[data-series]').forEach(button => button.addEventListener('click', () => {
  activeSeries = button.dataset.series;
  document.querySelectorAll('[data-series]').forEach(item => item.classList.toggle('selected', item === button));
  renderSeries();
}));
$('#capacitor-code').addEventListener('input', renderCapacitorCode);
$('#capacitor-tolerance').addEventListener('change', renderCapacitorCode);
$('#cap-value').addEventListener('input', renderConversion);
$('#cap-unit').addEventListener('change', renderConversion);
$('#transistor-search').addEventListener('input', renderTransistors);
$('#clear-search').addEventListener('click', () => { $('#transistor-search').value = ''; renderTransistors(); $('#transistor-search').focus(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('selected', item === button));
  renderTransistors();
}));
document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', () => {
  const target = button.dataset.tab;
  document.querySelectorAll('.tab-button').forEach(item => {
    const selected = item === button;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const selected = panel.id === target;
    panel.classList.toggle('active', selected);
    panel.hidden = !selected;
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));

buildBandInputs();
renderReverse();
renderSeries();
renderCapacitorCode();
renderConversion();
renderCapacitorTypes();
renderTransistors();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));

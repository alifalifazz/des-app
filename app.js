/* =========================================================
   APP.JS - UI Logic untuk Simulasi DES
   Menghubungkan input pengguna dengan des-core.js
   dan merender visualisasi setiap langkah.
   ========================================================= */

const D = window.DESCore;

const el = (id) => document.getElementById(id);

const inputText = el('inputText');
const keyText = el('keyText');
const errorBox = el('errorBox');
const btnRun = el('btnRun');
const btnReset = el('btnReset');
const btnRoundTrip = el('btnRoundTrip');

const outHex = el('outHex');
const outBin = el('outBin');
const inSummaryHex = el('inSummaryHex');
const inSummaryBin = el('inSummaryBin');
const keySummaryHex = el('keySummaryHex');
const keySummaryBin = el('keySummaryBin');
const ipSummary = el('ipSummary');
const finalSummary = el('finalSummary');

const keyScheduleBody = el('keyScheduleBody');
const roundsContainer = el('roundsContainer');
const sboxRefContainer = el('sboxRefContainer');

let lastResult = null; // simpan hasil terakhir untuk round-trip

// ---------- helper format ----------
function fmtBits(bits, group = 8) {
  // beri spasi setiap "group" bit agar mudah dibaca
  const out = [];
  for (let i = 0; i < bits.length; i += group) out.push(bits.substr(i, group));
  return out.join(' ');
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = msg ? 'block' : 'none';
}

// ---------- RENDER: Key Schedule ----------
function renderKeySchedule(ks, keyBits) {
  let html = '';
  html += `<div class="flow-row"><div class="flabel">Kunci 64-bit</div><div class="fval">${fmtBits(keyBits)}</div></div>`;
  html += `<div class="flow-row"><div class="flabel">Setelah PC-1 (56-bit)</div><div class="fval">${fmtBits(ks.pc1, 7)}</div></div>`;
  html += `<div class="flow-row"><div class="flabel">C0 (28-bit)</div><div class="fval">${fmtBits(ks.C0, 7)}</div></div>`;
  html += `<div class="flow-row"><div class="flabel">D0 (28-bit)</div><div class="fval">${fmtBits(ks.D0, 7)}</div></div>`;
  el('pc1Flow').innerHTML = html;

  let rows = '';
  ks.rounds.forEach(r => {
    rows += `<tr>
      <td>${r.round}</td>
      <td>${r.shift}</td>
      <td class="bits">${fmtBits(r.C, 7)}</td>
      <td class="bits">${fmtBits(r.D, 7)}</td>
      <td class="bits">${fmtBits(r.CD, 7)}</td>
      <td class="bits">${fmtBits(r.K, 6)}</td>
      <td class="bits">${D.bitsToHex(r.K)}</td>
    </tr>`;
  });
  keyScheduleBody.innerHTML = rows;
}

// ---------- RENDER: S-Box reference tables (8 tabel statis) ----------
function renderSboxReference() {
  let html = '<div class="sbox-ref-grid">';
  for (let s = 0; s < 8; s++) {
    html += `<div class="sbox-ref"><h4>S-Box ${s + 1}</h4><table><tr><th>Row\\Col</th>`;
    for (let c = 0; c < 16; c++) html += `<th>${c}</th>`;
    html += '</tr>';
    for (let r = 0; r < 4; r++) {
      html += `<tr><td>${r}</td>`;
      for (let c = 0; c < 16; c++) {
        html += `<td id="sbox-${s}-${r}-${c}">${D.S_BOX[s][r][c]}</td>`;
      }
      html += '</tr>';
    }
    html += '</table></div>';
  }
  html += '</div>';
  sboxRefContainer.innerHTML = html;
}

function clearSboxHighlights() {
  document.querySelectorAll('.sbox-ref table td.hl').forEach(td => td.classList.remove('hl'));
}

// ---------- RENDER: 1 round Feistel ----------
function renderRound(r, mode) {
  const f = r.feistel;

  let sboxHtml = '<div class="sbox-grid">';
  f.sboxDetails.forEach(sb => {
    sboxHtml += `<div class="sbox-card">
      <div class="sbox-title">S-Box ${sb.sboxIndex}</div>
      <div class="line"><span>Input (6 bit)</span><span>${sb.input6}</span></div>
      <div class="line"><span>Baris (bit 1,6)</span><span class="hi">${sb.rowBits} = ${sb.row}</span></div>
      <div class="line"><span>Kolom (bit 2-5)</span><span class="hi">${sb.colBits} = ${sb.col}</span></div>
      <div class="line"><span>Output S-Box</span><span class="hi">${sb.value} (${sb.valueBits})</span></div>
    </div>`;
  });
  sboxHtml += '</div>';

  const body = `
    <div class="flow-row"><div class="flabel">Subkunci</div><div class="fval">${r.subkeyLabel} = ${fmtBits(r.subkeyUsed, 6)}</div></div>
    <div class="flow-row"><div class="flabel">L${r.round - 1}</div><div class="fval">${fmtBits(r.Lin)}</div></div>
    <div class="flow-row"><div class="flabel">R${r.round - 1}</div><div class="fval">${fmtBits(r.Rin)}</div></div>
    <div class="section-title-sm">Fungsi F(R${r.round - 1}, ${r.subkeyLabel})</div>
    <div class="flow-row"><div class="flabel">Ekspansi E (48-bit)</div><div class="fval">${fmtBits(f.expanded, 6)}</div></div>
    <div class="flow-row"><div class="flabel">E ⊕ ${r.subkeyLabel}</div><div class="fval">${fmtBits(f.xored, 6)}</div></div>
    <div class="section-title-sm">Lookup 8 S-Box</div>
    ${sboxHtml}
    <div class="flow-row" style="margin-top:8px"><div class="flabel">Gabungan S-Box (32-bit)</div><div class="fval">${fmtBits(f.sboxOutput)}</div></div>
    <div class="flow-row"><div class="flabel">Setelah Permutasi P</div><div class="fval">${fmtBits(f.afterP)}</div></div>
    <div class="section-title-sm">Hasil Round ${r.round}</div>
    <div class="flow-row"><div class="flabel">L${r.round} = R${r.round - 1}</div><div class="fval">${fmtBits(r.Lout)}</div></div>
    <div class="flow-row"><div class="flabel">R${r.round} = L${r.round - 1} ⊕ P</div><div class="fval">${fmtBits(r.Rout)}</div></div>
  `;

  const card = document.createElement('div');
  card.className = 'round-card';
  card.innerHTML = `
    <div class="round-header">
      <div><span class="chevron">▶</span> <span class="title">Round ${r.round}</span>
        <span class="summary">  | Subkunci ${r.subkeyLabel}</span></div>
      <div class="summary">L${r.round}=${D.bitsToHex(r.Lout)}  R${r.round}=${D.bitsToHex(r.Rout)}</div>
    </div>
    <div class="round-body">${body}</div>
  `;
  card.querySelector('.round-header').addEventListener('click', () => {
    card.classList.toggle('open');
  });
  return card;
}

// ---------- MAIN: Jalankan DES ----------
function runDES() {
  showError('');
  clearSboxHighlights();

  const isHex = document.querySelector('input[name="format"]:checked').value === 'hex';
  const mode = document.querySelector('input[name="mode"]:checked').value;

  let inputBits, keyBits;
  try {
    inputBits = D.normalizeTo64Bits(inputText.value, isHex);
    keyBits = D.normalizeTo64Bits(keyText.value, isHex);
  } catch (e) {
    showError('Input tidak valid: ' + e.message);
    return;
  }

  const result = D.desProcess(inputBits, keyBits, mode);
  lastResult = { result, isHex, mode, inputBits, keyBits };

  // ---- Ringkasan input ----
  inSummaryHex.textContent = D.bitsToHex(inputBits);
  inSummaryBin.textContent = fmtBits(inputBits);
  keySummaryHex.textContent = D.bitsToHex(keyBits);
  keySummaryBin.textContent = fmtBits(keyBits);

  // ---- Key schedule ----
  renderKeySchedule(result.keySchedule, keyBits);

  // ---- IP ----
  ipSummary.innerHTML = `
    <div class="flow-row"><div class="flabel">Input (64-bit)</div><div class="fval">${fmtBits(result.input)}</div></div>
    <div class="flow-row"><div class="flabel">Setelah IP</div><div class="fval">${fmtBits(result.afterIP)}</div></div>
    <div class="flow-row"><div class="flabel">L0 (32-bit)</div><div class="fval">${fmtBits(result.L0)}</div></div>
    <div class="flow-row"><div class="flabel">R0 (32-bit)</div><div class="fval">${fmtBits(result.R0)}</div></div>
  `;

  // ---- 16 Rounds ----
  roundsContainer.innerHTML = '';
  result.rounds.forEach(r => roundsContainer.appendChild(renderRound(r, mode)));

  // ---- Final ----
  finalSummary.innerHTML = `
    <div class="flow-row"><div class="flabel">Pre-output (R16‖L16)</div><div class="fval">${fmtBits(result.preOutput)}</div></div>
    <div class="flow-row"><div class="flabel">Setelah IP⁻¹</div><div class="fval">${fmtBits(result.output)}</div></div>
  `;

  // ---- Output utama ----
  const label = mode === 'encrypt' ? 'Ciphertext' : 'Plaintext';
  outHex.previousElementSibling.textContent = `Output (${label}) - Hexadecimal`;
  outHex.textContent = D.bitsToHex(result.output);
  outBin.textContent = fmtBits(result.output);

  btnRoundTrip.disabled = false;
}

// ---------- RESET ----------
function resetAll() {
  inputText.value = '';
  keyText.value = '';
  showError('');
  outHex.textContent = '-';
  outBin.textContent = '-';
  inSummaryHex.textContent = '-';
  inSummaryBin.textContent = '-';
  keySummaryHex.textContent = '-';
  keySummaryBin.textContent = '-';
  ipSummary.innerHTML = '';
  finalSummary.innerHTML = '';
  el('pc1Flow').innerHTML = '';
  keyScheduleBody.innerHTML = '';
  roundsContainer.innerHTML = '';
  clearSboxHighlights();
  lastResult = null;
  btnRoundTrip.disabled = true;
}

// ---------- ROUND-TRIP TEST ----------
function roundTripTest() {
  if (!lastResult) return;
  const { result, isHex, mode } = lastResult;

  // Ambil output hasil proses sebelumnya sebagai input baru,
  // gunakan kunci yang sama, dan balik mode
  const newMode = mode === 'encrypt' ? 'decrypt' : 'encrypt';
  const newInputHex = D.bitsToHex(result.output);

  // set form ke mode kebalikan & isi input dengan output sebelumnya
  document.querySelector(`input[name="mode"][value="${newMode}"]`).checked = true;
  document.querySelector(`input[name="format"][value="hex"]`).checked = true;
  inputText.value = newInputHex;
  keyText.value = D.bitsToHex(lastResult.keyBits);

  runDES();

  // Bandingkan hasil round-trip dengan input asli
  const originalHex = D.bitsToHex(lastResult.inputBits);
  const roundTripHex = D.bitsToHex(lastResult.result.output);
  const match = originalHex === roundTripHex;

  const note = document.createElement('div');
  note.className = 'note';
  note.style.color = match ? '#4fd1c5' : '#fc8181';
  note.style.fontWeight = '700';
  note.textContent = match
    ? `✓ Round-trip BERHASIL: hasil ${newMode === 'decrypt' ? 'dekripsi' : 'enkripsi'} (${roundTripHex}) sama dengan input awal (${originalHex}).`
    : `✗ Round-trip GAGAL: hasil (${roundTripHex}) berbeda dengan input awal (${originalHex}).`;
  el('roundTripNote').innerHTML = '';
  el('roundTripNote').appendChild(note);
}

// ---------- TAB SWITCHING ----------
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      el(btn.dataset.tab).classList.add('active');
    });
  });
}

// ---------- INIT ----------
window.addEventListener('DOMContentLoaded', () => {
  renderSboxReference();
  setupTabs();
  btnRun.addEventListener('click', runDES);
  btnReset.addEventListener('click', resetAll);
  btnRoundTrip.addEventListener('click', roundTripTest);
  btnRoundTrip.disabled = true;

  // contoh default (test vector standar DES) agar mudah diverifikasi
  inputText.value = '5A3C9F1E7B2D04A8';
  keyText.value = '1F2E3D4C5B6A7980';
});
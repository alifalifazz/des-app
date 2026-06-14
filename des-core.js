/* =========================================================
   DES CORE LOGIC - Implementasi sendiri (tanpa library luar)
   Semua tabel & algoritma sesuai standar DES (FIPS 46-3)
   ========================================================= */

// ---------- TABEL-TABEL STANDAR DES ----------

// Initial Permutation (IP)
const IP_TABLE = [
  58, 50, 42, 34, 26, 18, 10, 2,
  60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6,
  64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1,
  59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5,
  63, 55, 47, 39, 31, 23, 15, 7
];

// Inverse Initial Permutation (IP^-1)
const IP_INV_TABLE = [
  40, 8, 48, 16, 56, 24, 64, 32,
  39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30,
  37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28,
  35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26,
  33, 1, 41, 9, 49, 17, 57, 25
];

// Permuted Choice 1 (PC-1) -> 64 bit kunci -> 56 bit
const PC1_TABLE = [
  57, 49, 41, 33, 25, 17, 9,
  1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27,
  19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15,
  7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29,
  21, 13, 5, 28, 20, 12, 4
];

// Permuted Choice 2 (PC-2) -> 56 bit -> 48 bit subkunci
const PC2_TABLE = [
  14, 17, 11, 24, 1, 5,
  3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8,
  16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55,
  30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53,
  46, 42, 50, 36, 29, 32
];

// Jadwal pergeseran kiri (Left Shift) untuk tiap round 1-16
const SHIFT_SCHEDULE = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

// Expansion table (E) -> 32 bit -> 48 bit
const E_TABLE = [
  32, 1, 2, 3, 4, 5,
  4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13,
  12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21,
  20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29,
  28, 29, 30, 31, 32, 1
];

// Permutation P -> setelah S-Box
const P_TABLE = [
  16, 7, 20, 21,
  29, 12, 28, 17,
  1, 15, 23, 26,
  5, 18, 31, 10,
  2, 8, 24, 14,
  32, 27, 3, 9,
  19, 13, 30, 6,
  22, 11, 4, 25
];

// 8 buah S-Box (masing-masing 4x16)
const S_BOX = [
  // S1
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]
  ],
  // S2
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]
  ],
  // S3
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]
  ],
  // S4
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]
  ],
  // S5
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]
  ],
  // S6
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]
  ],
  // S7
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]
  ],
  // S8
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
  ]
];

// ---------- FUNGSI UTILITAS DASAR ----------

// Konversi hex string -> array bit (string '0'/'1'), panjang = hex.length*4
function hexToBits(hex) {
  let bits = '';
  for (const ch of hex.trim()) {
    bits += parseInt(ch, 16).toString(2).padStart(4, '0');
  }
  return bits;
}

// Konversi bit string -> hex string
function bitsToHex(bits) {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.substr(i, 4), 2).toString(16);
  }
  return hex.toUpperCase();
}

// Terapkan tabel permutasi/seleksi: outputBits[i] = inputBits[table[i]-1]
function permute(inputBits, table) {
  let out = '';
  for (const pos of table) {
    out += inputBits[pos - 1];
  }
  return out;
}

// XOR dua bit string dengan panjang sama
function xorBits(a, b) {
  let out = '';
  for (let i = 0; i < a.length; i++) {
    out += (a[i] === b[i]) ? '0' : '1';
  }
  return out;
}

// Left circular shift bit string sebanyak n posisi
function leftShift(bits, n) {
  return bits.substr(n) + bits.substr(0, n);
}

// Validasi: harus 64-bit (biner) atau 16-hex-digit
function normalizeTo64Bits(input, isHex) {
  let bits;
  if (isHex) {
    const cleaned = input.trim().replace(/\s+/g, '');
    if (!/^[0-9A-Fa-f]{16}$/.test(cleaned)) {
      throw new Error('Input hex harus 16 digit (64 bit).');
    }
    bits = hexToBits(cleaned);
  } else {
    const cleaned = input.trim().replace(/\s+/g, '');
    if (!/^[01]{64}$/.test(cleaned)) {
      throw new Error('Input biner harus 64 bit.');
    }
    bits = cleaned;
  }
  return bits;
}

/* =========================================================
   KEY SCHEDULE - Pembangkitan 16 subkunci (K1..K16)
   Mengembalikan objek log lengkap untuk visualisasi
   ========================================================= */
function generateKeySchedule(keyBits) {
  const log = {};

  // 1. PC-1: 64 bit -> 56 bit
  const afterPC1 = permute(keyBits, PC1_TABLE);
  log.pc1 = afterPC1;

  // 2. Bagi menjadi C0 (28 bit) dan D0 (28 bit)
  let C = afterPC1.substr(0, 28);
  let D = afterPC1.substr(28, 28);
  log.C0 = C;
  log.D0 = D;

  const rounds = [];
  for (let i = 1; i <= 16; i++) {
    const shift = SHIFT_SCHEDULE[i - 1];
    // 3. Left shift C(i-1) dan D(i-1)
    C = leftShift(C, shift);
    D = leftShift(D, shift);
    // 4. Gabung CnDn -> PC-2 -> Kn (48 bit)
    const CD = C + D;
    const Kn = permute(CD, PC2_TABLE);

    rounds.push({
      round: i,
      shift: shift,
      C: C,
      D: D,
      CD: CD,
      K: Kn
    });
  }
  log.rounds = rounds;
  log.subkeys = rounds.map(r => r.K); // K1..K16
  return log;
}

/* =========================================================
   FUNGSI F (FEISTEL FUNCTION)
   Input: R (32 bit), K (48 bit subkunci)
   Mengembalikan log lengkap: E, XOR, S-Box detail, P
   ========================================================= */
function feistelFunction(Rbits, Kbits) {
  // 1. Ekspansi E: 32 bit -> 48 bit
  const expanded = permute(Rbits, E_TABLE);

  // 2. XOR dengan subkunci K
  const xored = xorBits(expanded, Kbits);

  // 3. Bagi menjadi 8 blok 6-bit, lookup S-Box
  const sboxDetails = [];
  let sboxOutput = '';
  for (let i = 0; i < 8; i++) {
    const block6 = xored.substr(i * 6, 6);
    // baris dari bit 1 & 6, kolom dari bit 2-5
    const rowBits = block6[0] + block6[5];
    const colBits = block6.substr(1, 4);
    const row = parseInt(rowBits, 2);
    const col = parseInt(colBits, 2);
    const val = S_BOX[i][row][col];
    const valBits = val.toString(2).padStart(4, '0');
    sboxDetails.push({
      sboxIndex: i + 1,
      input6: block6,
      rowBits, colBits,
      row, col,
      value: val,
      valueBits: valBits
    });
    sboxOutput += valBits;
  }

  // 4. Permutasi P: 32 bit -> 32 bit
  const afterP = permute(sboxOutput, P_TABLE);

  return {
    R_input: Rbits,
    K_input: Kbits,
    expanded,
    xored,
    sboxDetails,
    sboxOutput,
    afterP
  };
}

/* =========================================================
   PROSES UTAMA: ENKRIPSI / DEKRIPSI DES
   mode: 'encrypt' atau 'decrypt'
   Mengembalikan objek log lengkap untuk seluruh visualisasi
   ========================================================= */
function desProcess(inputBits, keyBits, mode) {
  const result = { mode };

  // --- Key Schedule ---
  const ks = generateKeySchedule(keyBits);
  result.keySchedule = ks;

  // Untuk dekripsi, urutan subkunci dibalik (K16 -> K1)
  const subkeys = mode === 'encrypt'
    ? ks.subkeys
    : [...ks.subkeys].reverse();

  // --- Initial Permutation (IP) ---
  const afterIP = permute(inputBits, IP_TABLE);
  result.input = inputBits;
  result.afterIP = afterIP;

  let L = afterIP.substr(0, 32);
  let R = afterIP.substr(32, 32);
  result.L0 = L;
  result.R0 = R;

  // --- 16 Round Feistel ---
  const rounds = [];
  for (let i = 1; i <= 16; i++) {
    const K = subkeys[i - 1];
    const f = feistelFunction(R, K);
    const newR = xorBits(L, f.afterP); // L XOR f(R,K)
    const newL = R;

    rounds.push({
      round: i,
      subkeyUsed: K,
      subkeyLabel: mode === 'encrypt' ? `K${i}` : `K${17 - i}`,
      Lin: L,
      Rin: R,
      feistel: f,
      Lout: newL,
      Rout: newR
    });

    L = newL;
    R = newR;
  }
  result.rounds = rounds;

  // Setelah round 16, TIDAK ada swap akhir -> gabungkan R16L16
  const preOutput = R + L; // R16 L16 (32+32 bit)
  result.preOutput = preOutput;

  // --- Inverse Initial Permutation (IP^-1) ---
  const output = permute(preOutput, IP_INV_TABLE);
  result.output = output;

  return result;
}

// ---------- EXPORT (untuk digunakan di browser via <script>) ----------
// Semua fungsi dilekatkan ke window agar bisa dipanggil dari app.js
if (typeof window !== 'undefined') {
  window.DESCore = {
    hexToBits, bitsToHex, permute, xorBits, leftShift,
    normalizeTo64Bits, generateKeySchedule, feistelFunction, desProcess,
    IP_TABLE, IP_INV_TABLE, PC1_TABLE, PC2_TABLE, SHIFT_SCHEDULE,
    E_TABLE, P_TABLE, S_BOX
  };
}
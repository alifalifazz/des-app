## Fitur

- Input plaintext/ciphertext dan kunci 64-bit dalam format **biner** atau **heksadesimal**
- Pilihan mode **Enkripsi** atau **Dekripsi**
- Visualisasi lengkap **Key Schedule**: PC-1, pembagian C0/D0, pergeseran (LS) tiap round, PC-2 → K1–K16
- Visualisasi proses enkripsi/dekripsi: **Initial Permutation (IP)**, 16 round Feistel (ekspansi E, XOR, lookup S-Box per blok, permutasi P, swap), dan **IP⁻¹**
- Detail lookup ke-8 **S-Box** (baris, kolom, nilai output) untuk setiap round
- Tabel referensi lengkap 8 S-Box
- Output akhir dalam format **biner** dan **heksadesimal**
- Tombol **Reset/Clear** dan **Round-trip Test** (verifikasi enkripsi ↔ dekripsi menghasilkan nilai semula)

## Struktur Folder

```
des-app/
├── app.py          # Server Flask (opsional) untuk menjalankan aplikasi
├── index.html      # Halaman utama UI
├── style.css       # Styling aplikasi
├── app.js          # Logika UI & visualisasi
└── des-core.js     # Logika inti algoritma DES
```

## Cara Menjalankan

Aplikasi ini **full frontend** — seluruh logika DES berjalan di sisi klien (browser). Ada dua cara menjalankannya:

### Opsi 1: Menggunakan Python (Flask)

```bash
pip install flask
python app.py
```

Buka browser ke `http://localhost:5000`.

## Cara Penggunaan

1. Masukkan **plaintext/ciphertext** dan **kunci** 64-bit (format hex 16 digit atau biner 64 bit).
2. Pilih format input (Hex/Biner) dan mode (Enkripsi/Dekripsi).
3. Klik **Jalankan DES**.
4. Lihat hasil pada tab:
   - **Key Schedule (K1–K16)** — proses pembangkitan subkunci
   - **IP & 16 Round Feistel** — klik tiap round untuk melihat detail E, XOR, S-Box, dan P
   - **Tabel Referensi S-Box** — tabel lookup lengkap 8 S-Box
5. Gunakan **Round-trip Test** untuk memverifikasi hasil enkripsi dapat didekripsi kembali menjadi plaintext semula.
6. Klik **Reset/Clear** untuk mengosongkan semua input dan hasil.

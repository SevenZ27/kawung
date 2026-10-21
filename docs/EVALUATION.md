# Protokol evaluasi tahap dua

Ditulis sebelum menjalankan benchmark tahap dua, 21 Oktober 2026. Kawung adalah generator prosedural deterministik; tidak ada model ML yang dilatih atau akurasi klasifikasi yang dilaporkan.

## Variasi dan reproduktibilitas

Untuk setiap motif: seed 0–499, palet Sogan, kepadatan 5, ketebalan 4, rotasi 0, versi generator 2, bidang persegi 1000 × 1000. Hitung SHA-256 SVG dan raster 64 × 64 dengan kanal RGB dikuantisasi ke kelipatan 16. Hash berbeda membuktikan perbedaan representasi, bukan bahwa pengguna dapat membedakan seluruh gambar. Hash raster yang sama menandai kandidat mirip, bukan otomatis kesalahan. Tidak mengklaim 100.000 seed menghasilkan 100.000 desain unik.

Ceplok versi 1 tetap tersedia untuk tautan lama; benturan seed 0 dan 11 dikunci oleh tes regresi. Versi 2 menambah proporsi kelopak dan bingkai yang dibatasi agar simetri tetap terjaga. Pada tahap dua, penggantian motif atau seed di UI memilih versi 2 dan tautan memuat `g=2`. Revisi berikutnya memakai versi 3, dijelaskan di bagian akhir dokumen.

## Kontras area jam

720 konfigurasi tetap: 10 motif × 4 palet × 2 perangkat × 3 level Dim (-60, 0, +60) × 3 seed evaluasi (137, 7919, 90523). Palet bebas memakai #888888. Seed dipasangkan dengan kepadatan [1,5,10], ketebalan [10,4,1], dan rotasi [0,33,179]. Ini desain terstruktur dengan kombinasi yang dipasangkan, bukan faktorial penuh; pengaruh faktor yang dipasangkan tidak dapat dipisahkan. Seed demo/pengembangan 0 dan 4821 tidak masuk suite kontras.

Baseline: raster lebar 90 px, memilih teks terang/gelap menurut median rasio kontras. Kandidat: lebar 240 px, memilih persentase area di bawah 3:1 paling kecil; jika sama, P10 tertinggi. Nilai yang ditampilkan adalah P10, bukan median. Daerah persegi panjang tetap sama untuk kedua algoritma, mencakup tanggal dan jam pada preview. Referensi pembanding: raster 720 px, fungsi luminans sRGB yang sama.

Laporan menyimpan hasil setiap konfigurasi, perbedaan berpasangan antara baseline dan kandidat, jumlah membaik/memburuk/tetap, error absolut P10 terhadap raster 720, serta ringkasan per motif dan Dim. Regresi harus dilaporkan, tidak disembunyikan oleh rerata. Semua kasus dipertahankan; tidak ada pemilihan hasil yang menguntungkan. Tidak menghitung confidence interval populasi karena ini suite deterministik, bukan sampel pengguna atau kain.

3:1 dan 4,5:1 adalah ambang pemeriksaan kontras yang diambil dari dokumentasi WCAG, bukan sertifikasi kepatuhan. Sampel berbentuk area, bukan mask glif. Bayangan teks, antialiasing glif, ketajaman mata, wallpaper crop OS, ukuran jam OS, dan kondisi layar fisik tidak dimodelkan. Pengguna tetap perlu memeriksa wallpaper di perangkatnya. Dim mengubah warna seluruh motif dan ikut diekspor; tanggal, jam, bingkai tidak ikut diekspor.

## Performa

25 pengukuran pembentukan scene+SVG setelah satu pemanasan per motif, kepadatan 10, ketebalan 10, rotasi 45, rasio 1320/2868. Median dan P95 adalah hasil Chrome pada komputer pengujian, bukan klaim performa HP, render GPU, atau waktu interaksi end-to-end.

## Menjalankan ulang

Jalankan `pnpm dev` (port 4185), lalu `node scripts/evaluate.mjs`. Set `PLAYWRIGHT_EXECUTABLE_PATH` jika Chrome berada di lokasi berbeda. Output ada di `docs/verification/stage-two/`: CSV mentah, JSON hasil, browser/version, Git HEAD, serta SHA-256 semua sumber TS/TSX/CSS. HEAD saja tidak menggambarkan perubahan lokal; gunakan manifest hash. Jalankan tes unit dan browser secara terpisah.

Referensi perhitungan: [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Rujukan motif: [MOTIF-REFERENCES.md](MOTIF-REFERENCES.md).

## Pengulangan untuk revisi motif versi 3

Suite yang sama dijalankan ulang setelah perubahan Nitik, Megamendung dan Tambal, dengan `EVAL_GENERATION=3`. Skrip menyimpan hasil ke `docs/verification/motif-revision/` sehingga hasil versi 2 tidak ditimpa. `EVAL_OUT` dapat memilih folder lain. Parameter dan seed suite tetap; hanya versi geometri yang berubah. Rujuk laporan MOTIF-REVISION.md untuk hasil terbaru.

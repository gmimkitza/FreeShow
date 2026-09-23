# Dokumentasi Pengembangan Fork FreeShow - LiturgiApp

Dokumen ini mencatat seluruh riwayat perubahan, arsitektur modul, dan fitur kustom yang telah dibangun pada repositori fork FreeShow ini.

---

## 1. Informasi Repositori & Fork

* **Nama Fork:** FreeShow - Liturgi Edition
* **URL Remote Fork (`origin`):** `https://github.com/gmimkitza/FreeShow.git`
* **URL Repositori Resmi (`upstream`):** `https://github.com/ChurchApps/FreeShow.git`
* **Basis Versi Resmi:** `1.6.5` (Stable Release)
* **Branch Pengembangan Aktif:** `dialog-liturgi`
* **Lisensi:** GNU General Public License v3.0 (GPL-3.0)

---

## 2. Latar Belakang & Masalah yang Diselesaikan

Pada penyajian ibadah gereja (khususnya tata ibadah responsif / dialog liturgi), teks pembacaan sering kali memiliki format bersahut-sahutan antara Pelayan/Pendeta (`P:`) dan Jemaat (`J:`). 

### Kendala pada FreeShow Asli:
1. **Tidak Ada Inden Gantung (*Hanging Indent*):** Ketika kalimat ucapan pembicara panjang dan berpindah ke baris ke-2 atau ke-3, teks otomatis kembali ke batas paling kiri (di bawah huruf `P:` atau `J:`), sehingga teks tampak berantakan dan tidak sejajar.
2. **Tombol Tab Tidak Berfungsi di Editor:** Penekanan tombol `Tab` pada keyboard memindahkan fokus kursor (*blur*) keluar dari kanvas teks, sehingga pengguna tidak bisa membuat spasi tabulasi seperti di Microsoft Word atau PowerPoint.
3. **Lebar Huruf Berbeda:** Huruf `P` dan `J` memiliki lebar piksel yang berbeda pada font proporsional, sehingga penambahan spasi manual tidak pernah bisa menghasilkan kelurusan vertikal yang presisi.

---

## 3. Fitur yang Telah Dibangun

### A. Modul Terisolasi: `LiturgiApp`
Untuk menjaga kode tetap bersih dan tidak bentrok (*merge conflicts*) saat memperbarui FreeShow ke versi resmi berikutnya, dibuat modul khusus di:
📁 **`src/frontend/LiturgiApp/`**

* **`templates.ts`**: Menyediakan kategori template khusus **"LiturgiApp"** dan template siap pakai **"Dialog Liturgi"** (`dialog_liturgi`).
* Template ini dilengkapi:
  * Box kontainer putih modern dengan sudut melengkung (*rounded corners*) dan bayangan lembut (*box-shadow*).
  * Judul header liturgi otomatis (`TAHBISAN`).
  * Blok teks dialog responsif dengan nilai *hanging indent* bawaan (`90px`) dan format pembicara siap pakai (`P:\t` dan `J:\t`).

### B. Dukungan Tombol `Tab` di Editor Teks
* Mengintercept penekanan tombol `Tab` di editor kanvas (`EditboxLines.svelte`).
* Mencegah default browser dan menyisipkan karakter tabulasi `\t` pada posisi kursor.
* Kursor langsung melompat tepat ke batas indentasi yang ditentukan.

### C. Mesin CSS Hanging Indent & Tab Stop
Diterapkan pada baris slide presentasi (`TextboxLines.svelte`) maupun baris editor kanvas (`EditboxHelper.ts` & `EditboxLines.svelte`):
```css
padding-left: ${hangingIndent}px;
text-indent: -${hangingIndent}px;
tab-size: ${hangingIndent}px;
```
* **Baris Pertama:** Dimulai dari `0px` (tempat label `P:` atau `J:`).
* **Karakter `\t`:** Melompatkan kata pertama dialog langsung ke posisi `hangingIndent` (misal `90px`).
* **Baris Ke-2, Ke-3, dst:** Otomatis membungkus (*wrap*) rata kiri di posisi `90px`.
* Teks dialog dari pembicara `P:` dan respon `J:` menjadi **lurus sejajar vertikal 100% presisi piksel**.

### D. Penggaris Visual Interaktif (*Visual Ruler* ala Microsoft Word)
* Dibuat komponen baru: **`src/frontend/components/edit/editbox/Ruler.svelte`** yang tersemat langsung di atas kotak teks (Pilihan A).
* **Fitur Penggaris Autentik ala Word:**
  * Garis batas tepi kiri nol (`0px`).
  * Skala ukuran unit (`1, 2, 3, 4, 5...`) dengan tick marks halus setiap 10px, 25px, dan 50px.
  * **Segitiga Atas (⯆ - First Line Indent):** Mengatur posisi awal baris pertama (tempat label `P:` atau `J:`).
  * **Segitiga Bawah (⯅ - Hanging Indent):** Mengatur batas lekukan untuk baris ke-2, ke-3, dst saat kalimat panjang membungkus.
  * **Multi-Tab Stop Markers (Simbol Siku `L` Autentik):**
    * **Setiap Titik L Menjadi Titik Tab:** Setiap simbol `L` yang ditaruh pada mistar penggaris menjadi target titik tab (`\t`) horizontal yang presisi. Tab ke-1 melompat ke titik L pertama, tab ke-2 melompat ke titik L kedua, dst.
    * **Klik untuk Menambah:** Klik sekali di sembarang posisi mistar penggaris untuk menaruh titik tab baru (simbol siku `L`).
    * **Geser untuk Mengatur (*Real-Time Drag*):** Tarik tanda `L` ke kiri atau kanan. Nilai langsung tersimpan ke `showsCache` dan riwayat edit (*history*), dan posisi teks dialog serta batas gantung (*hanging indent*) ikut bergeser secara halus dan instan.
    * **Garis Panduan Vertikal (*Drop Guide Line*):** Garis putus-putus berwarna turun melintasi teks ketika marker digeser sehingga pengguna bisa melihat karakter mana yang sejajar dengan titik tab.
    * **Tarik Keluar untuk Menghapus (*Drag Off to Delete*):** Menarik tanda `L` ke bawah keluar dari mistar penggaris (>25px) mengubah indikator menjadi merah ("Lepas untuk hapus ×") dan menghapus titik tab saat tombol mouse dilepas (atau klik ganda untuk menghapus).
    * **Skala Dinamis:** Skala penggaris (garis tick unit 1, 2, 3...) menyesuaikan secara otomatis mengikuti lebar aktual kotak teks.
  * Terintegrasi penuh dengan sistem **Undo / Redo (Ctrl+Z / Ctrl+Y)**.

### E. Kontrol Input Angka di Sidebar Kanan (Inspector Textbox)
* Di panel kanan (tab **Textbox** -> seksi pengaturan baris/paragraf), ditambahkan kontrol:
  * **Indentasi gantung (*Hanging indent*)**: Kotak angka dalam satuan `px` dengan tombol `[-]` dan `[+]` (kelipatan 5px).
  * **Sinkronisasi Dua Arah:** Mengubah angka di panel samping akan menggeser pin penggaris di kanvas, dan menggeser pin di kanvas akan memperbarui angka di panel samping.
* Dukungan bahasa ganda:
  * Bahasa Indonesia: `Indentasi gantung`, `Penggaris` (`public/lang/id_ID.json`).
  * Bahasa Inggris: `Hanging indent`, `Ruler` (`public/lang/en.json`).

---

## 4. Daftar File yang Dibuat & Dimodifikasi

| Status | File | Deskripsi Perubahan |
| :--- | :--- | :--- |
| **BARU** | `src/frontend/LiturgiApp/templates.ts` | Registrasi kategori LiturgiApp dan template "Dialog Liturgi" |
| **BARU** | `src/frontend/components/edit/editbox/Ruler.svelte` | Komponen visual penggaris interaktif di atas textbox |
| **BARU** | `LITURGI_DOCS.md` | Dokumentasi komprehensif riwayat pengembangan fork |
| **MODIFIKASI** | `src/frontend/utils/createData.ts` | Pendaftaran otomatis template LiturgiApp ke dalam store default templates |
| **MODIFIKASI** | `src/frontend/components/slide/TextboxLines.svelte` | Penerapan styling `hangingIndent` & `tab-size` untuk output dan preview |
| **MODIFIKASI** | `src/frontend/components/edit/editbox/EditboxLines.svelte` | Penanganan tombol `Tab` keyboard dan integrasi CSS indent di editor |
| **MODIFIKASI** | `src/frontend/components/edit/editbox/EditboxHelper.ts` | Konversi HTML DOM dan pembersihan style indent saat parsing line |
| **MODIFIKASI** | `src/frontend/components/edit/editbox/EditboxPlain.svelte` | Penyematan komponen `<Ruler>` di atas textbox aktif |
| **MODIFIKASI** | `src/frontend/components/edit/values/boxes.ts` | Penambahan input `specialStyle.hangingIndent` di sidebar inspector |
| **MODIFIKASI** | `public/lang/id_ID.json` & `public/lang/en.json` | Penambahan string terjemahan untuk label UI |

---

## 5. Panduan Penggunaan untuk Operator

1. **Membuat Slide Dialog Liturgi Baru:**
   * Buka panel bawah, klik tab **Templates**.
   * Pilih kategori **LiturgiApp**, lalu klik **Dialog Liturgi**.
   * Slide dialog siap pakai akan langsung tercipta dengan format yang sudah rapi.
2. **Mengatur Jarak Indentasi:**
   * **Cara 1 (Mouse):** Klik kotak teks di kanvas edit, lalu tarik pin segitiga (🔻) pada penggaris di atas textbox ke kiri atau kanan sesuai estetika yang diinginkan.
   * **Cara 2 (Angka Presisi):** Pada sidebar kanan di tab **Textbox**, ubah nilai angka pada kotak **Indentasi gantung** (misal `70 px`, `90 px`, atau `110 px`).
3. **Mengetik Teks Dialog Baru:**
   * Ketik label pembicara (misal `P:` atau `J:`).
   * Tekan tombol **`Tab`** di keyboard. Kursor akan melompat lurus sejajar dengan batas indentasi.
   * Ketik isi ucapan pembicara. Jika teks melebihi lebar kotak, baris berikutnya akan otomatis tertata rapi di bawah teks pertama (tidak kembali ke bawah label pembicara).

---

## 6. Panduan Pemeliharaan & Sinkronisasi Git (Fork Workflow)

Untuk menjaga agar fork Anda tetap dapat menerima pembaruan dari repositori resmi FreeShow tanpa menghapus fitur LiturgiApp ini:

### Memeriksa Remote:
```bash
git remote -v
# origin   -> https://github.com/gmimkitza/FreeShow.git (push/fetch)
# upstream -> https://github.com/ChurchApps/FreeShow.git (push/fetch)
```

### Mengambil Pembaruan dari Upstream (Jika FreeShow merilis versi baru):
```bash
# 1. Ambil update dari ChurchApps resmi
git fetch upstream

# 2. Pastikan berada di branch kerja
git checkout dialog-liturgi

# 3. Gabungkan update ke branch Anda
git merge upstream/main
# atau
git rebase upstream/main
```

Karena kode inti LiturgiApp ditempatkan di dalam folder mandiri `src/frontend/LiturgiApp/`, potensi konflik saat update di masa depan sangat minim.

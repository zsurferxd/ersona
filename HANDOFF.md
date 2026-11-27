# Handoff & Panduan Lanjut di PC Lain — Ersona (`ersona.site`)

Dokumen ini disiapkan agar proyek company profile **Ersona** dapat dilanjutkan di PC mana saja tanpa kehilangan konteks desain, aturan copywriting, maupun skills.

---

## 1. Setup Cepat di PC Baru

```bash
git clone https://github.com/zsurferxd/ersona.git
cd ersona
npm install
npm run dev
```

Build produksi & cek preview lokal:

```bash
npm run build
npm run preview
```

Output static SPA siap deploy berada di folder `./dist` (sesuai `wrangler.json` untuk Cloudflare Pages / Workers Static Assets, atau hubungkan langsung repo GitHub ke Vercel / Cloudflare Pages).

---

## 2. Skills yang Sudah Tersedia di Repository

Kelima paket skill sudah terpasang di `.agents/skills/` dan tercatat di `skills-lock.json` sehingga ikut terunduh otomatis saat `git clone`:

1. `design-taste-frontend` + kumpulan `taste-skill` (`Leonxlnx/taste-skill`)
2. `antislop`, `antislop-code`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-ui` (`miqdadbadjuber/anti-slop`)
3. `impeccable` (`pbakaus/impeccable`) — konfigurasi ada di `.impeccable/config.json`, hooks di `.codex/hooks.json`, brief di `.impeccable/surfaces/src-components-landingpage-jsx.md`
4. `no-ai-slop` (`petergyang/no-ai-slop`)
5. `avoid-ai-writing` (`conorbronsdon/avoid-ai-writing`)

Opsional di PC baru (bila ingin menjalankan pemeriksaan browser headless `impeccable first-viewport`):

```powershell
.\.agents\skills\impeccable\scripts\impeccable.cmd doctor
```

Bila diminta browser/Playwright di PC baru, jalankan `npx playwright install chromium`. Jika menggunakan Windows Command/PowerShell, `impeccable.cmd` tersedia langsung di folder scripts di atas.

---

## 3. Catatan Konteks Bisnis & Aturan Desain

- **Brand & Domain:** Ersona (`ersona.site`).
- **Kontak Resmi:**
  - WhatsApp: `0895629460463` (`0895-6294-60463` / `https://wa.me/62895629460463`)
  - Email: `support@ersona.site`
- **Fokus Layanan Publik:** 100% software dan sistem operasional berbasis web (aplikasi stok/gudang/quotation/invoice, kasir kafe & retail, website profil/reservasi hotel & jasa, serta sistem member/jadwal gym, studio, dan kantor). Layanan jaringan/infrastruktur fisik disimpan offline dan hanya dibahas bila klien bertanya langsung.
- **Aturan Desain & Copywriting:**
  - **1 Tema Terang Tunggal:** Latar `#FFFFFF` & `#F4F4F5` dengan blok kontras `#121512` (mengacu pada tata letak Copora). Jangan tambah ulang dark mode toggle.
  - **Tipografi Self-Hosted:** `Bricolage Grotesque` (heading display), `Onest` (body/UI), `JetBrains Mono` (hanya nomor kontak, email, dan label kanvas/demo) di `src/assets/fonts/` dan `src/index.css`.
  - **Bahasa & Copywriting:** Dwibahasa `ID` (default) / `EN` via `src/locales/translations.js` dan `src/context/ThemeLanguageContext.jsx`. Hindari tanda kurung `(...)` yang tidak perlu, jaga judul tetap ringkas, dan dilarang mengarang statistik, penghargaan, atau testimoni palsu.
- **Referensi Desain Lengkap:** Baca `PRODUCT.md` dan `DESIGN.md` sebelum mengubah struktur utama.

---

## 4. Peta Slot Canvas Kosong (Siap Diisi Gambar)

Seluruh wadah gambar di `src/components/LandingPage.jsx` sudah disiapkan penuh rasio (`overflow-hidden`). Saat aset foto/screenshot siap, simpan file ke `public/images/` lalu ganti konten placeholder dengan `<img src="/images/nama-file.jpg" alt="..." className="w-full h-full object-cover" />`:

1. **Hero Bento (3 Canvas):**
   - `CANVAS 01 · FOTO UTAMA 3:5` (kiri tinggi penuh)
   - `CANVAS 02 · CUPLIKAN APLIKASI` (kanan atas)
   - `CANVAS 03 · SUASANA KERJA` (kanan bawah)
2. **Bagian Sistem Kerja `#sistem` (4 Kartu Rasio `4:3`):**
   - `Stok & Penawaran` (toko/gudang/distributor)
   - `Kasir & Kafe` (kafe/resto/retail)
   - `Website & Reservasi` (hotel/vila/jasa)
   - `Member & Portal Tim` (gym/klinik/kantor)
3. **Bagian Alur Kerja `#alur` (1 Canvas Rasio `4:5` di panel gelap sebelah kiri)**
4. **Bagian Portofolio `#portofolio` (3 Canvas `DEMO 01`–`03` Rasio `16:10`):**
   - Pastikan screenshot aplikasi nyata (seperti sistem *Newtex Flooring* `https://newtexsystem.pages.dev/`) sudah memakai data contoh / nama klien disamarkan sebelum ditayangkan publik.

---

## 5. Prompt Siap Pakai untuk Melanjutkan di PC Lain

Salin prompt di bawah ini ke agent saat membuka folder repository `ersona` di PC baru:

```text
Baca dulu PRODUCT.md, DESIGN.md, HANDOFF.md, src/components/LandingPage.jsx, dan src/locales/translations.js sebelum mulai bekerja.

Gunakan skills yang ada di .agents/skills/ (impeccable, design-taste-frontend, antislop, no-ai-slop, avoid-ai-writing) dan patuhi aturan berikut:
1. Fokus 100% pada software house / pembuatan sistem operasional web custom (stok/invoice, kasir kafe, website/reservasi hotel, member/jadwal gym, portal kantor). Jangan masukkan layanan kabel/jaringan fisik.
2. Pertahankan 1 tema terang tunggal (tanpa toggle dark mode), kombinasi font self-hosted Bricolage Grotesque + Onest + JetBrains Mono, serta header single-row dengan switcher ID / EN inline.
3. Jaga copywriting tetap natural berbahasa Indonesia & Inggris, ringkas, dan hindari tanda kurung serta klaim/testimoni fiktif.
4. Setelah mengedit kode, verifikasi selalu dengan `npm run build` dan cek visual/antipattern dengan impeccable.

Tugas saya sekarang adalah: [TULIS TUGAS LANJUTAN ANDA DI SINI, misal: pasang foto-foto di public/images/ ke Canvas Hero dan Sistem Kerja, atau tambahkan live demo Newtex di DEMO 01]
```

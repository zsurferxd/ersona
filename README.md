# Solist — Notion-Style Workspace (To-Do & Catatan)

Aplikasi web modern untuk manajemen To-Do List dan Catatan dengan antarmuka minimalis bergaya Notion. Dibangun menggunakan **React (Vite)**, **Tailwind CSS v4**, dan backend **Supabase** dengan keamanan data berbasis **Row Level Security (RLS)**.

---

## Fitur Utama

- 🪐 **Desain Minimalis Ala Notion**: Font Inter, palet warna lembut (`#FBFBFA`), custom scrollbar, dan layout kartu & sidebar.
- 🔐 **Autentikasi Aman**: Login dan registrasi menggunakan Supabase Auth (Email & Password).
- 🛡️ **Privasi & Keamanan Data (RLS)**: Pengaturan Row Level Security di PostgreSQL memastikan setiap pengguna hanya bisa melihat, menambah, mengedit, dan menghapus catatan & tugas miliknya sendiri.
- 📅 **To-Do List & Jadwal**: Quick-add inline task, pemilihan due date (batas waktu), indikator status (terlewat/hari ini/mendatang), dan checkbox completion.
- 📝 **Catatan Interaktif**: Blok catatan dengan emoji kustom, modal editor, dan tampilan kartu responsif.
- 🔍 **Pencarian Instan**: Cari tugas atau catatan langsung dari search bar header.
- 🚀 **Vercel Ready**: Dilengkapi dengan `vercel.json` rewrite untuk deployment tanpa kendala routing.

---

## Struktur Proyek

```
solist/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth.jsx             # Form Login & Register Notion-style
│   │   └── Dashboard.jsx        # Dashboard utama (Sidebar, Tasks, Notes)
│   ├── context/
│   │   └── AuthContext.jsx      # Global context untuk Supabase auth session
│   ├── lib/
│   │   └── supabaseClient.js    # Inisialisasi client Supabase
│   ├── App.jsx                  # Root router kondisional (Auth / Dashboard)
│   ├── index.css                # Styling Tailwind v4 & tema Notion
│   └── main.jsx                 # Entry point React
├── supabase/
│   └── schema.sql               # Skema PostgreSQL & RLS Policies
├── .env.example                 # Template variabel lingkungan
├── .env                         # Konfigurasi lokal (URL & Anon Key)
├── vercel.json                  # Konfigurasi SPA rewrite untuk Vercel
├── package.json
└── vite.config.js
```

---

## Panduan Menjalankan di Lokal

### 1. Setup Database Supabase
1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor** di dashboard Supabase.
3. Buka file [`supabase/schema.sql`](supabase/schema.sql) di proyek ini, salin seluruh kodenya, lalu klik **Run** di Supabase.

### 2. Atur Environment Variables
Buka file `.env` di root proyek Anda, lalu masukkan kredensial dari **Project Settings > API** di Supabase:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Jalankan Aplikasi
```bash
# Jalankan server pengembangan lokal
npm run dev
```

Buka browser di `http://localhost:5173`.

---

## Panduan Deploy ke Vercel

1. **Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/username/solist.git
   git push -u origin main
   ```
2. **Import ke Vercel**:
   - Buka [vercel.com](https://vercel.com) dan klik **Add New... > Project**.
   - Pilih repositori GitHub Anda.
   - Di bagian **Environment Variables**, tambahkan:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Klik **Deploy**.
3. **Atur Redirect URL di Supabase**:
   - Di dashboard Supabase, buka **Authentication > URL Configuration**.
   - Ubah **Site URL** ke domain Vercel Anda (misal: `https://solist.vercel.app`).
   - Tambahkan `https://solist.vercel.app/**` di **Redirect URLs**.

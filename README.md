# WhatsApp Financial Management Bot

## Overview
Sistem bot keuangan WhatsApp ini menyediakan solusi lengkap untuk pengelolaan keuangan pribadi melalui antarmuka WhatsApp dan web. Fitur utama meliputi pencatatan transaksi, pengelolaan anggaran, pelacakan tujuan keuangan, analisis keuangan canggih, serta integrasi pengingat dan notifikasi.

## Fitur Utama
- Pencatatan transaksi otomatis via WhatsApp dengan NLP tingkat lanjut
- Pengelolaan anggaran dengan rekomendasi otomatis
- Pelacakan dan gamifikasi tujuan keuangan
- Dashboard interaktif dengan widget yang dapat dikustomisasi
- Integrasi kalender untuk pengingat dan perencanaan keuangan
- Fitur kolaborasi untuk keluarga atau tim keuangan
- Notifikasi otomatis untuk tagihan, anggaran, dan aktivitas penting
- Analisis sentimen untuk memahami kondisi keuangan pengguna
- Keamanan tingkat tinggi dengan autentikasi dan enkripsi data

## Teknologi
- Backend: Node.js, Express, MongoDB, WhatsApp Web.js, NLP.js, Google Speech-to-Text
- Frontend: React, Redux, Tailwind CSS, React DnD, React Big Calendar
- DevOps: Nodemon, PM2, Docker (opsional)

## Instalasi
1. Clone repository
2. Install dependencies backend dan frontend
3. Konfigurasi file `.env` sesuai `.env.example`
4. Jalankan MongoDB
5. Jalankan backend: `npm run dev` di folder backend
6. Jalankan frontend: `npm start` di folder frontend
7. Akses aplikasi di `http://localhost:3000`

## Pengujian
- Backend: Unit dan integrasi menggunakan Jest dan Supertest
- Frontend: Pengujian komponen dan E2E menggunakan React Testing Library dan Cypress
- Pengujian manual untuk fitur WhatsApp bot dan web interface

## Cara Penggunaan
- Daftar dan login di web
- Aktivasi nomor WhatsApp melalui QR code
- Mulai catat transaksi dan kelola keuangan via WhatsApp atau web
- Gunakan fitur pengingat dan notifikasi untuk manajemen keuangan yang lebih baik
- Manfaatkan dashboard dan laporan untuk analisis keuangan

## Roadmap Pengembangan
- Peningkatan akurasi NLP dan dukungan bahasa daerah
- Implementasi pemindaian struk belanja dengan OCR
- Fitur obrolan grup untuk pengeluaran bersama
- Integrasi API bank dan e-wallet
- Fitur ekspor/impor data lanjutan
- Autentikasi dua faktor dan keamanan tambahan
- Optimasi performa dan skalabilitas

## Kontak
Untuk dukungan dan pertanyaan, hubungi: support@example.com

---

## Testing Commands

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## Demo
- Jalankan backend dan frontend
- Gunakan WhatsApp untuk berinteraksi dengan bot
- Gunakan web untuk manajemen dan analisis keuangan

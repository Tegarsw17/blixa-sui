# Panduan Link Sharing untuk Print

## Untuk User (Yang Upload Dokumen)

### 1. Login
- Buka `http://localhost:3000/user`
- Connect wallet Sui Anda

### 2. Upload Dokumen
- Klik "Choose File" dan pilih PDF
- Klik "Upload PDF"
- Tunggu sampai upload selesai

### 3. Generate Link
- Setelah upload berhasil, klik "Generate Link untuk Print"
- Link akan muncul di layar

### 4. Kirim Link ke Printer
Ada 2 cara:

**Cara 1: Copy Link**
- Klik tombol "Copy Link"
- Paste link di WhatsApp/Telegram/Email
- Kirim ke printer agent

**Cara 2: WhatsApp Langsung**
- Klik tombol "Kirim via WhatsApp"
- Pilih kontak printer agent
- Kirim pesan

### 5. Link Format
```
http://localhost:3000/agent?sessionId=xxx&token=yyy
```

⚠️ **Penting:**
- Link hanya bisa digunakan SATU KALI
- Link expire dalam 10 menit
- File akan dihapus setelah print

---

## Untuk Printer Agent

### 1. Terima Link
- Terima link dari user via WhatsApp/chat

### 2. Buka Link
**Cara 1: Klik Langsung (Recommended)**
- Klik link yang dikirim user
- Browser akan otomatis buka halaman agent
- Session langsung dimuat

**Cara 2: Manual Paste**
- Buka `http://localhost:3000/agent`
- Copy link yang dikirim user
- Paste di form "Load Print Session"
- Klik "Load Session"

### 3. Print Dokumen
- Setelah session dimuat, klik "🖨️ Print Document"
- File akan di-download (simulasi print)
- File otomatis dihapus dari server
- Link tidak bisa digunakan lagi

---

## Troubleshooting

### Link Tidak Bisa Dibuka
- Pastikan backend dan frontend sudah running
- Cek apakah link masih valid (belum expire)
- Cek apakah link belum pernah digunakan

### Session Tidak Dimuat
- Refresh halaman
- Cek console browser untuk error
- Pastikan wallet sudah terconnect

### Print Gagal
- Cek koneksi internet
- Cek apakah file masih ada di server
- Cek log backend untuk error detail

---

## Contoh Flow Lengkap

1. **User**: Upload invoice.pdf
2. **User**: Klik "Generate Link"
3. **User**: Copy link: `http://localhost:3000/agent?sessionId=abc123&token=xyz789`
4. **User**: Kirim via WhatsApp ke printer
5. **Printer**: Klik link di WhatsApp
6. **Printer**: Browser buka halaman agent dengan session sudah dimuat
7. **Printer**: Klik "Print Document"
8. **Printer**: File di-download
9. **System**: File dihapus dari server
10. **System**: Session ditandai complete di blockchain

---

## Keamanan

✅ **Aman karena:**
- One-time token (tidak bisa digunakan 2x)
- Expire time (10 menit)
- Blockchain verification
- File terenkripsi di storage
- Audit trail di blockchain

❌ **Jangan:**
- Share link di public channel
- Gunakan link yang sudah expire
- Simpan link untuk digunakan nanti

---

## Testing di Local

### Terminal 1: Backend
```bash
cd backend
npm start
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### Browser 1: User
```
http://localhost:3000/user
```

### Browser 2: Agent (atau tab baru)
```
Klik link yang di-generate user
```

---

## Production Setup

Update `backend/.env`:
```
FRONTEND_URL=https://your-domain.com
```

Link akan otomatis menggunakan domain production.

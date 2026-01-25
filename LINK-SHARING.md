# Link Sharing untuk Print Session

## Overview

Sistem ini menggantikan QR code dengan shareable link untuk mengirim dokumen ke printer. User upload dokumen, generate link, dan kirim link tersebut ke printer agent melalui WhatsApp atau metode lain.

## Cara Kerja

### 1. User Upload Dokumen
- User login dengan wallet Sui
- Upload file PDF (max 10MB)
- File dienkripsi dan disimpan di server

### 2. Generate Link
- User klik "Generate Link untuk Print"
- Backend membuat print session di blockchain
- Backend generate shareable link dengan format:
  ```
  http://localhost:3000/agent?sessionId=xxx&token=yyy
  ```

### 3. Kirim Link ke Printer
- User copy link atau kirim via WhatsApp
- Link berisi sessionId dan one-time token
- Link hanya bisa digunakan SATU KALI
- Link expire dalam 10 menit

### 4. Printer Agent Claim Session
- Agent klik link atau paste di form
- Session otomatis dimuat dari URL parameters
- Agent bisa langsung print dokumen
- Setelah print, file dihapus permanen

## Endpoint API Baru

### GET /api/sessions/:id/link
Generate shareable link untuk print session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "link": "http://localhost:3000/agent?sessionId=xxx&token=yyy",
  "sessionId": "xxx",
  "expiresAt": "2026-01-25T12:00:00.000Z"
}
```

## Frontend Changes

### User Page (`/user`)
- Mengganti QR code dengan shareable link
- Tombol "Copy Link" untuk copy ke clipboard
- Tombol "Kirim via WhatsApp" untuk share langsung
- Menampilkan link dalam format yang mudah dibaca

### Agent Page (`/agent`)
- Auto-load session dari URL parameters
- Mendukung klik link langsung
- Tetap support manual paste untuk backward compatibility
- UI lebih sederhana tanpa QR scanner

## Environment Variables

Tambahkan di `backend/.env`:
```
FRONTEND_URL=http://localhost:3000
```

Untuk production:
```
FRONTEND_URL=https://your-domain.com
```

## Keuntungan Link Sharing

1. **Lebih Mudah**: Tidak perlu scan QR code
2. **Fleksibel**: Bisa kirim via WhatsApp, email, atau chat
3. **Mobile Friendly**: Klik link langsung buka di browser
4. **Tetap Aman**: One-time token, expire time, blockchain verification
5. **Better UX**: Tidak perlu kamera atau QR scanner

## Security

- Link menggunakan one-time token yang di-hash di blockchain
- Token tidak bisa digunakan dua kali
- Session expire otomatis setelah 10 menit
- File dienkripsi di storage
- Blockchain audit trail untuk semua transaksi

## Testing

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Login sebagai user di `/user`
4. Upload PDF dan generate link
5. Copy link dan buka di tab baru (sebagai agent)
6. Atau kirim link via WhatsApp ke device lain
7. Klik link untuk auto-load session
8. Print dokumen

## Backward Compatibility

Endpoint QR code (`/api/sessions/:id/qr`) masih tersedia untuk backward compatibility, tapi UI sudah diganti dengan link sharing.

# Session Error Handling - Completed Sessions

## Perubahan yang Dilakukan

Ketika session sudah complete (di-print dan dihapus), link yang dibuka akan menampilkan error message yang jelas dan informatif.

## Error Messages

### 1. Session Tidak Ditemukan (404)
```
Session tidak ditemukan. Session mungkin sudah dihapus setelah print selesai.
```

### 2. Session Sudah Di-Print (400)
```
Session sudah di-print dan dihapus secara permanen. Link tidak dapat digunakan lagi.
```

### 3. Session Kadaluarsa (400)
```
Session sudah kadaluarsa. Silakan buat session baru.
```

### 4. Token Tidak Valid (401)
```
Token tidak valid. Pastikan link yang digunakan benar.
```

## UI Error Display

Error ditampilkan dengan:
- ❌ Icon merah yang jelas
- Judul: "Session Tidak Tersedia"
- Pesan error dari API
- Box informasi dengan kemungkinan penyebab:
  - Session sudah di-print dan dihapus secara permanen
  - Link sudah kadaluarsa atau tidak valid
  - Session dibatalkan oleh user
  - Token tidak cocok atau sudah digunakan
- Tombol "Tutup & Coba Lagi" untuk reset

## Testing

1. Buat session dan print hingga selesai
2. Buka link yang sama lagi
3. Akan muncul error: "Session sudah di-print dan dihapus secara permanen. Link tidak dapat digunakan lagi."

## File yang Diubah

1. `backend/src/routes/agent.js` - Error messages yang lebih jelas
2. `frontend/app/agent/page.tsx` - UI error display yang informatif

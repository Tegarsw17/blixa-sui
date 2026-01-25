'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { Upload, FileText, QrCode } from 'lucide-react';
import { uploadDocument, createSession, getQRCode, setAuthToken, verifyWallet } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

export default function UserPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);

  useEffect(() => {
    if (!account) {
      router.push('/');
      return;
    }

    // Simple auth untuk MVP
    const token = btoa(`${account.address}:${Date.now()}`);
    setAuthToken(token);
  }, [account, router]);

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      setDocument(doc);
      alert('Dokumen berhasil diupload!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!document) return;

    try {
      const sess = await createSession(document.id, 10);
      setSession(sess);
      
      const qr = await getQRCode(sess.id);
      setQrData(qr);
      
      alert('Session berhasil dibuat!');
    } catch (error) {
      console.error('Create session error:', error);
      alert('Gagal membuat session');
    }
  };

  if (!account) return null;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">User Portal</h1>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Upload className="mr-2" /> Upload Dokumen
          </h2>
          
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="mb-4 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />

          {file && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                File: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>

        {/* Document Info */}
        {document && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FileText className="mr-2" /> Dokumen
            </h2>
            <div className="space-y-2 text-sm">
              <p><strong>Filename:</strong> {document.filename}</p>
              <p><strong>Size:</strong> {document.size} bytes</p>
              <p><strong>Hash:</strong> {document.hash.substring(0, 16)}...</p>
            </div>

            <button
              onClick={handleCreateSession}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Generate QR Code
            </button>
          </div>
        )}

        {/* QR Code */}
        {qrData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <QrCode className="mr-2" /> QR Code untuk Print
            </h2>
            
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded">
                <QRCodeSVG value={qrData.payload} size={256} />
              </div>
              
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p><strong>Session ID:</strong> {session.id}</p>
                <p><strong>Status:</strong> {session.status}</p>
                <p><strong>Expires:</strong> {new Date(session.expiresAt).toLocaleString()}</p>
                {session.suiTxCreate && (
                  <p>
                    <strong>Tx Hash:</strong>{' '}
                    <a
                      href={`https://suiexplorer.com/txblock/${session.suiTxCreate}?network=testnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {session.suiTxCreate.substring(0, 16)}...
                    </a>
                  </p>
                )}
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded text-sm">
                <p className="font-bold mb-2">⚠️ Penting:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>QR code ini hanya bisa digunakan SATU KALI</li>
                  <li>File akan otomatis dihapus setelah print</li>
                  <li>Session akan expire dalam 10 menit</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Link as LinkIcon, Copy, Check, Send, QrCode } from 'lucide-react';
import QRCode from 'qrcode.react';
import { uploadDocument, createSession, CreateSessionParams } from '@/lib/api';
import { saveToUploadHistory } from '@/lib/storage';
import { usePrintSessionContract } from '@/lib/blockchain';

export default function UserPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const contractService = usePrintSessionContract();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!account) {
      router.push('/');
      return;
    }
  }, [account, router]);

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        alert('Hanya file PDF yang diperbolehkan');
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Walrus with client-side encryption
      const doc = await uploadDocument(file);
      setDocument(doc);

      // Save to upload history
      saveToUploadHistory({
        blobId: doc.blobId,
        filename: doc.filename,
        size: doc.size,
        hash: doc.hash,
        createdAt: Date.now(),
      });

      alert('Dokumen berhasil diupload dan dienkripsi!');
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!document) return;

    setCreatingSession(true);
    try {
      // Create session on blockchain
      const params: CreateSessionParams = {
        blobId: document.blobId,
        filename: document.filename,
        fileSize: document.size,
        documentHash: document.hash,
        encryptionKey: document.encryptionKey,
        expiresIn: 10 * 60 * 1000, // 10 minutes
      };

      const sess = await createSession(params, contractService);
      setSession(sess);
      setShareableLink(sess.shareableLink);

      alert('Session berhasil dibuat di blockchain!');
    } catch (error) {
      console.error('Create session error:', error);
      alert(`Gagal membuat session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      alert('Gagal copy link');
    }
  };

  const handleSendToWhatsApp = () => {
    const message = encodeURIComponent(
      `Halo! Silakan klik link ini untuk print dokumen:\n\n${shareableLink}\n\n⚠️ Link ini hanya bisa digunakan SATU KALI dan akan expire dalam 10 menit.`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
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
            {uploading ? 'Uploading & Encrypting...' : 'Upload PDF'}
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
              <p><strong>Walrus Blob ID:</strong> {document.blobId.substring(0, 16)}...</p>
            </div>

            <button
              onClick={handleCreateSession}
              disabled={creatingSession}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {creatingSession ? 'Creating Session...' : 'Generate Link untuk Print'}
            </button>
          </div>
        )}

        {/* Shareable Link & QR Code */}
        {shareableLink && session && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <LinkIcon className="mr-2" /> Link untuk Print
            </h2>

            <div className="space-y-6">
              {/* Link Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareable Link
                </label>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm font-mono break-all">{shareableLink}</p>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </label>
                <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-gray-200">
                  <QRCode
                    value={shareableLink}
                    size={256}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Link
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendToWhatsApp}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  <Send size={18} />
                  Kirim via WhatsApp
                </button>
              </div>

              {/* Session Info */}
              <div className="text-sm text-gray-600 space-y-1 pt-4 border-t">
                <p><strong>Object ID:</strong> {session.objectId.substring(0, 16)}...</p>
                <p><strong>Session ID:</strong> {session.sessionId}</p>
                <p><strong>Expires:</strong> {new Date(session.expiresAt).toLocaleString()}</p>
              </div>

              {/* Warning Box */}
              <div className="p-4 bg-yellow-50 rounded text-sm">
                <p className="font-bold mb-2">⚠️ Penting:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Link ini hanya bisa digunakan SATU KALI</li>
                  <li>File dienkripsi dan disimpan di Walrus (decentralized storage)</li>
                  <li>Session akan expire dalam 10 menit</li>
                  <li>Setelah print, session akan dihapus dari blockchain</li>
                  <li>Kirim link ini ke printer agent untuk memulai print</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

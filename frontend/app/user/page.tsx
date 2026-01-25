'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Link as LinkIcon, Copy, Check, ArrowLeft, Sparkles, Send } from 'lucide-react';
import { uploadDocument, createSession, getShareableLink, setAuthToken } from '@/lib/api';

export default function UserPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

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
      
      const linkData = await getShareableLink(sess.id);
      setShareableLink(linkData.link);
      
      alert('Link berhasil dibuat!');
    } catch (error) {
      console.error('Create session error:', error);
      alert('Gagal membuat session');
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
              Generate Link untuk Print
            </button>
          </div>
        )}

        {/* Shareable Link */}
        {shareableLink && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <LinkIcon className="mr-2" /> Link untuk Print
            </h2>
            
            <div className="space-y-4">
              {/* Link Display */}
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-sm font-mono break-all">{shareableLink}</p>
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
                  📱 Kirim via WhatsApp
                </button>
              </div>

              {/* Session Info */}
              <div className="text-sm text-gray-600 space-y-1 pt-4 border-t">
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

              {/* Warning Box */}
              <div className="mt-4 p-4 bg-yellow-50 rounded text-sm">
                <p className="font-bold mb-2">⚠️ Penting:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Link ini hanya bisa digunakan SATU KALI</li>
                  <li>File akan otomatis dihapus setelah print</li>
                  <li>Session akan expire dalam 10 menit</li>
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

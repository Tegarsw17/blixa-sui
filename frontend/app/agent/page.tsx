'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { Printer, Scan, CheckCircle } from 'lucide-react';
import { claimSession, streamDocument, completeSession, setAuthToken } from '@/lib/api';

export default function AgentPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [qrInput, setQrInput] = useState('');
  const [session, setSession] = useState<any>(null);
  const [printing, setPrinting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!account) {
      router.push('/');
      return;
    }

    const token = btoa(`${account.address}:${Date.now()}`);
    setAuthToken(token);
  }, [account, router]);

  const handleScan = async () => {
    try {
      const payload = JSON.parse(qrInput);
      const { sessionId, token } = payload;

      const claimed = await claimSession(sessionId, token);
      setSession({ ...claimed, sessionId, token });
      alert('Session berhasil di-claim!');
    } catch (error) {
      console.error('Scan error:', error);
      alert('QR code tidak valid atau sudah digunakan');
    }
  };

  const handlePrint = async () => {
    if (!session) return;

    setPrinting(true);
    try {
      // Download file
      const blob = await streamDocument(session.sessionId, session.token);
      
      // Simulasi print: buat download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = session.document.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Complete session
      const result = await completeSession(session.sessionId, session.token, 'success');
      
      setCompleted(true);
      alert('Print berhasil! File telah dihapus dari sistem.');
      
      console.log('Print completed:', result);
    } catch (error) {
      console.error('Print error:', error);
      alert('Print gagal');
    } finally {
      setPrinting(false);
    }
  };

  if (!account) return null;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Print Agent Portal</h1>

        {!session ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Scan className="mr-2" /> Scan QR Code
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Paste QR code payload atau scan menggunakan kamera
            </p>

            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder='{"sessionId":"...","token":"..."}'
              className="w-full p-3 border rounded mb-4 font-mono text-sm"
              rows={4}
            />

            <button
              onClick={handleScan}
              disabled={!qrInput}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Validate QR Code
            </button>
          </div>
        ) : !completed ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Printer className="mr-2" /> Ready to Print
            </h2>

            <div className="space-y-2 text-sm mb-6">
              <p><strong>Filename:</strong> {session.document.filename}</p>
              <p><strong>Size:</strong> {session.document.size} bytes</p>
              <p><strong>Session ID:</strong> {session.sessionId}</p>
            </div>

            <button
              onClick={handlePrint}
              disabled={printing}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400 text-lg"
            >
              {printing ? 'Printing...' : '🖨️ Print Document'}
            </button>

            <div className="mt-4 p-4 bg-blue-50 rounded text-sm">
              <p className="font-bold mb-2">ℹ️ Info:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Klik tombol Print untuk memulai</li>
                <li>File akan di-download (simulasi print)</li>
                <li>Setelah print, file akan dihapus permanen</li>
                <li>QR code tidak bisa digunakan lagi</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Print Completed!</h2>
            <p className="text-gray-600 mb-4">
              Dokumen telah berhasil dicetak dan dihapus dari sistem
            </p>
            <button
              onClick={() => {
                setSession(null);
                setCompleted(false);
                setQrInput('');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Scan QR Baru
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

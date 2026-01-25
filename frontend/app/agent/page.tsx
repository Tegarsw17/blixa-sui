'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer, CheckCircle, Link as LinkIcon, Loader2, Download, Trash2, FileCheck } from 'lucide-react';
import { claimSession, streamDocument, completeSession, setAuthToken } from '@/lib/api';

type PrintStep = 'claiming' | 'downloading' | 'printing' | 'deleting' | 'completing' | 'done';

export default function AgentPage() {
  const account = useCurrentAccount();
  const searchParams = useSearchParams();
  const autoLoadRef = useRef(false); // Use ref instead of state
  const [qrInput, setQrInput] = useState('');
  const [session, setSession] = useState<any>(null);
  const [printing, setPrinting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [printStep, setPrintStep] = useState<PrintStep | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // JANGAN redirect ke home jika tidak ada account
    // Biarkan halaman tetap terbuka
    if (!account) {
      return; // HAPUS router.push('/')
    }

    const token = btoa(`${account.address}:${Date.now()}`);
    setAuthToken(token);

    // Auto-load session from URL parameters - HANYA SEKALI menggunakan ref
    if (!autoLoadRef.current) {
      const sessionId = searchParams.get('sessionId');
      const sessionToken = searchParams.get('token');
      
      if (sessionId && sessionToken) {
        autoLoadRef.current = true; // Set ref agar tidak load lagi
        handleAutoLoad(sessionId, sessionToken);
      }
    }
  }, [account]); // HAPUS router dari dependency juga

  const handleAutoLoad = async (sessionId: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      const claimed = await claimSession(sessionId, token);
      setSession({ ...claimed, sessionId, token });
      console.log('Session loaded successfully:', claimed);
    } catch (err: any) {
      console.error('Auto-load error:', err);
      // Tampilkan error message yang jelas
      const errorMessage = err.message || 'Session tidak ditemukan atau sudah dihapus';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = JSON.parse(qrInput);
      const { sessionId, token } = payload;

      const claimed = await claimSession(sessionId, token);
      setSession({ ...claimed, sessionId, token });
      console.log('Session scanned successfully:', claimed);
    } catch (err: any) {
      console.error('Scan error:', err);
      const errorMessage = err.message || 'Gagal memuat session. Pastikan payload valid dan session masih aktif.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handlePrint = async () => {
    if (!session) return;

    setPrinting(true);
    setProgress(0);
    
    try {
      // Step 1: Claiming session
      setPrintStep('claiming');
      setProgress(10);
      await sleep(800);
      
      // Step 2: Downloading file
      setPrintStep('downloading');
      setProgress(30);
      const blob = await streamDocument(session.sessionId, session.token);
      setProgress(50);
      await sleep(500);
      
      // Step 3: Printing (buka di tab baru untuk print)
      setPrintStep('printing');
      setProgress(60);
      
      // Buka PDF di tab baru browser untuk langsung print
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      // Tunggu tab baru terbuka, lalu trigger print dialog
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      await sleep(1500);
      setProgress(75);
      
      // Cleanup URL setelah delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 3000);
      
      await sleep(500);
      
      // Step 4: Deleting file
      setPrintStep('deleting');
      setProgress(85);
      await sleep(800);
      
      // Step 5: Completing session
      setPrintStep('completing');
      setProgress(95);
      const result = await completeSession(session.sessionId, session.token, 'success');
      
      // Step 6: Done
      setPrintStep('done');
      setProgress(100);
      // TIDAK auto close, tunggu user klik tombol
      
      console.log('Print completed:', result);
    } catch (err) {
      console.error('Print error:', err);
      // JANGAN alert, tampilkan error di console saja
      setPrintStep(null);
      setPrinting(false);
    }
    // JANGAN set setPrinting(false) di sini, biarkan modal tetap terbuka
  };

  const handleCloseModal = () => {
    setPrinting(false);
    setPrintStep(null);
    setProgress(0);
    setCompleted(true);
    // JANGAN redirect, biarkan UI completed page muncul
  };

  const getStepIcon = (step: PrintStep) => {
    switch (step) {
      case 'claiming':
        return <Loader2 className="animate-spin" size={24} />;
      case 'downloading':
        return <Download size={24} />;
      case 'printing':
        return <Printer size={24} />;
      case 'deleting':
        return <Trash2 size={24} />;
      case 'completing':
        return <FileCheck size={24} />;
      case 'done':
        return <CheckCircle size={24} />;
      default:
        return null;
    }
  };

  const getStepText = (step: PrintStep) => {
    switch (step) {
      case 'claiming':
        return 'Memverifikasi session...';
      case 'downloading':
        return 'Mengunduh dokumen...';
      case 'printing':
        return 'Mencetak dokumen...';
      case 'deleting':
        return 'Menghapus file dari server...';
      case 'completing':
        return 'Menyelesaikan transaksi...';
      case 'done':
        return 'Print berhasil!';
      default:
        return '';
    }
  };

  // JANGAN return null jika tidak ada account
  // Biarkan halaman tetap render
  
  // Loading state saat auto-load dari URL
  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold mb-2">Loading Session...</h2>
          <p className="text-gray-600">Mohon tunggu, sedang memuat print session</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Print Agent Portal</h1>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-6 animate-slide-down">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">Session Tidak Tersedia</h3>
                <p className="text-red-800 mb-4">{error}</p>
                <div className="bg-red-100 rounded p-4 text-sm text-red-900 space-y-2">
                  <p className="font-semibold">Kemungkinan penyebab:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Session sudah di-print dan dihapus secara permanen</li>
                    <li>Link sudah kadaluarsa atau tidak valid</li>
                    <li>Session dibatalkan oleh user</li>
                    <li>Token tidak cocok atau sudah digunakan</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    setQrInput('');
                  }}
                  className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold"
                >
                  Tutup & Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Progress Modal */}
        {printing && printStep && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
            onClick={(e) => {
              // Prevent closing modal by clicking backdrop when not done
              if (printStep !== 'done') {
                e.stopPropagation();
              }
            }}
          >
            <div 
              className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {/* Icon */}
                <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4 transition-all duration-300 ${
                  printStep === 'done' 
                    ? 'bg-green-100 text-green-600 scale-110' 
                    : 'bg-blue-100 text-blue-600 animate-pulse-slow'
                }`}>
                  {getStepIcon(printStep)}
                </div>

                {/* Step Text */}
                <h2 className="text-xl font-bold mb-2 animate-slide-up">{getStepText(printStep)}</h2>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      printStep === 'done' ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Progress Percentage */}
                <p className="text-sm text-gray-600 mb-4 font-mono">{progress}%</p>

                {/* Step Details */}
                <div className="text-left bg-gray-50 rounded p-4 text-sm space-y-2">
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    printStep === 'claiming' || progress > 10 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {progress > 10 ? (
                      <CheckCircle size={16} className="animate-scale-in" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                    <span>Verifikasi session</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    printStep === 'downloading' || progress > 50 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {progress > 50 ? (
                      <CheckCircle size={16} className="animate-scale-in" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                    <span>Download dokumen</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    printStep === 'printing' || progress > 75 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {progress > 75 ? (
                      <CheckCircle size={16} className="animate-scale-in" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                    <span>Cetak dokumen</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    printStep === 'deleting' || progress > 85 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {progress > 85 ? (
                      <CheckCircle size={16} className="animate-scale-in" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                    <span>Hapus file dari server</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    printStep === 'completing' || progress > 95 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {progress > 95 ? (
                      <CheckCircle size={16} className="animate-scale-in" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                    <span>Selesaikan transaksi</span>
                  </div>
                </div>

                {/* Done Message */}
                {printStep === 'done' && (
                  <div className="mt-4 space-y-3">
                    {/* Success Message with Animation */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg text-green-800 animate-slide-up border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle size={20} className="text-white" />
                        </div>
                        <h3 className="font-bold text-lg">Print Berhasil!</h3>
                      </div>
                      <p className="text-sm">
                        Dokumen telah berhasil dicetak dan dihapus dari sistem secara permanen.
                      </p>
                    </div>
                    
                    {/* Transaction Info */}
                    <div className="p-3 bg-blue-50 rounded text-xs text-blue-800 space-y-1">
                      <p><strong>Session ID:</strong> {session.sessionId.substring(0, 16)}...</p>
                      <p><strong>Filename:</strong> {session.document.filename}</p>
                      <p><strong>Status:</strong> <span className="text-green-600 font-semibold">COMPLETED</span></p>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={handleCloseModal}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      ✓ Close & Continue
                    </button>
                  </div>
                )}

                {/* Cancel Button (only show when not done) */}
                {printStep !== 'done' && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 text-center animate-pulse">
                      ⏳ Mohon tunggu, proses sedang berjalan...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!session ? (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Load Print Session</h2>
              <p className="text-gray-600">
                Paste link atau QR code payload untuk memuat session
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Payload
                </label>
                <textarea
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder='{"sessionId":"...","token":"..."}'
                  className="w-full p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  rows={5}
                />
              </div>

              <button
                onClick={handleScan}
                disabled={!qrInput || loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Loading...
                  </>
                ) : (
                  'Load Session'
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
                <span className="text-xl">💡</span> Cara Menggunakan:
              </p>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Klik link yang dikirim oleh user (otomatis load)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Atau paste payload JSON di form atas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Klik "Load Session" untuk memuat</span>
                </li>
              </ul>
            </div>
          </div>
        ) : !completed ? (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Print</h2>
              <p className="text-gray-600">Session berhasil dimuat, siap untuk dicetak</p>
            </div>

            {/* Document Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <FileCheck size={20} />
                Informasi Dokumen
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Filename:</span>
                  <span className="font-semibold text-gray-900">{session.document.filename}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-semibold text-gray-900">
                    {(session.document.size / 1024).toFixed(2)} KB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {session.sessionId.substring(0, 16)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={printing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-3"
            >
              {printing ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Printing...
                </>
              ) : (
                <>
                  <Printer size={24} />
                  Print Document
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="font-semibold mb-3 text-yellow-900 flex items-center gap-2">
                <span className="text-xl">ℹ️</span> Informasi Penting:
              </p>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Klik tombol Print untuk memulai proses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>File akan di-download (simulasi print)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Setelah print, file akan dihapus permanen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Link tidak bisa digunakan lagi setelah print</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Print Completed!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Dokumen telah berhasil dicetak dan dihapus dari sistem
            </p>

            {/* Success Details */}
            <div className="bg-green-50 rounded-lg p-6 mb-6 border border-green-200">
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-gray-700">Dokumen berhasil dicetak</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-gray-700">File dihapus dari server</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-gray-700">Transaksi tercatat di blockchain</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-gray-700">Session ditutup secara permanen</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setSession(null);
                setCompleted(false);
                setQrInput('');
                // JANGAN redirect, reset state saja
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Load Session Baru
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

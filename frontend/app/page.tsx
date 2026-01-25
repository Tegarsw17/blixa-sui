'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';
import { Shield, Printer, Lock, Zap, FileCheck, Clock } from 'lucide-react';

export default function Home() {
  const account = useCurrentAccount();

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto glass rounded-2xl px-6 py-4 mb-8 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">BLIXA</h1>
          </div>
          <ConnectButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        {!account ? (
          /* Landing Page */
          <div className="text-center py-12 md:py-20">
            <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl mx-auto">
              <div className="animate-float mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg">
                  <Shield className="w-14 h-14 text-white" />
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
                Secure Print Platform
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-700 mb-4">
                One-time printing dengan zero retention
              </p>
              
              <p className="text-lg text-gray-600 mb-8">
                dan on-chain receipt di Sui blockchain
              </p>

              <div className="inline-block">
                <ConnectButton />
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-4 mt-12">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                  <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-800">One-Time Use</h3>
                  <p className="text-sm text-gray-600">Link sekali pakai</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                  <FileCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-800">Zero Retention</h3>
                  <p className="text-sm text-gray-600">Auto-delete file</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <Clock className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-800">Auto Expiry</h3>
                  <p className="text-sm text-gray-600">Session timeout</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard */
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
              Pilih Portal
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* User Portal Card */}
              <Link href="/user" className="group">
                <div className="glass rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Lock className="w-9 h-9 text-white" />
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800">
                    User Portal
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    Upload dokumen dan generate link untuk print
                  </p>

                  <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                    <span>Mulai Upload</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>

              {/* Agent Portal Card */}
              <Link href="/agent" className="group">
                <div className="glass rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Printer className="w-9 h-9 text-white" />
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800">
                    Print Agent
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    Scan link dan proses print request
                  </p>

                  <div className="flex items-center text-green-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                    <span>Mulai Print</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Features List */}
            <div className="glass rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">✨ Fitur Keamanan</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">One-time printing</p>
                    <p className="text-sm text-gray-600">Link tidak bisa dipakai ulang</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Zero retention</p>
                    <p className="text-sm text-gray-600">File otomatis dihapus setelah print</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">On-chain receipt</p>
                    <p className="text-sm text-gray-600">Bukti permanen di Sui blockchain</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Encrypted storage</p>
                    <p className="text-sm text-gray-600">File terenkripsi AES-256-GCM</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Auto-expiry</p>
                    <p className="text-sm text-gray-600">Session otomatis expire</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useCurrentAccount, useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';
import { Shield, Printer, Lock } from 'lucide-react';

export default function Home() {
  const account = useCurrentAccount();

  return (
    <main className="min-h-screen p-8">
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold">BLIXA</h1>
        <ConnectButton />
      </nav>

      <div className="max-w-6xl mx-auto">
        {!account ? (
          <div className="text-center py-20">
            <Shield className="w-20 h-20 mx-auto mb-6 text-blue-600" />
            <h2 className="text-4xl font-bold mb-4">Secure Print Platform</h2>
            <p className="text-xl text-gray-600 mb-8">
              One-time printing dengan zero retention dan on-chain receipt
            </p>
            <p className="text-lg mb-8">Connect wallet Sui untuk mulai</p>
            <ConnectButton />
          </div>
        ) : (
          <div>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Link
                href="/user"
                className="p-8 border-2 rounded-lg hover:border-blue-500 transition"
              >
                <Lock className="w-12 h-12 mb-4 text-blue-600" />
                <h3 className="text-2xl font-bold mb-2">User Portal</h3>
                <p className="text-gray-600">
                  Upload dokumen dan generate QR code untuk print
                </p>
              </Link>

              <Link
                href="/agent"
                className="p-8 border-2 rounded-lg hover:border-green-500 transition"
              >
                <Printer className="w-12 h-12 mb-4 text-green-600" />
                <h3 className="text-2xl font-bold mb-2">Print Agent</h3>
                <p className="text-gray-600">
                  Scan QR code dan proses print request
                </p>
              </Link>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Fitur MVP</h3>
              <ul className="space-y-2">
                <li>✅ One-time printing (QR tidak bisa dipakai ulang)</li>
                <li>✅ Zero retention (file otomatis dihapus setelah print)</li>
                <li>✅ On-chain receipt (bukti permanen di Sui blockchain)</li>
                <li>✅ Encrypted storage (file terenkripsi AES-256-GCM)</li>
                <li>✅ Auto-expiry (session otomatis expire)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// src/app/maintenance/page.tsx
import React from 'react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
      <div className="mb-6 animate-bounce">
        {/* Ikon Kuda Catur atau Tools */}
        <span className="text-6xl">🚧</span>
      </div>
      <h1 className="text-3xl font-bold mb-3 text-blue-400">
        Under Maintenance
      </h1>
      <p className="text-slate-300 max-w-md mx-auto">
        Sistem sedang dalam perbaikan untuk peningkatan fitur. 
        Kami akan segera kembali. Silakan cek lagi nanti!
      </p>
    </div>
  );
}
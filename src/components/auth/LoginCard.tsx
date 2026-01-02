import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { GiChessKnight } from 'react-icons/gi';
import { IoSparkles } from 'react-icons/io5';

interface LoginCardProps {
  onLogin: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
                <GiChessKnight className="text-6xl text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Chess Master</h1>
              <div className="flex items-center justify-center gap-1 text-white/90">
                <IoSparkles className="text-yellow-300" />
                <p className="text-sm font-medium">10 Level Challenge</p>
                <IoSparkles className="text-yellow-300" />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Selamat Datang!
              </h2>
              <p className="text-gray-600">
                Tantang AI dengan 10 level kesulitan berbeda
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                <div className="text-2xl mb-1">🎯</div>
                <p className="text-xs font-semibold text-indigo-700">10 Level</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-2xl mb-1">🏆</div>
                <p className="text-xs font-semibold text-purple-700">Ranking</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <div className="text-2xl mb-1">📊</div>
                <p className="text-xs font-semibold text-pink-700">Stats</p>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={onLogin}
              className="w-full bg-white border-2 border-gray-200 hover:border-indigo-500 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-3 group"
            >
              <FcGoogle className="text-2xl" />
              <span>Masuk dengan Google</span>
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Progress & statistik tersimpan otomatis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
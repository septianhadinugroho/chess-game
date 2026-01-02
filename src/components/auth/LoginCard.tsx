import React from 'react';

interface LoginCardProps {
  onLogin: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-7xl mb-4">♟️</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Game Catur</h1>
          <p className="text-gray-600 mb-2 text-lg">10 Level Challenge</p>
          <p className="text-sm text-gray-500 mb-8">Asah strategi & kemampuan berpikir Anda</p>
          
          <button
            onClick={onLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🔐</span>
            <span>Masuk dengan Google</span>
          </button>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              🎮 Mode Demo - Progress tersimpan di browser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';

interface HeaderProps {
  userName: string;
  highestLevel: number;
  onLogout: () => void;
  onBackToMenu?: () => void;
  showBackButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  userName, 
  highestLevel, 
  onLogout,
  onBackToMenu,
  showBackButton = false
}) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {showBackButton && onBackToMenu ? (
            <button
              onClick={onBackToMenu}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
            >
              ← Kembali
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <div>
                <div className="font-semibold text-gray-800">{userName}</div>
                <div className="text-xs text-gray-600">Level Tertinggi: {highestLevel}/10</div>
              </div>
            </div>
          )}
          
          <button
            onClick={onLogout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};
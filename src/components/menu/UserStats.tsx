import React from 'react';

interface UserStatsProps {
  gamesWon: number;
  gamesPlayed: number;
}

export const UserStats: React.FC<UserStatsProps> = ({ gamesWon, gamesPlayed }) => {
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Statistik</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="text-2xl font-bold text-green-700">{gamesWon}</div>
          <div className="text-xs text-gray-600 mt-1">Menang</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{gamesPlayed}</div>
          <div className="text-xs text-gray-600 mt-1">Dimainkan</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{winRate}%</div>
          <div className="text-xs text-gray-600 mt-1">Win Rate</div>
        </div>
      </div>
    </div>
  );
};
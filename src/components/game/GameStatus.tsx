import React from 'react';

interface GameStatusProps {
  status: string;
  isThinking: boolean;
  currentTurn: 'w' | 'b';
}

export const GameStatus: React.FC<GameStatusProps> = ({ status, isThinking, currentTurn }) => {
  if (status) {
    const isWin = status.includes('Menang');
    const isDraw = status.includes('Seri');
    
    return (
      <div className={`text-center py-3 px-4 rounded-xl mb-3 font-bold text-lg shadow-md ${
        isWin 
          ? 'bg-green-100 text-green-800 border-2 border-green-300' 
          : isDraw
          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
          : 'bg-red-100 text-red-800 border-2 border-red-300'
      }`}>
        {status}
      </div>
    );
  }

  if (isThinking) {
    return (
      <div className="text-center py-3 px-4 bg-blue-50 border-2 border-blue-200 rounded-xl mb-3">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin text-xl">🤔</div>
          <span className="font-semibold text-blue-800">AI sedang berpikir...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-2 px-4 bg-gray-50 border border-gray-200 rounded-xl mb-3">
      <span className="text-sm font-medium text-gray-700">
        {currentTurn === 'w' ? '♔ Giliran Putih' : '♚ Giliran Hitam'}
      </span>
    </div>
  );
};
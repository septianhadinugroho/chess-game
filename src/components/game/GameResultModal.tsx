import React from 'react';
import { IoTrophy, IoRefresh, IoHome, IoSadOutline, IoHandRight } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface GameResultModalProps {
  status: string;
  onReset: () => void;
  onHome: () => void;
  language: Language;
  hidePlayAgain?: boolean; // New prop for multiplayer
}

export const GameResultModal: React.FC<GameResultModalProps> = ({ 
  status, 
  onReset, 
  onHome, 
  language,
  hidePlayAgain = false 
}) => {
  if (!status) return null;
  
  const t = translations[language];
  
  // Detect win/lose/draw
  const isWin = status.includes(t.youWin) || 
                status.toLowerCase().includes('menang') || 
                status.toLowerCase().includes('win');
  
  const isDraw = status.includes(t.draw) || 
                 status.toLowerCase().includes('seri') || 
                 status.toLowerCase().includes('draw');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-pop-in relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          {isWin && (
            <>
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-emerald-200 to-transparent rounded-full translate-x-1/2 translate-y-1/2 opacity-50"></div>
            </>
          )}
        </div>

        <div className="relative z-10">
          {/* Icon */}
          <div className={`
            inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 animate-bounce-slow
            ${isWin 
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
              : isDraw
              ? 'bg-gradient-to-br from-blue-400 to-cyan-500'
              : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }
          `}>
            {isWin ? (
              <IoTrophy className="text-5xl text-white drop-shadow-lg" />
            ) : isDraw ? (
              <IoHandRight className="text-5xl text-white" />
            ) : (
              <IoSadOutline className="text-5xl text-white" />
            )}
          </div>

          {/* Title */}
          <h2 className={`
            text-3xl font-bold mb-2
            ${isWin 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600' 
              : isDraw
              ? 'text-blue-600'
              : 'text-gray-600'
            }
          `}>
            {isWin ? t.victory : isDraw ? t.draw : t.defeat}
          </h2>

          {/* Message */}
          <p className="text-gray-700 mb-8 font-medium text-lg">
            {status}
          </p>

          {/* Motivational Text */}
          {!isWin && !isDraw && !hidePlayAgain && (
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-sm text-blue-800 font-medium flex items-center justify-center gap-2">
                <IoRefresh size={16} />
                {language === 'id' 
                  ? 'Jangan menyerah! Coba lagi dan raih kemenangan!' 
                  : 'Don\'t give up! Try again and claim victory!'}
              </p>
            </div>
          )}

          {/* Win Celebration */}
          {isWin && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
              <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 to-orange-700 flex items-center justify-center gap-2">
                <IoTrophy size={16} />
                {language === 'id' 
                  ? 'Selamat! Kamu berhasil menang!' 
                  : 'Congratulations! You won!'}
              </p>
            </div>
          )}

          {/* Draw Message */}
          {isDraw && (
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-sm text-blue-800 font-medium">
                {language === 'id' 
                  ? 'Permainan seri! Kedua pemain bermain bagus.' 
                  : 'It\'s a draw! Both players played well.'}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {/* Play Again Button - Hidden for Multiplayer */}
            {!hidePlayAgain && (
              <button 
                onClick={onReset} 
                className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl touch-feedback flex items-center justify-center gap-2"
              >
                <IoRefresh size={20} />
                {t.playAgain}
              </button>
            )}
            
            <button 
              onClick={onHome} 
              className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-4 rounded-2xl font-bold transition-all hover:shadow-md touch-feedback flex items-center justify-center gap-2"
            >
              <IoHome size={20} />
              {t.backToMenu}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
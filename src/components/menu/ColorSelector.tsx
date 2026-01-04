import React from 'react';
import { translations, Language } from '@/lib/language';
import { IoShieldCheckmark, IoRocket, IoShuffle } from 'react-icons/io5';
import { GiChessKing, GiChessQueen } from 'react-icons/gi';

interface ColorSelectorProps {
  onSelectColor: (color: 'white' | 'black' | 'random') => void;
  language: Language;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({ onSelectColor, language }) => {
  const t = translations[language];
  
  return (
    <div className="card animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
          <GiChessQueen className="text-xl text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{t.selectColor}</h3>
          <p className="text-xs text-gray-500">
            {language === 'id' ? 'Klik untuk langsung main' : 'Click to start playing'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* White */}
        <button
          onClick={() => onSelectColor('white')}
          className="group relative bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl p-3 rounded-xl transition-all touch-feedback flex flex-col items-center justify-center min-h-[110px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex flex-col items-center">
            <GiChessKing className="text-4xl mb-2 text-gray-700 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-gray-800 text-sm mb-1">{t.white}</div>
            <div className="text-[10px] text-gray-600 font-medium text-center px-1">{t.firstMove}</div>
            <div className="mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold flex items-center gap-1">
              <IoRocket size={10} />
              {language === 'id' ? 'Agresif' : 'Aggressive'}
            </div>
          </div>
        </button>
        
        {/* Black */}
        <button
          onClick={() => onSelectColor('black')}
          className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-blue-400 hover:shadow-xl p-3 rounded-xl transition-all touch-feedback flex flex-col items-center justify-center min-h-[110px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex flex-col items-center">
            <GiChessKing className="text-4xl mb-2 text-white group-hover:scale-110 transition-transform drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]" />
            <div className="font-bold text-white text-sm mb-1">{t.black}</div>
            <div className="text-[10px] text-gray-300 font-medium text-center px-1">{t.secondMove}</div>
            <div className="mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold flex items-center gap-1">
              <IoShieldCheckmark size={10} />
              {language === 'id' ? 'Defensif' : 'Defensive'}
            </div>
          </div>
        </button>
        
        {/* Random */}
        <button
          onClick={() => onSelectColor('random')}
          className="group relative bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-blue-400 hover:border-yellow-400 hover:shadow-xl p-3 rounded-xl transition-all touch-feedback flex flex-col items-center justify-center min-h-[110px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex flex-col items-center">
            <IoShuffle className="text-4xl mb-2 text-white group-hover:scale-110 group-hover:rotate-180 transition-all" />
            <div className="font-bold text-white text-sm mb-1">{t.random}</div>
            <div className="text-[10px] text-blue-100 font-medium text-center px-1">{t.randomColor}</div>
            <div className="mt-1.5 px-2 py-0.5 bg-yellow-300 text-yellow-900 rounded-full text-[9px] font-bold flex items-center gap-1">
              <IoShuffle size={10} />
              {language === 'id' ? 'Kejutan!' : 'Surprise!'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
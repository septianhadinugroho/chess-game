import React from 'react';
import { translations, Language } from '@/lib/language';
import { IoShieldCheckmark, IoRocket, IoShuffle, IoBulb } from 'react-icons/io5';
import { GiChessKing, GiChessQueen } from 'react-icons/gi';

interface ColorSelectorProps {
  onSelectColor: (color: 'white' | 'black' | 'random') => void;
  language: Language;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({ onSelectColor, language }) => {
  const t = translations[language];
  
  return (
    <div className="card animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
          <GiChessQueen className="text-2xl text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{t.selectColor}</h3>
          <p className="text-sm text-gray-500">
            {language === 'id' ? 'Tentukan warna bidakmu' : 'Choose your pieces color'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* White */}
        <button
          onClick={() => onSelectColor('white')}
          className="group relative bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl p-4 sm:p-5 rounded-2xl transition-all touch-feedback flex flex-col items-center justify-center min-h-[140px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex flex-col items-center">
            <GiChessKing className="text-5xl mb-3 text-gray-700 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-gray-800 text-base mb-1">{t.white}</div>
            <div className="text-xs text-gray-600 font-medium text-center px-2">{t.firstMove}</div>
            <div className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1">
              <IoRocket size={12} />
              {language === 'id' ? 'Agresif' : 'Aggressive'}
            </div>
          </div>
        </button>
        
        {/* Black */}
        <button
          onClick={() => onSelectColor('black')}
          className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-blue-400 hover:shadow-xl p-4 sm:p-5 rounded-2xl transition-all touch-feedback flex flex-col items-center justify-center min-h-[140px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex flex-col items-center">
            <GiChessKing className="text-5xl mb-3 text-white group-hover:scale-110 transition-transform drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]" />
            <div className="font-bold text-white text-base mb-1">{t.black}</div>
            <div className="text-xs text-gray-300 font-medium text-center px-2">{t.secondMove}</div>
            <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold flex items-center gap-1">
              <IoShieldCheckmark size={12} />
              {language === 'id' ? 'Defensif' : 'Defensive'}
            </div>
          </div>
        </button>
        
        {/* Random */}
        <button
          onClick={() => onSelectColor('random')}
          className="group relative bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-blue-400 hover:border-yellow-400 hover:shadow-xl p-4 sm:p-5 rounded-2xl transition-all touch-feedback flex flex-col items-center justify-center min-h-[140px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex flex-col items-center">
            <IoShuffle className="text-5xl mb-3 text-white group-hover:scale-110 group-hover:rotate-180 transition-all" />
            <div className="font-bold text-white text-base mb-1">{t.random}</div>
            <div className="text-xs text-blue-100 font-medium text-center px-2">{t.randomColor}</div>
            <div className="mt-2 px-3 py-1 bg-yellow-300 text-yellow-900 rounded-full text-[10px] font-bold flex items-center gap-1">
              <IoShuffle size={12} />
              {language === 'id' ? 'Kejutan!' : 'Surprise!'}
            </div>
          </div>
        </button>
      </div>

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-100">
        <div className="flex gap-3">
          <IoBulb className="text-2xl text-yellow-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm text-gray-800 mb-1">
              {language === 'id' ? 'Tips Bermain' : 'Playing Tips'}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {language === 'id' 
                ? 'Putih: Kontrol awal permainan. Hitam: Strategi counter-attack. Random: Buat permainan lebih menantang!' 
                : 'White: Control early game. Black: Counter-attack strategy. Random: Make it more challenging!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
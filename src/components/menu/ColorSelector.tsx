import React from 'react';
import { translations, Language } from '@/lib/language';

interface ColorSelectorProps {
  onSelectColor: (color: 'white' | 'black' | 'random') => void;
  language: Language;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({ onSelectColor, language }) => {
  const t = translations[language];
  
  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-4">{t.selectColor}</h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={() => onSelectColor('white')}
          className="bg-linear-to-br from-slate-200 to-white border-2 border-slate-400 hover:border-blue-400 hover:shadow-lg p-4 sm:p-6 rounded-xl transition-all active:scale-95 group flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px]"
        >
          <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">♔</div>
          <div className="font-semibold text-slate-800 text-sm sm:text-base">{t.white}</div>
          <div className="text-[10px] sm:text-xs text-slate-600 mt-1 text-center">{t.firstMove}</div>
        </button>
        
        <button
          onClick={() => onSelectColor('black')}
          className="bg-linear-to-br from-slate-700 to-slate-900 border-2 border-slate-600 hover:border-blue-400 hover:shadow-lg p-4 sm:p-6 rounded-xl transition-all active:scale-95 group flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px]"
        >
          <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">♚</div>
          <div className="font-semibold text-white text-sm sm:text-base">{t.black}</div>
          <div className="text-[10px] sm:text-xs text-slate-300 mt-1 text-center">{t.secondMove}</div>
        </button>
        
        <button
          onClick={() => onSelectColor('random')}
          className="bg-linear-to-br from-blue-700 to-blue-900 border-2 border-blue-600 hover:border-blue-400 hover:shadow-lg p-4 sm:p-6 rounded-xl transition-all active:scale-95 group flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px]"
        >
          <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">🎲</div>
          <div className="font-semibold text-white text-sm sm:text-base">{t.random}</div>
          <div className="text-[10px] sm:text-xs text-blue-200 mt-1 text-center">{t.randomColor}</div>
        </button>
      </div>
    </div>
  );
};
import React from 'react';
import { AI_LEVELS } from '@/constants/game-config';
import { translations, Language } from '@/lib/language';

interface LevelSelectorProps {
  currentLevel: number;
  highestLevel: number;
  onSelectLevel: (level: number) => void;
  language: Language;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevel,
  highestLevel,
  onSelectLevel,
  language
}) => {
  const t = translations[language];
  
  const handleLevelClick = (level: number) => {
    onSelectLevel(level);
    
    setTimeout(() => {
      const colorSection = document.getElementById('color-selector-section');
      if (colorSection) {
        colorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'from-green-600 to-emerald-700';
    if (level <= 4) return 'from-yellow-600 to-amber-700';
    if (level <= 6) return 'from-orange-600 to-red-700';
    if (level <= 8) return 'from-red-600 to-rose-700';
    return 'from-purple-600 to-violet-700';
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-4 sm:p-6 mb-4">
      <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <span className="text-blue-400">🎯</span> {t.selectLevel}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {AI_LEVELS.map((level) => {
          const isLocked = level.level > highestLevel;
          const isSelected = currentLevel === level.level;
          
          return (
            <button
              key={level.level}
              onClick={() => !isLocked && handleLevelClick(level.level)}
              disabled={isLocked}
              className={`
                relative p-3 sm:p-4 rounded-xl transition-all text-left overflow-hidden group min-h-[70px] sm:min-h-[80px]
                ${isSelected
                  ? 'ring-2 ring-blue-400 bg-slate-700 shadow-lg transform scale-[1.02]'
                  : isLocked
                  ? 'bg-slate-900/50 opacity-50 cursor-not-allowed'
                  : 'bg-slate-700/80 border border-slate-600 hover:border-blue-400 hover:shadow-md active:scale-95'
                }
              `}
            >
              <div className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm sm:text-base ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                    {t.level} {level.level}
                  </span>
                  {isSelected && <span className="text-blue-400 text-lg">✓</span>}
                  {!isLocked && !isSelected && (
                    <span className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity text-lg">
                      →
                    </span>
                  )}
                </div>
                <div className={`text-xs ${isLocked ? 'text-slate-500' : 'text-slate-400'} font-medium truncate`}>
                  {t.levels[level.level as keyof typeof t.levels]}
                </div>
              </div>
              
              {/* Color indicator */}
              {!isLocked && (
                <div className={`absolute bottom-0 left-0 h-1 w-full bg-linear-to-r ${getLevelColor(level.level)} opacity-70`}></div>
              )}
              
              {/* Lock overlay */}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[1px]">
                  <span className="text-slate-500 text-2xl">🔒</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
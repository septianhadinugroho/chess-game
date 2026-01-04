import React from 'react';
import { AI_LEVELS } from '@/constants/game-config';
import { translations, Language } from '@/lib/language';
import { IoLeaf, IoStar, IoFlame, IoDiamond, IoTrophy, IoLockClosed, IoCheckmark } from 'react-icons/io5';

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

  const getLevelColors = (level: number) => {
    if (level <= 2) return {
      gradient: 'from-emerald-400 to-green-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: IoLeaf,
      iconColor: 'text-emerald-600'
    };
    if (level <= 4) return {
      gradient: 'from-yellow-400 to-amber-500',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: IoStar,
      iconColor: 'text-yellow-600'
    };
    if (level <= 6) return {
      gradient: 'from-orange-400 to-red-500',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: IoFlame,
      iconColor: 'text-orange-600'
    };
    if (level <= 8) return {
      gradient: 'from-red-500 to-pink-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: IoDiamond,
      iconColor: 'text-red-600'
    };
    return {
      gradient: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      icon: IoTrophy,
      iconColor: 'text-purple-600'
    };
  };

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
          <IoTrophy className="text-2xl text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{t.selectLevel}</h3>
          <p className="text-sm text-gray-500">
            {language === 'id' ? 'Pilih tingkat kesulitan' : 'Choose difficulty level'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {AI_LEVELS.map((level) => {
          const isLocked = level.level > highestLevel;
          const isSelected = currentLevel === level.level;
          const colors = getLevelColors(level.level);
          const IconComponent = colors.icon;
          
          return (
            <button
              key={level.level}
              onClick={() => !isLocked && handleLevelClick(level.level)}
              disabled={isLocked}
              className={`
                relative p-4 rounded-2xl transition-all text-left overflow-hidden group
                min-h-[90px] touch-feedback
                ${isSelected
                  ? `ring-4 ring-blue-500 ${colors.bg} shadow-xl transform scale-[1.02]`
                  : isLocked
                  ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                  : `bg-white border-2 ${colors.border} hover:shadow-lg hover:-translate-y-1`
                }
              `}
            >
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`text-2xl ${isLocked ? 'text-gray-400' : colors.iconColor}`} />
                    <span className={`font-bold text-base ${isSelected ? colors.text : 'text-gray-700'}`}>
                      {t.level} {level.level}
                    </span>
                  </div>
                  {isSelected && (
                    <IoCheckmark className="text-blue-600 text-xl animate-bounce-slow" />
                  )}
                  {!isLocked && !isSelected && (
                    <span className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity text-lg">
                      →
                    </span>
                  )}
                </div>
                
                <div className={`text-xs font-medium ${isLocked ? 'text-gray-400' : colors.text}`}>
                  {t.levels[level.level as keyof typeof t.levels]}
                </div>
              </div>
              
              {/* Progress indicator */}
              {!isLocked && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`}></div>
              )}
              
              {/* Lock overlay */}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-2xl">
                  <div className="text-center">
                    <IoLockClosed className="text-4xl text-gray-500 mx-auto mb-1" />
                    <span className="text-xs font-bold text-gray-600">
                      {language === 'id' ? 'Terkunci' : 'Locked'}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Level Progress Bar */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {language === 'id' ? 'Progress Level' : 'Level Progress'}
          </span>
          <span className="text-sm font-bold text-blue-600">
            {highestLevel}/10
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(highestLevel / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { AI_LEVELS } from '@/constants/game-config';

interface LevelSelectorProps {
  currentLevel: number;
  highestLevel: number;
  onSelectLevel: (level: number) => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevel,
  highestLevel,
  onSelectLevel
}) => {
  
  const handleLevelClick = (level: number) => {
    onSelectLevel(level);
    
    // Auto scroll ke bawah (bagian pilih warna)
    setTimeout(() => {
      const colorSection = document.getElementById('color-selector-section');
      if (colorSection) {
        colorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-blue-600">📚</span> Pilih Level
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {AI_LEVELS.map((level) => {
          const isLocked = level.level > highestLevel;
          const isSelected = currentLevel === level.level;
          
          return (
            <button
              key={level.level}
              onClick={() => !isLocked && handleLevelClick(level.level)}
              disabled={isLocked}
              className={`
                p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden group
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105 z-10'
                  : isLocked
                  ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                  : 'border-gray-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 bg-white'
                }
              `}
            >
              <div className="flex justify-between items-start mb-1 relative z-10">
                <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                  Level {level.level}
                </span>
                {!isLocked && (
                   <span className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} text-blue-500`}>
                     ▼
                   </span>
                )}
              </div>
              <div className="text-xs text-gray-500">{level.name}</div>
              
              {/* Indikator Warna Level di bawah kartu */}
              <div className={`absolute bottom-0 left-0 h-1 w-full bg-${level.color}-400 opacity-50`}></div>
              
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                  <span className="text-gray-400 text-xl">🔒</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
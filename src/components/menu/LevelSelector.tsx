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
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Pilih Level</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {AI_LEVELS.map((level) => {
          const isLocked = level.level > highestLevel;
          const isSelected = currentLevel === level.level;
          
          return (
            <button
              key={level.level}
              onClick={() => !isLocked && onSelectLevel(level.level)}
              disabled={isLocked}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : isLocked
                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-800">Level {level.level}</span>
                {isLocked && <span className="text-red-500">🔒</span>}
                {!isLocked && level.level <= highestLevel && level.level !== currentLevel && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
              <div className="text-sm font-semibold text-gray-700">{level.name}</div>
              <div className="text-xs text-gray-600 mt-1">{level.description}</div>
            </button>
          );
        })}
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <div className="font-bold text-gray-800 mb-1">
              {AI_LEVELS[currentLevel - 1].name}
            </div>
            <div className="text-sm text-gray-600">
              {AI_LEVELS[currentLevel - 1].description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
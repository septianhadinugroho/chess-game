import React from 'react';

interface ColorSelectorProps {
  onSelectColor: (color: 'white' | 'black' | 'random') => void;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({ onSelectColor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🎨 Pilih Warna</h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onSelectColor('white')}
          className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 hover:border-blue-500 hover:shadow-lg p-6 rounded-xl transition-all"
        >
          <div className="text-4xl mb-2">♔</div>
          <div className="font-semibold text-gray-800">Putih</div>
          <div className="text-xs text-gray-600 mt-1">Jalan duluan</div>
        </button>
        
        <button
          onClick={() => onSelectColor('black')}
          className="bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600 hover:border-blue-500 hover:shadow-lg p-6 rounded-xl transition-all"
        >
          <div className="text-4xl mb-2">♚</div>
          <div className="font-semibold text-white">Hitam</div>
          <div className="text-xs text-gray-300 mt-1">Jalan kedua</div>
        </button>
        
        <button
          onClick={() => onSelectColor('random')}
          className="bg-gradient-to-br from-purple-100 via-white to-indigo-100 border-2 border-purple-300 hover:border-blue-500 hover:shadow-lg p-6 rounded-xl transition-all"
        >
          <div className="text-4xl mb-2">🎲</div>
          <div className="font-semibold text-gray-800">Random</div>
          <div className="text-xs text-gray-600 mt-1">Acak warna</div>
        </button>
      </div>
    </div>
  );
};
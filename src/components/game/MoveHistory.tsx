import React, { useRef, useEffect } from 'react';
import { IoList, IoChevronDown } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface Move {
  moveNumber: number;
  white?: string;
  black?: string;
}

interface MoveHistoryProps {
  moves: string[];
  language: Language;
  compact?: boolean;
}

export default function MoveHistory({ moves, language, compact = false }: MoveHistoryProps) {
  const t = translations[language];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll ke move terbaru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  // Format moves ke dalam pairs (white, black)
  const movePairs: Move[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1]
    });
  }

  if (moves.length === 0) {
    return (
      <div className={`${compact ? 'p-3' : 'card'} text-center`}>
        <IoList className="text-4xl text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 font-medium">
          {language === 'id' ? 'Belum ada gerakan' : 'No moves yet'}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'card'}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <IoList className="text-blue-500" />
          {language === 'id' ? 'Riwayat Gerakan' : 'Move History'}
        </h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
          {moves.length} {language === 'id' ? 'langkah' : 'moves'}
        </span>
      </div>

      <div 
        ref={scrollRef}
        className={`${
          compact ? 'max-h-32' : 'max-h-64'
        } overflow-y-auto bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-3`}
      >
        <div className="space-y-1">
          {movePairs.map((pair, index) => (
            <div 
              key={index}
              className="grid grid-cols-[40px_1fr_1fr] gap-2 p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <div className="text-xs font-bold text-gray-500 flex items-center">
                {pair.moveNumber}.
              </div>
              <div className="font-mono text-sm font-bold text-gray-800 flex items-center">
                {pair.white && (
                  <span className="bg-white border border-gray-200 px-2 py-1 rounded-lg w-full">
                    {pair.white}
                  </span>
                )}
              </div>
              <div className="font-mono text-sm font-bold text-gray-800 flex items-center">
                {pair.black && (
                  <span className="bg-gray-800 text-white px-2 py-1 rounded-lg w-full">
                    {pair.black}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {moves.length > 10 && (
        <div className="mt-2 text-center">
          <IoChevronDown className="text-gray-400 mx-auto animate-bounce-slow" size={16} />
        </div>
      )}
    </div>
  );
}
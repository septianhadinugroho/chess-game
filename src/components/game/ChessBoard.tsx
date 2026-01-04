import React from 'react';
import { getPieceSymbol, getSquareNotation, isLightSquare } from '@/utils/helpers';

interface ChessBoardProps {
  board: any[][];
  selectedSquare: string | null;
  validMoves: any[];
  onSquareClick: (row: number, col: number) => void;
}

export const ChessBoard = ({ board, selectedSquare, validMoves, onSquareClick }: ChessBoardProps) => (
  <div className="w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
    {board.map((row: any, i: number) => (
      <div key={i} className="flex h-[12.5%]">
        {row.map((piece: any, j: number) => {
          const square = getSquareNotation(i, j);
          const isLight = isLightSquare(i, j);
          const isSelected = selectedSquare === square;
          const isValidMove = validMoves.some((m: any) => m.to === square);
          
          return (
            <div
              key={j}
              onClick={() => onSquareClick(i, j)}
              className={`
                flex items-center justify-center cursor-pointer transition-all relative w-[12.5%]
                ${isLight ? 'bg-slate-300' : 'bg-blue-900'}
                ${isSelected ? 'ring-4 ring-yellow-400 ring-inset z-10' : ''}
                ${isValidMove && !piece ? 'hover:bg-blue-700' : ''}
                ${isValidMove && piece ? 'hover:bg-red-600' : ''}
                active:scale-95
              `}
            >
              {piece && (
                <span 
                  className={`
                    text-4xl sm:text-5xl select-none pointer-events-none transition-transform
                    ${isSelected ? 'scale-110' : ''}
                    ${piece.color === 'w' 
                      ? 'text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.95)]' 
                      : 'text-slate-900 drop-shadow-[0_2px_3px_rgba(255,255,255,0.5)]'
                    }
                  `}
                >
                  {getPieceSymbol(piece)}
                </span>
              )}
              {isValidMove && (
                <div className={`
                  absolute inset-0 flex items-center justify-center pointer-events-none
                  ${piece ? 'bg-red-500 bg-opacity-40' : ''}
                `}>
                  {!piece && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 opacity-70 shadow-lg" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ))}
  </div>
);
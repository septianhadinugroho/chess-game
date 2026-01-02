import React from 'react';
import { getPieceSymbol, getSquareNotation, isLightSquare } from '@/utils/helpers';

interface ChessBoardProps {
  board: any[][];
  selectedSquare: string | null;
  validMoves: any[];
  onSquareClick: (row: number, col: number) => void;
}

export const ChessBoard = ({ board, selectedSquare, validMoves, onSquareClick }: ChessBoardProps) => (
  <div className="aspect-square shadow-2xl rounded-2xl overflow-hidden border-4 border-gray-800">
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
                ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
                ${isSelected ? 'ring-4 ring-blue-500 ring-inset z-10' : ''}
                hover:brightness-95
              `}
            >
              {piece && (
                <span 
                  className={`
                    text-5xl select-none pointer-events-none
                    ${piece.color === 'w' 
                      ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' 
                      : 'text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]'
                    }
                  `}
                >
                  {getPieceSymbol(piece)}
                </span>
              )}
              {isValidMove && (
                <div className={`
                  absolute inset-0 flex items-center justify-center pointer-events-none
                  ${piece ? 'bg-red-400 bg-opacity-40' : ''}
                `}>
                  {!piece && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 opacity-70 shadow-lg" />
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